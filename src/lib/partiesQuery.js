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

/** GPS 좌표 → Social BAR·컨시어지 공통 지역 pill */
const USER_REGION_BOXES = [
  { name: '서울', minLat: 37.41, maxLat: 37.70, minLng: 126.76, maxLng: 127.18 },
  { name: '경인', minLat: 37.02, maxLat: 37.78, minLng: 126.28, maxLng: 127.58 },
  { name: '경상도', minLat: 34.65, maxLat: 36.55, minLng: 127.55, maxLng: 129.65 },
  { name: '전라도', minLat: 34.10, maxLat: 36.25, minLng: 125.75, maxLng: 127.55 },
  { name: '충청도', minLat: 35.60, maxLat: 37.45, minLng: 126.50, maxLng: 128.30 },
  { name: '강원/제주', minLat: 33.05, maxLat: 38.45, minLng: 125.95, maxLng: 129.50 },
];

const USER_REGION_CENTROIDS = {
  서울: { lat: 37.5665, lng: 126.978 },
  경인: { lat: 37.32, lng: 126.95 },
  경상도: { lat: 35.18, lng: 129.08 },
  충청도: { lat: 36.35, lng: 127.77 },
  전라도: { lat: 35.82, lng: 127.15 },
  '강원/제주': { lat: 37.75, lng: 128.9 },
};

export function inferUserRegionFromCoords(coords) {
  const la = Number(coords?.lat);
  const ln = Number(coords?.lng ?? coords?.lon);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return '전국';

  for (const box of USER_REGION_BOXES) {
    if (la >= box.minLat && la <= box.maxLat && ln >= box.minLng && ln <= box.maxLng) {
      return box.name;
    }
  }

  let best = '전국';
  let minDist = Infinity;
  Object.entries(USER_REGION_CENTROIDS).forEach(([name, c]) => {
    const d = haversineKm(la, ln, c.lat, c.lng);
    if (d < minDist) {
      minDist = d;
      best = name;
    }
  });
  return best;
}

const USER_REGION_PARTY_ALIASES = {
  서울: ['서울'],
  경인: ['경인', '수도권', '경기', '인천'],
  경상도: ['경상', '경상도', '부산', '대구', '울산', '경남', '경북'],
  전라도: ['전라', '전라도', '광주', '전남', '전북'],
  충청도: ['충청', '충청도', '대전', '세종'],
  '강원/제주': ['강원', '제주', '강원/제주'],
};

/** 컨시어지·BAR: 사용자 GPS 지역과 파티 장소 지역 일치 */
export function partyMatchesUserRegion(party, userRegion) {
  if (!userRegion || userRegion === '전국') return true;
  const partyRegion = inferPartyRegionLabel(party);
  const aliases = USER_REGION_PARTY_ALIASES[userRegion] || [userRegion];
  return aliases.some(
    (a) => partyRegion === a || partyRegion.includes(a) || a.includes(partyRegion),
  );
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

/** 필터 → 동일 지역 우선(원격 지역 제외) → 근거리 정렬 → 상위 N건 */
export function curatePartiesForChat(
  parties,
  { todayStr, genreName, userCoords, coordMap, userRegion, limit = 5 } = {},
) {
  let list = filterPartiesForChat(parties, { todayStr, genreName });
  if (userRegion && userRegion !== '전국') {
    list = list.filter((p) => partyMatchesUserRegion(p, userRegion));
  }
  if (userCoords?.lat != null && userCoords?.lng != null) {
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

/** 운명좌표(사주) — 오늘 이후 승인 파티 (join 실패 시 단독 select) */
export async function fetchUpcomingPartiesForSaju(supabaseClient, { todayStr, limit = 100 } = {}) {
  if (!supabaseClient) {
    return { data: [], error: new Error('Supabase client not configured') };
  }

  const upcomingQuery = (selectCols) =>
    supabaseClient
      .from('parties')
      .select(selectCols)
      .eq('status', 'approved')
      .gte('date', todayStr)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(limit);

  const joined = await upcomingQuery(PARTIES_WITH_LOCATION);
  if (!joined.error) return joined;

  logPartiesFetchError(joined.error);
  return upcomingQuery(PARTIES_SELECT);
}

/** 사주 추천 카드용 — locations join·App parties 필드 통합 */
export function normalizePartyForSajuDisplay(p) {
  if (!p) return null;
  const joined = p.locations;
  const lat = joined?.latitude ?? p.venueLat ?? null;
  const lng = joined?.longitude ?? p.venueLng ?? null;
  return {
    ...p,
    date: normDate(p.date),
    poster_url: p.poster_url ?? p.imageUrl ?? null,
    locations: {
      name: joined?.name ?? p.locationName ?? p.location_name ?? p.studio_name ?? null,
      address: joined?.address ?? p.address ?? '',
      latitude: lat,
      longitude: lng,
    },
  };
}
