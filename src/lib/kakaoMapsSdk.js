import { getKakaoApiKey } from './kakaoEnv';

let loadPromise = null;

export function loadKakaoMapsSdk() {
  const key = getKakaoApiKey();
  if (!key) return Promise.reject(new Error('Kakao API key missing'));

  if (typeof window !== 'undefined' && window.kakao?.maps) {
    return new Promise((resolve) => {
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    });
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error('Kakao Maps SDK failed to load'));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };
    script.onerror = () => reject(new Error('Kakao Maps SDK script error'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
