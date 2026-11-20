const DEFAULT_SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

async function fetchSupabaseProfileFallback(userProfile = {}, profileName = '') {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY;

  const merged = {
    userId: typeof userProfile?.userId === 'string' ? userProfile.userId.trim() : '',
    fullName:
      (typeof userProfile?.fullName === 'string' && userProfile.fullName.trim()) ||
      (typeof profileName === 'string' && profileName.trim()) ||
      '',
    username: typeof userProfile?.username === 'string' ? userProfile.username.trim() : '',
    email: typeof userProfile?.email === 'string' ? userProfile.email.trim() : '',
    bio: typeof userProfile?.bio === 'string' ? userProfile.bio.trim() : '',
    location: typeof userProfile?.location === 'string' ? userProfile.location.trim() : '',
    education: typeof userProfile?.education === 'string' ? userProfile.education.trim() : ''
  };

  if (!supabaseUrl || !supabaseKey) return merged;

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Accept: 'application/json'
  };

  try {
    if (merged.userId) {
      const pRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(merged.userId)}&select=*&limit=1`,
        { headers }
      );
      if (pRes.ok) {
        const rows = await pRes.json();
        if (Array.isArray(rows) && rows[0]) {
          const r = rows[0];
          if (r.full_name) merged.fullName = String(r.full_name).trim();
          if (r.username) merged.username = String(r.username).trim();
          if (r.email) merged.email = String(r.email).trim();
          if (r.bio) merged.bio = String(r.bio).trim();
          if (r.location || r.city || r.lives_in) {
            merged.location = String(r.location || r.city || r.lives_in).trim();
          }
          if (r.education || r.university || r.school) {
            merged.education = String(r.education || r.university || r.school).trim();
          }
        }
      }
    }

    const queryUrl = merged.userId
      ? `${supabaseUrl}/rest/v1/account_settings?user_id=eq.${encodeURIComponent(merged.userId)}&order=updated_at.desc&limit=1`
      : `${supabaseUrl}/rest/v1/account_settings?order=updated_at.desc&limit=1`;

    const sRes = await fetch(queryUrl, { headers });
    if (sRes.ok) {
      const sRows = await sRes.json();
      if (Array.isArray(sRows) && sRows[0]) {
        const s = sRows[0];
        if (s.full_name) merged.fullName = String(s.full_name).trim();
        if (s.bio) merged.bio = String(s.bio).trim();
        if (s.location || s.city || s.lives_in) {
          merged.location = String(s.location || s.city || s.lives_in).trim();
        }
        if (s.education || s.university || s.school) {
          merged.education = String(s.education || s.university || s.school).trim();
        }
      }
    }
  } catch (_) {}

  return merged;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key is missing in Vercel Environment Variables.' });
  }

  const { message, profileName = '', userProfile = {}, history = [] } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const profile = await fetchSupabaseProfileFallback(userProfile, profileName);
  const cleanName = profile.fullName;
  const isCurrentUserFounder = cleanName.toLowerCase() === 'abir mazumder';

  const currentUserInfoLines = [
    cleanName ? `Name: ${cleanName}` : 'Name: Not saved in profile',
    profile.username ? `Username: @${profile.username}` : '',
    profile.email ? `Email: ${profile.email}` : '',
    profile.bio ? `Bio: ${profile.bio}` : '',
    profile.location ? `Location: ${profile.location}` : '',
    profile.education ? `Education: ${profile.education}` : ''
  ].filter(Boolean).join('\n');

  const systemInstruction = `You are Autro AI Assistant inside Autrobook.
Always reply clearly, helpfully, and naturally in the exact same language that the user writes in (support all languages seamlessly).
Keep responses concise, direct, and fast. Do not use markdown asterisks like ** unless needed.

Current Logged-in / Profile User Details (from Supabase):
${currentUserInfoLines}

Identity Rules — Follow Strictly:
1. When the user asks about THEMSELVES (e.g., "আমি কে", "আমার নাম কি", "আমার পরিচয়", "who am i", "what is my name", "my profile"):
   - Tell ONLY this current user's own saved profile details above (${cleanName || 'their saved profile name'}).
   - ${isCurrentUserFounder
       ? 'Since this profile belongs to Abir Mazumder, you may mention his founder details if asked about his identity.'
       : 'Do NOT claim this user is the Founder/CEO or give Abir Mazumder\'s family/university details unless their own profile says so.'}
2. When greeting the user (e.g., "hi", "hello", "হাই", "হ্যালো"):
   - Greet with "হ্যালো ${cleanName}" (in Bengali) or "Hello ${cleanName}" (in other languages) if ${cleanName ? `"${cleanName}"` : 'a name'} is available, without dumping a long bio.
3. When someone asks about the ADMIN / FOUNDER / CEO / CREATOR of Autrobook (e.g., "ফাউন্ডার কে", "অ্যাডমিন কে", "CEO কে", "who is the founder/CEO/admin"):
   - State clearly:
     Founder and CEO: Abir Mazumder
     Father: Babul Mazumder
     Mother: Monika Mitra
     Lives in: Dhaka
     Studies at: Dhaka Central University`;

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
