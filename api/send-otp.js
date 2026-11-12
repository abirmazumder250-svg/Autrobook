// Vercel API - Send OTP to Email via EmailJS + Firestore
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { name, email } = body || {};
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and Email required' });

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    const docId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/email_otps/${docId}?key=${FIREBASE_API_KEY}`;

    // Rate Limit - 60 seconds
    const getRes = await fetch(docUrl);
    if (getRes.ok) {
      const old = await getRes.json();
      const lastSent = Number(old.fields?.lastSent?.integerValue || 0);
      if (Date.now() - lastSent < 60000) {
        return res.status(429).json({ success: false, message: 'Please wait 60 seconds before resend' });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;

    // Save to Firestore
    await fetch(docUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          otp: { stringValue: otp },
          email: { stringValue: cleanEmail },
          expiry: { integerValue: String(expiry) },
          attempts: { integerValue: "0" },
          lastSent: { integerValue: String(Date.now()) }
        }
      })
    });

    // Send Email via EmailJS
    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: { to_email: cleanEmail, email: cleanEmail, name: name, otp: otp }
      })
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.log("EmailJS Error:", err);
      return res.status(500).json({ success: false, message: 'Failed to send email. Check EmailJS keys.' });
    }

    return res.status(200).json({ success: true, message: 'OTP sent to ' + cleanEmail });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
                          }
