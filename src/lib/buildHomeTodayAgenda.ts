import { formatHeroDateLabel } from '../components/home/buildHomeDarkHeroSlides';
import type { HomeDarkParty } from '../components/home/types';
import { isApprovedParty, normDate } from './dateNorm';
import { partyMatchesCalendarDate } from './partyRecurrence';
import { formatPartyTitleDisplay } from './partyTitleDisplay';
import { resolvePartyVenueName } from './partiesQuery';
import { inferPartyRowSlot, isSocialPartyRow } from './postKind';
import { getPartyGenreLabel } from './partyShareCard';

export type HomeTodayAgendaKind = 'social' | 'bootcamp' | 'festival' | 'party';

export type HomeTodayAgendaItem = {
  id: string;
  dateStr: string;
  kind: HomeTodayAgendaKind;
  kindLabelKo: string;
  kindLabelEn: string;
  genreLabel: string;
  posterUrl: string;
  title: string;
  venue: string;
  timeLabel: string;
  sortTime: string;
  raw: unknown;
};

const KIND_LABELS: Record<HomeTodayAgendaKind, { ko: string; en: string }> = {
  social: { ko: '소셜', en: 'Social' },
  bootcamp: { ko: '부트캠프', en: 'Bootcamp' },
  festival: { ko: '페스티벌', en: 'Festival' },
  party: { ko: '파티', en: 'Party' },
};

const KIND_ORDER: Record<HomeTodayAgendaKind, number> = {
  social: 0,
  bootcamp: 1,
  festival: 2,
  party: 3,
};

/** 메인 다가오는 일정 — 오늘 포함 N일 */
export const UPCOMING_AGENDA_DAY_COUNT = 7;

/** 홈 날짜 스트립 — 한 달 전체 */
export const HOME_LIST_DATE_STRIP_DAY_COUNT = 14;

/** @deprecated date strip shows full selected day */
export const UPCOMING_AGENDA_PREVIEW_LIMIT = 3;

export const addDaysToDateStr = (dateStr: string, days: number) => {
  const base = new Date(`${normDate(dateStr)}T12:00:00`);
  if (Number.isNaN(base.getTime())) return normDate(dateStr);
  base.setDate(base.getDate() + days);
  return normDate(base);
};

export const buildUpcomingDateRange = (fromDateStr: string, dayCount = UPCOMING_AGENDA_DAY_COUNT) => {
  const dates: string[] = [];
  for (let i = 0; i < dayCount; i += 1) {
    dates.push(addDaysToDateStr(fromDateStr, i));
  }
  return dates;
};

export const parseDateStrParts = (dateStr: string) => {
  const normalized = normDate(dateStr);
  const [year, month, day] = normalized.split('-').map((part) => Number(part));
  return {
    year: Number.isFinite(year) ? year : 0,
    month: Number.isFinite(month) ? month : 0,
    day: Number.isFinite(day) ? day : 0,
  };
};

export const shiftMonth = (year: number, month: number, delta: number) => {
  const base = new Date(year, month - 1 + delta, 1, 12, 0, 0);
  return {
    year: base.getFullYear(),
    month: base.getMonth() + 1,
  };
};

export const formatAgendaMonthLabel = (year: number, month: number, isEn: boolean) => (
  isEn ? `${month}/${year}` : `${year}. ${month}.`
);

const parseRowGenres = (row: Record<string, unknown>) => {
  if (Array.isArray(row.genre)) {
    return row.genre.map((value) => String(value).trim()).filter(Boolean);
  }
  const raw = String(row.genre || '').trim();
  if (!raw) return [];
  return raw.split(/[,/·|]/).map((part) => part.trim()).filter(Boolean);
};

