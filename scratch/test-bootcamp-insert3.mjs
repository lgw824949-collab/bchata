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
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// minimal like user might submit from step 4 without filling step 1
const bad = {
  title: '',
  instructor: '',
  type: 'domestic',
  region: '서울',
  start_date: '2026-06-01',
  end_date: '2026-06-01',
  venue: '',
  fee: '',
  description: '',
  poster_url: null,
  genre: '바차타',
  level: '초급',
  instagram: '',
  youtube: '',
  bank_info: null,
  status: 'active',
};
const { error: e1 } = await sb.from('bootcamps').insert(bad).select().single();
console.log('empty title:', e1?.message || 'OK');

// check status enum
for (const st of ['active', 'pending', 'rejected', 'hold']) {
  const { error } = await sb.from('bootcamps').insert({ ...bad, title: 'x', instructor: 'y', fee: '1', status: st }).select('id').single();
  console.log('status', st, error ? error.message : 'OK');
  if (!error) {
    const { data } = await sb.from('bootcamps').select('id').eq('title', 'x').maybeSingle();
    if (data?.id) await sb.from('bootcamps').delete().eq('id', data.id);
  }
}
