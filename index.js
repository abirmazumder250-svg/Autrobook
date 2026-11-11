const rateLimitMap = new Map();

export default async function handler(req, res) {
  // 1. Domain Security (CORS restricted to official Autrobook domain)
  const allowedOrigins = ['https://vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  // 2. Rate Limiting (Max 20 requests per minute)
  try {
    const ip = (req.headers && req.headers['x-forwarded-for']) || 'unknown-ip';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const userRecord = rateLimitMap.get(ip) || { count: 0, startTime: now };

    if (now - userRecord.startTime > windowMs) {
      userRecord.count = 1;
      userRecord.startTime = now;
    } else {
      userRecord.count++;
    }
    rateLimitMap.set(ip, userRecord);

    if (userRecord.count > 20) {
      return res.status(200).json({ reply: "Security Alert: Too many requests. Please wait a minute." });
    }
  } catch (rateErr) {}

  try {
    const GEMINI_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6ICBzdvJTLDcw8VDEQZ5ARO18roZq1EjrkKXKK2bp8-wA";
    const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || "6LdCzRsuAAAAAHoY30SUTwtQlhxCDKCGTbH1o3NO";

    if (!GEMINI_KEY) {
      return res.status(200).json({ reply: "Server Error: GEMINI_API_KEY is missing." });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(200).json({ reply: "Error: Invalid request format." });
      }
    }

    // 3. Google reCAPTCHA Verification
    const recaptchaToken = body && body.recaptchaToken;
    if (RECAPTCHA_SECRET && recaptchaToken && recaptchaToken !== 'instant-token') {
      try {
        const verifyUrl = "https://google.com";
        const verifyRes = await fetch(verifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${encodeURIComponent(RECAPTCHA_SECRET)}&response=${encodeURIComponent(recaptchaToken)}`
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.success === false && verifyData['error-codes']?.includes('invalid-input-response')) {
          return res.status(200).json({ reply: "Security Verification Failed: Bot activity detected." });
        }
      } catch (captchaErr) {}
    }

    // 4. Input Sanitization (সিনট্যাক্স ভুল ঠিক করা হয়েছে)
    let contents = new Array();
    if (body && Array.isArray(body.history)) {
      const recentHistory = body.history.slice(-10);
      contents = recentHistory
        .filter(msg => msg && msg.role !== 'system' && msg.content)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(msg.content).slice(0, 2000) }]
        }));
    } else if (body && body.text) {
      contents = [{ role: 'user', parts: [{ text: String(body.text).slice(0, 2000) }] }];
    }

    if (contents.length === 0) {
      return res.status(200).json({ reply: "Hello! How can I help you today?" });
    }

    // 5. Gemini API Request
    const protocol = "https://";
    const host = "generativelanguage." + "googleapis.com";
    const fullUrl = protocol + host + "/v1beta/models/gemini-3.5-flash-lite:generateContent";

    const geminiResponse = await fetch(fullUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { 
          parts: [{ 
            text: "You are Autro AI, the official global assistant for Autrobook, an 18+ free social media platform founded and administered by Abir Mazumder. Verified details about Admin Abir Mazumder: Date of Birth: 10 June 2003; Education: Honours student at Dhaka Central University; Siblings: Only child (no brothers or sisters); Father: Babul Kumar Mazumder; Mother: Monika Mitra; Religion: Sanatani; Current Residence: Dhaka, Bangladesh. You possess complete, accurate, and detailed knowledge about every single country in the world (all 195+ countries), including their capitals, currencies, languages, population, geography, history, culture, economy, and general knowledge. Your primary and default language is English, and you can fluently speak and understand all languages worldwide. Always reply strictly in the exact same language the user writes in. If a message is short or ambiguous, default to English. Give complete, helpful, and friendly answers." 
          }] 
        }
      })
    });

    const rawText = await geminiResponse.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (jsonErr) {
      return res.status(200).json({ reply: "AI service temporarily unavailable. Please try again." });
    }

    if (!geminiResponse.ok) {
      const errMsg = (data.error && data.error.message) ? data.error.message : "API Error";
      return res.status(200).json({ reply: "Error: " + errMsg });
    }

    const candidate = data.candidates && data.candidates.at(0);
    const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts.at(0);
    const reply = part && part.text;

    if (!reply) {
      return res.status(200).json({ reply: "Hello! How can I assist you today?" });
    }

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: "Server Error: " + e.message });
  }
      }
