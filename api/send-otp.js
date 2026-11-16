import nodemailer from 'nodemailer';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase (Uses Vercel Environment Variables)
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // 1. CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    // 2. Parse Request Body safely
    let body = req.body;
    if (typeof body === 'string') {
      try { 
        body = JSON.parse(body); 
      } catch (e) { 
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' }); 
      }
    }

    // 3. Extract Data from Frontend
    const { email, name, recaptchaToken, fingerprintVerified } = body || {};

    if (!email || !recaptchaToken) {
      return res.status(400).json({ success: false, message: 'Email and reCAPTCHA token are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // 4. Verify Google reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is missing in environment variables');
      return res.status(500).json({ success: false, message: 'Server configuration error (reCAPTCHA)' });
    }

    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', recaptchaToken);

    const recaptchaRes = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    // Bypass for testing if token is 'manual_bypass' (You can remove this in production)
    if (!recaptchaRes.data.success && recaptchaToken !== 'manual_bypass') {
      return res.status(400).json({ 
        success: false, 
        message: 'reCAPTCHA verification failed. Please try again.',
        errors: recaptchaRes.data['error-codes']
      });
    }

    // 5. Generate Secure 6-digit OTP & Expiry (5 minutes)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 6. Hash the OTP for security
    const hashedOtp = await bcrypt.hash(generatedOtp, 10);

    // 7. Save OTP to Supabase (Delete old ones first)
    const { error: deleteError } = await supabase.from('otps').delete().eq('email', cleanEmail);
    if (deleteError) console.warn('Supabase Delete Warning:', deleteError.message);
    
    const { error: dbError } = await supabase
      .from('otps')
      .insert([{ 
        email: cleanEmail, 
        otp: hashedOtp, // Storing hashed OTP
        expiry: expiryTime 
      }]);

    if (dbError) {
      console.error('Supabase Database Error:', dbError);
      return res.status(500).json({ success: false, message: 'Database error: ' + dbError.message });
    }

    // 8. Security Audit Log
    console.log(`[SECURITY] OTP Requested | Email: ${cleanEmail} | IP: ${clientIp} | Biometric: ${fingerprintVerified ? 'Yes' : 'No'}`);

    // 9. Send Email via Nodemailer (Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"Autrobook Security" <${process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: 'Your Autrobook Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; max-width: 500px; margin: auto; border: 1px solid #e4e6e9; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://raw.githubusercontent.com/abirmazumder250-svg/Autrobook/main/logo.png" alt="Autrobook" width="70" style="border-radius: 14px; margin-bottom: 12px;" />
            <h2 style="color: #1c1e21; margin: 0; font-size: 22px; font-weight: 800;">Autrobook</h2>
          </div>
          
          <h3 style="color: #1c1e21; font-size: 18px; margin-bottom: 10px;">Hi ${name || 'User'},</h3>
          <p style="color: #65676b; font-size: 15px; line-height: 1.5;">Please use the following 6-digit code to verify your identity. This code is valid for 5 minutes.</p>
          
          <div style="text-align: center; background: #f0f2f5; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <span style="letter-spacing: 8px; color: #1b5e20; font-size: 36px; font-weight: 800;">${generatedOtp}</span>
          </div>
          
          <p style="color: #65676b; font-size: 13px; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e4e6e9; margin: 24px 0;">
          <p style="color: #9aa0a6; font-size: 12px; text-align: center;">&copy; 2025 Autrobook. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: 'OTP sent successfully to your email' });

  } catch (e) {
    console.error('Server Internal Error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
