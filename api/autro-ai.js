import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export const config = {
  maxDuration: 30
};

const ADMIN_IDENTITY = {
  founderAndCeo: 'Abir Mazumder',
  fathersName: 'Babul Mazumder',
  mothersName: 'Monika Mitra',
  address: 'Dhaka, Bangladesh',
  studyIn: 'Bsc Honours in Dhaka Central University',
  platform: 'Autrobook'
};

let cachedGroqModels = { models: [], fetchedAt: 0 };

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
        model: 'Autrobook AI',
        language: language || 'English'
      });
    }

    const isBn = /[\u0980-\u09FF]/.test(cleanMessage);
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
      const groqModels = await resolveGroqModels(groqKey);
      for (const modelId of groqModels.slice(0, 2)) {
        tasks.push(
          callGroq({
            apiKey: groqKey,
            model: modelId,
            systemPrompt,
            history: recentHistory,
            message: cleanMessage,
            timeoutMs: 14000
          })
        );
      }
    }

    if (geminiKey) {
      const geminiModels = resolveGeminiModels();
      for (const gemModel of geminiModels) {
        tasks.push(
          callGemini({
            apiKey: geminiKey,
            model: gemModel,
            systemPrompt,
            history: recentHistory,
            message: cleanMessage,
            timeoutMs: 14000
          })
        );
      }
    }

    if (tasks.length === 0) {
      return res.status(200).json({
        reply: isBn
          ? 'Vercel Environment Variables-এ GROQ_API_KEY বা GEMINI_API_KEY যুক্ত করে Redeploy করুন।'
          : 'No AI API key (GROQ_API_KEY or GEMINI_API_KEY) is configured on the server. Please add it in Vercel Environment Variables and redeploy.',
        model: 'Autrobook AI',
        language: syncedContext.language || 'English'
      });
    }

    try {
      const winner = await Promise.any(tasks);
      return res.status(200).json({
        reply: sanitizeReplyText(winner.reply),
        model: 'Autrobook AI',
        provider: winner.provider || 'AI',
        language: syncedContext.language || 'English'
      });
    } catch (aggErr) {
      const reasons = Array.isArray(aggErr?.errors)
        ? aggErr.errors.map((e) => e?.message || String(e)).join(' | ')
        : (aggErr?.message || 'Provider error');

      console.error('[Autro AI Provider Failure]:', reasons);

      return res.status(200).json({
        reply: isBn
          ? 'AI সার্ভিস সাময়িকভাবে ব্যস্ত আছে। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন।'
          : 'AI service is temporarily busy. Please try again in a moment.',
        model: 'Autrobook AI',
        language: syncedContext.language || 'English'
      });
    }
  } catch (error) {
    console.error('[Autro AI Handler Error]:', error);
    return res.status(200).json({
      reply: 'Something went wrong while processing your request. Please try again.',
      model: 'Autrobook AI',
      language: 'English'
    });
  }
}

function resolveGeminiModels() {
  const envModel = (process.env.GEMINI_MODEL || '').trim();
  if (envModel) return [envModel, 'gemini-2.5-flash'];
  return ['gemini-2.5-flash', 'gemini-1.5-flash'];
}

async function resolveGroqModels(apiKey) {
  const envModel = (process.env.GROQ_MODEL || '').trim();
  if (envModel) return [envModel];

  const now = Date.now();
  if (cachedGroqModels.models.length > 0 && now - cachedGroqModels.fetchedAt < 10 * 60 * 1000) {
    return cachedGroqModels.models;
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const json = await res.json();
      const ids = (json?.data || [])
        .map((m) => m?.id)
        .filter(
          (id) =>
            typeof id === 'string' &&
            !/whisper|guard|tts|embed|vision/i.test(id)
        );

      const preferred = ids.filter((id) => /llama|qwen|gemma|mixtral|deepseek/i.test(id));
      const picked = (preferred.length > 0 ? preferred : ids).slice(0, 2);

      if (picked.length > 0) {
        cachedGroqModels = { models: picked, fetchedAt: now };
        return picked;
      }
    } else {
      const errBody = await res.text().catch(() => '');
      console.error('[Groq Models List Error]:', res.status, errBody);
    }
  } catch (err) {
    console.error('[Groq Models Fetch Exception]:', err?.message || err);
  }

  return ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
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
    .trim();
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
    language: String(fallbackLang || fallbackProfile?.language || 'English').trim()
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
    ctx.name ? `User display name: ${ctx.name}` : '',
    ctx.location ? `User location: ${ctx.location}` : '',
    ctx.education ? `User education: ${ctx.education}` : '',
    ctx.bio ? `User bio: ${ctx.bio}` : ''
  ]
    .filter(Boolean)
    .join(' | ');

  const adminInfo = [
    `Platform: ${ADMIN_IDENTITY.platform}`,
    `Founder & CEO: ${ADMIN_IDENTITY.founderAndCeo}`,
    `Father's name: ${ADMIN_IDENTITY.fathersName}`,
    `Mother's name: ${ADMIN_IDENTITY.mothersName}`,
    `Address: ${ADMIN_IDENTITY.address}`,
    `Study in: ${ADMIN_IDENTITY.studyIn}`
  ].join(' | ');

  const asksSpecificLanguage =
    /(in bengali|in bangla|বাংলায়|বাংলা ভাষায়|in english|in hindi|हिन्दी में|in arabic|in spanish|in french|in urdu)/i.test(
      userMessage
    );

  const langInstruction = asksSpecificLanguage
    ? 'Reply in the exact language requested in the user message.'
    : 'Default language is English when unclear, otherwise always reply fluently in the exact same language as the user’s message across ALL world languages.';

  return [
    'You are Autrobook AI Assistant inside Autrobook.',
    'Answer any topic or question clearly, accurately, and naturally. You can be helpful, friendly, casual, or humorous/witty depending on the conversation.',
    'When the user has a profile name, address the user naturally by their name.',
    langInstruction,
    `Official Admin & Platform Identity (provide when asked about founder/CEO/admin/platform details): ${adminInfo}.`,
    details ? `Current user context: ${details}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-8)
    .filter((item) => item && typeof item.text === 'string' && item.text.trim())
    .map((item) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.text.trim().slice(0, 1200)
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
      temperature: 0.7,
      max_tokens: 1500
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
    provider: 'Groq',
    model: 'Autrobook AI'
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
        temperature: 0.7,
        maxOutputTokens: 1500
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
    provider: 'Gemini',
    model: 'Autrobook AI'
  };
    }
