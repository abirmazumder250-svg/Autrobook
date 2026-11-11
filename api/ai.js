export default async function handler(req, res) {
  // CORS Setup
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

    // Safely parse request body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const history = body?.history;

    if (!history || !Array.isArray(history)) {
      return res.status(200).json({ reply: "Error: Invalid message history format from frontend." });
    }

    const contents = history
      .filter(msg => msg.role !== 'system' && msg.content)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content) }]
      }));

    // Using the active gemini-2.5-flash model
    const geminiResponse = await fetch(
      `https://googleapis.com{API_KEY}`,
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
    
    // Return exact error message if Gemini API fails
    if (!geminiResponse.ok) {
      return res.status(200).json({ 
        reply: "Gemini API Error: " + (data.error?.message || "Unknown Error") 
      });
    }
    
    // Safely extract the reply text
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      return res.status(200).json({ reply: "Error: AI could not generate a response. Please try again." });
    }

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: "Server Error: " + e.message });
  }
}
