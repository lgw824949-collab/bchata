import { BAR_DATABASE as GPS_BARS } from '../data/barDatabase';
import { normalizeVenueAddressKey, normalizeVenueNameKey } from './venueDedupe';

/** barDatabase.js 마스터에서 name·address·alias 매칭 */
export function findBarMasterGps(name, address) {
  const locName = normalizeVenueNameKey(name);
  const locAddr = normalizeVenueAddressKey(address);
  const match = GPS_BARS.find((bar) => {
    const barName = normalizeVenueNameKey(bar.name);
    if (locName && barName && locName === barName) return true;
    if (locName && (bar.aliases || []).some((alias) => normalizeVenueNameKey(alias) === locName)) {
      return true;
    }
    const barAddr = normalizeVenueAddressKey(bar.address);
    return locAddr && barAddr && locAddr === barAddr;
  });
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
  const lat = Number(row.latitude ?? row.lat);
  const lng = Number(row.longitude ?? row.lon);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { ...row, latitude: lat, longitude: lng };
  }
  return row;
}

export function enrichBarListCoordinates(rows) {
  return (rows || []).map(enrichBarRowCoordinates);
}
