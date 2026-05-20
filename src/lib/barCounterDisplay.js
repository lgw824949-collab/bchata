import { getKSTCalendarTodayStr } from './dateNorm';

export const LIVE_HOT_THRESHOLD = 5;

/**
 * @returns {{ mode: 'live_hot'|'warming', line: string }}
 */
export function buildBarCounterDisplay({ liveCount = 0, clickCount = 0 } = {}) {
  const live = Math.max(0, Number(liveCount) || 0);
  const clicks = Math.max(0, Number(clickCount) || 0);

  if (live >= LIVE_HOT_THRESHOLD) {
    return {
      mode: 'live_hot',
      line: `🔥 라이브 ${live}명!`,
    };
  }

  return {
    mode: 'warming',
    line: `view ${clicks}명`,
  };
}

/** BAR 상세 — FeaturedPartyCard용 카피 */
export function buildVenuePartyLiveBadge({ liveCount = 0, clickCount = 0 } = {}) {
  const live = Math.max(0, Number(liveCount) || 0);
  const clicks = Math.max(0, Number(clickCount) || 0);

  if (live >= LIVE_HOT_THRESHOLD) {
    return {
      mode: 'live_hot',
      line: `🔥 LIVE ${live}명 댄싱 중!`,
    };
  }

  return {
    mode: 'warming',
    line: `view 오늘 ${clicks}명`,
  };
}

export function shouldShowVenuePartyLiveBadge({ liveCount = 0, clickCount = 0 } = {}) {
  return shouldShowBarCounter({ liveCount, clickCount });
}

/** 카운트 표시 여부 (둘 다 0이면 숨김) */
export function shouldShowBarCounter({ liveCount = 0, clickCount = 0 } = {}) {
  const live = Math.max(0, Number(liveCount) || 0);
  const clicks = Math.max(0, Number(clickCount) || 0);
  return live >= LIVE_HOT_THRESHOLD || clicks > 0;
}

/** locations 행·집계 맵 키 (id 우선, 없으면 이름) */
export function getBarStatsKey(bar) {
  if (bar?.id != null && !String(bar.id).startsWith('bar-')) {
    return `id:${bar.id}`;
  }
  return `name:${String(bar?.name || '')
    .trim()
    .toLowerCase()}`;
}

export function normalizeBarNameKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/** KST 당일 00:00 ISO (체크인·클릭 집계용) */
export function getKSTTodayStartISO() {
  const day = getKSTCalendarTodayStr();
  return `${day}T00:00:00+09:00`;
}
