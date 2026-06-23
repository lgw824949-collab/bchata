import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...parseEnvFile('.env'), ...parseEnvFile('.env.local'), ...parseEnvFile('.env.production.local') };
const supabase = createClient(
  env.VITE_SUPABASE_URL || 'https://biwziyyklaycbjrnitem.supabase.co',
  env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1',
);

const address = '경기도 고양시 일산동구 강송로113번길 53-20 B1';
const { data: rows, error: findErr } = await supabase
  .from('locations')
  .select('id,name,address')
  .or('name.ilike.%살사%우노%,name.ilike.%salsa%uno%');

if (findErr) {
  console.error('find error', findErr.message);
  process.exit(1);
}

console.log('before', rows);

if (!rows?.length) {
  console.log('no matching locations row');
  process.exit(0);
}

const { data, error } = await supabase
  .from('locations')
  .update({ address, latitude: 37.6433, longitude: 126.7865 })
  .in('id', rows.map((r) => r.id))
  .select('id,name,address,latitude,longitude');

console.log(error ? `update error: ${error.message}` : 'updated', data);
