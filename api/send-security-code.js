import nodemailer from 'nodemailer';

const ALLOWED_ORIGINS = new Set([
  'https://autrobook.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000'
]);

function applyCorsHeaders(req, res) {
  const origin = String(req.headers.origin || '').trim();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body || '{}');
      } catch (_) {
        return res.status(400).json({
          ok: false,
          success: false,
          error: 'Invalid JSON request body.'
        });
      }
    }

    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'Request body must be a JSON object.'
      });
    }

    const recipient = String(body.to || body.email || '').trim().toLowerCase();
    const codeValue = String(body.code || body.otp || '').trim();
    const purposeText = String(body.purpose || 'Account Security').trim().slice(0, 80);

    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recipient)) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'Valid recipient email is required.'
      });
    }

    if (!/^\d{6}$/.test(codeValue)) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'Valid 6-digit verification code is required.'
      });
    }

    const gmailUser = String(process.env.GMAIL_USER || '').trim();
    const gmailAppPassword = String(process.env.GMAIL_APP_PASSWORD || '')
      .replace(/\s+/g, '')
      .trim();

    if (!gmailUser || !gmailAppPassword) {
      console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables.');
      return res.status(500).json({
        ok: false,
        success: false,
        error: 'Server mail configuration is missing.'
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
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
        <div style="font-family: Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <h2 style="margin: 0 0 10px; color: #0F5132;">Autrobook Security Verification</h2>
          <p style="margin: 0 0 14px; color: #374151;">Action: <strong>${safePurpose}</strong></p>
          <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 14px; text-align: center; background: #f3f4f6; border-radius: 8px; color: #0F5132;">
            ${safeCode}
          </div>
          <p style="margin: 14px 0 0; font-size: 12px; color: #6b7280;">This code will expire in 5 minutes. If you did not request this, secure your account immediately.</p>
        </div>
      `
    });

    return res.status(200).json({
      ok: true,
      success: true,
      message: 'Verification code sent successfully.'
    });
  } catch (err) {
    console.error('send-otp-email error:', err);
    return res.status(500).json({
      ok: false,
      success: false,
      error: 'Failed to send verification email.'
    });
  }
}
