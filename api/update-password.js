import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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

    const { email, resetToken, newPassword } = body || {};

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // 3. Basic Token Verification (For added security)
    // In a real app, you would verify the JWT token here.
    try {
      const decodedToken = Buffer.from(resetToken, 'base64').toString('ascii');
      if (!decodedToken.startsWith(cleanEmail)) {
        return res.status(403).json({ success: false, message: 'Invalid or expired reset token' });
      }
    } catch (e) {
      return res.status(403).json({ success: false, message: 'Malformed token' });
    }

    // 4. Hash the new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update the user's password in the Supabase 'users' table
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', cleanEmail);

    if (updateError) {
      console.error('Supabase Update Error:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to update password in database' });
    }

    // 6. Success
    return res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully' 
    });

  } catch (e) {
    console.error('Server Internal Error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
