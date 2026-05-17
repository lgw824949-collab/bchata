/** 카톡 공유 — Kakao SDK 피드 + 포스터 이미지 */
export const KAKAO_BRAND = '오늘밤빠';
export const SHARE_BUILD = '20260516b';

const SHARE_LINK = 'https://bchata.vercel.app';

/** @returns {Promise<boolean>} */
export const sharePartyToKakao = async ({ title, description, posterUrl, imageUrl }) => {
  if (!window.Kakao) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(import.meta.env.VITE_KAKAO_API_KEY);
  }

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description: description || '',
      imageUrl: posterUrl || imageUrl,
      link: {
        mobileWebUrl: SHARE_LINK,
        webUrl: SHARE_LINK,
      },
    },
  });

  return true;
};
