import { getKakaoApiKey } from './kakaoEnv';

let loadPromise = null;
let kakaoMapsBlocked = false;

export function isKakaoMapsSdkBlocked() {
  return kakaoMapsBlocked;
}

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
  if (kakaoMapsBlocked) {
    return Promise.reject(new Error('disabled OPEN_MAP_AND_LOCAL service'));
  }

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
        kakaoMapsBlocked = true;
        restorePostcodeNamespace(postcodeBackup);
        reject(new Error('disabled OPEN_MAP_AND_LOCAL service'));
        return;
      }
      restorePostcodeNamespace(postcodeBackup);
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };
    script.onerror = () => {
      loadPromise = null;
      kakaoMapsBlocked = true;
      restorePostcodeNamespace(postcodeBackup);
      reject(new Error('disabled OPEN_MAP_AND_LOCAL service'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
