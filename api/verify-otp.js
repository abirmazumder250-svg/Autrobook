// api/verify-otp.js
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, code: 'INVALID_JSON' }); }
    }

    const { email, otp, password, profile } = body || {};
    if (!email || !otp || !password || !profile) {
      return res.status(400).json({ success: false, code: 'MISSING_FIELDS' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, code: 'PASSWORD_TOO_SHORT' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const { data: rec } = await supabase
      .from('otps').select('*').eq('email', cleanEmail)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!rec) return res.status(400).json({ success: false, code: 'OTP_NOT_FOUND' });

    if (new Date(rec.expires_at) < new Date()) {
      await supabase.from('otps').delete().eq('id', rec.id);
      return res.status(400).json({ success: false, code: 'OTP_EXPIRED' });
    }

    if ((rec.attempts || 0) >= 5) {
      await supabase.from('otps').delete().eq('id', rec.id);
      return res.status(429).json({ success: false, code: 'OTP_MAX_ATTEMPTS' });
    }

    const ok = await bcrypt.compare(String(otp), rec.otp_hash);
    if (!ok) {
      await supabase.from('otps').update({ attempts: (rec.attempts || 0) + 1 }).eq('id', rec.id);
      return res.status(400).json({ success: false, code: 'OTP_INVALID' });
    }

    await supabase.from('otps').delete().eq('id', rec.id);

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: cleanEmail, password, email_confirm: true
    });

    if (createErr) {
      if (createErr.message?.toLowerCase().includes('already')) {
        return res.status(409).json({ success: false, code: 'ALREADY_EXISTS', alreadyExists: true });
      }
      console.error('createUser:', createErr);
      return res.status(500).json({ success: false, code: 'SERVER_ERROR' });
    }

    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: created.user.id,
      email: cleanEmail,
      full_name: profile.full_name,
      dob: profile.dob,
      selfie_url: profile.selfieData,
      face_descriptor: profile.faceDescriptor,
      fingerprint_id: profile.webauthnCredentialId,
      status: 'verified'
    });

    if (profileErr) {
      await supabase.auth.admin.deleteUser(created.user.id);
      console.error('profile save:', profileErr);
      return res.status(500).json({ success: false, code: 'SERVER_ERROR' });
    }

    return res.status(200).json({ success: true, code: 'ACCOUNT_CREATED', userId: created.user.id });
  } catch (e) {
    console.error('verify-otp:', e);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR' });
  }
}
