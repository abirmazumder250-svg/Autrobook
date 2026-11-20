import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export const config = {
  maxDuration: 30
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      message = '',
      language = '',
      profileName = '',
      userProfile = {},
      history = [],
      userId = '',
      accountKey = ''
    } = req.body || {};

    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return res.status(500).json({ error: 'AI API keys are not configured on server' });
    }

    // Fetch latest language & profile context from Supabase if available (non-blocking fast lookup)
    const syncedContext = await fetchSupabaseContext({
      userId: String(userId || userProfile?.userId || '').trim(),
      accountKey: String(accountKey || '').trim(),
      fallbackProfile: userProfile,
      fallbackName: profileName,
      fallbackLang: language
    });

    const systemPrompt = buildMetaStyleSystemPrompt(syncedContext);
    const recentHistory = sanitizeHistory(history);

    const tasks = [];

    // 1. Ultra-fast Groq model for instant Meta-like speed
    if (groqKey) {
      tasks.push(
        callGroq({
          apiKey: groqKey,
          model: 'llama-3.1-8b-instant',
          systemPrompt,
          history: recentHistory,
          message: cleanMessage,
          timeoutMs: 6500
        })
      );

      // 2. High-accuracy Groq model as fast backup
      tasks.push(
        callGroq({
          apiKey: groqKey,
          model: 'llama-3.3-70b-versatile',
          systemPrompt,
          history: recentHistory,
          message: cleanMessage,
          timeoutMs: 8500
        })
      );
    }

    // 3. Gemini 2.5 Flash for accuracy & multilingual strength
    if (geminiKey) {
      tasks.push(
        callGemini({
          apiKey: geminiKey,
          model: 'gemini-2.5-flash',
          systemPrompt,
          history: recentHistory,
          message: cleanMessage,
          timeoutMs: 8500
        })
      );
    }

    const winner = await Promise.any(tasks);

    return res.status(200).json({
      reply: winner.reply,
      model: winner.model,
      language: syncedContext.language || 'auto'
    });
  } catch (error) {
    console.error('Autro AI error:', error);
    return res.status(500).json({
      error: 'Unable to generate a response right now. Please try again.'
    });
  }
}

async function fetchSupabaseContext({
  userId,
  accountKey,
  fallbackProfile = {},
  fallbackName = '',
  fallbackLang = ''
}) {
  const ctx = {
    name: String(
      fallbackName ||
      fallbackProfile?.fullName ||
      fallbackProfile?.full_name ||
      fallbackProfile?.username ||
      ''
    ).trim(),
    location: String(fallbackProfile?.location || fallbackProfile?.city || '').trim(),
    education: String(fallbackProfile?.education || fallbackProfile?.school || '').trim(),
    bio: String(fallbackProfile?.bio || '').trim(),
    language: String(fallbackLang || fallbackProfile?.language || '').trim()
  };

  try {
    const queries = [];

    if (userId) {
      queries.push(
        supabase
          .from('profiles')
          .select('full_name, username, location, education, bio, language')
          .eq('id', userId)
          .maybeSingle()
      );
      queries.push(
        supabase
          .from('account_settings')
          .select('full_name, location, education, bio, language, preferred_language')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );
    } else if (accountKey) {
      queries.push(
        supabase
          .from('account_settings')
          .select('full_name, location, education, bio, language, preferred_language')
          .eq('account_key', accountKey)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );
    }

    if (queries.length === 0) return ctx;

    const results = await Promise.race([
      Promise.allSettled(queries),
      new Promise((resolve) => setTimeout(() => resolve([]), 1200))
    ]);

    for (const res of results) {
      if (res.status !== 'fulfilled' || !res.value?.data) continue;
      const row = res.value.data;

      if (!ctx.name && row.full_name) ctx.name = String(row.full_name).trim();
      if (!ctx.name && row.username) ctx.name = String(row.username).trim();
      if (!ctx.location && row.location) ctx.location = String(row.location).trim();
      if (!ctx.education && row.education) ctx.education = String(row.education).trim();
      if (!ctx.bio && row.bio) ctx.bio = String(row.bio).trim();

      const dbLang = String(row.language || row.preferred_language || '').trim();
      if (dbLang) ctx.language = dbLang;
    }
  } catch (_) {}

  return ctx;
}

function buildMetaStyleSystemPrompt(ctx) {
  const details = [
    ctx.name ? `User name: ${ctx.name}` : '',
    ctx.location ? `Location: ${ctx.location}` : '',
    ctx.education ? `Education: ${ctx.education}` : '',
    ctx.bio ? `Bio: ${ctx.bio}` : ''
  ]
    .filter(Boolean)
    .join(' | ');

  const langRule = ctx.language
    ? `Always reply in language code "${ctx.language}" (unless the user explicitly asks for another language in their prompt).`
    : 'Default language is English. Match the language the user writes in naturally and accurately.';

  return [
    'You are Autro AI Assistant inside Autrobook.',
    'Respond like Meta AI: crisp, natural, well-structured, accurate, and directly useful without fluff.',
    'Use short paragraphs or clean bullet points when helpful, and keep explanations easy to scan.',
    langRule,
    details ? `User context: ${details}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-4)
    .filter((item) => item && typeof item.text === 'string' && item.text.trim())
    .map((item) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.text.trim().slice(0, 700)
    }));
}

async function callGroq({ apiKey, model, systemPrompt, history, message, timeoutMs }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.45,
      max_tokens: 650
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Groq (${model}) failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error(`Groq (${model}) returned empty reply`);
  }

  return {
    reply,
    model: `Groq • ${model}`
  };
}

async function callGemini({ apiKey, model, systemPrompt, history, message, timeoutMs }) {
  const contents = [
    ...history.map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }]
    })),
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 650
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini (${model}) failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p?.text || '')
    .join('')
    .trim();

  if (!reply) {
    throw new Error(`Gemini (${model}) returned empty reply`);
  }

  return {
    reply,
    model: `Gemini • ${model}`
  };
          }
