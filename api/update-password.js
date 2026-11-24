import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

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
    if (!parsed || String(parsed.email || '').toLowerCase() !== expectedEmail) return false;
    if (!parsed.exp || Date.now() > Number(parsed.exp)) return false;
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    let otpRowId = null;

    if (resetToken) {
      if (!verifySignedToken(resetToken, cleanEmail)) {
        return res.status(403).json({ success: false, message: 'Invalid or expired reset token' });
      }
    } else {
      const { data: otpRow, error: otpErr } = await supabase
        .from('password_reset_otps')
        .select('id, otp, expires_at, used')
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
      if (otpRow.expires_at && Date.now() > new Date(otpRow.expires_at).getTime()) {
        return res.status(400).json({ success: false, message: 'OTP has expired' });
      }
      if (String(otpRow.otp).trim() !== cleanOtp) {
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

    if (otpRowId) {
      await supabase
        .from('password_reset_otps')
        .update({ used: true })
        .eq('id', otpRowId);
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (e) {
    console.error('Server Internal Error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
  }
