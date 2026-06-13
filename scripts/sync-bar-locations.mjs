/**
 * BAR locations — 마스터 주소·좌표 반영, 동일 업체 1건만 유지
 * Usage: node scripts/sync-bar-locations.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { BAR_DATABASE } from '../src/data/barDatabase.js';
import {
  canonicalizeVenueRow,
  findBarMasterRecord,
  getVenueDedupeKey,
} from '../src/lib/venueCanonical.js';
import { enrichBarRowCoordinates } from '../src/lib/barMasterCoords.js';
import { normalizeVenueNameKey } from '../src/lib/venueNormalize.js';

function loadEnv() {
  const out = {};
  for (const file of ['.env', '.env.local', '.env.production.local']) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue;
      const i = line.indexOf('=');
      if (i < 1) continue;
      out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

const dryRun = process.argv.includes('--dry-run');
const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const scoreRow = (row) =>
  (row.latitude != null ? 4 : 0) +
  (row.longitude != null ? 2 : 0) +
  (row.image_url ? 2 : 0) +
  ((row.address || '').length > 12 ? 2 : 0) +
  (String(row.id || '').includes('-') ? 1 : 0);

const pickKeeper = (rows) => {
  const master = findBarMasterRecord(rows[0]?.name, rows[0]?.address);
  if (master) {
    const masterKey = normalizeVenueNameKey(master.name);
    const canonicalMatch = rows.find((r) => normalizeVenueNameKey(r.name) === masterKey);
    if (canonicalMatch) return canonicalMatch;
  }
  return [...rows].sort((a, b) => scoreRow(b) - scoreRow(a))[0];
};

const buildPayload = (row) => {
  const canonical = canonicalizeVenueRow(row);
  const enriched = enrichBarRowCoordinates(canonical);
  const payload = {
    name: enriched.name,
    address: enriched.address,
  };
  if (enriched.latitude != null) payload.latitude = enriched.latitude;
  if (enriched.longitude != null) payload.longitude = enriched.longitude;
  return payload;
};

const { data: rows, error } = await supabase
  .from('locations')
  .select('id, name, address, latitude, longitude, image_url, view_count')
  .order('name');
if (error) {
  console.error(error.message);
  process.exit(1);
}

const groups = new Map();
for (const row of rows || []) {
  const key = getVenueDedupeKey(row);
  if (!key) continue;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

let updated = 0;
let deleted = 0;
let partiesRepointed = 0;

for (const [key, list] of groups) {
  if (list.length === 0) continue;
  const keeper = pickKeeper(list);
  const payload = buildPayload(keeper);
  const dupes = list.filter((r) => r.id !== keeper.id);

  const needsUpdate =
    keeper.name !== payload.name ||
    (keeper.address || '').trim() !== payload.address.trim() ||
    (payload.latitude != null && keeper.latitude !== payload.latitude) ||
    (payload.longitude != null && keeper.longitude !== payload.longitude);

  if (needsUpdate) {
    console.log(`UPDATE ${keeper.name} -> ${payload.name} | ${payload.address}`);
    if (!dryRun) {
      const { error: uerr } = await supabase.from('locations').update(payload).eq('id', keeper.id);
      if (uerr) console.error('  update fail:', uerr.message);
      else updated++;
    } else {
      updated++;
    }
  }

  for (const dup of dupes) {
    console.log(`MERGE delete ${dup.name} (${dup.id.slice(0, 8)}) -> keep ${keeper.name} (${keeper.id.slice(0, 8)}) [${key}]`);

    if (!dryRun) {
      const { data: parties } = await supabase
        .from('parties')
        .select('id')
        .eq('location_id', dup.id);
      if (parties?.length) {
        const { error: perr } = await supabase
          .from('parties')
          .update({ location_id: keeper.id })
          .eq('location_id', dup.id);
        if (perr) console.error('  parties repoint fail:', perr.message);
        else partiesRepointed += parties.length;
      }

      const { error: derr } = await supabase.from('locations').delete().eq('id', dup.id);
      if (derr) console.error('  delete fail:', derr.message);
      else deleted++;
    } else {
      deleted++;
    }
  }
}

const { count } = await supabase.from('locations').select('*', { count: 'exact', head: true });
console.log({
  dryRun,
  masterCount: BAR_DATABASE.length,
  updated,
  deleted,
  partiesRepointed,
  totalInDb: count,
});
