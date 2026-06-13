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

const env = { ...loadEnv('.env'), ...loadEnv('.env.local'), ...loadEnv('.env.production.local') };
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(env.VITE_SUPABASE_URL, key);

const BROKEN_ID = 'e0ff4047-f3b1-46f2-aa05-ff6ca488a593';
const { data: linked } = await supabase.from('parties').select('id').eq('location_id', BROKEN_ID).limit(1);
if (linked?.length) {
  console.log('still linked, skip delete');
  process.exit(0);
}
const del = await supabase.from('locations').delete().eq('id', BROKEN_ID);
console.log(del.error ? del.error.message : 'deleted orphan location');
