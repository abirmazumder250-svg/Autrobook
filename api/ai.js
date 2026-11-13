const rateLimitMap = new Map();

export default async function handler(req, res) {
  // 1. Domain Security (CORS restricted to your official domain)
  const allowedOrigins = ['https://autrobook.vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://autrobook.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  // 2. Rate Limiting (Maximum 20 requests per minute per IP)
  try {
    const ip = (req.headers && req.headers['x-forwarded-for']) || 'user-ip';
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
  } catch (rateErr) {
    // Continue if rate limit check encounters an issue
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(200).json({ reply: "Error: GEMINI_API_KEY is not set in Vercel." });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseErr) {
        return res.status(200).json({ reply: "Error: Invalid JSON format." });
      }
    }

    const history = body && body.history;
    const userName = body && body.userName ? body.userName : "Friend";
    if (!history || !Array.isArray(history)) {
      return res.status(200).json({ reply: "Error: Invalid message history format." });
    }

    // Keep the last 10 messages for faster response speed
    const recentHistory = history.slice(-10);

    const contents = recentHistory
      .filter(msg => msg && msg.role !== 'system' && msg.content)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content) }]
      }));

    if (contents.length === 0) {
      return res.status(200).json({ reply: `Hello ${userName}! How can I help you today?` });

    const protocol = "https://";
    const host = "generativelanguage." + "googleapis.com";
    const fullUrl = protocol + host + "/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY;
    const geminiResponse = await fetch(fullUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
    parts: [{
        text: `You are Autro AI, the official assistant for Autrobook. 
You were text: `You are Autro AI, the official assistant for Autrobook.
You were created by Founder Abir Mazumder.
About Founder: Abir Mazumder is the Son of Babul Kumar Mazumder and Monika Mitra. He is their only child. He lives in Dhaka, Bangladesh. He studies at Dhaka Central University. He is the developer and owner of Autrobook.
The current user's account name is "${userName}".

RULE 1: Default language is English. Reply in the same language the user writes.
RULE 2: In EVERY reply, in EVERY language, you MUST address the user by their name "${userName}".
RULE 3: If anyone asks "who made you", "who is your creator", or "who is Abir Mazumder", proudly tell them all the details above about Founder Abir Mazumder.
Be friendly, helpful and loyal to Autrobook and its Founder.`
    }]
        }
      })
    });

    const rawText = await geminiResponse.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (jsonErr) {
      return res.status(200).json({ reply: "Google server returned an invalid response. Please try again." });
    }

    if (!geminiResponse.ok) {
      const errMsg = (data.error && data.error.message) ? data.error.message : "API Error";
      return res.status(200).json({ reply: "Error: " + errMsg });
    }

    const candidate = data.candidates && data.candidates[0];
    const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    const reply = part && part.text;

    if (!reply) {
      return res.status(200).json({ reply });
    }

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: "Server Error: " + e.message });
  }
}
