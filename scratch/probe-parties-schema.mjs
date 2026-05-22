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

const tests = [
  ['select * limit 1', () => supabase.from('parties').select('*').limit(1)],
  ['select id,title,date,status', () => supabase.from('parties').select('id, title, date, status').limit(1)],
  ['broadRegion', () => supabase.from('parties').select('id, broadRegion').limit(1)],
  ['broad_region', () => supabase.from('parties').select('id, broad_region').limit(1)],
  ['poster_url', () => supabase.from('parties').select('id, poster_url').limit(1)],
  ['eq status approved', () => supabase.from('parties').select('id, date, status').eq('status', 'approved').limit(3)],
  ['gte date', () => supabase.from('parties').select('id, date').gte('date', today).limit(3)],
  ['not poster null', () => supabase.from('parties').select('id, poster_url').not('poster_url', 'is', null).limit(3)],
  ['gte + eq status', () => supabase.from('parties').select('*').eq('status', 'approved').gte('date', today).limit(3)],
  ['in date array', () => supabase.from('parties').select('id, date').in('date', [today]).limit(3)],
  ['combined home posters', () =>
    supabase.from('parties').select('poster_url').gte('date', today).not('poster_url', 'is', null).limit(3)],
  ['chatbot imageUrl', () =>
    supabase.from('parties').select('*, imageUrl').eq('status', 'approved').gte('date', today).limit(3)],
  ['saju join', () =>
    supabase.from('parties').select('title, fee, date, poster_url, locations(name, address, latitude, longitude)').eq('status', 'approved').gte('date', today).limit(1)],
];

for (const [label, run] of tests) {
  const { data, error } = await run();
  if (error) {
    console.log(`${label}: ERROR ${error.code} — ${error.message}`);
    if (error.details) console.log('  details:', error.details);
    if (error.hint) console.log('  hint:', error.hint);
  } else if (data?.[0]) {
    console.log(`${label}: OK keys=[${Object.keys(data[0]).join(', ')}]`);
  } else {
    console.log(`${label}: OK (empty)`);
  }
}

const { data: sample } = await supabase.from('parties').select('*').limit(1);
if (sample?.[0]) {
  console.log('\nFull column list:', Object.keys(sample[0]).sort().join(', '));
}
