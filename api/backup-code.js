import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gemyqaniztqrsilayblx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

function normalizeEmail(raw = '') {
  return String(raw || '').trim().toLowerCase();
}

function sha256Hex(text = '') {
  return crypto
    .createHash('sha256')
    .update(String(text || '').trim().toUpperCase())
    .digest('hex');
}

function generateBackupCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let left = '';
  let right = '';
  for (let i = 0; i < 4; i++) {
    left += alphabet[bytes[i] % alphabet.length];
    right += alphabet[bytes[i + 4] % alphabet.length];
  }
  return `${left}-${right}`;
}

async function findUserIdByEmail(email) {
  if (!supabaseAdmin || !email) return null;
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.warn('findUserIdByEmail warning:', error.message);
    return null;
  }
  return data?.id || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      ok: false,
      error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const action = String(body.action || '').trim().toLowerCase();
    const email = normalizeEmail(body.email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Valid email is required' });
    }

    const userId = body.userId || (await findUserIdByEmail(email)) || null;

    if (action === 'generate') {
      const plainCode = generateBackupCode();
      const codeHash = sha256Hex(plainCode);

      const { error } = await supabaseAdmin
        .from('backup_codes')
        .insert({
          user_id: userId,
          email,
          code_hash: codeHash,
          used: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Insert backup_codes error:', error);
        return res.status(500).json({
          ok: false,
          error: `Failed to create backup code: ${error.message}`
        });
      }

      return res.status(200).json({
        ok: true,
        code: plainCode
      });
    }

    if (action === 'verify') {
      const code = String(body.code || '').trim().toUpperCase();
      if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
        return res.status(400).json({ ok: false, error: 'Invalid backup code format' });
      }

      const codeHash = sha256Hex(code);

      let query = supabaseAdmin
        .from('backup_codes')
        .select('id, used')
        .eq('email', email)
        .eq('code_hash', codeHash)
        .eq('used', false);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: row, error: selectError } = await query.maybeSingle();

      if (selectError || !row) {
        return res.status(400).json({ ok: false, error: 'Invalid or already used backup code' });
      }

      const { error: updateError } = await supabaseAdmin
        .from('backup_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', row.id)
        .eq('used', false);

      if (updateError) {
        console.error('Update backup_codes error:', updateError);
        return res.status(500).json({ ok: false, error: 'Failed to consume backup code' });
      }

      return res.status(200).json({
        ok: true,
        codeId: row.id
      });
    }

    return res.status(400).json({ ok: false, error: 'Invalid action' });
  } catch (err) {
    console.error('Backup code handler error:', err);
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Unexpected server error'
    });
  }
}
