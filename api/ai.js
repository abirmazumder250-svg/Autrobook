export default async function handler(req, res) {
  // CORS Fix
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ reply: "Error: GEMINI_API_KEY পাওয়া যায়নি। Vercel Settings এ বসাও" });
    }

    const { prompt, history } = req.body; 
    
    let contents = [];

    // System Prompt - এটাই সব ভাষার চাবি
    const systemPrompt = "You are Autro AI, a friendly assistant. Always reply in the same language that the user is writing in. Be helpful, natural, and conversational.";
    contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
    contents.push({ role: 'model', parts: [{ text: "Understood! I will reply in the user's language." }] });


    if (history && Array.isArray(history)) {
      // Chat History থাকলে সেটা অ্যাড করো
      const historyContents = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      contents = contents.concat(historyContents);
    } else if (prompt) {
      // শুধু prompt আসলে সেটা অ্যাড করো
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    } else {
      return res.status(400).json({ reply: "Error: prompt বা history কিছুই পাইনি" });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    );

    const data = await geminiResponse.json();
    if (!geminiResponse.ok) {
      return res.status(500).json({ reply: "Error: " + (data.error?.message || "Gemini API Failed") });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch(e) {
    res.status(500).json({ reply: "Error: " + e.message });
  }
        }
