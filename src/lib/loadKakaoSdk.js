let kakaoLoadPromise = null;

/** Kakao JS SDK — 공유 시점에만 로드 (초기 HTML 파싱 차단 제거) */
export function ensureKakaoSdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Kakao SDK is browser-only'));
  }
  if (window.Kakao) return Promise.resolve(window.Kakao);

  if (!kakaoLoadPromise) {
    kakaoLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-bchata-kakao-sdk]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Kakao));
        existing.addEventListener('error', () => reject(new Error('Kakao SDK load failed')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      script.async = true;
      script.defer = true;
      script.dataset.bchataKakaoSdk = '1';
      script.onload = () => resolve(window.Kakao);
      script.onerror = () => reject(new Error('Kakao SDK load failed'));
      document.head.appendChild(script);
    }).catch((err) => {
      kakaoLoadPromise = null;
      throw err;
    });
  }

  return kakaoLoadPromise;
}
