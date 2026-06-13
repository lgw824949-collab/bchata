import {
  buildHomeUpcomingAgenda,
  type HomeTodayAgendaItem,
} from './buildHomeTodayAgenda';
import type { HomeDarkParty } from '../components/home/types';

const SEARCH_DAY_COUNT = 60;

type BuildHomePartySearchItemsInput = {
  fromDateStr: string;
  parties: HomeDarkParty[] | null | undefined;
  bootcamps: Record<string, unknown>[] | null | undefined;
  festivals: Record<string, unknown>[] | null | undefined;
};

export function buildHomePartySearchItems(input: BuildHomePartySearchItemsInput): HomeTodayAgendaItem[] {
  return buildHomeUpcomingAgenda({
    ...input,
    dayCount: SEARCH_DAY_COUNT,
  }).flatMap((day) => day.items);
}

export function filterHomePartySearchItems(
  items: HomeTodayAgendaItem[],
  query: string,
  limit = 30,
): HomeTodayAgendaItem[] {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];

  return items.filter((item) => {
    const haystack = [
      item.title,
      item.venue,
      item.kindLabelKo,
      item.kindLabelEn,
      item.dateStr,
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  }).slice(0, limit);
}
