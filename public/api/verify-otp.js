// api/verify-otp.js
import nodemailer from 'nodemailer';

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
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ success: false, code: 'INVALID_JSON' });
      }
    }

    const { email, otp, password, profile } = body || {};
    if (!email || !otp || !password || !profile) {
      return res.status(400).json({ success: false, code: 'MISSING_FIELDS' });
    }

    const cleanOtp = String(otp).trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, code: 'OTP_INVALID' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ success: false, code: 'PASSWORD_TOO_SHORT' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, code: 'INVALID_EMAIL' });
    }

    const gmailUser = (process.env.GMAIL_USER || '').trim();
    const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();

    if (!gmailUser || !gmailAppPassword) {
      return res.status(500).json({
        success: false,
        code: 'GMAIL_APP_PASSWORD_MISSING',
        message: 'GMAIL_USER or GMAIL_APP_PASSWORD is missing in Vercel Environment Variables.'
      });
    }

    const cleanName = esc(profile.full_name ? String(profile.full_name).trim() : 'User');
    const safePassword = esc(password);

    const transporter = createGmailTransporter(gmailUser, gmailAppPassword);
    await transporter.verify();

    // আপনার নিজের Gmail থেকে ইউজারের ইমেইলে অটোমেটিক পাসওয়ার্ড ও অ্যাকাউন্ট তথ্য পাঠানো
    await transporter.sendMail({
      from: `"Autrobook" <${gmailUser}>`,
      replyTo: gmailUser,
      to: cleanEmail,
      subject: 'Your Autrobook Account Password & Details',
      html: `
        <div style="font-family:Arial,sans-serif;padding:30px;max-width:520px;margin:auto;border:1px solid #e4e6e9;border-radius:16px;background:#fff">
          <div style="background:#0B3D20;padding:24px;border-radius:12px 12px 0 0;text-align:center;margin:-30px -30px 24px">
            <h2 style="color:#fff;margin:0;font-size:22px">Autrobook</h2>
          </div>
          <h3 style="margin:0 0 12px;color:#050505">Hi ${cleanName},</h3>
          <p style="color:#65676b;margin:0 0 16px">Your account details have been confirmed. Here is your password:</p>
          <div style="background:#f0f2f5;padding:18px;border-radius:12px;margin:16px 0">
            <p style="margin:0 0 8px;color:#050505;font-size:14px"><b>Email:</b> ${esc(cleanEmail)}</p>
            <p style="margin:0;color:#050505;font-size:14px"><b>Password:</b> <span style="color:#0B3D20;font-weight:800;font-family:'Courier New',monospace">${safePassword}</span></p>
          </div>
          <p style="color:#65676b;font-size:13px;margin:16px 0 0">For your security, please keep this email safe or change your password after logging in.</p>
          <p style="color:#9aa0a6;font-size:12px;text-align:center;margin:20px 0 0">&copy; 2026 Autrobook</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      code: 'VERIFIED_AND_SENT',
      sentFrom: gmailUser
    });
  } catch (e) {
    console.error('verify-otp error:', e);
    return res.status(500).json({
      success: false,
      code: 'GMAIL_SEND_FAILED',
      message: e && e.message ? e.message : 'Failed to send email via Gmail App Password.'
    });
  }
}
