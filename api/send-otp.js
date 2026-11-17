// api/send-otp.js - Send OTP Only
// Job: Generate 6-digit OTP -> Hash it -> Save in Supabase -> Send Email

import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); }
      catch (e) { return res.status(400).json({ success: false, message: 'Invalid JSON payload' }); }
    }

    const { email, name } = body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = name ? String(name).trim() : 'User';

    // Generate 6-digit OTP - Valid for 5 minutes
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Hash OTP - Never store plain OTP in database
    const hashedOtp = await bcrypt.hash(generatedOtp, 10);

    // Delete old OTPs for this email
    await supabase.from('otps').delete().eq('email', cleanEmail);

    // Save new OTP
    const { error: dbError } = await supabase
      .from('otps')
      .insert([{
        email: cleanEmail,
        otp: hashedOtp,
        otp_hash: hashedOtp,
        expiry: expiryTime,
        expires_at: expiryTime,
        created_at: new Date().toISOString()
      }]);

    if (dbError) {
      return res.status(500).json({ success: false, message: 'Database error: ' + dbError.message });
    }

    // Send Email via Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ success: false, message: 'Gmail credentials not set in Vercel' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: `"Autrobook Security" <${process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: 'Your Autrobook Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 500px; margin: auto; border: 1px solid #e4e6e9; border-radius: 16px;">
          <h2 style="text-align:center; color:#043D22;">Autrobook</h2>
          <h3>Hi ${cleanName},</h3>
          <p style="color:#65676b;">Use this 6-digit code to verify your identity. Valid for 5 minutes.</p>
          <div style="text-align:center; background:#f0f2f5; padding:20px; border-radius:12px; margin:20px 0;">
            <span style="letter-spacing:8px; color:#043D22; font-size:36px; font-weight:800;">${generatedOtp}</span>
          </div>
          <p style="color:#65676b; font-size:13px; text-align:center;">If you did not request this, ignore this email.</p>
          <p style="color:#9aa0a6; font-size:12px; text-align:center;">&copy; 2026 Autrobook</p>
        </div>
      `
    });

    return res.status(200).json({ success: true, message: 'OTP sent successfully to your email' });

  } catch (e) {
    console.error('Send OTP Error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
