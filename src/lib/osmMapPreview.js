/** SDK 실패 시 좌표 기반 미리보기 (외부 열기는 카카오맵 유지) */
export function buildOsmMapEmbedUrl(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const padLng = 0.003;
  const padLat = 0.0015;
  const bbox = [
    lng - padLng,
    lat - padLat,
    lng + padLng,
    lat + padLat,
  ].join(',');
  const params = new URLSearchParams({
    bbox,
    layer: 'mapnik',
    marker: `${lat},${lng}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
