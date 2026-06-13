import { getKakaoApiKey } from './kakaoEnv';

/** Kakao Local API — 주소 → { lat, lng } */
export async function geocodeAddress(address) {
  const query = String(address || '').trim();
  const key = getKakaoApiKey();
  if (!query || !key) return null;

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `KakaoAK ${key}` } },
    );
    const result = await response.json();
    const doc = result?.documents?.[0];
    if (!doc) return null;
    const lat = parseFloat(doc.y);
    const lng = parseFloat(doc.x);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch (err) {
    console.error('Kakao geocode error:', err);
    return null;
  }
}
