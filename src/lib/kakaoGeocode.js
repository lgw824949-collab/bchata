import { getKakaoApiKey } from './kakaoEnv';
import { geocodeWithNominatim } from './openStreetMap';

/** Kakao Local API → 실패 시 Nominatim — 주소 → { lat, lng } */
export async function geocodeAddress(address) {
  const query = String(address || '').trim();
  if (!query) return null;

  const key = getKakaoApiKey();
  if (key) {
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
        { headers: { Authorization: `KakaoAK ${key}` } },
      );
      if (response.ok) {
        const result = await response.json();
        const doc = result?.documents?.[0];
        if (doc) {
          const lat = parseFloat(doc.y);
          const lng = parseFloat(doc.x);
          if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        }
      }
    } catch (err) {
      console.error('Kakao geocode error:', err);
    }
  }

  return geocodeWithNominatim(query);
}
