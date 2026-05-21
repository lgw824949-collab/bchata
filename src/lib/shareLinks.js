/** 카카오·복사 링크 — 항상 공개 HTTPS 도메인 (카카오 Product Link 등록 도메인과 일치) */
export const PUBLIC_APP_ORIGIN = String(
  import.meta.env.VITE_PUBLIC_APP_URL || 'https://bchata.vercel.app',
)
  .trim()
  .replace(/\/$/, '');

export function buildPartyShareUrl(partyId) {
  if (partyId == null || partyId === '') return `${PUBLIC_APP_ORIGIN}/`;
  return `${PUBLIC_APP_ORIGIN}/?party=${encodeURIComponent(String(partyId))}&open=true`;
}

/** localhost·http 링크를 공개 앱 URL로 치환 (카카오톡에서 링크·버튼 활성화) */
export function resolvePublicShareUrl(linkUrl, partyId) {
  if (partyId != null && partyId !== '') return buildPartyShareUrl(partyId);

  const fallback = `${PUBLIC_APP_ORIGIN}/`;
  const raw = String(linkUrl || fallback).trim();
  if (!raw) return fallback;

  try {
    const u = new URL(raw);
    const isLocal =
      /^(localhost|127\.0\.0\.1)$/i.test(u.hostname) || u.protocol !== 'https:';
    if (isLocal) {
      const pathQuery = `${u.pathname || '/'}${u.search || ''}`;
      return pathQuery === '/' ? fallback : `${PUBLIC_APP_ORIGIN}${pathQuery}`;
    }
    return raw;
  } catch {
    return fallback;
  }
}

export function toPublicAbsoluteUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (/^(localhost|127\.0\.0\.1)$/i.test(u.hostname)) {
        return `${PUBLIC_APP_ORIGIN}${u.pathname}${u.search}`;
      }
    } catch {
      /* keep original */
    }
    return trimmed;
  }
  return `${PUBLIC_APP_ORIGIN}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}