const resolveAgendaGenreLabel = (
  row: Record<string, unknown>,
  kind: HomeTodayAgendaKind,
): string => {
  const parsed = parseRowGenres(row);
  if (parsed.length) return parsed.slice(0, 2).join(' · ');

  const ratioLabel = getPartyGenreLabel(row as HomeDarkParty);
  if (ratioLabel && ratioLabel !== '소셜') return ratioLabel;

  return kind === 'social' ? '' : '';
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

const eventsOnDate = (
  list: Record<string, unknown>[],
  fullDate: string,
  activeStatus = 'active',
  startDatesOnly = false,
) =>
  dedupeById(list || []).filter((row) => {
    if (row.status && row.status !== activeStatus) return false;
    const start = normDate(row.start_date || row.date);
    const end = normDate(row.end_date || row.start_date || row.date);
    if (startDatesOnly) {
      return start === fullDate;
    }
    if (start && end && end !== start) {
      return fullDate >= start && fullDate <= end;
    }
    return start === fullDate;
  });

const normalizeClock = (value?: unknown) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const start = raw.includes('-') ? raw.split('-')[0].trim() : raw;
  return start.slice(0, 5);
};

const sortTimeKey = (clock: string) => (clock && /^\d{2}:\d{2}$/.test(clock) ? clock : '99:99');

const resolveFestivalKind = (row: Record<string, unknown>): HomeTodayAgendaKind => {
  const eventType = String(row.event_type || 'festival');
  if (eventType === 'party') return 'party';
  return 'festival';
};

/** parties — 해당 날짜·승인·포스터 (업체 dedupe 없음) */
export const filterAgendaPartiesForDate = (
  list: HomeDarkParty[] | null | undefined,
  dateStr: string,
) => dedupeById(
  (list || []).filter(
    (party) =>
      isApprovedParty(party)
      && isSocialPartyRow(party)
      && partyMatchesCalendarDate(party, dateStr)
      && String(party.poster_url || '').trim(),
  ),
);

const toAgendaItem = (
  id: string,
  dateStr: string,
  kind: HomeTodayAgendaKind,
  row: Record<string, unknown>,
): HomeTodayAgendaItem | null => {
  const posterUrl = String(row.poster_url || '').trim();
  if (!posterUrl) return null;

  const title = String(row.title || row.name || '').trim();
  if (!title) return null;

  const venue = kind === 'social'
    ? String(
      resolvePartyVenueName(row)
      || row.locationName
      || row.location_name
      || row.venue
      || row.address
      || '',
    ).trim()
    : String(
      row.venue || row.location || row.location_name || row.locationName || row.address || '',
    ).trim();
  const clock = normalizeClock(row.start_time || row.time);
  const labels = KIND_LABELS[kind];
  const genreLabel = resolveAgendaGenreLabel(row, kind);

  return {
    id,
    dateStr,
    kind,
    kindLabelKo: labels.ko,
    kindLabelEn: labels.en,
    genreLabel,
    posterUrl,
    title: kind === 'social' ? formatPartyTitleDisplay(title) : title,
    venue,
    timeLabel: clock,
    sortTime: sortTimeKey(clock),
    raw: row,
  };
};

export function formatAgendaDayLabel(dateStr: string, todayStr: string, isEn: boolean) {
  return formatHeroDateLabel(dateStr, todayStr, isEn) || dateStr.slice(5).replace('-', '/');
}

/** @deprecated use formatAgendaDayLabel */
export function formatTodayAgendaDateLabel(dateStr: string, isEn: boolean) {
  return formatAgendaDayLabel(dateStr, dateStr, isEn);
}

type BuildHomeTodayAgendaInput = {
  dateStr: string;
  parties: HomeDarkParty[] | null | undefined;
  bootcamps: Record<string, unknown>[] | null | undefined;
  festivals: Record<string, unknown>[] | null | undefined;
  startDatesOnly?: boolean;
};

