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

const normDate = (d) => {
  if (d == null || d === '') return '';
  const s = String(d).trim();
  const day = s.includes('T') ? s.split('T')[0] : s;
  return day.slice(0, 10);
};

const getKSTCalendarTodayStr = () => {
  const kst = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [m, d, y] = kst.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const today = getKSTCalendarTodayStr();

const { data, error } = await supabase.from('parties').select('id, date, status, title').eq('status', 'approved');
if (error) {
  console.error(error);
  process.exit(1);
}

const todayParties = (data || []).filter((p) => normDate(p.date) === today);
console.log('calendar today:', today);
console.log('approved total:', data?.length);
console.log('approved today:', todayParties.length);
console.log('sample dates:', [...new Set((data || []).slice(0, 5).map((p) => p.date))]);
