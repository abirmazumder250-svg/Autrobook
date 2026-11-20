export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key is missing in Vercel Environment Variables.' });
  }

  const { message, profileName = '', history = [] } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const cleanProfileName = typeof profileName === 'string' ? profileName.trim() : '';

  const systemInstruction = `You are Autro AI Assistant inside Autrobook.
Always reply clearly, helpfully, and naturally in the exact same language that the user writes in (support all languages seamlessly).
Keep responses concise, direct, and fast. Do not use markdown asterisks like ** unless needed.

Strict Identity Rules:
1. Saved Supabase Profile Name: ${cleanProfileName ? `"${cleanProfileName}"` : 'Not available'}.
   - When greeting the user (e.g., "hi", "hello", "হাই", "হ্যালো") or when the user asks for their own profile name (e.g., "what is my name", "আমার নাম কি"), use ONLY the saved Supabase profile name "${cleanProfileName}". Do NOT mix admin/founder details into "what is my name".
2. Admin / Founder Identity (ONLY when specifically asked about the admin, founder, CEO, owner, or creator of Autrobook):
   - Founder and CEO: Abir Mazumder
   - Father: Babul Mazumder
   - Mother: Monika Mitra
   - Lives in: Dhaka
   - Studies at: Dhaka Central University
   - Do NOT bring up these admin details for normal questions or when someone just asks "what is my name".`;

  const contents = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-4)) {
      if (!item || typeof item.text !== 'string') continue;
      contents.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }]
      });
    }
  }

  if (contents.length === 0 || contents[contents.length - 1].parts[0].text !== message) {
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });
  }

  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'];

  for (const modelName of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            contents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 400
            }
          })
        }
      );

      clearTimeout(timer);
      const data = await geminiRes.json();

      if (geminiRes.ok) {
        const reply =
          data?.candidates?.[0]?.content?.parts
            ?.map((p) => p.text)
            .filter(Boolean)
            .join('')
            .trim() || '';

        if (reply) {
          return res.status(200).json({ reply, model: modelName });
        }
      }

      const errMsg = data?.error?.message || '';
      const isOverloaded =
        geminiRes.status === 429 ||
        geminiRes.status === 503 ||
        errMsg.toLowerCase().includes('high demand') ||
        errMsg.toLowerCase().includes('overloaded');

      if (!isOverloaded && geminiRes.status !== 404) {
        return res.status(geminiRes.status).json({ error: errMsg || 'Gemini API request failed.' });
      }
    } catch (_) {
      // Try next model immediately
    }
  }

  return res.status(503).json({
    error: 'AI servers are busy right now. Please try again in a moment.'
  });
}
