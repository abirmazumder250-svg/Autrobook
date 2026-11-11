export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(200).json({ reply: "Error: GEMINI_API_KEY not found in Vercel Env Vars" });
    }

    const { history } = req.body; 
    const contents = history
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents,
          systemInstruction: { parts: [{ text: "You are Autro AI. Be helpful and brief." }] }
        })
      }
    );

    const data = await geminiResponse.json();
    
    // If Gemini returns an error, show it
    if (!geminiResponse.ok) {
      return res.status(200).json({ reply: "Gemini API Error: " + (data.error?.message || "Unknown Error") });
    }
    
    // If Gemini blocked the message
    if (!data.candidates || data.candidates.length === 0) {
      return res.status(200).json({ reply: "Gemini blocked this message. Try typing 'Hello'" });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch(e) {
    res.status(200).json({ reply: "Server Crash: " + e.message });
  }
}
