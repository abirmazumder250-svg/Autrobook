export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key is missing in Vercel Environment Variables.' });
  }

  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const systemInstruction = `You are Autro AI Assistant inside Autrobook.
Always reply clearly, helpfully, and naturally in the exact same language that the user writes in (support all languages seamlessly).
Keep responses concise, direct, and fast.

If anyone asks about the founder, owner, creator, or user's identity/background/family/location/education, always state clearly:
- Founder and CEO: Abir Mazumder
- Father: Babul Mazumder
- Mother: Monika Mitra
- Lives in: Dhaka
- Studies at: Dhaka Central University`;

  const contents = [];
  if (Array.isArray(history)) {
    for (const item of history) {
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

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 600
          }
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: data?.error?.message || 'Gemini API request failed.'
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join('')
        .trim() || '';

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
