// api/send-otp.js
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, code: 'INVALID_JSON' }); }
    }

    const { email, name } = body || {};
    if (!email) return res.status(400).json({ success: false, code: 'EMAIL_REQUIRED' });

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, code: 'INVALID_EMAIL' });
    }
    const cleanName = esc(name ? String(name).trim() : 'User');

    // Rate limit — 10 min / 3 OTP
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('otps').select('*', { count: 'exact', head: true })
      .eq('email', cleanEmail).gte('created_at', tenMinAgo);
    if ((count || 0) >= 3) {
      return res.status(429).json({ success: false, code: 'RATE_LIMITED' });
    }

    // Already registered?
    const { data: existing } = await supabase.auth.admin.listUsers();
    if (existing?.users?.some(u => u.email?.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ success: false, code: 'ALREADY_EXISTS', alreadyExists: true });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const otpHash = await bcrypt.hash(otp, 10);

    await supabase.from('otps').delete().eq('email', cleanEmail);
    const { error: dbErr } = await supabase.from('otps').insert([{
      email: cleanEmail, otp_hash: otpHash, expires_at: expiresAt, attempts: 0
    }]);
    if (dbErr) {
      console.error('DB:', dbErr);
      return res.status(500).json({ success: false, code: 'DB_ERROR' });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ success: false, code: 'GMAIL_MISSING' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });

    await transporter.sendMail({
      from: `"Autrobook" <${process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: `Autrobook Verification Code: ${otp}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:30px;max-width:520px;margin:auto;border:1px solid #e4e6e9;border-radius:16px;background:#fff">
          <div style="background:#043D22;padding:24px;border-radius:12px 12px 0 0;text-align:center;margin:-30px -30px 24px">
            <h2 style="color:#fff;margin:0;font-size:22px">Autrobook</h2>
          </div>
          <h3 style="margin:0 0 12px">Hi ${cleanName},</h3>
          <p style="color:#65676b;margin:0 0 20px">Use this code to verify. Valid for <b>5 minutes</b>.</p>
          <div style="text-align:center;background:#f0f2f5;padding:24px;border-radius:12px;margin:20px 0">
            <span style="letter-spacing:10px;color:#043D22;font-size:38px;font-weight:800;font-family:'Courier New',monospace">${otp}</span>
          </div>
          <p style="color:#65676b;font-size:13px;text-align:center;margin:16px 0 0">If you didn't request this, ignore this email.</p>
          <p style="color:#9aa0a6;font-size:12px;text-align:center;margin:8px 0 0">&copy; 2026 Autrobook</p>
        </div>
      `
    });

    return res.status(200).json({ success: true, code: 'OTP_SENT' });
  } catch (e) {
    console.error('send-otp:', e);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR' });
  }
}
