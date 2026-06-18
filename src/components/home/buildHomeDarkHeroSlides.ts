import type { HomeDarkHeroSlide } from './types';
import { getNextLessonOccurrence, isApprovedVenueLesson } from '../../lib/venueLessonSchedule';

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
  date?: string;
  end_date?: string;
  created_at?: string;
  event_type?: string;
};

const normDate = (value?: string) => String(value || '').slice(0, 10);

const resolvePosterEventDate = (row: PosterRow, todayStr: string) => {
  const direct = normDate(row.start_date || row.date);
  if (direct) return direct;
  if ((row as { is_weekly_recurring?: boolean }).is_weekly_recurring) return todayStr;
  return '';
};

/** 오늘과 가까운 날짜 우선 — 다가오는 행사는 가까운 순, 지난 행사는 최근 순 */
export const compareNearestEventDate = (a: string, b: string, todayStr: string) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const aUpcoming = a >= todayStr;
  const bUpcoming = b >= todayStr;
  if (aUpcoming && bUpcoming) return a.localeCompare(b);
  if (aUpcoming) return -1;
  if (bUpcoming) return 1;
  return b.localeCompare(a);
};

const sortRowsByNearestEventDate = (rows: PosterRow[], todayStr: string) =>
  [...rows].sort((a, b) => compareNearestEventDate(
    resolvePosterEventDate(a, todayStr),
    resolvePosterEventDate(b, todayStr),
    todayStr,
  ));

const sortSlidesByNearestEventDate = (slides: HomeDarkHeroSlide[], todayStr: string) =>
  [...slides].sort((a, b) => compareNearestEventDate(
    resolvePosterEventDate(a.raw as PosterRow, todayStr),
    resolvePosterEventDate(b.raw as PosterRow, todayStr),
    todayStr,
  ));

export function formatHeroDateLabel(
  startDate: string | undefined,
  todayStr: string,
  isEn: boolean,
): string | undefined {
  const d = normDate(startDate);
  if (!d) return undefined;
  if (d === todayStr) return isEn ? 'Today' : '오늘';
  const date = new Date(`${d}T12:00:00`);
  if (Number.isNaN(date.getTime())) return d.slice(5).replace('-', '/');
  const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = isEn ? weekdaysEn[date.getDay()] : weekdaysKo[date.getDay()];
  return isEn ? `${month}/${day} (${weekday})` : `${month}월 ${day}일 (${weekday})`;
}

const pickNearestEventRow = (
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
  const upcoming = notEnded.filter((row) => normDate(row.start_date) >= todayStr);
  const pool = upcoming.length ? upcoming : notEnded;
  return sortRowsByNearestEventDate(pool, todayStr)[0] || null;
};

const toSlide = (
  row: PosterRow,
  kind: HomeDarkHeroSlide['kind'],
  id: string,
  subtitleKo: string,
  subtitleEn: string,
  todayStr: string,
): HomeDarkHeroSlide => ({
  id,
  kind,
  poster_url: String(row.poster_url || ''),
  title: String(row.title || row.name || '').trim(),
  venue: String(row.venue || row.studio_name || row.location_name || row.locationName || '').trim(),
  start_time: String(row.start_time || row.time || '').slice(0, 5) || undefined,
  date_label: formatHeroDateLabel(
    resolvePosterEventDate(row, todayStr),
    todayStr,
    false,
  ),
  subtitleKo,
  subtitleEn,
  raw: row,
});

/** 히어로 로테이션: 소셜·업체수업·부트캠프·페스티벌·파티 후보를 행사일 가까운 순으로 정렬 */
export function buildHomeDarkHeroSlides(
  socialParties: PosterRow[],
  bootcampRows: PosterRow[],
  festivalRows: PosterRow[],
  todayStr: string,
  venueLessonRows: PosterRow[] = [],
): HomeDarkHeroSlide[] {
  const slides: HomeDarkHeroSlide[] = [];

  sortRowsByNearestEventDate(
    (socialParties || []).filter((party) => String(party.poster_url || '').trim() && party.id != null),
    todayStr,
  )
    .slice(0, 2)
    .forEach((party) => {
      slides.push(toSlide(party, 'social', `social-${party.id}`, '오늘 소셜', 'Tonight\'s Social', todayStr));
    });

  const venueLessons = (venueLessonRows || [])
    .filter((row) => isApprovedVenueLesson(row))
    .map((row) => ({
      ...row,
      start_date: getNextLessonOccurrence(row, todayStr) || row.start_date,
    }))
    .filter((row) => {
      const next = normDate(row.start_date);
      return next && next >= todayStr;
    });
  sortRowsByNearestEventDate(venueLessons, todayStr)
    .slice(0, 1)
    .forEach((lesson) => {
      slides.push(toSlide(
        lesson,
        'venueLesson',
        `venue-lesson-${lesson.id}`,
        '업체 수업',
        'Venue class',
        todayStr,
      ));
    });

  const bootcamp = pickNearestEventRow(bootcampRows, todayStr);
  if (bootcamp?.id != null) {
    slides.push(toSlide(bootcamp, 'bootcamp', `bootcamp-${bootcamp.id}`, '부트캠프', 'Bootcamp', todayStr));
  }

  const festival = pickNearestEventRow(festivalRows, todayStr, ['festival', 'mt']);
  if (festival?.id != null) {
    slides.push(toSlide(festival, 'festival', `festival-${festival.id}`, '페스티벌', 'Festival', todayStr));
  }

  const partyEvent = pickNearestEventRow(festivalRows, todayStr, 'party');
  if (partyEvent?.id != null) {
    slides.push(toSlide(partyEvent, 'party', `event-party-${partyEvent.id}`, '파티', 'Party', todayStr));
  }

  return sortSlidesByNearestEventDate(slides, todayStr);
}

export const HOME_DARK_HERO_ROTATE_MS = 4500;
