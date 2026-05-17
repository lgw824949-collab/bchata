/** 카톡 공유 — Kakao SDK 피드 + 포스터 이미지 */
export const KAKAO_BRAND = '오늘밤빠';
export const SHARE_BUILD = '20260516b';

const homeUrl = () => `${window.location.origin}/`;

const brandTitle = (title) =>
  title?.includes(KAKAO_BRAND) ? title : `${KAKAO_BRAND} | ${title || '라틴·소셜 파티'}`;

/** @returns {Promise<boolean>} */
export const sharePartyToKakao = async ({ title, description, posterUrl, linkUrl = homeUrl() }) => {
  if (!window.Kakao) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(import.meta.env.VITE_KAKAO_API_KEY);
  }

  const url = linkUrl || homeUrl();
  const fullTitle = brandTitle(title);

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: fullTitle,
      description: description || '',
      imageUrl: posterUrl,
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
    },
    buttons: [
      {
        title: '파티 보러가기',
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
    ],
  });

  return true;
};
