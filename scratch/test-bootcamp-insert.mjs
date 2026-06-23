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

const { data: sample } = await sb.from('bootcamps').select('*').limit(1);
if (sample?.[0]) console.log('columns:', Object.keys(sample[0]).join(', '));

const payload = {
  title: 'Test Camp',
  instructor: 'Test Master',
  type: 'domestic',
  region: '서울',
  country: '',
  start_date: '2026-06-01',
  end_date: '2026-06-01',
  venue: '추후 공지',
  fee: '100000',
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
console.log('insert:', error ? `ERR ${error.message}` : `OK id=${data?.id}`);
if (data?.id) {
  const { error: delErr } = await sb.from('bootcamps').delete().eq('id', data.id);
  console.log('cleanup:', delErr ? delErr.message : 'OK');
}

// test with country column removed
const payload2 = { ...payload, title: 'Test Camp 2' };
delete payload2.country;
const { error: err2 } = await sb.from('bootcamps').insert(payload2).select().single();
console.log('insert no country:', err2 ? `ERR ${err2.message}` : 'OK');

// test pending status like festival
const payload3 = { ...payload, title: 'Test Camp 3', status: 'pending' };
const { data: d3, error: err3 } = await sb.from('bootcamps').insert(payload3).select().single();
console.log('insert pending:', err3 ? `ERR ${err3.message}` : `OK id=${d3?.id}`);
if (d3?.id) await sb.from('bootcamps').delete().eq('id', d3.id);
