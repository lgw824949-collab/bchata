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
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(env.VITE_SUPABASE_URL, key);

const ONEDAY_DATE = process.argv[2] || '2026-06-19';
const DOW = ['일', '월', '화', '수', '목', '금', '토'][new Date(ONEDAY_DATE).getDay()];

const { data, error } = await supabase
  .from('classes_info')
  .select('*')
  .or('studio_name.ilike.%강남턴%,studio_name.ilike.%강턴%,title.ilike.%강턴%')
  .order('created_at', { ascending: false });

if (error) {
  console.error('query failed', error);
  process.exit(1);
}

console.log('found', data?.length || 0);
console.log(JSON.stringify(data, null, 2));

if (!process.argv.includes('--apply') || !data?.length) process.exit(0);

const target = data[0];
const payload = {
  start_date: ONEDAY_DATE,
  duration: '원데이',
  day_of_week: DOW,
};

const { data: updated, error: updErr } = await supabase
  .from('classes_info')
  .update(payload)
  .eq('id', target.id)
  .select('*')
  .maybeSingle();

if (updErr) {
  console.error('update failed', updErr);
  process.exit(1);
}

console.log('updated', updated?.id, payload);
