import type { HomeTodayAgendaItem } from './buildHomeTodayAgenda';
import { normalizeBarNameKey } from './barCounterDisplay';
import { resolveBarStats } from './barStatsQuery';
import { isPartyInLiveBannerWindow } from './homeLiveBannerSlides';
import { resolvePartyVenueName } from './partiesQuery';
import type { HomeDarkBar, HomeDarkParty } from '../components/home/types';

type BarStatsMap = Record<string, { liveCount: number; clickCount: number }>;

export type AgendaLiveStatus = {
  isLive: boolean;
  liveCount: number;
  labelKo: string;
  labelEn: string;
};

const findBarForParty = (party: HomeDarkParty, locations: HomeDarkBar[]) => {
  const row = party as Record<string, unknown>;
  const locationId = row.location_id;
  if (locationId != null) {
    const byId = locations.find((bar) => String(bar.id) === String(locationId));
    if (byId) return byId;
  }

  const venueName = resolvePartyVenueName(party);
  const nameKey = normalizeBarNameKey(venueName);
  if (!nameKey) return null;

  return locations.find((bar) => normalizeBarNameKey(bar.name) === nameKey) || null;
};

const resolveLiveCountForParty = (
  party: HomeDarkParty,
  locations: HomeDarkBar[],
  barStatsMap: BarStatsMap,
) => {
  const bar = findBarForParty(party, locations);
  if (bar) return resolveBarStats(bar, barStatsMap).liveCount;

  const venueName = resolvePartyVenueName(party);
  const nameKey = `name:${normalizeBarNameKey(venueName)}`;
  return barStatsMap[nameKey]?.liveCount || 0;
};

/** 오늘 소셜 — LIVE 시간대 + bar_checkins 실제 인원 */
export function resolveAgendaLiveStatus(
  item: HomeTodayAgendaItem,
  todayStr: string,
  locations: HomeDarkBar[],
  barStatsMap: BarStatsMap,
): AgendaLiveStatus | null {
  if (item.kind !== 'social') return null;
  if (item.dateStr !== todayStr) return null;

  const party = item.raw as HomeDarkParty;
  if (!isPartyInLiveBannerWindow(party)) return null;

  const liveCount = resolveLiveCountForParty(party, locations, barStatsMap);
  return {
    isLive: true,
    liveCount,
    labelKo: `LIVE ${liveCount}명`,
    labelEn: `LIVE ${liveCount}`,
  };
}
