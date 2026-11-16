import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase Client
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
    // 2. Parse Request Body
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } 
      catch (e) { return res.status(400).json({ success: false, message: 'Invalid JSON payload' }); }
    }

    const { email, otp } = body || {};

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 3. Fetch the latest OTP record for this email from Supabase
    const { data: otpRecords, error: fetchError } = await supabase
      .from('otps')
      .select('*')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Supabase Fetch Error:', fetchError);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (!otpRecords || otpRecords.length === 0) {
      return res.status(400).json({ success: false, message: 'No OTP found for this email. Please request a new one.' });
    }

    const record = otpRecords[0];

    // 4. Check if the OTP has expired
    const now = new Date();
    const expiry = new Date(record.expiry);
    
    if (now > expiry) {
      // Clean up expired OTP
      await supabase.from('otps').delete().eq('email', cleanEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // 5. Compare the entered OTP with the hashed OTP in the database
    const isMatch = await bcrypt.compare(cleanOtp, record.otp);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // 6. OTP is valid! Delete it so it cannot be reused
    await supabase.from('otps').delete().eq('email', cleanEmail);

    // 7. Generate a secure temporary token for the next step (Password Reset)
    // In a real production app, you would generate a JWT token here.
    const resetToken = Buffer.from(`${cleanEmail}:${Date.now()}`).toString('base64');

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
