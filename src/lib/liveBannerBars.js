import { normalizeBarNameKey } from './barCounterDisplay';
import { resolveBarStats } from './barStatsQuery';

/** 홈 LIVE 바 — 우선 노출 BAR (이름 매칭) */
export const LIVE_BANNER_BAR_RULES = [
  { label: '라틴', match: (k) => k === '라틴' },
  { label: '카디즈', match: (k) => k.includes('카디즈') || k.includes('cadiz') },
  { label: '보니따', match: (k) => k.includes('보니타') || k.includes('보니따') },
  { label: '강남턴', match: (k) => k.includes('강남턴') || k === '강턴' },
];

function findVenueForRule(venues, rule) {
  return (venues || []).find((v) => rule.match(normalizeBarNameKey(v?.name)));
}

function maxLiveFromStatsMap(statsMap, rule) {
  let max = 0;
  Object.entries(statsMap || {}).forEach(([key, val]) => {
    if (!key.startsWith('name:')) return;
    const nk = key.slice(5);
    if (rule.match(nk)) max = Math.max(max, Number(val?.liveCount) || 0);
  });
  return max;
}

/**
 * @returns {{ label: string, liveCount: number, venue: object|null, key: string }[]}
 */
export function buildLiveBarSpotlights(venues = [], statsMap = {}) {
  return LIVE_BANNER_BAR_RULES.map((rule) => {
    const venue = findVenueForRule(venues, rule);
    const fromVenue = venue ? resolveBarStats(venue, statsMap).liveCount : 0;
    const fromMap = maxLiveFromStatsMap(statsMap, rule);
    return {
      key: rule.label,
      label: rule.label,
      liveCount: Math.max(fromVenue, fromMap),
      venue: venue || null,
    };
  });
}

export function formatLiveBarChip(row, isEn = false) {
  const n = Math.max(0, Number(row.liveCount) || 0);
  if (isEn) return `${row.label} ${n}`;
  return `${row.label} ${n}명`;
}
