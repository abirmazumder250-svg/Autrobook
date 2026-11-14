import nodemailer from 'nodemailer';
import axios from 'axios';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { email, otp, name, recaptchaToken } = req.body;

    if (!email || !otp || !recaptchaToken) {
      return res.status(400).json({ success: false, message: 'Email, OTP and reCAPTCHA required' });
    }

    // 1. Verify reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    const recaptchaRes = await axios.post(verifyURL);
    
    if (!recaptchaRes.data.success) {
      return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed' });
    }

    // 2. Send Email with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // autrobooksupport@gmail.com
        pass: process.env.GMAIL_APP_PASSWORD // 16 digit app password
      }
    });

    const mailOptions = {
      from: `Autrobook <${process.env.GMAIL_USER}>`,
      to: email.trim(),
      subject: 'Your Autrobook Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #111;">Hi ${name || 'User'},</h2>
          <p style="color: #555;">Your Autrobook verification code is:</p>
          <h1 style="letter-spacing: 5px; color: #0f5132; font-size: 32px; margin: 20px 0;">${otp}</h1>
          <p style="color: #555; font-size: 14px;">This OTP expires in 5 minutes. Do not share it with anyone.</p>
          <br>
          <p style="color: #888; font-size: 13px;">- Team Autrobook</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });

  } catch (e) {
    console.error('Server Error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
