import { getKakaoApiKey } from './kakaoEnv';
import { resolvePublicShareUrl, toPublicAbsoluteUrl } from './shareLinks';

/** 카톡 공유 — Kakao SDK 피드 + 포스터 이미지 */
export const KAKAO_BRAND = '오늘밤빠';
export const SHARE_BUILD = '20260517c';

const SHARE_MESSAGE_FOOTER = '👆 링크 클릭 후 확인하세요!';

const kakaoLink = (url) => ({
  mobileWebUrl: url,
  webUrl: url,
});

/** @returns {Promise<boolean>} */
export const sharePartyToKakao = async ({ title, description, posterUrl, imageUrl, linkUrl, partyId }) => {
  if (!window.Kakao) {
    window.alert('카카오 공유를 불러오지 못했습니다. 페이지를 새로고침 후 다시 시도해 주세요.');
    return false;
  }

  const kakaoAppKey = getKakaoApiKey();
  if (!kakaoAppKey) {
    window.alert(
      '카카오 JavaScript 키가 없습니다.\n' +
        'VITE_KAKAO_API_KEY 를 .env / Vercel에 설정해 주세요.'
    );
    return false;
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(kakaoAppKey);
  }

  const url = resolvePublicShareUrl(linkUrl, partyId);
  const image = toPublicAbsoluteUrl(posterUrl || imageUrl);
  const desc = (description || '').replace(/\n/g, ' · ').replace(/\s*\|\s*/g, ' · ').trim();
  const descWithFooter = desc ? `${desc} · ${SHARE_MESSAGE_FOOTER}` : SHARE_MESSAGE_FOOTER;

  if (!image) {
    window.alert('포스터 이미지가 없어 카카오 공유를 할 수 없습니다.');
    return false;
  }

  if (!/^https:\/\//i.test(image)) {
    window.alert('포스터 이미지는 HTTPS 주소여야 카카오 공유가 됩니다.');
    return false;
  }

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: title || KAKAO_BRAND,
      description: descWithFooter,
      imageUrl: image,
      imageWidth: 800,
      imageHeight: 1200,
      link: kakaoLink(url),
    },
    buttonTitle: '오늘밤빠에서 확인하기',
    buttons: [
      {
        title: '오늘밤빠에서 확인하기',
        link: kakaoLink(url),
      },
    ],
  });

  return true;
};
