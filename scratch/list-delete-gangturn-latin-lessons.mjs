import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  if (!fs.existsSync(path)) return {};
  const out = {};
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const matchesStudio = (name) => {
  const s = String(name || '').trim();
  return s === '라틴' || s.includes('강남턴') || s === '강턴';
};

const { data, error } = await supabase.from('classes_info').select('id,title,studio_name,status,address');
if (error) {
  console.error(error);
  process.exit(1);
}

const hits = (data || []).filter((r) => matchesStudio(r.studio_name));
console.log('matches', hits.length);
console.log(JSON.stringify(hits, null, 2));

if (process.argv.includes('--delete') && hits.length) {
  const ids = hits.map((r) => r.id);
  const { error: delErr } = await supabase.from('classes_info').delete().in('id', ids);
  if (delErr) {
    console.error('delete failed', delErr);
    process.exit(1);
  }
  console.log('deleted', ids.length);
}
