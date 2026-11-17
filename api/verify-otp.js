// api/verify-otp.js - Verify OTP Only
// Job: Check if the 6-digit OTP entered by user matches the hashed OTP in Supabase
// This file does NOT send OTP. Sending is done in api/send-otp.js

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// MUST USE SERVICE ROLE KEY
// Anon Key cannot read the 'otps' table because of RLS (Row Level Security)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1. CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 2. Check Environment Variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ success: false, message: 'Supabase credentials not set in Vercel' });
  }

  try {
    // 3. Parse Request Body Safely
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
      }
    }

    const { email, otp } = body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 4. Fetch Latest OTP for This Email
    const { data: otpRecords, error: fetchError } = await supabase
      .from('otps')
      .select('*')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Supabase Fetch Error:', fetchError);
      return res.status(500).json({ success: false, message: 'Database error: ' + fetchError.message });
    }

    if (!otpRecords || otpRecords.length === 0) {
      return res.status(400).json({ success: false, message: 'No OTP found for this email. Please request a new one.' });
    }

    const record = otpRecords[0];

    // 5. Check Expiry - Supports 3 column names: expires_at / expiry / expire_at
    const expiryRaw = record.expires_at || record.expiry || record.expire_at;
    if (!expiryRaw) {
      return res.status(500).json({ success: false, message: 'OTP expiry field missing in database' });
    }

    const now = new Date();
    const expiry = new Date(expiryRaw);
    if (now > expiry) {
      // Delete expired OTP
      await supabase.from('otps').delete().eq('email', cleanEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // 6. Compare OTP - Supports 3 column names: otp_hash / otp / code
    const storedHash = record.otp_hash || record.otp || record.code;
    if (!storedHash) {
      return res.status(500).json({ success: false, message: 'OTP hash not found in database' });
    }

    // If stored as plain 6-digit code, compare directly
    // If stored as bcrypt hash, use bcrypt.compare
    let isMatch = false;
    if (String(storedHash).length === 6 && /^\d{6}$/.test(String(storedHash))) {
      isMatch = String(storedHash) === cleanOtp;
    } else {
      isMatch = await bcrypt.compare(cleanOtp, String(storedHash));
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // 7. OTP is Valid - Delete it so it cannot be reused
    await supabase.from('otps').delete().eq('email', cleanEmail);

    // 8. Generate Secure Reset Token - FIXED: Now uses crypto random, not predictable
    const resetToken = crypto.randomBytes(32).toString('hex');

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: resetToken
    });

  } catch (e) {
    console.error('Server Internal Error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
