export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(200).json({ reply: "Error: GEMINI_API_KEY is not set in Vercel." });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const history = body && body.history;
    if (!history || !Array.isArray(history)) {
      return res.status(200).json({ reply: "Error: Invalid message history format from frontend." });
    }

    const contents = history
      .filter(msg => msg.role !== 'system' && msg.content)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content) }]
      }));

    // একাধিক লেটেস্ট মডেল (একটিতে চাপ থাকলে স্বয়ংক্রিয়ভাবে পরেরটি কাজ করবে)
    const models = [
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.7-flash"
    ];

    let reply = null;
    let lastError = "Unknown Error";

    for (const modelName of models) {
      const fullUrl = `https://googleapis.com{modelName}:generateContent?key=${API_KEY}`;

      const geminiResponse = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { 
            parts: [{ 
              text: "You are Autro AI, a multilingual personal assistant for Autrobook. You understand and speak all languages around the world (including English, Bengali, Hindi, Arabic, Spanish, French, Russian, Chinese, Japanese, Korean, German, Portuguese, Urdu, etc.). Always detect the exact language or script the user writes in and reply strictly in that same language. If a single short greeting is ambiguous (like 'Hi' or 'Gi'), default to English. Be friendly, helpful, and brief." 
            }] 
          }
        })
      });

      const data = await geminiResponse.json();

      if (geminiResponse.ok) {
        const firstCandidate = data.candidates && data.candidates.at(0);
        const firstPart = firstCandidate && firstCandidate.content && firstCandidate.content.parts && firstCandidate.content.parts.at(0);
        if (firstPart && firstPart.text) {
          reply = firstPart.text;
          break;
        }
      } else {
        lastError = data.error?.message || "Server busy";
      }
    }

    if (!reply) {
      return res.status(200).json({ reply: "Gemini API Error: " + lastError });
    }
    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: "Server Error: " + e.message });
  }
}
