export default async function handler(req, res) {
  // Enable CORS for all mobile browsers and in-app webviews (Facebook, Messenger, Chrome)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    // Safely parse JSON body for older mobile browsers
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { prompt, history = [] } = body || {};

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt cannot be empty.' });
    }

    // Load API Key securely from Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server error: GEMINI_API_KEY is missing in Vercel settings.' });
    }

    // Format conversation history if provided, plus current prompt
    const formattedContents = [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ];

    // Official Google Gemini 2.5 Flash API Endpoint
    const apiUrl = `https://googleapis.com{apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: {
          parts: [
            {
              text: 'You are Autro AI, a helpful assistant for Autrobook. Your primary language is English, and you must always respond in the exact same language the user writes in.'
            }
          ]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'AI service returned an error.'
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(200).json({ reply: 'No response generated. Please try rephrasing.' });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({
      error: 'Server timeout or network error. Please check your connection.'
    });
  }
}
