/** 카카오·복사 링크 — 항상 공개 HTTPS 도메인 (카카오 Product Link 등록 도메인과 일치) */
export const PUBLIC_APP_ORIGIN = String(
  import.meta.env.VITE_PUBLIC_APP_URL || 'https://bchata.vercel.app',
)
  .trim()
  .replace(/\/$/, '');

/** 카카오 제품 링크 > 웹 도메인에 등록한 호스트와 반드시 일치 */
export const KAKAO_SHARE_HOST = (() => {
  try {
    return new URL(PUBLIC_APP_ORIGIN).hostname;
  } catch {
    return 'bchata.vercel.app';
  }
})();

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

/** 카카오톡 공유용 — 등록된 호스트만 사용 (미등록 도메인이면 링크·버튼 비활성) */
export function resolveKakaoShareUrl(linkUrl, partyId) {
  const url = resolvePublicShareUrl(linkUrl, partyId);
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' && u.hostname === KAKAO_SHARE_HOST) {
      return u.toString();
    }
  } catch {
    /* fall through */
  }
  return buildPartyShareUrl(partyId);
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
