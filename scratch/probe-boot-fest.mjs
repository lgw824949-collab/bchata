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
const today = new Date().toISOString().slice(0, 10);

for (const [label, run] of [
  ['bootcamps * active', () => supabase.from('bootcamps').select('*').eq('status', 'active')],
  ['festivals * active', () => supabase.from('festivals').select('*').eq('status', 'active')],
  ['bootcamps poster gte', () => supabase.from('bootcamps').select('poster_url').gte('start_date', today).not('poster_url', 'is', null)],
  ['festivals poster gte', () => supabase.from('festivals').select('poster_url').gte('start_date', today).not('poster_url', 'is', null)],
]) {
  const { error } = await run();
  console.log(label, error ? `ERROR ${error.message}` : 'OK');
}
