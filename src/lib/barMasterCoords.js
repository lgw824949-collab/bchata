import { BAR_DATABASE as GPS_BARS } from '../data/barDatabase.js';
import { normalizeKoreaCoordinates } from './geoDistance.js';
import { findBarMasterRecord } from './venueCanonical.js';

/** barDatabase.js 마스터에서 name·address·alias 매칭 */
export function findBarMasterGps(name, address) {
  const match = findBarMasterRecord(name, address);
  if (!match || match.lat == null || match.lon == null) return null;
  return { lat: Number(match.lat), lon: Number(match.lon) };
}

/** Supabase locations — 마스터 GPS 우선, 없으면 DB 좌표 유지 */
export function enrichBarRowCoordinates(row) {
  if (!row) return row;
  const gps = findBarMasterGps(row.name, row.address);
  if (gps) {
    return { ...row, latitude: gps.lat, longitude: gps.lon };
  }
  const normalized = normalizeKoreaCoordinates(
    row.latitude ?? row.lat,
    row.longitude ?? row.lon,
  );
  if (normalized) {
    return { ...row, latitude: normalized.lat, longitude: normalized.lng };
  }
  return { ...row, latitude: null, longitude: null };
}

export function enrichBarListCoordinates(rows) {
  return (rows || []).map(enrichBarRowCoordinates);
}
