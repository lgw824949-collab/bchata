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
  eventType?: string,
) => {
  let scoped = rows || [];
  if (eventType) {
    scoped = scoped.filter((row) => (row.event_type || 'festival') === eventType);
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

/** 히어로: 부트캠프 → 소셜(오늘 파티) → 페스티벌 */
export function buildHomeDarkHeroSlides(
  socialParties: PosterRow[],
  bootcampRows: PosterRow[],
  festivalRows: PosterRow[],
  todayStr: string,
): HomeDarkHeroSlide[] {
  const slides: HomeDarkHeroSlide[] = [];

  const bootcamp = pickFeaturedEventRow(bootcampRows, todayStr);
  if (bootcamp?.id != null) {
    slides.push(toSlide(bootcamp, 'bootcamp', `bootcamp-${bootcamp.id}`, '부트캠프', 'Bootcamp'));
  }

  (socialParties || [])
    .filter((party) => String(party.poster_url || '').trim())
    .forEach((party) => {
      if (party.id == null) return;
      slides.push(toSlide(party, 'party', `party-${party.id}`, '오늘 소셜', 'Tonight\'s Social'));
    });

  const festival = pickFeaturedEventRow(festivalRows, todayStr, 'festival');
  if (festival?.id != null) {
    slides.push(toSlide(festival, 'festival', `festival-${festival.id}`, '페스티벌', 'Festival'));
  }

  return slides;
}
