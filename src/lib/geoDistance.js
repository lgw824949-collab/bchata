const EARTH_RADIUS_KM = 6371;

/** Haversine — 두 좌표 간 직선거리(km) */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const a1 = Number(lat1);
  const o1 = Number(lon1);
  const a2 = Number(lat2);
  const o2 = Number(lon2);
  if (![a1, o1, a2, o2].every(Number.isFinite)) return null;

  const dLat = ((a2 - a1) * Math.PI) / 180;
  const dLon = ((o2 - o1) * Math.PI) / 180;
  const r1 = (a1 * Math.PI) / 180;
  const r2 = (a2 * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r1) * Math.cos(r2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** UI용 거리 라벨 (1km 미만은 m) */
export function formatDistanceLabel(km) {
  const n = Number(km);
  if (!Number.isFinite(n)) return '';
  if (n < 1) return `${Math.round(n * 1000)}m`;
  return `${n.toFixed(1)}km`;
}

export const DISTANCE_SORT_FALLBACK = Number.POSITIVE_INFINITY;

/**
 * @param {Array} items
 * @param {{ lat: number, lng: number } | null} userCoords
 * @param {(item: unknown) => { lat: number, lng: number } | null} getItemCoords
 */
export function sortByDistanceFromUser(items, userCoords, getItemCoords) {
  if (!userCoords?.lat || !userCoords?.lng) return [...(items || [])];

  return [...(items || [])].sort((a, b) => {
    const ca = getItemCoords(a);
    const cb = getItemCoords(b);
    const da = ca
      ? haversineKm(userCoords.lat, userCoords.lng, ca.lat, ca.lng) ?? DISTANCE_SORT_FALLBACK
      : DISTANCE_SORT_FALLBACK;
    const db = cb
      ? haversineKm(userCoords.lat, userCoords.lng, cb.lat, cb.lng) ?? DISTANCE_SORT_FALLBACK
      : DISTANCE_SORT_FALLBACK;
    return da - db;
  });
}
