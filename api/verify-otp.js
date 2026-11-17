// api/verify-otp.js - OTP Verify Only - Email OTP
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// ⚠️ MUST USE SERVICE ROLE - Anon Key দিয়ে otps Table পড়া যাবে না (RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
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

    // Fetch latest OTP
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

    // FIX: তোমার Table এ expiry / expires_at - 2টাই হতে পারে, 2টাই Handle করলাম
    const expiryRaw = record.expires_at || record.expiry || record.expire_at;
    if (!expiryRaw) {
      return res.status(500).json({ success: false, message: 'OTP expiry field missing in DB' });
    }

    const now = new Date();
    const expiry = new Date(expiryRaw);
    if (now > expiry) {
      await supabase.from('otps').delete().eq('email', cleanEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // FIX: record.otp / record.otp_hash / record.code - 3টাই Handle
    const storedHash = record.otp_hash || record.otp || record.code;
    if (!storedHash) {
      return res.status(500).json({ success: false, message: 'OTP hash not found in DB' });
    }

    // If stored is plain 6-digit (not hashed), direct compare
    let isMatch = false;
    if (String(storedHash).length === 6 && /^\d{6}$/.test(String(storedHash))) {
      isMatch = String(storedHash) === cleanOtp;
    } else {
      isMatch = await bcrypt.compare(cleanOtp, String(storedHash));
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // OTP Valid - Delete so cannot reuse
    await supabase.from('otps').delete().eq('email', cleanEmail);

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
