const rateLimitMap = new Map();

export default async function handler(req, res) {
  // ১. ডোমেইন সিকিউরিটি (শুধুমাত্র আপনার অ্যাপ থেকেই API কল করা যাবে)
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

  // ২. Rate Limiting চেক (প্রতি মিনিটে সর্বোচ্চ ২০টি মেসেজ)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
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
    return res.status(200).json({ reply: "Too many requests. Please wait a moment and try again." });
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(200).json({ reply: "Error: GEMINI_API_KEY is not set in Vercel." });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const history = body && body.history;
    if (!history || !Array.isArray(history)) {
      return res.status(200).json({ reply: "Error: Invalid message history format." });
    }

    // দ্রুত রেসপন্সের জন্য সর্বশেষ ১০টি মেসেজ নেওয়া হচ্ছে
    const recentHistory = history.slice(-10);

    const contents = recentHistory
      .filter(msg => msg.role !== 'system' && msg.content)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content) }]
      }));

    const protocol = "https://";
    const host = "generativelanguage." + "googleapis.com";
    const fullUrl = protocol + host + "/v1beta/models/gemini-3.5-flash-lite:generateContent";

    const geminiResponse = await fetch(fullUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { 
          parts: [{ 
            text: "You are Autro AI, the official assistant for Autrobook. The founder and admin of Autrobook is Abir Mazumder. Your primary and default language is English, and you can fluently speak and understand all languages across all countries worldwide (including Bengali, Hindi, Arabic, Spanish, French, Urdu, Russian, Chinese, Japanese, Korean, German, Portuguese, Turkish, etc.). Always detect the exact language the user writes in and reply strictly in that same language. If a message is short or ambiguous, default to English. Give complete, helpful, and friendly answers without cutting sentences short." 
          }] 
        }
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const errMsg = (data.error && data.error.message) ? data.error.message : "API Error";
      return res.status(200).json({ reply: "Error: " + errMsg });
    }

    const candidate = data.candidates && data.candidates[0];
    const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    const reply = part && part.text;

    if (!reply) {
      return res.status(200).json({ reply: "Could not generate a response. Please try again." });
    }

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: "Server Error: " + e.message });
  }
}
