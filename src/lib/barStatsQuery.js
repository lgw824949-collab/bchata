import { getKSTCalendarTodayStr } from './dateNorm';
import {
  getBarStatsKey,
  getKSTTodayStartISO,
  normalizeBarNameKey,
} from './barCounterDisplay';

const LIVE_CHECKIN_WINDOW_MS = 6 * 60 * 60 * 1000;

/** public.bar_checkins — AdminDashboard insert 기준: bar_name, region, checked_in_at (location_id 없음) */
const BAR_CHECKINS_SELECT = 'bar_name, region, checked_in_at';

async function runBarStatsQuery(supabase, label, builder) {
  try {
    const res = await builder;
    if (res?.error) {
      console.warn(`[barStats] ${label}:`, res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn(`[barStats] ${label}:`, err?.message || err);
    return null;
  }
}

/**
 * @returns {Promise<Record<string, { liveCount: number, clickCount: number }>>}
 */
export async function fetchBarStatsMap(supabase) {
  const empty = {};
  if (!supabase) return empty;

  const todayStr = getKSTCalendarTodayStr();
  const todayStart = getKSTTodayStartISO();
  const map = {};

  const ensure = (key) => {
    if (!map[key]) map[key] = { liveCount: 0, clickCount: 0 };
    return map[key];
  };

  try {
    const checkinRows = await runBarStatsQuery(
      supabase,
      'bar_checkins',
      supabase
        .from('bar_checkins')
        .select(BAR_CHECKINS_SELECT)
        .gte('checked_in_at', todayStart),
    );

    (checkinRows || []).forEach((row) => {
      const at = row.checked_in_at ? new Date(row.checked_in_at).getTime() : 0;
      if (at < Date.now() - LIVE_CHECKIN_WINDOW_MS) return;

      const nameKey = normalizeBarNameKey(row.bar_name);
      if (nameKey) ensure(`name:${nameKey}`).liveCount += 1;
    });

    const partyRows = await runBarStatsQuery(
      supabase,
      'parties clicks',
      supabase
        .from('parties')
        .select('location_id, click_count, date')
        .eq('status', 'approved')
        .eq('date', todayStr),
    );

    (partyRows || []).forEach((p) => {
      if (p.location_id == null) return;
      const key = `id:${p.location_id}`;
      ensure(key).clickCount += Number(p.click_count) || 0;
    });
  } catch (err) {
    console.error('[barStats] fetchBarStatsMap failed:', err);
    return empty;
  }

  return map;
}

/** BAR 카드용 — id·이름 키 병합 */
export function resolveBarStats(bar, statsMap = {}) {
  const idKey = bar?.id != null && !String(bar.id).startsWith('bar-') ? `id:${bar.id}` : null;
  const nameKey = `name:${normalizeBarNameKey(bar?.name)}`;

  const byId = idKey ? statsMap[idKey] : null;
  const byName = statsMap[nameKey];
  const merged = {
    liveCount: Math.max(byId?.liveCount || 0, byName?.liveCount || 0),
    clickCount: Math.max(byId?.clickCount || 0, byName?.clickCount || 0),
  };

  return merged;
}

export function bumpBarClickCount(setter, bar, delta = 1) {
  const key = getBarStatsKey(bar);
  const nameKey = `name:${normalizeBarNameKey(bar?.name)}`;
  setter((prev) => {
    const next = { ...prev };
    [key, nameKey].forEach((k) => {
      if (!next[k]) next[k] = { liveCount: 0, clickCount: 0 };
      next[k] = { ...next[k], clickCount: (next[k].clickCount || 0) + delta };
    });
    return next;
  });
}
