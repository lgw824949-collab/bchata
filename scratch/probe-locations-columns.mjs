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

const tests = [
  ['select * limit 1', () => supabase.from('locations').select('*').limit(1)],
  ['select id,name,region', () => supabase.from('locations').select('id, name, region').limit(1)],
  ['select id,name,region_id', () => supabase.from('locations').select('id, name, region_id').limit(1)],
  ['select image_url', () => supabase.from('locations').select('id, image_url, kakao_url, instagram_url').limit(1)],
  ['bars table', () => supabase.from('bars').select('*').limit(1)],
  ['venues table', () => supabase.from('venues').select('*').limit(1)],
  ['join regions', () => supabase.from('locations').select('id, name, address, region_id, regions(name)').limit(1)],
];

for (const [label, run] of tests) {
  const { data, error } = await run();
  if (error) {
    console.log(`${label}: ERROR ${error.code} — ${error.message}`);
    if (error.details) console.log('  details:', error.details);
    if (error.hint) console.log('  hint:', error.hint);
  } else if (data?.[0]) {
    console.log(`${label}: OK columns=[${Object.keys(data[0]).join(', ')}]`);
  } else {
    console.log(`${label}: OK (empty)`);
  }
}
