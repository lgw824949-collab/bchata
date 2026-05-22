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
const { data } = await supabase.from('locations').select('*').order('name', { ascending: true });
const rawList = data || [];

const uniqueMap = new Map();
rawList.forEach(loc => {
  let key = (loc.name || '').replace(/\s+/g, '').toLowerCase();
  if (key.includes('강남턴') || key.includes('강턴')) key = '강턴';
  if (!key) return;

  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, loc);
  } else {
    const existing = uniqueMap.get(key);
    const score = (loc.image_url ? 2 : 0) + (loc.kakao_url ? 1 : 0) + (loc.instagram_url ? 1 : 0);
    const exScore = (existing.image_url ? 2 : 0) + (existing.kakao_url ? 1 : 0) + (existing.instagram_url ? 1 : 0);
    if (score > exScore || (score === exScore && loc.id > existing.id)) {
      uniqueMap.set(key, loc);
    }
  }
});
const deduplicatedList = Array.from(uniqueMap.values());

const REGIONS_ORDER = ['서울', '경인', '경상도', '전라도', '충청도', '강원/제주'];
const classified = deduplicatedList.map(loc => {
  const text = `${loc.address || ''}`.toLowerCase();
  let region = '기타';
  if (text.includes('서울')) region = '서울';
  else if (text.includes('경기') || text.includes('인천')) region = '경인';
  else if (text.includes('부산') || text.includes('대구') || text.includes('경북') || text.includes('경남') || text.includes('울산') || text.includes('창원') || text.includes('포항') || text.includes('구미')) region = '경상도';
  else if (text.includes('광주') || text.includes('전북') || text.includes('전남') || text.includes('여수') || text.includes('순천') || text.includes('목포')) region = '전라도';
  else if (text.includes('대전') || text.includes('충북') || text.includes('충남') || text.includes('세종') || text.includes('청주') || text.includes('천안')) region = '충청도';
  else if (text.includes('강원') || text.includes('제주') || text.includes('춘천') || text.includes('원주')) region = '강원/제주';
  else {
    const nameText = `${loc.name || ''}`.toLowerCase();
    if (nameText.includes('서울')) region = '서울';
    else if (nameText.includes('경기') || nameText.includes('인천')) region = '경인';
    else if (nameText.includes('부산') || nameText.includes('대구')) region = '경상도';
    else region = '서울';
  }
  return { name: loc.name, region };
});

console.log('deduped', classified.length);
for (const tab of ['전체', ...REGIONS_ORDER]) {
  const count = tab === '전체' ? classified.length : classified.filter(b => b.region === tab).length;
  console.log(tab, count);
}
