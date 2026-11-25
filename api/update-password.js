import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://gemyqaniztqrsilayblx.supabase.co';

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const otpPepper = String(
  process.env.OTP_PEPPER || supabaseServiceKey || ''
);

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

function hashOtp(email, otp) {
  return crypto
    .createHmac('sha256', otpPepper)
    .update(`${String(email).trim().toLowerCase()}:${String(otp).trim()}`)
    .digest('hex');
}

function safeEqualStrings(a, b) {
  const s1 = String(a || '');
  const s2 = String(b || '');
  if (!s1 || !s2) return false;
  const buf1 = Buffer.from(s1, 'utf8');
  const buf2 = Buffer.from(s2, 'utf8');
  if (buf1.length !== buf2.length) return false;
  return crypto.timingSafeEqual(buf1, buf2);
}

function verifySignedToken(token, expectedEmail) {
  const secret =
    process.env.RESET_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !token) return false;

  const parts = String(token).split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('hex');

  if (!safeEqualStrings(sig, expectedSig)) return false;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );
    if (
      !parsed ||
      String(parsed.email || '').trim().toLowerCase() !== expectedEmail
    ) {
      return false;
    }
    if (!parsed.exp || Date.now() > Number(parsed.exp)) return false;
    return true;
  } catch {
    return false;
  }
}

async function findSupabaseAuthUserByEmail(supabaseAdmin, email) {
  let page = 1;
  const perPage = 500;

  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
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

async function findOtpRowInTable(supabaseAdmin, tableName, cleanEmail) {
  const { data: purposeRow, error: purposeErr } = await supabaseAdmin
    .from(tableName)
    .select('*')
    .eq('email', cleanEmail)
    .eq('purpose', 'reset-password')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!purposeErr && purposeRow) {
    return { row: purposeRow, error: null };
  }

  const { data: fallbackRow, error: fallbackErr } = await supabaseAdmin
    .from(tableName)
    .select('*')
    .eq('email', cleanEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { row: fallbackRow, error: fallbackErr };
}

async function verifyOtpFromTables(supabaseAdmin, cleanEmail, cleanOtp) {
  const candidateTables = ['password_reset_otps', 'otps', 'email_otps'];
  const computedHash = otpPepper ? hashOtp(cleanEmail, cleanOtp) : '';

  for (const tableName of candidateTables) {
    const { row, error } = await findOtpRowInTable(
      supabaseAdmin,
      tableName,
      cleanEmail
    );

    if (error || !row) continue;

    if (row.used === true || row.verified === true) {
      return { ok: false, status: 400, message: 'OTP already used' };
    }

    const currentAttempts = Number(row.attempts || 0);
    if (currentAttempts >= MAX_OTP_ATTEMPTS) {
      return {
        ok: false,
        status: 429,
        message: 'Too many invalid OTP attempts',
      };
    }

    if (row.expires_at && Date.now() > new Date(row.expires_at).getTime()) {
      return { ok: false, status: 400, message: 'OTP has expired' };
    }

    const storedOtp = String(
      row.otp ?? row.code ?? row.otp_code ?? row.otp_hash ?? ''
    ).trim();

    const isMatch =
      safeEqualStrings(storedOtp, cleanOtp) ||
      (computedHash && safeEqualStrings(storedOtp, computedHash));

    if (!isMatch) {
      const nextAttempts = currentAttempts + 1;
      const updatePayload = {};
      if ('attempts' in row) updatePayload.attempts = nextAttempts;
      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        if ('used' in row) updatePayload.used = true;
        if ('verified' in row) updatePayload.verified = true;
      }

      if (Object.keys(updatePayload).length > 0) {
        await supabaseAdmin
          .from(tableName)
          .update(updatePayload)
          .eq('id', row.id);
      }

      return { ok: false, status: 400, message: 'Invalid OTP code' };
    }

    return { ok: true, tableName, row };
  }

  return { ok: false, status: 400, message: 'OTP record not found' };
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ ok: false, success: false, message: 'Method not allowed' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({
        ok: false,
        success: false,
        message:
          'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in environment variables',
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res
          .status(400)
          .json({ ok: false, success: false, message: 'Invalid JSON payload' });
      }
    }

    const { email, resetToken, otp, newPassword, password } = body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(newPassword || password || '');
    const cleanOtp = String(otp || '').trim();

    if (
      !cleanEmail ||
      !cleanPassword ||
      (!resetToken && !/^\d{6}$/.test(cleanOtp))
    ) {
      return res.status(400).json({
        ok: false,
        success: false,
        message:
          'Missing required fields (email, password, and resetToken or valid 6-digit otp)',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Invalid email address',
      });
    }

    if (!isStrongPassword(cleanPassword)) {
      return res.status(400).json({
        ok: false,
        success: false,
        message:
          'Password must be at least 8 characters with uppercase, lowercase, and a number or symbol',
      });
    }

    let otpVerification = null;

    if (resetToken) {
      if (!verifySignedToken(resetToken, cleanEmail)) {
        return res.status(403).json({
          ok: false,
          success: false,
          message: 'Invalid or expired reset token',
        });
      }
    } else {
      otpVerification = await verifyOtpFromTables(
        supabase,
        cleanEmail,
        cleanOtp
      );
      if (!otpVerification.ok) {
        return res.status(otpVerification.status).json({
          ok: false,
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
      console.error(
        'Supabase users table update warning:',
        updateError.message || updateError
      );
    } else if (Array.isArray(updatedUsers) && updatedUsers.length > 0) {
      updatedAnyAccount = true;
    }

    const authUser = await findSupabaseAuthUserByEmail(supabase, cleanEmail);
    if (authUser) {
      const { error: authErr } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password: cleanPassword }
      );
      if (authErr) {
        console.error(
          'Supabase Auth password update error:',
          authErr.message || authErr
        );
      } else {
        updatedAnyAccount = true;
      }
    }

    if (!updatedAnyAccount) {
      return res
        .status(404)
        .json({ ok: false, success: false, message: 'User not found' });
    }

    if (otpVerification && otpVerification.row && otpVerification.tableName) {
      const markUsedPayload = {};
      if ('used' in otpVerification.row) markUsedPayload.used = true;
      if ('verified' in otpVerification.row) markUsedPayload.verified = true;

      if (Object.keys(markUsedPayload).length > 0) {
        await supabase
          .from(otpVerification.tableName)
          .update(markUsedPayload)
          .eq('id', otpVerification.row.id);
      } else {
        await supabase
          .from(otpVerification.tableName)
          .delete()
          .eq('id', otpVerification.row.id);
      }
    }

    return res.status(200).json({
      ok: true,
      success: true,
      message: 'Password updated successfully',
    });
  } catch (e) {
    console.error('Server Internal Error:', e);
    return res
      .status(500)
      .json({ ok: false, success: false, message: 'Internal server error' });
  }
}
