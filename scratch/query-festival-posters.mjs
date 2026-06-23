import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const { data: festivals } = await sb
  .from('festivals')
  .select('id,title,poster_url,created_at,start_date,end_date,event_type,status')
  .eq('status', 'active')
  .order('created_at', { ascending: true });

const { data: bootcamps } = await sb
  .from('bootcamps')
  .select('id,title,poster_url,created_at,start_date,end_date,status')
  .eq('status', 'active')
  .order('created_at', { ascending: true });

console.log('--- festivals (festival/mt) ---');
for (const r of festivals || []) {
  const type = r.event_type || 'festival';
  if (!['festival', 'mt'].includes(type)) continue;
  const end = String(r.end_date || r.start_date || '').slice(0, 10);
  if (end && end < today) continue;
  console.log(JSON.stringify({ created: r.created_at, title: r.title, poster: r.poster_url }));
}

console.log('--- bootcamps first ---');
for (const r of (bootcamps || []).slice(0, 3)) {
  console.log(JSON.stringify({ created: r.created_at, title: r.title, poster: r.poster_url }));
}
