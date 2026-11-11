export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ reply: "Error: GEMINI_API_KEY not found in Vercel Environment Variables" });
    }

    const { history } = req.body; 
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ reply: "Error: No chat history received" });
    }

    // Convert your history to Gemini format. Remove 'system' role.
    const contents = history
      .filter(msg => msg.role !== 'system') 
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    if(contents.length === 0) {
      return res.status(400).json({ reply: "Error: Empty conversation" });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents,
          systemInstruction: { // This is how Gemini takes system prompt
            parts: [{ text: "You are Autro AI, a helpful assistant for Autrobook social media. Reply in the same language the user writes. Be friendly, helpful, and brief." }]
          }
        })
      }
    );

    const data = await geminiResponse.json();
    if (!geminiResponse.ok) {
      return res.status(500).json({ reply: "Gemini API Error: " + (data.error?.message || "Unknown error") });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch(e) {
    res.status(500).json({ reply: "Server Error: " + e.message });
  }
  }
