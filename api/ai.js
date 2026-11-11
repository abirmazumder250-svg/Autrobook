export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ reply: "Error: GEMINI_API_KEY পাওয়া যায়নি" });

    const { prompt } = req.body; 
    if (!prompt) return res.status(400).json({ reply: "Error: prompt খালি" });

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "You are Autro AI. Reply in the same language as user." }] }
        })
      }
    );

    const data = await geminiResponse.json();
    
    if (!geminiResponse.ok) {
      return res.status(500).json({ reply: "Gemini Error: " + (data.error?.message || "API Failed") });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch(e) {
    res.status(500).json({ reply: "Server Crash: " + e.message });
  }
}
