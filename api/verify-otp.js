// Vercel API - Verify Email OTP (Firestore Shared Storage)
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
      catch (e) { return res.status(400).json({ success: false, message: 'Invalid JSON body' }); }
    }

    const { email, otp } = body || {};

    // 1. Validation
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6) {
      return res.status(400).json({ success: false, message: 'OTP must be 6 digits' });
    }

    const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    if (!PROJECT_ID || !FIREBASE_API_KEY) {
      return res.status(500).json({ success: false, message: 'Firebase config missing in Vercel Environment Variables' });
    }

    // Firestore Document ID - Safe for email
    const docId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/email_otps/${docId}?key=${FIREBASE_API_KEY}`;

    // 2. Get OTP from Firestore
    const getRes = await fetch(docUrl);
    if (!getRes.ok) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please send OTP again.' });
    }

    const data = await getRes.json();
    const f = data.fields || {};
    const savedOtp = f.otp?.stringValue;
    const expiry = Number(f.expiry?.integerValue || 0);
    const attempts = Number(f.attempts?.integerValue || 0);
    const storedEmail = f.email?.stringValue;

    // 3. Check Expiry - 5 Minutes
    if (Date.now() > expiry) {
      await fetch(docUrl, { method: "DELETE" }).catch(() => {});
      return res.status(400).json({ success: false, message: 'OTP expired. Please resend OTP.' });
    }

    // 4. Check Attempts - Max 3
    if (attempts >= 3) {
      await fetch(docUrl, { method: "DELETE" }).catch(() => {});
      return res.status(400).json({ success: false, message: 'Too many wrong attempts. Please resend OTP.' });
    }

    // 5. Verify OTP
    if (cleanOtp === savedOtp) {
      // Success - Delete OTP so it cannot be reused
      await fetch(docUrl, { method: "DELETE" }).catch(() => {});
      return res.status(200).json({
        success: true,
        message: 'Verified!',
        email: storedEmail || cleanEmail
      });
    } else {
      // Wrong OTP - Increase attempt count correctly
      const newAttempts = attempts + 1;
      await fetch(docUrl + "&updateMask.fieldPaths=attempts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            attempts: { integerValue: String(newAttempts) }
          }
        })
      }).catch(() => {});

      return res.status(400).json({
        success: false,
        message: `Wrong OTP (${newAttempts}/3)`
      });
    }

  } catch (e) {
    console.log("Verify OTP Error:", e.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
      }
