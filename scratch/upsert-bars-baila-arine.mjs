import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function parseEnv(filePath) {
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

const env = { ...parseEnv('.env'), ...parseEnv('.env.local'), ...parseEnv('.env.production.local') };
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const BARS = [
  {
    name: '바일라모스',
    aliases: ['바이라모스'],
    address: '경기도 성남시 분당구 수내동 19-3 대덕프라자 503호',
    regionHint: '경기',
    latitude: 37.3842,
    longitude: 127.1218,
  },
  {
    name: '아리네',
    address: '광주광역시 남구 천변좌로428번길 6',
    regionHint: '전라',
    latitude: 35.1391,
    longitude: 126.9186,
  },
];

const { data: regions, error: regErr } = await supabase.from('regions').select('id, name');
if (regErr) {
  process.stderr.write(`${regErr.message}\n`);
  process.exit(1);
}

const pickRegionId = (hint) => {
  const row = (regions || []).find((r) => String(r.name || '').includes(hint));
  return row?.id || null;
};

for (const bar of BARS) {
  const regionId = pickRegionId(bar.regionHint);
  const names = [bar.name, ...(bar.aliases || [])];
  let existing = null;

  for (const n of names) {
    const { data } = await supabase.from('locations').select('id, name, address').eq('name', n).maybeSingle();
    if (data) {
      existing = data;
      break;
    }
  }

  if (existing) {
    const { error } = await supabase
      .from('locations')
      .update({
        name: bar.name,
        address: bar.address,
        region_id: regionId,
        latitude: bar.latitude,
        longitude: bar.longitude,
      })
      .eq('id', existing.id);
    if (error) {
      process.stderr.write(`update ${bar.name}: ${error.message}\n`);
      process.exit(1);
    }
    process.stdout.write(`updated ${bar.name} (${existing.id})\n`);
    continue;
  }

  const { data: inserted, error } = await supabase
    .from('locations')
    .insert([{
      name: bar.name,
      address: bar.address,
      region_id: regionId,
      latitude: bar.latitude,
      longitude: bar.longitude,
      view_count: 0,
    }])
    .select('id, name')
    .single();

  if (error) {
    process.stderr.write(`insert ${bar.name}: ${error.message}\n`);
    process.exit(1);
  }
  process.stdout.write(`inserted ${bar.name} (${inserted.id})\n`);
}
