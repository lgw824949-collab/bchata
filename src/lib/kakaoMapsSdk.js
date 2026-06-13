import { getKakaoApiKey } from './kakaoEnv';

let loadPromise = null;

function backupPostcodeNamespace() {
  const kakao = typeof window !== 'undefined' ? window.kakao : null;
  if (!kakao?.Postcode && !kakao?.postcode) return null;
  return {
    Postcode: kakao.Postcode,
    postcode: kakao.postcode,
  };
}

function restorePostcodeNamespace(backup) {
  if (!backup || typeof window === 'undefined') return;
  window.kakao = window.kakao || {};
  if (backup.Postcode) window.kakao.Postcode = backup.Postcode;
  if (backup.postcode) window.kakao.postcode = backup.postcode;
}

function clearKakaoNamespaceForMaps() {
  if (typeof window === 'undefined') return;
  if (window.kakao?.maps) return;
  delete window.kakao;
}

export function loadKakaoMapsSdk() {
  const key = getKakaoApiKey();
  if (!key) return Promise.reject(new Error('Kakao API key missing'));

  if (typeof window !== 'undefined' && window.kakao?.maps) {
    return new Promise((resolve) => {
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    });
  }

  if (loadPromise) return loadPromise;

  const postcodeBackup = backupPostcodeNamespace();
  clearKakaoNamespaceForMaps();

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) {
        loadPromise = null;
        restorePostcodeNamespace(postcodeBackup);
        reject(new Error('Kakao Maps SDK failed to initialize — 카카오맵 API 사용 설정 ON 확인'));
        return;
      }
      restorePostcodeNamespace(postcodeBackup);
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };
    script.onerror = () => {
      loadPromise = null;
      restorePostcodeNamespace(postcodeBackup);
      reject(new Error('Kakao Maps SDK script error — Web 도메인·API 활성화 확인'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
