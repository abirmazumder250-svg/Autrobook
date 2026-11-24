const ALLOWED_ORIGINS = new Set([
  'https://autrobook.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000'
]);

function applyCorsHeaders(req, res) {
  const origin = String(req.headers.origin || '').trim();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (_) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON request body.'
      });
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Request body must be a JSON object.'
    });
  }

  const rawToken =
    body.token ||
    body.recaptchaToken ||
    body.gRecaptchaResponse ||
    body['g-recaptcha-response'] ||
    '';

  if (typeof rawToken !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reCAPTCHA token format.'
    });
  }

  const token = rawToken.trim();
  if (!token || token.length > 4096) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid reCAPTCHA token.'
    });
  }

  const secret = String(process.env.RECAPTCHA_SECRET_KEY || '').trim();
  if (!secret) {
    console.error('Missing RECAPTCHA_SECRET_KEY environment variable.');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: reCAPTCHA secret key is not set.'
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const forwardedFor = String(req.headers['x-forwarded-for'] || '').trim();
    const clientIp =
      (forwardedFor ? forwardedFor.split(',')[0].trim() : '') ||
      String(req.socket?.remoteAddress || '').trim();

    if (clientIp) {
      params.append('remoteip', clientIp);
    }

    const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!verifyResponse.ok) {
      console.error('Google reCAPTCHA siteverify HTTP error:', verifyResponse.status);
      return res.status(502).json({
        success: false,
        message: 'Failed to reach reCAPTCHA verification service.'
      });
    }

    const data = await verifyResponse.json();

    if (data && data.success === true) {
      return res.status(200).json({
        success: true,
        message: 'reCAPTCHA verified successfully.',
        hostname: data.hostname || ''
      });
    }

    const errorCodes = Array.isArray(data?.['error-codes']) ? data['error-codes'] : [];
    console.warn('reCAPTCHA verification rejected:', {
      errorCodes,
      hostname: data?.hostname || 'unknown'
    });

    return res.status(400).json({
      success: false,
      message: 'reCAPTCHA verification failed. Please try again.',
      errors: errorCodes
    });
  } catch (err) {
    console.error('verify-captcha unexpected error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during reCAPTCHA verification.'
    });
  }
}
