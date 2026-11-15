import nodemailer from 'nodemailer';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS Headers Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { 
        body = JSON.parse(body); 
      } catch (e) { 
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' }); 
      }
    }

    // ফ্রন্টএন্ড থেকে পাঠানো ডেটাগুলো রিসিভ করা হচ্ছে (এর মধ্যে fingerprintVerified ও যুক্ত করা হয়েছে)
    const { email, name, recaptchaToken, fingerprintVerified } = body || {};

    if (!email || !recaptchaToken) {
      return res.status(400).json({ success: false, message: 'Email and reCAPTCHA token are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Capture client IP and User-Agent for security auditing
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // 1. Verify Google reCAPTCHA Token
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is missing in environment variables');
      return res.status(500).json({ success: false, message: 'Server configuration error (reCAPTCHA)' });
    }

    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', recaptchaToken);

    // অ্যাক্সিওস রিকোয়েস্টে সঠিক হেডার যুক্ত করা হয়েছে
    const recaptchaRes = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (!recaptchaRes.data.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'reCAPTCHA verification failed',
        errors: recaptchaRes.data['error-codes']
      });
    }

    // 2. Generate a secure 6-digit OTP & set 5-minute expiry time (ISO string ফরম্যাট Supabase-এর জন্য নিরাপদ)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 3. Hash the OTP securely using bcrypt before storing it in the database
    const hashedOtp = await bcrypt.hash(generatedOtp, 10);

    // 4. Save the hashed OTP to the Supabase 'otps' table (delete any previous OTP for this email first)
    const { error: deleteError } = await supabase.from('otps').delete().eq('email', cleanEmail);
    if (deleteError) {
      console.error('Supabase Delete Error:', deleteError);
    }
    
    const { error: dbError } = await supabase
      .from('otps')
      .insert([{ 
        email: cleanEmail, 
        otp: hashedOtp, 
        expiry: expiryTime 
      }]);

    if (dbError) {
      console.error('Supabase Database Error:', dbError);
      return res.status(500).json({ success: false, message: 'Database error: ' + dbError.message });
    }

    // Log security audit details
    console.log(`[SECURITY AUDIT] OTP requested for: ${cleanEmail} | IP: ${clientIp} | UA: ${userAgent} | Biometric: ${fingerprintVerified}`);

    // 5. Configure Nodemailer and Send Email with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `Autrobook <${process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: 'Your Autrobook Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; max-width: 500px; margin: auto; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://autrobook.vercel.app/logo.png" alt="Autrobook Logo" width="70" style="border-radius: 10px; margin-bottom: 10px;" />
            <h2 style="color: #111; margin: 0; font-size: 22px;">Autrobook</h2>
          </div>
          <h3 style="color: #333;">Hi ${name || 'User'},</h3>
          <p style="color: #555; font-size: 15px;">Your Autrobook verification code is:</p>
          <div style="text-align: center; background: #f4f6f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <span style="letter-spacing: 6px; color: #0f5132; font-size: 32px; font-weight: bold;">${generatedOtp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP expires in 5 minutes. Do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">- Team Autrobook</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });

  } catch (e) {
    console.error('Server Internal Error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
