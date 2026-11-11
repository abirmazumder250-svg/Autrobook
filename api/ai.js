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

    const domain = "://googleapis.com";
    const path = "/v1beta/models/gemini-2.5-flash:generateContent?key=";
    const fullUrl = "https://" + domain + path + API_KEY;

    const geminiResponse = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: "You are Autro AI. Be helpful and brief." }] }
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(200).json({
        reply: "Gemini API Error: " + (data.error?.message || "Unknown Error")
      });
    }

    const firstCandidate = data.candidates && data.candidates.at(0);
    const firstPart = firstCandidate && firstCandidate.content && firstCandidate.content.parts && firstCandidate.content.parts.at(0);
    const reply = firstPart && firstPart.text;

    if (!reply) {
      return res.status(200).json({ reply: "Error: AI could not generate a response. Please try again." });
    }

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: "Server Error: " + e.message });
  }
}
