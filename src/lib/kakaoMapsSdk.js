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

/** SDK 스크립트 요청 전에 카카오 서버 상태 확인 */
export async function probeKakaoMapsSdk(key = getKakaoApiKey()) {
  if (!key) {
    return { ok: false, message: 'VITE_KAKAO_API_KEY 가 설정되지 않았습니다.' };
  }

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:1234';
    const response = await fetch(
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`,
      { headers: { Origin: origin, Referer: `${origin}/` } },
    );
    if (response.ok) return { ok: true };
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return { ok: false, message: json.message || text };
    } catch {
      return { ok: false, message: text || `HTTP ${response.status}` };
    }
  } catch (err) {
    return { ok: false, message: err?.message || 'Kakao Maps SDK probe failed' };
  }
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
    probeKakaoMapsSdk(key).then((probe) => {
      if (!probe.ok) {
        loadPromise = null;
        restorePostcodeNamespace(postcodeBackup);
        reject(new Error(probe.message || 'Kakao Maps SDK unavailable'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
      script.async = true;
      script.onload = () => {
        if (!window.kakao?.maps) {
          loadPromise = null;
          restorePostcodeNamespace(postcodeBackup);
          reject(new Error('Kakao Maps SDK failed to initialize'));
          return;
        }
        restorePostcodeNamespace(postcodeBackup);
        window.kakao.maps.load(() => resolve(window.kakao.maps));
      };
      script.onerror = () => {
        loadPromise = null;
        restorePostcodeNamespace(postcodeBackup);
        reject(new Error('Kakao Maps SDK script error'));
      };
      document.head.appendChild(script);
    });
  });

  return loadPromise;
}
