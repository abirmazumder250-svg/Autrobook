export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (_) {
      return res.status(400).json({ success: false, message: 'Invalid JSON body' });
    }
  }

  const token = String(body.token || '').trim();
  if (!token) {
    return res.status(400).json({ success: false, message: 'Captcha token missing' });
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ success: false, message: 'RECAPTCHA_SECRET_KEY not set in Vercel' });
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await r.json();

    if (data.success) {
      return res.status(200).json({ success: true, message: 'Captcha verified successfully' });
    }

    console.error('reCAPTCHA verification failed:', data['error-codes']);
    return res.status(400).json({
      success: false,
      message: 'Captcha verification failed',
      errors: data['error-codes'],
    });
  } catch (e) {
    console.error('verify-captcha server error:', e);
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
}
