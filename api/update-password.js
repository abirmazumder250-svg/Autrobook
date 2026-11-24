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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

async function syncSupabaseAuthPasswordIfExists(supabaseAdmin, email, newPassword) {
  let page = 1;
  const perPage = 200;

  while (page <= 25) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return;

    const users = data?.users || [];
    const matched = users.find(
      (u) => String(u.email || '').trim().toLowerCase() === email
    );

    if (matched) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(matched.id, {
        password: newPassword,
      });
      if (authErr) {
        console.warn('Supabase Auth password sync warning:', authErr.message || authErr);
      }
      return;
    }

    if (users.length < perPage) break;
    page++;
  }
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

    let otpRowId = null;

    if (resetToken) {
      if (!verifySignedToken(resetToken, cleanEmail)) {
        return res.status(403).json({ success: false, message: 'Invalid or expired reset token' });
      }
    } else {
      const { data: otpRow, error: otpErr } = await supabase
        .from('password_reset_otps')
        .select('id, otp, expires_at, used, attempts')
        .eq('email', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpErr || !otpRow) {
        return res.status(400).json({ success: false, message: 'OTP record not found' });
      }
      if (otpRow.used) {
        return res.status(400).json({ success: false, message: 'OTP already used' });
      }
      if (Number(otpRow.attempts || 0) >= MAX_OTP_ATTEMPTS) {
        return res.status(429).json({ success: false, message: 'Too many invalid OTP attempts' });
      }
      if (otpRow.expires_at && Date.now() > new Date(otpRow.expires_at).getTime()) {
        return res.status(400).json({ success: false, message: 'OTP has expired' });
      }

      const otpBuf = Buffer.from(String(otpRow.otp || '').trim(), 'utf8');
      const inputBuf = Buffer.from(cleanOtp, 'utf8');
      const isMatch =
        otpBuf.length === inputBuf.length && crypto.timingSafeEqual(otpBuf, inputBuf);

      if (!isMatch) {
        const nextAttempts = Number(otpRow.attempts || 0) + 1;
        await supabase
          .from('password_reset_otps')
          .update({
            attempts: nextAttempts,
            used: nextAttempts >= MAX_OTP_ATTEMPTS ? true : false,
          })
          .eq('id', otpRow.id);

        return res.status(400).json({ success: false, message: 'Invalid OTP code' });
      }

      otpRowId = otpRow.id;
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const { data, error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', cleanEmail)
      .select('id');

    if (updateError) {
      console.error('Supabase Update Error:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to update password in database' });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await syncSupabaseAuthPasswordIfExists(supabase, cleanEmail, cleanPassword);

    if (otpRowId) {
      await supabase
        .from('password_reset_otps')
        .update({ used: true })
        .eq('id', otpRowId)
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
