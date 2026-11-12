// Vercel API - Send OTP to Email via EmailJS
const otpStore = new Map(); // email -> { otp, expiry, attempts }

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try{
    let body = req.body;
    if(typeof body === 'string') body = JSON.parse(body);
    const { name, email } = body;

    if(!name || !email) return res.status(400).json({ success:false, message: 'Name and Email required' });
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success:false, message: 'Invalid email' });

    // Rate limit - 1 min e 1 bar
    const old = otpStore.get(email);
    if(old && Date.now() - old.lastSent < 60000){
      return res.status(429).json({ success:false, message: 'Please wait 60 seconds before resend' });
    }

    // ✅ OTP SERVER E BANANO - Browser e na
    const otp = Math.floor(100000 + Math.random()*900000).toString();
    otpStore.set(email, { otp, expiry: Date.now() + 5*60*1000, attempts: 0, lastSent: Date.now() });
    // Share store with verify file via global
    globalThis.__otpStore = otpStore;

    // EmailJS REST API diye mail pathano
    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: { to_email: email, email: email, name: name, otp: otp }
      })
    });

    if(!emailRes.ok){
      const err = await emailRes.text();
      console.log("EmailJS Error:", err);
      return res.status(500).json({ success:false, message: 'Failed to send email. Check EmailJS keys.' });
    }

    return res.status(200).json({ success:true, message: 'OTP sent to ' + email });
  }catch(e){
    return res.status(500).json({ success:false, message: 'Server error: ' + e.message });
  }
}
