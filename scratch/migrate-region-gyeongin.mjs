/**
 * DB region 필드: 경기/인천 → 경인 일괄 변경
 * node scratch/migrate-region-gyeongin.mjs
 */
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

const FROM = '경기/인천';
const TO = '경인';

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Supabase env missing');
  process.exit(1);
}

const supabase = createClient(url, key);
const TABLES = ['parties', 'bootcamps', 'festivals', 'classes', 'instructors'];

for (const table of TABLES) {
  const { data, error } = await supabase.from(table).select('id, region').eq('region', FROM);
  if (error) {
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      console.log(`skip ${table}: no table or region column`);
      continue;
    }
    if (error.message?.includes('column') && error.message?.includes('region')) {
      console.log(`skip ${table}: no region column`);
      continue;
    }
    console.warn(`${table} select:`, error.message);
    continue;
  }
  const ids = (data || []).map((r) => r.id);
  if (ids.length === 0) {
    console.log(`${table}: 0 rows`);
    continue;
  }
  const { error: upErr } = await supabase.from(table).update({ region: TO }).eq('region', FROM);
  if (upErr) console.error(`${table} update:`, upErr.message);
  else console.log(`${table}: updated ${ids.length} → ${TO}`);
}

console.log('done');
