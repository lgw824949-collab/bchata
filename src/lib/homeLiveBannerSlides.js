/** 메인 홈 LIVE 바 — 1차 지역 집계, 2차 1~5위 고정 + 6~8위 로테이션 */
export const LIVE_BANNER_TOP_FIXED = 5;
export const LIVE_BANNER_ROTATE_SLOTS = 3;

export function rankPartiesForLiveBanner(parties) {
  return [...(parties || [])].sort((a, b) => {
    const views = (Number(b.view_count) || 0) - (Number(a.view_count) || 0);
    if (views !== 0) return views;
    const clicks = (Number(b.click_count) || 0) - (Number(a.click_count) || 0);
    if (clicks !== 0) return clicks;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
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

/**
 * @param {object} params
 * @param {{ seoul: number, metro: number, national: number }} params.regionCounts
 * @param {object[]} params.withPosterParties
 * @param {(party: object) => string} params.formatBarLine
 * @param {number} params.rotateOffset
 * @param {boolean} params.isEn
 */
export function buildHomeLiveBannerSlides({
  regionCounts,
  withPosterParties,
  formatBarLine,
  rotateOffset = 0,
  isEn = false,
}) {
  const seoulCount = Number(regionCounts?.seoul) || 0;
  const metroCount = Number(regionCounts?.metro) || 0;
  const localCount = Number(regionCounts?.national) || 0;
  const total = seoulCount + metroCount + localCount;

  const slide1Text = isEn
    ? `Today ${total} parties · Seoul ${seoulCount} · Metro ${metroCount} · Regions ${localCount}`
    : `오늘 파티 ${total}건 · 서울 ${seoulCount} · 수도권 ${metroCount} · 지방 ${localCount}`;

  const slides = [{ id: 'summary', text: slide1Text, tier: 'summary' }];

  const ranked = rankPartiesForLiveBanner(withPosterParties);
  const top5 = ranked.slice(0, LIVE_BANNER_TOP_FIXED);
  const rest = ranked.slice(LIVE_BANNER_TOP_FIXED);

  top5.forEach((party, i) => {
    slides.push({
      id: `live-bar-top-${party.id}-${i}`,
      text: formatBarLine(party),
      tier: 'fixed',
    });
  });

  if (rest.length > 0) {
    pickLiveBannerRotatingItems(rest, rotateOffset, LIVE_BANNER_ROTATE_SLOTS).forEach((party, i) => {
      slides.push({
        id: `live-bar-rot-${rotateOffset}-${party.id}-${i}`,
        text: formatBarLine(party),
        tier: 'rotate',
      });
    });
  } else if (!top5.length) {
    slides.push({
      id: 'live-bar-empty',
      text: isEn ? 'No BAR posters registered today' : '오늘 포스터 등록 BAR 없음 · 체크인 0명',
      tier: 'fixed',
    });
  }

  return {
    slides,
    pick: ranked[0] || null,
  };
}
