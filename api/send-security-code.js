import nodemailer from 'nodemailer';

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidCode(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code.trim());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return res.status(500).json({
      ok: false,
      error: 'Missing GMAIL_USER or GMAIL_APP_PASSWORD in Vercel environment variables.'
    });
  }

  const { to, code, purpose } = req.body || {};
  const recipient = String(to || '').trim();
  const verificationCode = String(code || '').trim();
  const actionPurpose = String(purpose || 'Autrobook Security Verification').trim();

  if (!isValidEmail(recipient)) {
    return res.status(400).json({ ok: false, error: 'Please provide a valid recipient email address.' });
  }

  if (!isValidCode(verificationCode)) {
    return res.status(400).json({ ok: false, error: 'Verification code must be a 6-digit number.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #1f2937; border-radius: 14px; background-color: #121314; color: #f1f5f9;">
      <h2 style="margin: 0 0 12px; color: #10b981;">Autrobook Security Verification</h2>
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #d1d5db;">
        Use the 6-digit verification code below for <strong style="color: #ffffff;">${actionPurpose}</strong>:
      </p>
      <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; text-align: center; padding: 14px; margin: 16px 0; background-color: #0B3D20; border: 1px solid #0a7d3b; border-radius: 10px; color: #ffffff;">
        ${verificationCode}
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af;">
        This code expires in 5 minutes. Do not share it with anyone.
      </p>
      <a href="https://autrobook.vercel.app" style="display: inline-block; margin-top: 10px; padding: 10px 18px; background-color: #0B3D20; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px;">
        Open Autrobook
      </a>
    </div>
  `;

  const textBody = [
    'Autrobook Security Verification',
    `Purpose: ${actionPurpose}`,
    `Verification Code: ${verificationCode}`,
    'This code expires in 5 minutes. Do not share it with anyone.'
  ].join('\n');

  try {
    await transporter.sendMail({
      from: `"Autrobook Security" <${gmailUser}>`,
      to: recipient,
      subject: `${verificationCode} is your Autrobook verification code`,
      text: textBody,
      html: htmlBody
    });

    return res.status(200).json({
      ok: true,
      message: 'Verification code sent successfully.'
    });
  } catch (error) {
    console.error('Failed to send security verification email:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to send verification email. Check Gmail App Password and account settings.'
    });
  }
}
