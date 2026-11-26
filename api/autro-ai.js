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
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? safeJsonParse(req.body) : (req.body || {});
    const {
      message = '',
      language = '',
      profileName = '',
      userProfile = {},
      history = [],
      userId = '',
      accountKey = ''
    } = body;

    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
      return res.status(200).json({
        reply: 'Please type a message so I can help you.',
        model: 'Autro AI',
        language: language || 'auto'
      });
    }

    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

    const syncedContext = await fetchSupabaseContext({
      userId: String(userId || userProfile?.userId || '').trim(),
      accountKey: String(accountKey || '').trim(),
      fallbackProfile: userProfile,
      fallbackName: profileName,
      fallbackLang: language
    });

    const systemPrompt = buildMultilingualSystemPrompt(syncedContext, cleanMessage);
    const recentHistory = sanitizeHistory(history);

    const tasks = [];

    if (groqKey) {
      tasks.push(
        callGroq({
          apiKey: groqKey,
          model: 'llama-3.3-70b-versatile',
          systemPrompt,
          history: recentHistory,
          message: cleanMessage,
          timeoutMs: 10000
        })
      );
      tasks.push(
        callGroq({
          apiKey: groqKey,
          model: 'llama-3.1-8b-instant',
          systemPrompt,
          history: recentHistory,
          message: cleanMessage,
          timeoutMs: 8000
        })
      );
    }

    if (geminiKey) {
      tasks.push(
        callGemini({
          apiKey: geminiKey,
          model: 'gemini-2.5-flash',
          systemPrompt,
          history: recentHistory,
          message: cleanMessage,
          timeoutMs: 10000
        })
      );
    }

    if (tasks.length === 0) {
      return res.status(200).json({
        reply: buildSmartDirectFallback(cleanMessage, syncedContext),
        model: 'Autro AI',
        language: syncedContext.language || 'auto'
      });
    }

    try {
      const winner = await Promise.any(tasks);
      return res.status(200).json({
        reply: sanitizeReplyText(winner.reply),
        model: 'Autro AI',
        language: syncedContext.language || 'auto'
      });
    } catch (providerErr) {
      console.warn('All AI providers failed:', providerErr?.errors || providerErr);
      return res.status(200).json({
        reply: buildSmartDirectFallback(cleanMessage, syncedContext),
        model: 'Autro AI',
        language: syncedContext.language || 'auto'
      });
    }
  } catch (error) {
    console.error('Autro AI error:', error);
    return res.status(200).json({
      reply: buildSmartDirectFallback(req?.body?.message || '', {}),
      model: 'Autro AI',
      language: 'auto'
    });
  }
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (_) {
    return {};
  }
}

function sanitizeReplyText(text) {
  return String(text || '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/https?:\/\/[^\s]+/g, '')
    .trim();
}

function buildSmartDirectFallback(message, ctx = {}) {
  const q = String(message || '').trim();
  const lower = q.toLowerCase();
  const isBengali = /[\u0980-\u09FF]/.test(q);

  if (isBengali) {
    if (/কে তুমি|তুমি কে|পরিচয়|পরিচিতি/.test(q)) {
      return 'আমি Autro AI Assistant, Autrobook-এর স্মার্ট সহকারী। আপনি যেকোনো প্রশ্ন করলে আমি সরাসরি উত্তর দেওয়ার চেষ্টা করি।';
    }
    if (/হাই|হ্যালো|সালাম|কেমন আছ/.test(q)) {
      return 'হ্যালো! কী জানতে চান বা কোন বিষয়ে সাহায্য লাগবে, সরাসরি বলুন।';
    }
    return `"${q}" — এই বিষয়টি নিয়ে সরাসরি উত্তর দিতে এখন সার্ভারে AI API কী সংযুক্ত নেই বা সংযোগে সমস্যা হচ্ছে। Vercel-এ GROQ_API_KEY বা GEMINI_API_KEY সেট করলে সব প্রশ্নের পূর্ণ উত্তর পাবেন।`;
  }

  if (/who are you|your name/.test(lower)) {
    return 'I am Autro AI Assistant inside Autrobook. Ask me anything and I will answer your question directly.';
  }
  if (/^(hi|hello|hey|good morning|good evening)\b/.test(lower)) {
    return 'Hello! What question or topic would you like help with?';
  }
  return `Regarding "${q}": live AI model keys (GROQ_API_KEY or GEMINI_API_KEY) are not configured or reachable right now. Please add a valid API key in your server environment to get full answers in any language.`;
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

function buildMultilingualSystemPrompt(ctx, userMessage = '') {
  const details = [
    ctx.name ? `User name: ${ctx.name}` : '',
    ctx.location ? `Location: ${ctx.location}` : '',
    ctx.education ? `Education: ${ctx.education}` : '',
    ctx.bio ? `Bio: ${ctx.bio}` : ''
  ]
    .filter(Boolean)
    .join(' | ');

  const asksSpecificLanguage =
    /(in bengali|in bangla|বাংলায়|বাংলা ভাষায়|in english|in hindi|हिन्दी में|in arabic|in spanish|in french|in urdu)/i.test(
      userMessage
    );

  const langInstruction = asksSpecificLanguage
    ? 'Reply in the exact language requested in the user message.'
    : 'Always reply in the exact same language as the user’s latest message across ALL world languages (Bengali, English, Hindi, Arabic, Spanish, French, Urdu, etc.).';

  return [
    'You are Autro AI Assistant inside Autrobook.',
    'Answer ONLY and DIRECTLY what the user asks. Give accurate, clear, and complete answers tailored to every question.',
    'Never repeat a canned or generic fallback sentence when a real question is asked.',
    langInstruction,
    'Keep formatting clean and easy to read. Do not include external URLs or links.',
    details ? `Optional user profile context (use only when relevant): ${details}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-6)
    .filter((item) => item && typeof item.text === 'string' && item.text.trim())
    .map((item) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.text.trim().slice(0, 900)
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
      temperature: 0.5,
      max_tokens: 1024
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
    model: 'Autro AI'
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
        temperature: 0.5,
        maxOutputTokens: 1024
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
    model: 'Autro AI'
  };
                    }
