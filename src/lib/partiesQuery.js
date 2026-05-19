import { normDate, isApprovedParty } from './dateNorm';
import {
  DISTANCE_SORT_FALLBACK,
  formatDistanceLabel,
  haversineKm,
  sortByDistanceFromUser,
} from './geoDistance';

/**
 * public.parties — verified against Supabase.
 * DB columns only (no broadRegion, region, imageUrl in DB).
 */
export const PARTIES_SELECT =
  'id, title, title_en, day_of_week, date, time, location_id, poster_url, description, address, fee, s_ratio, b_ratio, j_ratio, k_ratio, status, contributor_id, click_count, view_count, created_at';

export const PARTIES_WITH_LOCATION =
  `${PARTIES_SELECT}, locations!location_id(name, address, latitude, longitude)`;

export function logPartiesFetchError(error) {
  if (!error) return;
  console.error('Parties Fetch Error:', error.message, error.details);
}

/** poster_url → UI용 imageUrl (단건·배열 모두 지원) */
export function withPartyImageAlias(data) {
  if (data == null) return data;
  if (Array.isArray(data)) return data.map((row) => withPartyImageAlias(row));
  if (typeof data !== 'object') return data;
  return {
    ...data,
    imageUrl: data.poster_url ?? data.imageUrl ?? null,
  };
}

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const PLATFORM_NAME_RE = /오늘밤빠|밤빠|bamppa|tonightbamppa/i;

export const CHAT_GENRE_BY_NUM = {
  '1': '바차타',
  '2': '살사',
  '3': '쥬크',
  '4': '키좀바',
};

const PARTY_RATIO_KEY = {
  바차타: 'b_ratio',
  살사: 's_ratio',
  쥬크: 'j_ratio',
  키좀바: 'k_ratio',
};

const GENRE_TITLE_HINTS = {
  바차타: ['바차타', 'bachata', 'bach'],
  살사: ['살사', 'salsa'],
  쥬크: ['쥬크', 'zouk'],
  키좀바: ['키좀바', 'kizomba', 'kiz'],
};

/** locations.id → name 맵 (App·ChatBot 공통) */
export function buildLocationNameMap(locations) {
  return (locations || []).reduce((acc, loc) => {
    if (loc?.id != null) acc[loc.id] = loc.name;
    return acc;
  }, {});
}

/** locations.id → { lat, lng } (유효 좌표만) */
export function buildLocationCoordMap(locations) {
  return (locations || []).reduce((acc, loc) => {
    if (loc?.id == null) return acc;
    const lat = parseFloat(loc.latitude);
    const lng = parseFloat(loc.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      acc[loc.id] = { lat, lng };
    }
    return acc;
  }, {});
}

