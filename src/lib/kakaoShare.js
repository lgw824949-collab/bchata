/** 카톡 공유 — SDK 피드(바자회 APP 이름) 사용 안 함, 오늘밤빠 문구로 직접 공유 */
export const KAKAO_BRAND = '오늘밤빠';
export const SHARE_BUILD = '20260516b';

const homeUrl = () => `${window.location.origin}/`;

const brandTitle = (title) =>
  title?.includes(KAKAO_BRAND) ? title : `${KAKAO_BRAND} | ${title || '라틴·소셜 파티'}`;

/** @returns {Promise<boolean>} */
export const sharePartyToKakao = async ({ title, description, posterUrl, linkUrl = homeUrl() }) => {
  const fullTitle = brandTitle(title);
  const text = [fullTitle, description, linkUrl].filter(Boolean).join('\n');

  if (navigator.share) {
    try {
      const payload = {
        title: fullTitle,
        text: [description, linkUrl].filter(Boolean).join('\n'),
        url: linkUrl,
      };
      if (posterUrl && navigator.canShare) {
        try {
          const res = await fetch(posterUrl);
          const blob = await res.blob();
          const ext = blob.type?.includes('png') ? 'png' : 'jpg';
          const file = new File([blob], `poster.${ext}`, { type: blob.type || 'image/jpeg' });
          const withFile = { ...payload, files: [file] };
          if (navigator.canShare(withFile)) {
            await navigator.share(withFile);
            return true;
          }
        } catch (_) {
          /* 포스터 첨부 실패 시 텍스트만 */
        }
      }
      await navigator.share(payload);
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return true;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    window.alert('복사됐습니다. 카톡 채팅에 붙여 넣어 주세요.');
    return true;
  } catch {
    window.prompt('아래 내용을 복사해 카톡에 보내주세요:', text);
    return true;
  }
};
