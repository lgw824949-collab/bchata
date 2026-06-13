const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/** Kakao Local API가 꺼져 있을 때 주소 → 좌표 (한국 위주) */
export async function geocodeWithNominatim(address) {
  const query = String(address || '').trim();
  if (!query) return null;

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'kr',
    });
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'Accept-Language': 'ko' },
    });
    if (!response.ok) return null;

    const docs = await response.json();
    const hit = docs?.[0];
    if (!hit) return null;

    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch (err) {
    console.error('Nominatim geocode error:', err);
    return null;
  }
}

export function buildOsmEmbedUrl(lat, lng, zoomPad = 0.008) {
  const bbox = [lng - zoomPad, lat - zoomPad, lng + zoomPad, lat + zoomPad].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
}
