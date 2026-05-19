import { normDate, isApprovedParty } from './dateNorm';

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
  return (GENRE_TITLE_HINTS[genreName] || [genreName]).some((hint) => hay.includes(hint.toLowerCase()));
}

export function inferPartyRegionLabel(p) {
  const combined = `${p.title || ''} ${p.address || ''}`;
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
  return raw;
}

/** 컨시어지 말풍선용 (마크다운 **볼드** — ChatBot에서 파싱) */
export function formatPartyResultBlock(p) {
  const region = inferPartyRegionLabel(p);
  const title = (p.title || '파티').replace(/^\[.*?\]\s*/, '').trim();
  const date = normDate(p.date);
  const fee = formatPartyFeeLabel(p.fee);
  return `🎵 **${region}** ${title}\n📅 날짜: ${date}\n💰 입장료: ${fee}`;
}

export function filterPartiesForChat(parties, { todayStr, genreName } = {}) {
  return (parties || [])
    .filter(isApprovedParty)
    .filter((p) => !todayStr || isPartyOnCalendarToday(p, todayStr))
    .filter((p) => !genreName || partyMatchesGenre(p, genreName));
}
