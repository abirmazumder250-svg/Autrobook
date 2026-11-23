// api/send-otp.js
import nodemailer from 'nodemailer';
import crypto from 'crypto';

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function createGmailTransporter(gmailUser, gmailAppPassword) {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, ok: false, code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ success: false, ok: false, code: 'INVALID_JSON', error: 'Invalid JSON body' });
      }
    }

    const { email, name, purpose } = body || {};
    if (!email) {
      return res.status(400).json({ success: false, ok: false, code: 'EMAIL_REQUIRED', error: 'Email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, ok: false, code: 'INVALID_EMAIL', error: 'Invalid email address' });
    }

    const cleanName = esc(name ? String(name).trim() : 'User');
    const isReset = purpose === 'reset-password';

    const gmailUser = (process.env.GMAIL_USER || '').trim();
    const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();

    if (!gmailUser || !gmailAppPassword) {
      return res.status(500).json({
        success: false,
        ok: false,
        code: 'GMAIL_APP_PASSWORD_MISSING',
        error: 'GMAIL_USER or GMAIL_APP_PASSWORD is missing in Vercel Environment Variables.'
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const transporter = createGmailTransporter(gmailUser, gmailAppPassword);

    const headingText = isReset ? 'Reset Your Password' : 'Complete Your Sign Up';
    const actionText = isReset ? 'reset your password' : 'complete your sign up';

    await transporter.sendMail({
      from: `"Autrobook" <${gmailUser}>`,
      replyTo: gmailUser,
      to: cleanEmail,
      subject: `Autrobook Verification Code: ${otp}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:30px;max-width:520px;margin:auto;border:1px solid #e4e6e9;border-radius:16px;background:#fff">
          <div style="background:#0B3D20;padding:24px;border-radius:12px 12px 0 0;text-align:center;margin:-30px -30px 24px">
            <h2 style="color:#fff;margin:0;font-size:22px">Autrobook</h2>
          </div>
          <h3 style="margin:0 0 12px;color:#050505">Hi ${cleanName},</h3>
          <p style="color:#65676b;margin:0 0 20px">${headingText}: use this verification code to ${actionText}. Valid for <b>5 minutes</b>.</p>
          <div style="text-align:center;background:#f0f2f5;padding:24px;border-radius:12px;margin:20px 0">
            <span style="letter-spacing:10px;color:#0B3D20;font-size:38px;font-weight:800;font-family:'Courier New',monospace">${otp}</span>
          </div>
          <p style="color:#65676b;font-size:13px;text-align:center;margin:16px 0 0">If you didn't request this, please ignore this email.</p>
          <p style="color:#9aa0a6;font-size:12px;text-align:center;margin:8px 0 0">&copy; 2026 Autrobook</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      ok: true,
      code: 'OTP_SENT',
      from: gmailUser,
      otp,
      expiresAt
    });
  } catch (e) {
    console.error('send-otp error:', e);
    return res.status(500).json({
      success: false,
      ok: false,
      code: 'GMAIL_SEND_FAILED',
      error: e && e.message ? e.message : 'Failed to send email via Gmail App Password.'
    });
  }
      }
