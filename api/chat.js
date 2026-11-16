export const config = {
  runtime: 'edge',
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

    const recentHistory = history.slice(-6);
    const formattedContents = [
      ...recentHistory,
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const requestBody = {
      contents: formattedContents,
      systemInstruction: {
        parts: [
          {
            text: `You are Autro AI, the official AI assistant for Autrobook. 
            Rules:
            1. Always reply in the exact same language the user speaks in (Bengali, English, Hindi, Arabic, etc.).
            2. Be polite, helpful, and friendly.
            3. If someone asks about the Founder/Admin, you MUST reply with exactly these details:
               - Name: Abir Mazumder
               - University: Dhaka Central University
               - Father: Babul Mazumder
               - Mother: Manika Mitra
               - Location: Dhaka, Bangladesh
            4. Keep answers short, clear, and conversational (max 2-3 sentences).
            5. Mention Autrobook features like Zen Mode, 18+ Guard, Blood Donation Hub, and AI Smart Reply if asked.`,
          },
        ],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    };

    let response;
    let retries = 2;

    while (retries >= 0) {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok || response.status === 400 || response.status === 403) {
        break;
      }
      
      if (response.status === 429 || response.status === 503) {
        retries--;
        if (retries >= 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        break;
      }
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI is receiving too many messages right now. Please wait a few seconds and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
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
