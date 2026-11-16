import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import axios from 'axios';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { email, password, recaptchaToken } = req.body || {};

    if (!email || !password || !recaptchaToken) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Verify reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error (reCAPTCHA)' });
    }

    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', recaptchaToken);

    const recaptchaRes = await axios.post('https://www.google.com/recaptcha/api/siteverify', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    if (!recaptchaRes.data.success) {
      return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed' });
    }

    // 2. Check User in Supabase (আপনার টেবিলের নাম 'users' না হয়ে অন্য কিছু হলে এখানে পরিবর্তন করে নিবেন)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (error || !user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Verify Password using bcrypt
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    return res.status(200).json({ success: true, message: 'Login successful' });

  } catch (e) {
    console.error('Login Server Error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
