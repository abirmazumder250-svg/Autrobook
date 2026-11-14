// Vercel API - Verify Email OTP with Supabase
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
      catch (e) { return res.status(400).json({ success: false, message: 'Invalid JSON' }); }
    }

    const { email, otp } = body || {};
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const cleanEmail = String(email).trim().toLowerCase();
    
    // 1. Get OTP from Supabase
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if(error || !data) return res.status(400).json({ success: false, message: 'OTP not found' });
    if(Date.now() > data.expiry) return res.status(400).json({ success: false, message: 'OTP Expired' });
    if(data.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    // 2. OTP matched. Login user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({ 
      email: cleanEmail,
      options: { shouldCreateUser: true }
    });
    
    if(authError) throw authError;

    // 3. Delete OTP after use
    await supabase.from('otps').delete().eq('email', cleanEmail);

    return res.status(200).json({ success: true, message: 'Login Successful' });

  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
