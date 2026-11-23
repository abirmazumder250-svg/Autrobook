import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { to, code, purpose } = req.body || {};

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return res.status(400).json({ ok: false, error: 'Valid recipient email is required' });
    }

    if (!code || !/^\d{6}$/.test(String(code))) {
      return res.status(400).json({ ok: false, error: 'Valid 6-digit code is required' });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      return res.status(500).json({
        ok: false,
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

    await transporter.sendMail({
      from: `"Autrobook Security" <${gmailUser}>`,
      to,
      subject: `${code} is your Autrobook security code`,
      text: `Your Autrobook verification code for ${purpose || 'Security Verification'} is ${code}. It expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="margin: 0 0 10px; color: #0B3D20;">Autrobook Security Verification</h2>
          <p style="margin: 0 0 14px; color: #374151;">Action: <strong>${purpose || 'Account Security'}</strong></p>
          <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 14px; text-align: center; background: #f3f4f6; border-radius: 8px; color: #0B3D20;">
            ${code}
          </div>
          <p style="margin: 14px 0 0; font-size: 12px; color: #6b7280;">This code will expire in 5 minutes. If you did not request this, secure your account immediately.</p>
        </div>
      `
    });

    return res.status(200).json({ ok: true, message: 'Verification code sent' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Failed to send email' });
  }
}
