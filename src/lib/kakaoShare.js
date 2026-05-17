/** 카톡 공유 — Kakao SDK 피드 + 포스터 이미지 */
export const KAKAO_BRAND = '오늘밤빠';
export const SHARE_BUILD = '20260516b';

const SHARE_LINK = 'https://bchata.vercel.app';

const toAbsoluteImageUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${window.location.origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

const getKakaoJsKey = () =>
  import.meta.env.VITE_KAKAO_API_KEY || import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY || '';

/** @returns {Promise<boolean>} */
export const sharePartyToKakao = async ({ title, description, posterUrl, imageUrl, linkUrl }) => {
  if (!window.Kakao) {
    window.alert('카카오 공유를 불러오지 못했습니다. 페이지를 새로고침 후 다시 시도해 주세요.');
    return false;
  }

  const kakaoAppKey = getKakaoJsKey();
  if (!kakaoAppKey) {
    window.alert(
      '카카오 JavaScript 키가 없습니다.\n' +
        'developers.kakao.com → 앱 → JavaScript 키를 VITE_KAKAO_API_KEY 로 Vercel/.env에 넣어 주세요.\n' +
        '(REST API 키는 공유에 쓸 수 없습니다.)'
    );
    return false;
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(kakaoAppKey);
  }

  const image = toAbsoluteImageUrl(posterUrl || imageUrl);
  const url = linkUrl || SHARE_LINK;
  const desc = (description || '').replace(/\n/g, ' · ').replace(/\s*\|\s*/g, ' · ').trim();

  if (!image) {
    window.alert('포스터 이미지가 없어 카카오 공유를 할 수 없습니다.');
    return false;
  }

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: title || KAKAO_BRAND,
      description: desc,
      imageUrl: image,
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
