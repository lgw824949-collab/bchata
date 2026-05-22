import { createClient } from '@supabase/supabase-js';

const ALLOWED_TABLES = new Set(['instructor_classes', 'instructors']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedSecret = process.env.ADMIN_API_SECRET;
  const providedSecret =
    req.headers['x-admin-secret'] || req.body?.adminSecret || '';

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !serviceKey) {
    return res.status(500).json({
      error: 'Server missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL',
    });
  }

  const { table, action, id, payload } = req.body || {};

  if (!ALLOWED_TABLES.has(table)) {
    return res.status(400).json({ error: 'Invalid table' });
  }
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (action === 'update') {
      const { data, error } = await supabase
        .from(table)
        .update(payload || {})
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) return res.status(400).json({ error: error.message });
      if (!data) {
        return res.status(400).json({ error: 'No row updated' });
      }
      return res.status(200).json({ data });
    }

    if (action === 'delete') {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .select('id');
      if (error) return res.status(400).json({ error: error.message });
      if (!data?.length) {
        return res.status(400).json({ error: 'No row deleted' });
      }
      return res.status(200).json({ data });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Server error',
    });
  }
}
