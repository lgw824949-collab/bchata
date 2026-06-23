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

const payload = {
  title: 'Test Camp venue',
  instructor: 'Test Master',
  type: 'domestic',
  region: '서울',
  country: '',
  start_date: '2026-06-01',
  end_date: '2026-06-01',
  venue: 'My Venue',
  fee: '99999',
  location: 'should not set',
  price: '88888',
  description: 'test',
  poster_url: null,
  genre: '바차타',
  level: '초급',
  instagram: '',
  youtube: '',
  bank_info: null,
  status: 'active',
};

const { data, error } = await sb.from('bootcamps').insert(payload).select().single();
console.log('error:', error?.message);
console.log('saved venue:', data?.venue, 'fee:', data?.fee, 'location:', data?.location, 'price:', data?.price);
if (data?.id) await sb.from('bootcamps').delete().eq('id', data.id);

// test storage upload path
const blob = new Blob(['fake'], { type: 'image/png' });
const { error: upErr } = await sb.storage.from('posters').upload(`bootcamps/test-${Date.now()}.png`, blob);
console.log('upload:', upErr ? upErr.message : 'OK');
