// /api/ai.js - Vercel API Route
export default async function handler(req, res) {
  const { action, text } = req.body;
  const GEMINI_KEY = process.env.GEMINI_API_KEY; // Vercel থেকে নিবে

  if (!GEMINI_KEY) {
    return res.status(500).json({ error: "API Key missing" });
  }

  let prompt = "";
  
  if (action === "scan") {
    prompt = `Check if this comment has abuse, hate, or bad words in Bangla, Hindi, English. Comment: "${text}". Reply only "YES" or "NO"`;
  }
  
  if (action === "smartReply") {
    prompt = `This is a social media post: "${text}". Give me 3 short smart replies in Bangla and English mix with emoji. Reply as JSON array`;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const result = data.candidates[0].content.parts[0].text;
    
    res.status(200).json({ result });

  } catch (error) {
    res.status(500).json({ error: "Gemini API failed" });
  }
}
