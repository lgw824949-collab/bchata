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

const masterKeys = new Set(BAR_DATABASE.map((b) => normalizeKey(b.name)));

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const { data: rows, error } = await supabase.from('locations').select('id, name, address');
if (error) {
  console.error(error.message);
  process.exit(1);
}

const score = (r) => ((r.address || '').length > 10 ? 2 : 0) + (r.name || '').length;

const groups = new Map();
for (const row of rows || []) {
  const key = normalizeKey(row.name);
  if (!key) continue;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

const masterByKey = new Map(BAR_DATABASE.map((b) => [normalizeKey(b.name), b]));

let deleted = 0;
let updated = 0;

for (const [key, list] of groups) {
  const master = masterByKey.get(key);
  list.sort((a, b) => score(b) - score(a) || String(b.id).localeCompare(String(a.id)));
  const keep = list[0];
  const dups = list.slice(1);

  if (master) {
    const payload = { name: master.name, address: master.address };
    if (keep.name !== master.name || keep.address !== master.address) {
      const { error: uerr } = await supabase.from('locations').update(payload).eq('id', keep.id);
      if (!uerr) updated++;
    }
  }

  for (const dup of dups) {
    const { error: derr } = await supabase.from('locations').delete().eq('id', dup.id);
    if (!derr) deleted++;
    else console.error('delete fail', dup.name, derr.message);
  }
}

const { count } = await supabase.from('locations').select('*', { count: 'exact', head: true });
console.log({ deleted, updated, totalInDb: count, masterCount: BAR_DATABASE.length });
