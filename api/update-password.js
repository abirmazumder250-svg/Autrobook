import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_ORIGINS = new Set([
  'https://autrobook.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
]);

const MAX_OTP_ATTEMPTS = 5;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

function applyCors(req, res) {
  const origin = String(req.headers.origin || '').trim();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isStrongPassword(pw) {
  return (
    typeof pw === 'string' &&
    pw.length >= 8 &&
    pw.length <= 128 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /[\d\W_]/.test(pw)
  );
}

function verifySignedToken(token, expectedEmail) {
  const secret = process.env.RESET_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !token) return false;

  const parts = String(token).split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('hex');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed || String(parsed.email || '').trim().toLowerCase() !== expectedEmail) return false;
    if (!parsed.exp || Date.now() > Number(parsed.exp)) return false;
    return true;
  } catch {
    return false;
  }
}

async function findSupabaseAuthUserByEmail(supabaseAdmin, email) {
  let page = 1;
  const perPage = 200;

  while (page <= 25) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return null;

    const users = data?.users || [];
    const matched = users.find(
      (u) => String(u.email || '').trim().toLowerCase() === email
    );
    if (matched) return matched;

    if (users.length < perPage) break;
    page++;
  }
  return null;
}

async function verifyOtpFromTables(supabaseAdmin, cleanEmail, cleanOtp) {
  const candidateTables = ['password_reset_otps', 'otps', 'email_otps'];

  for (const tableName of candidateTables) {
    const { data: row, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !row) continue;

    if (row.used === true) {
      return { ok: false, status: 400, message: 'OTP already used' };
    }

    const currentAttempts = Number(row.attempts || 0);
    if (currentAttempts >= MAX_OTP_ATTEMPTS) {
      return { ok: false, status: 429, message: 'Too many invalid OTP attempts' };
    }

    if (row.expires_at && Date.now() > new Date(row.expires_at).getTime()) {
      return { ok: false, status: 400, message: 'OTP has expired' };
    }

    const storedOtp = String(row.otp ?? row.code ?? row.otp_code ?? '').trim();
    const otpBuf = Buffer.from(storedOtp, 'utf8');
    const inputBuf = Buffer.from(cleanOtp, 'utf8');
    const isMatch =
      storedOtp.length > 0 &&
      otpBuf.length === inputBuf.length &&
      crypto.timingSafeEqual(otpBuf, inputBuf);

    if (!isMatch) {
      const nextAttempts = currentAttempts + 1;
      await supabaseAdmin
        .from(tableName)
        .update({
          attempts: nextAttempts,
          used: nextAttempts >= MAX_OTP_ATTEMPTS,
        })
        .eq('id', row.id);

      return { ok: false, status: 400, message: 'Invalid OTP code' };
    }

    return { ok: true, tableName, rowId: row.id };
  }

  return { ok: false, status: 400, message: 'OTP record not found' };
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in environment variables',
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
      }
    }

    const { email, resetToken, otp, newPassword, password } = body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(newPassword || password || '');
    const cleanOtp = String(otp || '').trim();

    if (!cleanEmail || !cleanPassword || (!resetToken && !/^\d{6}$/.test(cleanOtp))) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (email, password, and resetToken or valid 6-digit otp)',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    if (!isStrongPassword(cleanPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with uppercase, lowercase, and a number or symbol',
      });
    }

    let otpVerification = null;

    if (resetToken) {
      if (!verifySignedToken(resetToken, cleanEmail)) {
        return res.status(403).json({ success: false, message: 'Invalid or expired reset token' });
      }
    } else {
      otpVerification = await verifyOtpFromTables(supabase, cleanEmail, cleanOtp);
      if (!otpVerification.ok) {
        return res.status(otpVerification.status).json({
          success: false,
          message: otpVerification.message,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    let updatedAnyAccount = false;

    const { data: updatedUsers, error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', cleanEmail)
      .select('id');

    if (updateError) {
      console.error('Supabase users table update warning:', updateError.message || updateError);
    } else if (Array.isArray(updatedUsers) && updatedUsers.length > 0) {
      updatedAnyAccount = true;
    }

    const authUser = await findSupabaseAuthUserByEmail(supabase, cleanEmail);
    if (authUser) {
      const { error: authErr } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: cleanPassword,
      });
      if (authErr) {
        console.error('Supabase Auth password update error:', authErr.message || authErr);
      } else {
        updatedAnyAccount = true;
      }
    }

    if (!updatedAnyAccount) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (otpVerification && otpVerification.rowId && otpVerification.tableName) {
      await supabase
        .from(otpVerification.tableName)
        .update({ used: true })
        .eq('id', otpVerification.rowId)
        .eq('used', false);
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (e) {
    console.error('Server Internal Error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
