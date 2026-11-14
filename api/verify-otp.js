// Vercel API - Verify Email OTP with Supabase
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt'; // Required to compare hashed OTPs

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
    
    const { email, otp } = body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Capture client IP and User-Agent for security audit logging
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // 1. Fetch OTP record from Supabase
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      return res.status(400).json({ success: false, message: 'OTP not found or already used' });
    }

    // 2. Check if the OTP has expired
    if (Date.now() > data.expiry) {
      // Automatically delete expired OTP from database
      await supabase.from('otps').delete().eq('email', cleanEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // 3. Compare user-submitted OTP with the bcrypt hashed OTP stored in the database
    const isMatch = await bcrypt.compare(String(otp), data.otp);

    if (!isMatch) {
      console.warn(`[SECURITY WARNING] Failed OTP verification attempt for: ${cleanEmail} | IP: ${clientIp}`);
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    // 4. OTP matched successfully. Sign in or authenticate user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({ 
      email: cleanEmail,
      options: { shouldCreateUser: true } 
    });
    
    if (authError) {
      console.error('Supabase Auth Error:', authError);
      throw authError;
    }

    // 5. Delete the OTP immediately after successful use to prevent reuse (Single-use token)
    await supabase.from('otps').delete().eq('email', cleanEmail);

    // Log successful verification audit
    console.log(`[SECURITY AUDIT] OTP verified successfully for: ${cleanEmail} | IP: ${clientIp} | UA: ${userAgent}`);

    return res.status(200).json({ success: true, message: 'Login Successful' });

  } catch (e) {
    console.error('Verify Internal Error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  } 
}
