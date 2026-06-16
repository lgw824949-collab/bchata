/** Local fallbacks — never use external placeholder hosts (ERR_FAILED in console). */
export const DEFAULT_CARD_IMAGE = '/assets/default-card.png';
export const DEFAULT_AVATAR_IMAGE = '/assets/default-avatar.png';

/** Explore·히어로 썸네일에서 제외할 브랜딩/플레이스홀더 URL */
const GENERIC_EXPLORE_POSTER_RE = /default-card\.png|default-avatar|tonightbamppa|오늘밤|\/logo\.png|home-gate-party/i;

export function isGenericExplorePosterUrl(url) {
  const value = String(url || '').trim();
  if (!value) return true;
  return GENERIC_EXPLORE_POSTER_RE.test(value);
}

export function imgFallbackHandler(fallback = DEFAULT_CARD_IMAGE) {
  return (event) => {
    const img = event.currentTarget;
    if (img.dataset.bchataFallback === '1') {
      img.style.visibility = 'hidden';
      return;
    }
    img.dataset.bchataFallback = '1';
    img.src = fallback;
  };
}
