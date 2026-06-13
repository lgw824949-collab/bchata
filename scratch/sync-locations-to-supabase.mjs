import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { BAR_DATABASE } from '../src/lib/BarLib.js';

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

const normalizeKey = (name) => {
  let key = (name || '').replace(/\s+/g, '').toLowerCase();
  if (key.includes('강남턴') || key.includes('강턴')) key = '강턴';
  return key;
};

/** 기존 DB 이름 → 새 마스터 이름 */
const legacyNameByKey = {
  강턴: '강남턴',
  solbar: '강남SOL',
  압구정살사클럽탑: '압구정 TOP',
  솔sol빠: '홍대SOL',
  천안틴: '천안턴',
  바일라모스: '바이라모스',
  쿠바: '돌체비타',
};

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const { data: existing, error: fetchErr } = await supabase
  .from('locations')
  .select('id, name, address');
if (fetchErr) {
  console.error('fetch failed:', fetchErr.message);
  process.exit(1);
}

const byKey = new Map();
for (const row of existing || []) {
  const key = normalizeKey(row.name);
  if (!key) continue;
  if (!byKey.has(key)) byKey.set(key, []);
  byKey.get(key).push(row);
}

let inserted = 0;
let updated = 0;
let skipped = 0;

for (const bar of BAR_DATABASE) {
  const key = normalizeKey(bar.name);
  const rows = byKey.get(key) || [];

  const payload = { name: bar.name, address: bar.address };

  if (rows.length === 0) {
    const { error } = await supabase.from('locations').insert([payload]);
    if (error) {
      const { error: e2 } = await supabase.from('locations').insert([{ name: bar.name, address: bar.address }]);
      if (e2) {
        console.error('insert fail', bar.name, e2.message);
        continue;
      }
    }
    inserted++;
    byKey.set(key, [{ name: bar.name }]);
    continue;
  }

  const primary = rows[0];
  const needsUpdate =
    primary.name !== bar.name ||
    (primary.address || '').trim() !== bar.address.trim();

  if (needsUpdate) {
    const { error } = await supabase.from('locations').update(payload).eq('id', primary.id);
    if (error) {
      console.error('update fail', bar.name, error.message);
      continue;
    }
    updated++;
  } else {
    skipped++;
  }

  for (let i = 1; i < rows.length; i++) {
    const dup = rows[i];
    const { error } = await supabase.from('locations').update(payload).eq('id', dup.id);
    if (!error) updated++;
  }
}

const { count } = await supabase.from('locations').select('*', { count: 'exact', head: true });
console.log({ inserted, updated, skipped, totalInDb: count });
