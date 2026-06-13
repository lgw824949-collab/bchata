import { formatHeroDateLabel } from '../components/home/buildHomeDarkHeroSlides';
import type { HomeDarkParty } from '../components/home/types';
import { formatPartyTitleDisplay } from './partyTitleDisplay';
import { resolvePartyVenueName } from './partiesQuery';
import { filterSocialPartyRows } from './postKind';

export type HomeTodayAgendaKind = 'social' | 'bootcamp' | 'festival' | 'party';

export type HomeTodayAgendaItem = {
  id: string;
  kind: HomeTodayAgendaKind;
  kindLabelKo: string;
  kindLabelEn: string;
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

const bootcampsOnDate = (list: Record<string, unknown>[], fullDate: string) =>
  dedupeById(list || []).filter((row) => {
    if (row.status && row.status !== 'active') return false;
    const start = normDate(row.start_date);
    const end = normDate(row.end_date || row.start_date);
    if (start && end && end !== start) {
      return fullDate >= start && fullDate <= end;
    }
    return start === fullDate;
  });

const festivalsOnDate = (list: Record<string, unknown>[], fullDate: string) =>
  dedupeById(list || []).filter((row) => {
    if (row.status && row.status !== 'active') return false;
    const start = normDate(row.start_date);
    const end = normDate(row.end_date || row.start_date);
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

const toAgendaItem = (
  id: string,
  kind: HomeTodayAgendaKind,
  row: Record<string, unknown>,
): HomeTodayAgendaItem | null => {
  const posterUrl = String(row.poster_url || '').trim();
  if (!posterUrl) return null;

  const title = String(row.title || row.name || '').trim();
  if (!title) return null;

  const venue = String(
    row.venue || row.location || row.location_name || row.locationName || '',
  ).trim();
  const clock = normalizeClock(row.start_time || row.time);
  const labels = KIND_LABELS[kind];

  return {
    id,
    kind,
    kindLabelKo: labels.ko,
    kindLabelEn: labels.en,
    posterUrl,
    title: kind === 'social' ? formatPartyTitleDisplay(title) : title,
    venue,
    timeLabel: clock,
    sortTime: sortTimeKey(clock),
    raw: row,
  };
};

export function formatTodayAgendaDateLabel(dateStr: string, isEn: boolean) {
  return formatHeroDateLabel(dateStr, dateStr, isEn) || dateStr.slice(5).replace('-', '/');
}

type BuildHomeTodayAgendaInput = {
  dateStr: string;
  socialParties: HomeDarkParty[];
  bootcamps: Record<string, unknown>[] | null | undefined;
  festivals: Record<string, unknown>[] | null | undefined;
};

/** 오늘(또는 지정일) 소셜·부트캠프·페스·파티 통합 일정 */
export function buildHomeTodayAgenda({
  dateStr,
  socialParties,
  bootcamps,
  festivals,
}: BuildHomeTodayAgendaInput): HomeTodayAgendaItem[] {
  const items: HomeTodayAgendaItem[] = [];

  filterSocialPartyRows(socialParties || []).forEach((party) => {
    const item = toAgendaItem(`social-${party.id}`, 'social', party as Record<string, unknown>);
    if (item) items.push(item);
  });

  bootcampsOnDate(bootcamps || [], dateStr).forEach((row) => {
    const item = toAgendaItem(`bootcamp-${row.id}`, 'bootcamp', row);
    if (item) items.push(item);
  });

  festivalsOnDate(festivals || [], dateStr).forEach((row) => {
    const kind = resolveFestivalKind(row);
    const item = toAgendaItem(`${kind}-${row.id}`, kind, row);
    if (item) items.push(item);
  });

  return items.sort((a, b) => {
    if (a.sortTime !== b.sortTime) return a.sortTime.localeCompare(b.sortTime);
    if (KIND_ORDER[a.kind] !== KIND_ORDER[b.kind]) {
      return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    }
    return a.title.localeCompare(b.title, 'ko');
  });
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
