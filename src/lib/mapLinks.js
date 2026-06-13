/** 외부 지도 열기 — 한국어 기본 카카오맵, 영어 UI는 구글맵 */
export function buildMapSearchUrl(query, { useGoogle = false } = {}) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return null;
  const encoded = encodeURIComponent(trimmed);
  if (useGoogle) {
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  }
  return `https://map.kakao.com/link/search/${encoded}`;
}

export function buildMapUrl({ query, lat, lng, useGoogle = false } = {}) {
  if (useGoogle) {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
    }
    return buildMapSearchUrl(query, { useGoogle: true });
  }
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://map.kakao.com/link/map/${lat},${lng}`;
  }
  return buildMapSearchUrl(query, { useGoogle: false });
}

export function openExternalMap(target, options = {}) {
  const url = typeof target === 'string'
    ? buildMapSearchUrl(target, options)
    : buildMapUrl({ ...target, ...options });
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
