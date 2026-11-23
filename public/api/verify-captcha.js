// api/verify-captcha.js - Google reCAPTCHA Verification Only
// This file is ONLY for reCAPTCHA. Do NOT mix OTP logic here.
// OTP verification lives in a separate file: api/verify-otp.js

export default async function handler(req, res) {
  // 1. CORS Configuration - Allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle Preflight Request
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Only POST is allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 2. Get Captcha Token from Frontend
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ success: false, message: 'Captcha token missing' });
  }

  // 3. Get Secret Key from Vercel Environment Variables
  // NEVER put the Secret Key in Frontend code or GitHub
  // Vercel -> Settings -> Environment Variables -> RECAPTCHA_SECRET_KEY
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ success: false, message: 'RECAPTCHA_SECRET_KEY not set in Vercel' });
  }

  try {
    // 4. Verify Token with Google
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const data = await r.json();

    // 5. Success - User is Human
    if (data.success) {
      return res.status(200).json({ success: true, message: 'Captcha verified successfully' });
    }

    // 6. Failed - Robot or Expired Token
    return res.status(400).json({
      success: false,
      message: "Captcha verification failed",
      errors: data["error-codes"]
    });

  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
