import type { HomeDarkHeroSlide } from './types';

type PosterRow = {
  id?: string | number;
  poster_url?: string;
  title?: string;
  name?: string;
  venue?: string;
  location_name?: string;
  locationName?: string;
  start_time?: string;
  time?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  event_type?: string;
};

const normDate = (value?: string) => String(value || '').slice(0, 10);

const pickLatestPosterRow = (rows: PosterRow[]) =>
  (rows || [])
    .filter((row) => String(row.poster_url || '').trim())
    .sort(
      (a, b) =>
        new Date(b.created_at || b.start_date || 0).getTime()
        - new Date(a.created_at || a.start_date || 0).getTime(),
    )[0] || null;

const pickFeaturedEventRow = (
  rows: PosterRow[],
  todayStr: string,
  eventTypes?: string | string[],
) => {
  let scoped = rows || [];
  if (eventTypes) {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    scoped = scoped.filter((row) => types.includes(row.event_type || 'festival'));
  }
  const withPoster = scoped.filter((row) => String(row.poster_url || '').trim());
  const notEnded = withPoster.filter((row) => {
    const end = normDate(row.end_date || row.start_date);
    return !end || end >= todayStr;
  });
  const upcoming = notEnded
    .filter((row) => normDate(row.start_date) >= todayStr)
    .sort((a, b) => normDate(a.start_date).localeCompare(normDate(b.start_date)));
  const pool = upcoming.length ? upcoming : notEnded;
  return pickLatestPosterRow(pool);
};

const toSlide = (
  row: PosterRow,
  kind: HomeDarkHeroSlide['kind'],
  id: string,
  subtitleKo: string,
  subtitleEn: string,
): HomeDarkHeroSlide => ({
  id,
  kind,
  poster_url: String(row.poster_url || ''),
  title: String(row.title || row.name || '').trim(),
  venue: String(row.venue || row.location_name || row.locationName || '').trim(),
  start_time: String(row.start_time || row.time || '').slice(0, 5) || undefined,
  subtitleKo,
  subtitleEn,
  raw: row,
});

/** 히어로 로테이션: 오늘소셜(2) → 부트캠프(1) → 페스티벌(1) → 파티(1) */
export function buildHomeDarkHeroSlides(
  socialParties: PosterRow[],
  bootcampRows: PosterRow[],
  festivalRows: PosterRow[],
  todayStr: string,
): HomeDarkHeroSlide[] {
  const slides: HomeDarkHeroSlide[] = [];

  (socialParties || [])
    .filter((party) => String(party.poster_url || '').trim() && party.id != null)
    .slice(0, 2)
    .forEach((party) => {
      slides.push(toSlide(party, 'social', `social-${party.id}`, '오늘 소셜', 'Tonight\'s Social'));
    });

  const bootcamp = pickFeaturedEventRow(bootcampRows, todayStr);
  if (bootcamp?.id != null) {
    slides.push(toSlide(bootcamp, 'bootcamp', `bootcamp-${bootcamp.id}`, '부트캠프', 'Bootcamp'));
  }

  const festival = pickFeaturedEventRow(festivalRows, todayStr, ['festival', 'mt']);
  if (festival?.id != null) {
    slides.push(toSlide(festival, 'festival', `festival-${festival.id}`, '페스티벌', 'Festival'));
  }

  const partyEvent = pickFeaturedEventRow(festivalRows, todayStr, 'party');
  if (partyEvent?.id != null) {
    slides.push(toSlide(partyEvent, 'party', `event-party-${partyEvent.id}`, '파티', 'Party'));
  }

  return slides;
}

export const HOME_DARK_HERO_ROTATE_MS = 4500;
