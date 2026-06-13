const normDate = (value?: unknown) => String(value ?? '').slice(0, 10);

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
  if (eventTypes && !eventTypes.includes(String(row.event_type || 'festival'))) return false;
  if (!String(row.poster_url || '').trim()) return false;
  const end = normDate(row.end_date || row.start_date);
  if (end && end < todayStr) return false;
  return true;
});

/** 최초 등록 포스터 1장 고정 */
export const pickFirstGateMenuPhotoUrl = (
  rows: Record<string, unknown>[] | null | undefined,
  getUrl: (row: Record<string, unknown>) => unknown,
  getSortKey: (row: Record<string, unknown>) => unknown,
  fallback: string,
): string => {
  const sorted = [...(rows || [])]
    .filter((row) => String(getUrl(row) || '').trim())
    .sort((a, b) => {
      const ta = new Date(String(getSortKey(a) || 0)).getTime();
      const tb = new Date(String(getSortKey(b) || 0)).getTime();
      return ta - tb;
    });
  const url = sorted[0] ? String(getUrl(sorted[0])).trim() : '';
  return url || fallback;
};

const PHOTO_CARD_SIZE = { width: 160, height: 210 };

const buildMenuPhotoUrl = (photoPath: string) =>
  `https://images.unsplash.com/${photoPath}?w=${PHOTO_CARD_SIZE.width}&h=${PHOTO_CARD_SIZE.height}&fit=crop&q=80&auto=format`;

export const HOME_LIST_PHOTO_MENU_FALLBACKS = {
  bootcamp: buildMenuPhotoUrl('photo-1682760631807-71067eeea033'),
  festival: buildMenuPhotoUrl('photo-1530103862676-de8c9debad1d'),
  party: '/home-gate-party.jpg',
  instructors: buildMenuPhotoUrl('photo-1494790108377-be9c29b29330'),
} as const;

export type HomeListPhotoMenuItemId = keyof typeof HOME_LIST_PHOTO_MENU_FALLBACKS;

export type HomeListPhotoMenuItem = {
  id: HomeListPhotoMenuItemId;
  label: string;
  photoUrl: string;
  count: number;
  countHint: string;
  onClick: () => void;
};

type BuildHomeListPhotoMenuItemsInput = {
  isEn: boolean;
  bootcamps: Record<string, unknown>[] | null | undefined;
  festivals: Record<string, unknown>[] | null | undefined;
  calendarTodayStr: string;
  bootcampCount: number;
  festivalCount: number;
  partyEventCount: number;
  instructorCount: number;
  instructorPhotoUrl?: string | null;
  onOpenBootcamp: () => void;
  onOpenFestival: () => void;
  onOpenPartyEvents: () => void;
  onOpenInstructors: () => void;
};

export function buildHomeListPhotoMenuItems(input: BuildHomeListPhotoMenuItemsInput): HomeListPhotoMenuItem[] {
  const {
    isEn,
    bootcamps,
    festivals,
    calendarTodayStr,
    bootcampCount,
    festivalCount,
    partyEventCount,
    instructorCount,
    instructorPhotoUrl,
    onOpenBootcamp,
    onOpenFestival,
    onOpenPartyEvents,
    onOpenInstructors,
  } = input;

  const bootcampPhotoUrl = pickFirstGateMenuPhotoUrl(
    filterActiveGateEventPosters(bootcamps, calendarTodayStr),
    (row) => row.poster_url,
    (row) => row.created_at || row.start_date,
    HOME_LIST_PHOTO_MENU_FALLBACKS.bootcamp,
  );

  const festivalPhotoUrl = pickFirstGateMenuPhotoUrl(
    filterActiveGateEventPosters(festivals, calendarTodayStr, ['festival', 'mt']),
    (row) => row.poster_url,
    (row) => row.created_at || row.start_date,
    HOME_LIST_PHOTO_MENU_FALLBACKS.festival,
  );

  const partyPhotoUrl = pickFirstGateMenuPhotoUrl(
    filterActiveGateEventPosters(festivals, calendarTodayStr, 'party'),
    (row) => row.poster_url,
    (row) => row.created_at || row.start_date,
    HOME_LIST_PHOTO_MENU_FALLBACKS.party,
  );

  const instructorPhoto = String(instructorPhotoUrl || '').trim() || HOME_LIST_PHOTO_MENU_FALLBACKS.instructors;
  const activeHint = isEn ? 'active' : '진행·예정';

  return [
    {
      id: 'bootcamp',
      label: isEn ? 'Bootcamp' : '부트캠프',
      photoUrl: bootcampPhotoUrl,
      count: bootcampCount,
      countHint: activeHint,
      onClick: onOpenBootcamp,
    },
    {
      id: 'festival',
      label: isEn ? 'Festival' : '페스티벌',
      photoUrl: festivalPhotoUrl,
      count: festivalCount,
      countHint: activeHint,
      onClick: onOpenFestival,
    },
    {
      id: 'party',
      label: isEn ? 'Party' : '파티',
      photoUrl: partyPhotoUrl,
      count: partyEventCount,
      countHint: activeHint,
      onClick: onOpenPartyEvents,
    },
    {
      id: 'instructors',
      label: isEn ? 'Instructors' : '강사',
      photoUrl: instructorPhoto,
      count: instructorCount,
      countHint: isEn ? 'instructors' : '활동 강사',
      onClick: onOpenInstructors,
    },
  ];
}

export function homeListPhotoMenuAriaLabel(
  item: HomeListPhotoMenuItem,
  isEn: boolean,
): string {
  if (item.count <= 0) return item.label;
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
