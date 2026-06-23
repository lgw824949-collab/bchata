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

const { data: row } = await sb.from('bootcamps').select('id, title, poster_url').limit(1).maybeSingle();
if (!row) {
  console.log('no bootcamp row');
  process.exit(0);
}

const payload = {
  title: row.title || 'Test',
  instructor: 'Test',
  type: 'domestic',
  region: '서울',
  start_date: '2026-06-01',
  end_date: '2026-06-01',
  venue: 'test',
  location: 'test',
  fee: '1',
  price: '1',
  poster_url: 'https://example.com/poster.jpg',
  price_poster_url: 'https://example.com/price.jpg',
  extra_poster_url: 'https://example.com/extra.jpg',
  genre: '바차타',
  level: '초급',
};

const { data, error } = await sb.from('bootcamps').update(payload).eq('id', row.id).select('poster_url, price_poster_url').maybeSingle();
console.log('full payload update:', error?.message || data);

const payload2 = { ...payload };
delete payload2.price_poster_url;
delete payload2.extra_poster_url;
const { data: d2, error: e2 } = await sb.from('bootcamps').update(payload2).eq('id', row.id).select('poster_url').maybeSingle();
console.log('without extra cols:', e2?.message || d2);
