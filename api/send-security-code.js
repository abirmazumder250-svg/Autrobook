import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body || '{}');
      } catch {
        return res.status(400).json({ ok: false, success: false, error: 'Invalid JSON body' });
      }
    }

    const recipient = String(body.to || body.email || '').trim().toLowerCase();
    const codeValue = String(body.code || body.otp || '').trim();
    const purposeText = String(body.purpose || 'Account Security').trim();

    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return res.status(400).json({ ok: false, success: false, error: 'Valid recipient email is required' });
    }

    if (!/^\d{6}$/.test(codeValue)) {
      return res.status(400).json({ ok: false, success: false, error: 'Valid 6-digit code is required' });
    }

    const gmailUser = String(process.env.GMAIL_USER || '').trim();
    const gmailAppPassword = String(process.env.GMAIL_APP_PASSWORD || '').trim();

    if (!gmailUser || !gmailAppPassword) {
      return res.status(500).json({
        ok: false,
        success: false,
        error: 'GMAIL_USER or GMAIL_APP_PASSWORD is missing in Vercel environment variables'
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    const safePurpose = escapeHtml(purposeText);
    const safeCode = escapeHtml(codeValue);

    await transporter.sendMail({
      from: `"Autrobook Security" <${gmailUser}>`,
      to: recipient,
      subject: `${safeCode} is your Autrobook security code`,
      text: `Your Autrobook verification code for ${purposeText} is ${codeValue}. It expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="margin: 0 0 10px; color: #0F5132;">Autrobook Security Verification</h2>
          <p style="margin: 0 0 14px; color: #374151;">Action: <strong>${safePurpose}</strong></p>
          <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 14px; text-align: center; background: #f3f4f6; border-radius: 8px; color: #0F5132;">
            ${safeCode}
          </div>
          <p style="margin: 14px 0 0; font-size: 12px; color: #6b7280;">This code will expire in 5 minutes. If you did not request this, secure your account immediately.</p>
        </div>
      `
    });

    return res.status(200).json({ ok: true, success: true, message: 'Verification code sent' });
  } catch (err) {
    return res.status(500).json({ ok: false, success: false, error: err?.message || 'Failed to send email' });
  }
}