/** 오늘(또는 지정일) 소셜·부트캠프·페스·파티 — 해당 날짜 포스터 전부 */
export function buildHomeTodayAgenda({
  dateStr,
  parties,
  bootcamps,
  festivals,
  startDatesOnly = false,
}: BuildHomeTodayAgendaInput): HomeTodayAgendaItem[] {
  const items: HomeTodayAgendaItem[] = [];
  const seenPosters = new Set<string>();

  const rememberPoster = (posterUrl: string) => {
    const key = `${dateStr}|${posterUrl}`;
    if (seenPosters.has(key)) return false;
    seenPosters.add(key);
    return true;
  };

  eventsOnDate(bootcamps || [], dateStr, 'active', startDatesOnly).forEach((row) => {
    const item = toAgendaItem(`bootcamp-${row.id}`, dateStr, 'bootcamp', row);
    if (item && rememberPoster(item.posterUrl)) items.push(item);
  });

  eventsOnDate(festivals || [], dateStr, 'active', startDatesOnly).forEach((row) => {
    const kind = resolveFestivalKind(row);
    const item = toAgendaItem(`${kind}-${row.id}`, dateStr, kind, row);
    if (item && rememberPoster(item.posterUrl)) items.push(item);
  });

  filterAgendaPartiesForDate(parties, dateStr).forEach((party) => {
    const row = party as Record<string, unknown>;
    const slot = inferPartyRowSlot(party);
    let kind: HomeTodayAgendaKind;
    if (slot === 'bootcamp' || slot === 'festival' || slot === 'party') {
      kind = slot;
    } else {
      kind = 'social';
    }

    const item = toAgendaItem(`party-row-${party.id}`, dateStr, kind, row);
    if (!item) return;

    // bootcamp/festival 테이블과 같은 포스터면 parties 중복 제외
    if (!rememberPoster(item.posterUrl)) return;
    items.push(item);
  });

  return items.sort((a, b) => {
    if (a.sortTime !== b.sortTime) return a.sortTime.localeCompare(b.sortTime);
    if (KIND_ORDER[a.kind] !== KIND_ORDER[b.kind]) {
      return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    }
    return a.title.localeCompare(b.title, 'ko');
  });
}

export type HomeUpcomingAgendaDay = {
  dateStr: string;
  items: HomeTodayAgendaItem[];
};

type BuildHomeUpcomingAgendaInput = {
  fromDateStr: string;
  dayCount?: number;
  parties: HomeDarkParty[] | null | undefined;
  bootcamps: Record<string, unknown>[] | null | undefined;
  festivals: Record<string, unknown>[] | null | undefined;
  startDatesOnly?: boolean;
};

type BuildHomeAgendaMonthInput = {
  year: number;
  month: number;
  parties: HomeDarkParty[] | null | undefined;
  bootcamps: Record<string, unknown>[] | null | undefined;
  festivals: Record<string, unknown>[] | null | undefined;
  startDatesOnly?: boolean;
};

/** 해당 월 1일~말일 — 일정 없는 날 포함 */
export function buildHomeAgendaMonthDays({
  year,
  month,
  parties,
  bootcamps,
  festivals,
  startDatesOnly = false,
}: BuildHomeAgendaMonthInput): HomeUpcomingAgendaDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return dates.map((dateStr) => ({
    dateStr,
    items: buildHomeTodayAgenda({
      dateStr,
      parties,
      bootcamps,
      festivals,
      startDatesOnly,
    }),
  }));
}

/** 오늘부터 N일 — 일정 없는 날 포함 (날짜 스트립용) */
export function buildHomeAgendaDayRange({
  fromDateStr,
  dayCount = HOME_LIST_DATE_STRIP_DAY_COUNT,
  parties,
  bootcamps,
  festivals,
  startDatesOnly = false,
}: BuildHomeUpcomingAgendaInput): HomeUpcomingAgendaDay[] {
  return buildUpcomingDateRange(fromDateStr, dayCount).map((dateStr) => ({
    dateStr,
    items: buildHomeTodayAgenda({
      dateStr,
      parties,
      bootcamps,
      festivals,
      startDatesOnly,
    }),
  }));
}

/** 오늘부터 N일 — 포스터 있는 날짜만 */
export function buildHomeUpcomingAgenda({
  fromDateStr,
  dayCount = UPCOMING_AGENDA_DAY_COUNT,
  parties,
  bootcamps,
  festivals,
}: BuildHomeUpcomingAgendaInput): HomeUpcomingAgendaDay[] {
  return buildHomeAgendaDayRange({
    fromDateStr,
    dayCount,
    parties,
    bootcamps,
    festivals,
  }).filter((day) => day.items.length > 0);
}

export function summarizeAgendaCountsFromDays(days: HomeUpcomingAgendaDay[]) {
  return summarizeTodayAgendaCounts(days.flatMap((day) => day.items));
}

export function summarizeTodayAgendaCounts(items: HomeTodayAgendaItem[]) {
  return items.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.kind] += 1;
      return acc;
    },
    { total: 0, social: 0, bootcamp: 0, festival: 0, party: 0 },
  );
}
