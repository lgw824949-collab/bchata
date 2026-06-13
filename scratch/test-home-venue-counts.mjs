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

const normalizeVenueNameKey = (name) => {
  let key = (name || '').replace(/\s+/g, '').toLowerCase();
  if (key.includes('강남턴') || key.includes('강턴')) key = '강턴';
  return key;
};

const mapBarLibRegionToPill = (regionLabel) => {
  const r = `${regionLabel || ''}`;
  if (r.includes('서울')) return '서울';
  if (r.includes('경기') || r.includes('인천')) return '경인';
  if (r.includes('경상') || r.includes('부산') || r.includes('대구')) return '경상도';
  if (r.includes('전라') || r.includes('광주')) return '전라도';
  if (r.includes('충청') || r.includes('대전') || r.includes('세종')) return '충청도';
  if (r.includes('강원') || r.includes('제주')) return '강원/제주';
  return null;
};

const classifyVenueLocation = (loc) => {
  const text = `${loc.address || ''}`.toLowerCase();
  const nameText = `${loc.name || ''}`.toLowerCase();
  const combined = `${text} ${nameText}`;
  let region = '기타';
  if (combined.includes('서울')) region = '서울';
  else if (combined.includes('경기') || combined.includes('인천')) region = '경인';
  else if (
    combined.includes('경상') || combined.includes('부산') || combined.includes('대구') ||
    combined.includes('울산') || combined.includes('창원') || combined.includes('포항') ||
    combined.includes('구미') || combined.includes('김천') || combined.includes('김해')
  ) region = '경상도';
  else if (
    combined.includes('전라') || combined.includes('광주') || combined.includes('전북') ||
    combined.includes('전남') || combined.includes('여수') || combined.includes('순천') ||
    combined.includes('목포')
  ) region = '전라도';
  else if (
    combined.includes('충청') || combined.includes('대전') || combined.includes('충북') ||
    combined.includes('충남') || combined.includes('세종') || combined.includes('청주') ||
    combined.includes('천안')
  ) region = '충청도';
  else if (combined.includes('강원') || combined.includes('제주') || combined.includes('춘천') || combined.includes('원주')) {
    region = '강원/제주';
  } else {
    const fromMaster = BAR_DATABASE.find((b) => normalizeVenueNameKey(b.name) === normalizeVenueNameKey(loc.name));
    const mapped = fromMaster ? mapBarLibRegionToPill(fromMaster.region) : null;
    region = mapped || '기타';
  }
  return { ...loc, region };
};

const dedupeVenueList = (rawList) => {
  const uniqueMap = new Map();
  rawList.forEach((loc) => {
    const key = normalizeVenueNameKey(loc.name);
    if (!key) return;
    if (!uniqueMap.has(key)) uniqueMap.set(key, loc);
    else {
      const existing = uniqueMap.get(key);
      const score = (loc) =>
        (loc.image_url ? 2 : 0) + (loc.kakao_url ? 1 : 0) + (loc.instagram_url ? 1 : 0) +
        ((loc.address || '').length > 8 ? 2 : 0);
      if (score(loc) > score(existing)) uniqueMap.set(key, loc);
    }
  });
  return [...uniqueMap.values()];
};

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const { data } = await supabase.from('locations').select('*').order('name');

let classified = dedupeVenueList(data || []).map(classifyVenueLocation);
const keys = new Set(classified.map((b) => normalizeVenueNameKey(b.name)));
BAR_DATABASE.forEach((bar, index) => {
  const key = normalizeVenueNameKey(bar.name);
  if (!key || keys.has(key)) return;
  keys.add(key);
  classified.push(classifyVenueLocation({ id: `bar-${index}`, name: bar.name, address: bar.address }));
});

const ORDER = ['서울', '경인', '경상도', '충청도', '전라도'];
const counts = {};
for (const b of classified) counts[b.region] = (counts[b.region] || 0) + 1;
console.log('total', classified.length);
for (const r of ORDER) console.log(r, counts[r] || 0);
console.log('other', Object.entries(counts).filter(([k]) => !ORDER.includes(k)));
