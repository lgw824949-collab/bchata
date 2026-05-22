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
const { data } = await supabase.from('locations').select('name, address').order('name');

// Parse BAR_DATABASE from BarLib.js
const lib = fs.readFileSync('src/lib/BarLib.js', 'utf8');
const barDb = [];
const re = /\{\s*name:\s*'([^']+)'[^}]*address:\s*'([^']+)'/g;
let m;
while ((m = re.exec(lib))) {
  barDb.push({ name: m[1], address: m[2] });
}

console.log('\n=== BAR_DATABASE (로컬 56곳) — 이름 | 주소 ===\n');
barDb.forEach((b, i) => {
  console.log(`${String(i + 1).padStart(2, '0')}. ${b.name}`);
  console.log(`    ${b.address}\n`);
});

console.log('\n=== Supabase locations 테이블 (' + (data?.length || 0) + '곳) ===\n');
(data || []).forEach((b, i) => {
  console.log(`${String(i + 1).padStart(2, '0')}. ${b.name}`);
  console.log(`    ${b.address || '(주소 없음)'}\n`);
});