/** Join·locations 맵에서 BAR 좌표 해석 */
export function resolvePartyCoords(p, coordMap = {}) {
  const joined = p?.locations;
  if (joined) {
    const lat = parseFloat(joined.latitude);
    const lng = parseFloat(joined.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  const mapped = coordMap[p?.location_id];
  if (mapped) return mapped;
  return null;
}

export function getPartyDistanceKm(p, userCoords, coordMap = {}) {
  if (!userCoords?.lat || !userCoords?.lng) return null;
  const venue = resolvePartyCoords(p, coordMap);
  if (!venue) return null;
  return haversineKm(userCoords.lat, userCoords.lng, venue.lat, venue.lng);
}

/** 근거리 순 정렬 (좌표 없는 항목은 목록 하단) */
export function sortPartiesByProximity(parties, userCoords, coordMap = {}) {
  return sortByDistanceFromUser(parties, userCoords, (p) => resolvePartyCoords(p, coordMap));
}

export function attachPartyDistances(parties, userCoords, coordMap = {}) {
  if (!userCoords?.lat || !userCoords?.lng) return parties || [];
  return (parties || []).map((p) => {
    const km = getPartyDistanceKm(p, userCoords, coordMap);
    return km != null ? { ...p, _distanceKm: km } : p;
  });
}

/** Join·맵·기존 필드 순으로 실제 BAR(업체)명 해석 */
export function resolvePartyVenueName(p, locationMap = {}) {
  const joined = p?.locations?.name;
  if (joined && !PLATFORM_NAME_RE.test(joined)) {
    return String(joined).trim();
  }

  const mapped = locationMap[p?.location_id];
  if (mapped && !PLATFORM_NAME_RE.test(mapped)) {
    return String(mapped).trim();
  }

  const legacy = p?.locationName || p?.location_name || p?.studio_name;
  if (legacy && !PLATFORM_NAME_RE.test(legacy)) {
    return String(legacy).trim();
  }

  return '장소 미정';
}

export function stripPlatformSuffixFromTitle(title) {
  return (
    String(title || '')
      .replace(/^\[.*?\]\s*/, '')
      .replace(/\s*ㅣ\s*오늘밤빠\s*$/i, '')
      .replace(/\s*\|\s*오늘밤빠\s*$/i, '')
      .replace(/\s*ㅣ\s*밤빠\s*$/i, '')
      .trim() || '파티'
  );
}

/** YYYY-MM-DD (요일) — KST 달력 날짜 기준 */
export function formatPartyDateWithWeekday(date) {
  const day = normDate(date);
  if (!day) return '일정 미정';
  const [y, mo, d] = day.split('-').map(Number);
  if (!y || !mo || !d) return day;
  const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return `${day} (${KOREAN_WEEKDAYS[weekday]})`;
}

export function enrichPartyRow(p, locationMap = {}) {
  const row = withPartyImageAlias(p);
  return {
    ...row,
    locationName: resolvePartyVenueName(row, locationMap),
  };
}

export function enrichPartiesWithVenues(parties, locations) {
  const locationMap = buildLocationNameMap(locations);
  const coordMap = buildLocationCoordMap(locations);
  return (parties || []).map((p) => {
    const row = enrichPartyRow(p, locationMap);
    const coords = resolvePartyCoords(row, coordMap);
    return coords ? { ...row, venueLat: coords.lat, venueLng: coords.lng } : row;
  });
}

/** 오늘의 파티 카운터와 동일: 달력 오늘만 */
export function isPartyOnCalendarToday(p, todayStr) {
  return normDate(p?.date) === todayStr;
}

/** 선택 장르가 비율·제목 기준으로 실제 매칭되는지 (지배 장르 우선) */
export function partyMatchesGenre(p, genreName) {
  const key = PARTY_RATIO_KEY[genreName];
  if (!key) return false;

  const ratios = {
    b_ratio: Number(p.b_ratio) || 0,
    s_ratio: Number(p.s_ratio) || 0,
    j_ratio: Number(p.j_ratio) || 0,
    k_ratio: Number(p.k_ratio) || 0,
  };
  const selected = ratios[key];
  const max = Math.max(ratios.b_ratio, ratios.s_ratio, ratios.j_ratio, ratios.k_ratio);

  if (selected > 0 && selected === max) return true;

  const hay = `${p.title || ''} ${p.description || ''}`.toLowerCase();
  return (GENRE_TITLE_HINTS[genreName] || [genreName]).some((hint) =>
    hay.includes(hint.toLowerCase()),
  );
}

export function inferPartyRegionLabel(p) {
  const combined = `${p.title || ''} ${p.address || ''} ${p.locationName || ''}`;
  if (/서울|강남|홍대|잠실|건대|신림|서초|영등포|성수/.test(combined)) return '서울';
  if (/경기|인천|수원|부천|분당|일산|안양|의정부|경인/.test(combined)) return '수도권';
  if (/부산|대구|울산|경상|창원|포항|경남|경북/.test(combined)) return '경상';
  if (/광주|전라|전남|전북|전주|목포|여수/.test(combined)) return '전라';
  if (/대전|충청|충남|충북|세종|천안|청주/.test(combined)) return '충청';
  if (/강원|제주|춘천|원주/.test(combined)) return '강원/제주';
  const bracket = combined.match(/\[([^\]]+)\]/);
  if (bracket) return bracket[1].replace(/도$/, '').trim();
  return '전국';
}

export function formatPartyFeeLabel(fee) {
  if (fee == null || fee === '') return '문의';
  const raw = String(fee).trim();
  const digits = raw.replace(/[^\d]/g, '');
  if (digits) return `${Number(digits).toLocaleString('ko-KR')}원`;
  return raw.includes('원') ? raw : `${raw}원`;
}

/** 컨시어지 말풍선용 (마크다운 **볼드** — ChatBot에서 파싱) */
export function formatPartyResultBlock(p, { showDistance = false } = {}) {
  const venue = resolvePartyVenueName(p);
  const title = stripPlatformSuffixFromTitle(p.title);
  const dateLine = formatPartyDateWithWeekday(p.date);
  const fee = formatPartyFeeLabel(p.fee);
  const distLine =
    showDistance && p._distanceKm != null && p._distanceKm < DISTANCE_SORT_FALLBACK
      ? `\n📍 ${formatDistanceLabel(p._distanceKm)}`
      : '';
  return `🎵 **${venue}** ${title}\n📅 시작: ${dateLine}\n💰 비용: ${fee}${distLine}`;
}

/** 필터 → 근거리 정렬 → 상위 N건 (콘시어지 큐레이션) */
export function curatePartiesForChat(parties, { todayStr, genreName, userCoords, coordMap, limit = 5 } = {}) {
  let list = filterPartiesForChat(parties, { todayStr, genreName });
  if (userCoords?.lat && userCoords?.lng) {
    list = sortPartiesByProximity(list, userCoords, coordMap);
    list = attachPartyDistances(list, userCoords, coordMap);
  }
  return list.slice(0, limit);
}

export function filterPartiesForChat(parties, { todayStr, genreName } = {}) {
  return (parties || [])
    .filter(isApprovedParty)
    .filter((p) => !todayStr || isPartyOnCalendarToday(p, todayStr))
    .filter((p) => !genreName || partyMatchesGenre(p, genreName));
}

/** Join 실패 시 PARTIES_SELECT 단독 조회 */
export async function fetchPartiesForChat(supabase, { todayStr, limit = 50 } = {}) {
  const baseQuery = () =>
    supabase
      .from('parties')
      .select(PARTIES_SELECT)
      .eq('status', 'approved')
      .eq('date', todayStr)
      .order('time', { ascending: true })
      .limit(limit);

  const joinQuery = () =>
    supabase
      .from('parties')
      .select(PARTIES_WITH_LOCATION)
      .eq('status', 'approved')
      .eq('date', todayStr)
      .order('time', { ascending: true })
      .limit(limit);

  const joined = await joinQuery();
  if (!joined.error) return joined;

  logPartiesFetchError(joined.error);
  return baseQuery();
}
