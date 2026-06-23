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

const env = { ...loadEnv('.env'), ...loadEnv('.env.local'), ...loadEnv('.env.production.local') };
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(env.VITE_SUPABASE_URL, key);

const GANGTURN_ADDRESS = '서울특별시 강남구 역삼로3길 17-5 (역삼동), 삼영빌딩 지하 1층';

const { data: locs, error: locErr } = await supabase
  .from('locations')
  .select('id, name, address')
  .or('name.ilike.%강남턴%,name.ilike.%강턴%');

if (locErr) {
  console.error('locErr', locErr.message);
  process.exit(1);
}

console.log('gangturn locations:', JSON.stringify(locs, null, 2));

const { data: parties, error: pErr } = await supabase
  .from('parties')
  .select('id, title, date, time, location_id, address, poster_url, status')
  .order('date', { ascending: false })
  .limit(100);

if (pErr) {
  console.error('pErr', pErr.message);
  process.exit(1);
}

const { data: joined, error: jErr } = await supabase
  .from('parties')
  .select('id, title, date, time, location_id, address, poster_url, status, locations!location_id(name, address)')
  .order('date', { ascending: false })
  .limit(100);

if (jErr) console.error('jErr', jErr.message);
else {
  const badVenue = (joined || []).filter((p) => {
    const n = p.locations?.name || '';
    return !p.location_id || !n || n.includes('오늘밤') || n.includes('미정');
  });
  console.log('bad venue join:', JSON.stringify(badVenue, null, 2));
}

const today = new Date().toISOString().slice(0, 10);
const { data: todayP } = await supabase
  .from('parties')
  .select('id, title, date, time, location_id, address, poster_url, locations!location_id(name, address)')
  .eq('date', today);
console.log('today parties:', JSON.stringify(todayP, null, 2));

const { data: badLoc } = await supabase
  .from('locations')
  .select('*')
  .eq('id', 'e0ff4047-f3b1-46f2-aa05-ff6ca488a593')
  .maybeSingle();
console.log('bad location row:', JSON.stringify(badLoc, null, 2));

const { data: linked } = await supabase
  .from('parties')
  .select('id, title, date')
  .eq('location_id', 'e0ff4047-f3b1-46f2-aa05-ff6ca488a593');
console.log('linked parties count:', linked?.length, linked?.map((p) => p.title));

const GANGTURN_ID = 'fb4e7a29-f1d4-4760-bd98-64a91981cbab';
const BROKEN_ID = 'e0ff4047-f3b1-46f2-aa05-ff6ca488a593';
const FULL_ADDRESS = '서울특별시 강남구 역삼로3길 17-5 (역삼동), 삼영빌딩 지하 1층';

// optional: remove duplicate location after parties moved
const { data: orphanCheck } = await supabase
  .from('parties')
  .select('id')
  .eq('location_id', BROKEN_ID)
  .limit(1);
if (!orphanCheck?.length) {
  const del = await supabase.from('locations').delete().eq('id', BROKEN_ID);
  console.log('deleted orphan location:', del.error?.message || 'ok');
}

const locUpdate = await supabase
  .from('locations')
  .update({
    name: '강남턴',
    address: FULL_ADDRESS,
    latitude: 37.4975,
    longitude: 127.0358,
  })
  .eq('id', BROKEN_ID)
  .select('*');

if (locUpdate.error) {
  console.error('locUpdate', locUpdate.error.message);
  process.exit(1);
}
console.log('updated location:', JSON.stringify(locUpdate.data, null, 2));

const partyUpdate = await supabase
  .from('parties')
  .update({ address: FULL_ADDRESS, location_id: GANGTURN_ID })
  .eq('location_id', BROKEN_ID)
  .select('id, title, address, location_id');

if (partyUpdate.error) {
  console.error('partyUpdate', partyUpdate.error.message);
  process.exit(1);
}
console.log('updated parties:', JSON.stringify(partyUpdate.data, null, 2));

for (const table of ['bootcamps', 'festivals']) {
  const { data, error } = await supabase.from(table).select('id, title, venue, location_name, address, poster_url, start_date').order('start_date', { ascending: false }).limit(20);
  if (!error) {
    const hits = (data || []).filter((r) =>
      [r.venue, r.location_name, r.address, r.title].some((v) => String(v || '').includes('미정')),
    );
    if (hits.length) console.log(table, '미정:', JSON.stringify(hits, null, 2));
    else console.log(table, 'recent:', JSON.stringify(data?.slice(0, 5), null, 2));
  } else console.log(table, error.message);
}
