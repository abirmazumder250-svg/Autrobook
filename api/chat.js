export const config = {
  runtime: 'edge', // Runs globally with zero cold-start delay
};

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { prompt, history = [] } = body || {};

    if (!prompt || prompt.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Prompt cannot be empty.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server error: GEMINI_API_KEY is missing in Vercel.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Keep only the last 6 messages so slow mobile networks upload less data
    const recentHistory = history.slice(-6);
    const formattedContents = [
      ...recentHistory,
      { role: 'user', parts: [{ text: prompt }] },
    ];

    // Full official Gemini 2.5 Flash endpoint
    const apiUrl = 'https://googleapis.com';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: {
          parts: [
            {
              text: 'You are Autro AI, the helpful assistant for Autrobook. Your primary language is English, and you must always respond in the exact same language the user writes in. Keep answers clear and concise.',
            },
          ],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
          thinkingConfig: {
            thinkingBudget: 0, // Disables internal reasoning delay for instant replies
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Google API returned an error.' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Server error: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
