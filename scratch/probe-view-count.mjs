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

for (const table of ['locations', 'social_bars', 'bars']) {
  const { data, error } = await supabase.from(table).select('id, name, view_count').limit(1);
  if (error) console.log(`${table}: ERROR — ${error.message}`);
  else console.log(`${table}: OK`, data?.[0] ? Object.keys(data[0]) : '(empty)');
}
