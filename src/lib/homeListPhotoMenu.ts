import { isGenericExplorePosterUrl } from '../constants/imageAssets';
import { compareNearestEventDate } from '../components/home/buildHomeDarkHeroSlides';

/** 다크 홈 퀵메뉴 전용 이모지 (리스트 탐색은 등록 포스터 사용) */
export const HOME_EXPLORE_MENU_EMOJIS = {
  social: '🎉',
  bootcamp: '🏕️',
  festival: '🎪',
  party: '🥳',
  instructors: '🕺',
} as const;

const normDate = (value?: unknown) => String(value ?? '').slice(0, 10);

const normalizeGateEventType = (row: Record<string, unknown>) => {
  const raw = String(row.event_type ?? 'festival').trim().toLowerCase();
  return raw || 'festival';
};

const matchesGateEventTypes = (
  row: Record<string, unknown>,
  eventTypes: string[] | null,
) => {
  if (!eventTypes) return true;
  return eventTypes.includes(normalizeGateEventType(row));
};

const dedupeById = <T extends { id?: unknown }>(list: T[]): T[] => {
  const seen = new Set<unknown>();
  return list.filter((item) => {
    const id = item?.id;
    if (id == null) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

/** 종료 전·승인·포스터 있는 행사 */
export const filterActiveGateEventPosters = (
  rows: Record<string, unknown>[] | null | undefined,
  todayStr: string,
  eventTypes: string[] | null = null,
) => dedupeById(rows || []).filter((row) => {
  if (row.status && row.status !== 'active') return false;
  if (!matchesGateEventTypes(row, eventTypes)) return false;
  if (!String(row.poster_url || '').trim()) return false;
  const end = normDate(row.end_date || row.start_date);
  if (end && end < todayStr) return false;
  return true;
});

const sortExplorePosterRows = (
  rows: Record<string, unknown>[],
  getEventDate: (row: Record<string, unknown>) => string,
  todayStr: string,
) => [...rows].sort((a, b) => {
  const byDate = compareNearestEventDate(
    getEventDate(a),
    getEventDate(b),
    todayStr,
  );
  if (byDate !== 0) return byDate;
  // 같은 행사일 — 최신 등록 포스터 우선 (구 플레이스홀더 회피)
  const tb = new Date(String(b.created_at || 0)).getTime();
  const ta = new Date(String(a.created_at || 0)).getTime();
  return tb - ta;
});

/** 행사일 가까운 순 + 브랜딩 URL 제외 — Explore 썸네일 후보 */
export const pickExploreMenuPosterCandidates = (
  rows: Record<string, unknown>[] | null | undefined,
  getUrl: (row: Record<string, unknown>) => unknown,
  getEventDate: (row: Record<string, unknown>) => string,
  todayStr: string,
  limit = 3,
): string[] => {
  const seen = new Set<string>();
  const sorted = sortExplorePosterRows(
    (rows || []).filter((row) => {
      const url = String(getUrl(row) || '').trim();
      return url && !isGenericExplorePosterUrl(url);
    }),
    getEventDate,
    todayStr,
  );

  const candidates: string[] = [];
  for (const row of sorted) {
    const url = String(getUrl(row)).trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    candidates.push(url);
    if (candidates.length >= limit) break;
  }
  return candidates;
};

export const pickNearestGateMenuPhotoUrl = (
  rows: Record<string, unknown>[] | null | undefined,
  getUrl: (row: Record<string, unknown>) => unknown,
  getEventDate: (row: Record<string, unknown>) => string,
  todayStr: string,
): string | null => pickExploreMenuPosterCandidates(rows, getUrl, getEventDate, todayStr, 1)[0] ?? null;

export type HomeListPhotoMenuItemId = 'social' | 'bootcamp' | 'festival' | 'party' | 'instructors';

export type HomeListPhotoMenuItem = {
  id: HomeListPhotoMenuItemId;
  label: string;
  /** 1순위 썸네일 (하위 호환) */
  photoUrl: string | null;
  /** 로드 실패 시 순차 시도 */
  photoCandidates: string[];
  count: number;
  countHint: string;
  onClick: () => void;
};

type BuildHomeListPhotoMenuItemsInput = {
  isEn: boolean;
  socialParties: Record<string, unknown>[] | null | undefined;
  bootcamps: Record<string, unknown>[] | null | undefined;
  festivals: Record<string, unknown>[] | null | undefined;
  calendarTodayStr: string;
  socialCount: number;
  bootcampCount: number;
  festivalCount: number;
  partyEventCount: number;
  eventsLoading?: boolean;
  onOpenSocial: () => void;
  onOpenBootcamp: () => void;
  onOpenFestival: () => void;
  onOpenPartyEvents: () => void;
};

const eventStartDate = (row: Record<string, unknown>) => normDate(row.start_date || row.date);

export function buildHomeListPhotoMenuItems(input: BuildHomeListPhotoMenuItemsInput): HomeListPhotoMenuItem[] {
  const {
    socialParties,
    bootcamps,
    festivals,
    calendarTodayStr,
    socialCount,
    bootcampCount,
    festivalCount,
    partyEventCount,
    eventsLoading = false,
    onOpenSocial,
    onOpenBootcamp,
    onOpenFestival,
    onOpenPartyEvents,
  } = input;

  const socialCandidates = eventsLoading
    ? []
    : pickExploreMenuPosterCandidates(
      socialParties,
      (row) => row.poster_url,
      (row) => {
        if ((row as { is_weekly_recurring?: boolean }).is_weekly_recurring) return calendarTodayStr;
        return normDate(row.date || row.start_date) || calendarTodayStr;
      },
      calendarTodayStr,
    );

  const bootcampCandidates = eventsLoading
    ? []
    : pickExploreMenuPosterCandidates(
      filterActiveGateEventPosters(bootcamps, calendarTodayStr),
      (row) => row.poster_url,
      eventStartDate,
      calendarTodayStr,
    );

  const festivalCandidates = eventsLoading
    ? []
    : pickExploreMenuPosterCandidates(
      filterActiveGateEventPosters(festivals, calendarTodayStr, ['festival', 'mt']),
      (row) => row.poster_url,
      eventStartDate,
      calendarTodayStr,
    );

  const partyCandidates = eventsLoading
    ? []
    : pickExploreMenuPosterCandidates(
      filterActiveGateEventPosters(festivals, calendarTodayStr, ['party']),
      (row) => row.poster_url,
      eventStartDate,
      calendarTodayStr,
    );

  const activeHint = 'upcoming';

  const toItem = (
    id: HomeListPhotoMenuItemId,
    label: string,
    candidates: string[],
    count: number,
    onClick: () => void,
  ): HomeListPhotoMenuItem => ({
    id,
    label,
    photoCandidates: candidates,
    photoUrl: candidates[0] ?? null,
    count,
    countHint: activeHint,
    onClick,
  });

  return [
    toItem('social', 'Social', socialCandidates, socialCount, onOpenSocial),
    toItem('bootcamp', 'Bootcamp', bootcampCandidates, bootcampCount, onOpenBootcamp),
    toItem('festival', 'Festival', festivalCandidates, festivalCount, onOpenFestival),
    toItem('party', 'Party', partyCandidates, partyEventCount, onOpenPartyEvents),
  ];
}

export function homeListPhotoMenuAriaLabel(
  item: HomeListPhotoMenuItem,
  isEn: boolean,
): string {
  if (item.count <= 0) return item.label;
  if (item.id === 'social') {
    return isEn ? `${item.label} · ${item.count} upcoming social` : `${item.label} · 진행·예정 소셜 ${item.count}건`;
  }
  if (item.id === 'bootcamp') {
    return isEn ? `${item.label} · ${item.count} active bootcamps` : `${item.label} · 진행·예정 부트캠프 ${item.count}건`;
  }
  if (item.id === 'festival') {
    return isEn ? `${item.label} · ${item.count} active festivals` : `${item.label} · 진행·예정 페스티벌 ${item.count}건`;
  }
  if (item.id === 'party') {
    return isEn ? `${item.label} · ${item.count} party events` : `${item.label} · 진행·예정 파티 ${item.count}건`;
  }
  return isEn ? `${item.label} · ${item.count} instructors` : `${item.label} · 활동 강사 ${item.count}명`;
}
