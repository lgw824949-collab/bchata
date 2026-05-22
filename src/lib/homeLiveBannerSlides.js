import { formatPartyTitleDisplay } from './partyTitleDisplay';
import {
  enrichPartyBroadRegion,
  isPartyMetro,
  isPartyNational,
  isPartySeoul,
} from './partyBroadRegion';

/** 포스터 등록 후 — 시작 10분 전부터 LIVE 바 노출 */
export const LIVE_BANNER_LEAD_MS = 10 * 60 * 1000;
/** 시작 후 노출 유지 (8시간) */
export const LIVE_BANNER_TAIL_MS = 8 * 60 * 60 * 1000;

const padTime = (raw) => {
  const s = String(raw || '20:00').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '20:00';
  return `${String(m[1]).padStart(2, '0')}:${m[2]}`;
};

export const getPartyStartMs = (party) => {
  const dateStr = String(party?.date || '').slice(0, 10);
  if (!dateStr) return 0;
  const t = padTime(party?.time);
  const ms = new Date(`${dateStr}T${t}:00+09:00`).getTime();
  return Number.isFinite(ms) ? ms : 0;
};

/** 시작 10분 전 ~ 시작 후 8시간 */
export const isPartyInLiveBannerWindow = (party, nowMs = Date.now()) => {
  const start = getPartyStartMs(party);
  if (!start) return true;
  return nowMs >= start - LIVE_BANNER_LEAD_MS && nowMs < start + LIVE_BANNER_TAIL_MS;
};

export const sortPartiesByStartTime = (parties) =>
  [...(parties || [])].sort((a, b) => getPartyStartMs(a) - getPartyStartMs(b));

const formatHeadcount = (party, isEn) => {
  const n = Number(party?.view_count) || 0;
  return isEn ? `${n}` : `${n}명`;
};

const formatPartySlideLine = (party, isEn) => {
  const title = formatPartyTitleDisplay(party?.title) || (isEn ? 'Party' : '파티');
  const venue = String(party?.location_name || '').trim();
  const time = padTime(party?.time);
  const people = formatHeadcount(party, isEn);
  if (isEn) {
    return venue
      ? `${time} · ${title} · ${venue} · ${people}`
      : `${time} · ${title} · ${people}`;
  }
  return venue ? `${time} · ${title} · ${venue} · ${people}` : `${time} · ${title} · ${people}`;
};

/**
 * LIVE 바 슬라이드 — 지역 우선(서울 → 수도권 → 지방), BAR 연맹명 대신 파티 제목·인원
 * @param {object} params
 * @param {{ seoul: number, metro: number, national: number }} params.regionCounts
 * @param {object[]} params.withPosterParties
 * @param {number} params.rotateOffset — (legacy, unused in region queue)
 * @param {boolean} params.isEn
 */
export function buildHomeLiveBannerSlides({
  regionCounts,
  withPosterParties,
  rotateOffset: _rotateOffset = 0,
  isEn = false,
  skipLiveWindow = false,
}) {
  const now = Date.now();
  const pool = (withPosterParties || [])
    .map(enrichPartyBroadRegion)
    .filter((p) => String(p.poster_url || p.imageUrl || '').trim())
    .filter((p) => skipLiveWindow || isPartyInLiveBannerWindow(p, now));

  const seoul = sortPartiesByStartTime(pool.filter(isPartySeoul));
  const metro = sortPartiesByStartTime(pool.filter(isPartyMetro));
  const national = sortPartiesByStartTime(pool.filter(isPartyNational));

  const slides = [];

  const seoulCount = Number(regionCounts?.seoul) || 0;
  const metroCount = Number(regionCounts?.metro) || 0;
  const nationalCount = Number(regionCounts?.national) || 0;
  const regionTotal = seoulCount + metroCount + nationalCount;
  if (regionTotal > 0) {
    slides.push({
      id: 'today-region-counts',
      text: isEn
        ? `Today · Seoul ${seoulCount} · Metro ${metroCount} · Regions ${nationalCount}`
        : `오늘 · 서울 ${seoulCount} · 수도권 ${metroCount} · 지방권 ${nationalCount}`,
      tier: 'summary',
    });
  }

  if (seoul.length) {
    slides.push({
      id: 'head-seoul',
      text: isEn ? `Today · Seoul ${seoul.length}` : `오늘 서울 ${seoul.length}건`,
      tier: 'region-head',
    });
    seoul.forEach((party, i) => {
      slides.push({
        id: `seoul-party-${party.id}-${i}`,
        text: formatPartySlideLine(party, isEn),
        tier: 'fixed',
        party,
      });
    });
  }

  if (metro.length) {
    slides.push({
      id: 'head-metro',
      text: isEn ? `Metro ${metro.length}` : `수도권 ${metro.length}건`,
      tier: 'region-head',
    });
    metro.forEach((party, i) => {
      slides.push({
        id: `metro-party-${party.id}-${i}`,
        text: formatPartySlideLine(party, isEn),
        tier: 'fixed',
        party,
      });
    });
  }

  if (national.length) {
    slides.push({
      id: 'head-national',
      text: isEn ? `Regions ${national.length}` : `지방권 ${national.length}건`,
      tier: 'region-head',
    });
    national.forEach((party, i) => {
      slides.push({
        id: `national-party-${party.id}-${i}`,
        text: formatPartySlideLine(party, isEn),
        tier: 'fixed',
        party,
      });
    });
  }

  const pick = seoul[0] || metro[0] || national[0] || null;

  return { slides, pick };
}

/** @deprecated 지역 큐 방식으로 대체됨 */
export const LIVE_BANNER_TOP_FIXED = 5;
export const LIVE_BANNER_ROTATE_SLOTS = 3;

export function rankPartiesForLiveBanner(parties) {
  return sortPartiesByStartTime(parties);
}

export function pickLiveBannerRotatingItems(rest, rotateOffset = 0, slotCount = LIVE_BANNER_ROTATE_SLOTS) {
  if (!rest?.length) return [];
  const n = rest.length;
  const slots = Math.min(slotCount, n);
  if (n <= slotCount) return rest.slice(0, slots);
  const start = ((Number(rotateOffset) || 0) % n + n) % n;
  const out = [];
  for (let i = 0; i < slotCount; i++) {
    out.push(rest[(start + i) % n]);
  }
  return out;
}
