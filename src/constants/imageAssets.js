/** Local fallbacks — never use external placeholder hosts (ERR_FAILED in console). */
export const DEFAULT_CARD_IMAGE = '/assets/default-card.png';
export const DEFAULT_AVATAR_IMAGE = '/assets/default-avatar.png';

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
