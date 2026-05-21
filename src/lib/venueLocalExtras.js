const STORAGE_KEY = 'bchata:venue-local-extras';

export const OPTIONAL_LOCATION_COLS = ['description', 'kakao_url', 'instagram_url', 'image_url'];

export function isMissingLocationsColumnError(err) {
  const msg = String(err?.message || '');
  return (
    err?.code === 'PGRST204'
    || err?.code === '42703'
    || /Could not find the .* column of 'locations'/i.test(msg)
    || (/schema cache/i.test(msg) && OPTIONAL_LOCATION_COLS.some((c) => msg.includes(c)))
  );
}

let optionalColumnsInDb = null;

/** Supabase locations에 description·연락처 컬럼 존재 여부 (1회 캐시) */
export async function hasOptionalLocationColumns(supabase) {
  if (!supabase) return false;
  if (optionalColumnsInDb !== null) return optionalColumnsInDb;
  const { error } = await supabase.from('locations').select('description, kakao_url, instagram_url').limit(1);
  optionalColumnsInDb = !error;
  return optionalColumnsInDb;
}

export function resetOptionalColumnsCache() {
  optionalColumnsInDb = null;
}

function storeKey(venue) {
  if (!venue) return 'unknown';
  const id = venue.id != null ? String(venue.id) : '';
  if (id && !id.startsWith('bar-')) return `id:${id}`;
  return `name:${String(venue.name || '').trim()}`;
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function readVenueLocalExtras(venue) {
  return readAll()[storeKey(venue)] || {};
}

export function writeVenueLocalExtras(venue, patch) {
  const key = storeKey(venue);
  const all = readAll();
  all[key] = { ...(all[key] || {}), ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* quota / private mode */
  }
}

export function pickOptionalLocationFields(patch) {
  const out = {};
  OPTIONAL_LOCATION_COLS.forEach((col) => {
    if (patch && Object.prototype.hasOwnProperty.call(patch, col)) out[col] = patch[col];
  });
  return out;
}

export function omitOptionalLocationFields(patch) {
  const out = { ...patch };
  OPTIONAL_LOCATION_COLS.forEach((col) => delete out[col]);
  return out;
}

function coalesceVenueField(dbVal, localVal) {
  const fromDb = String(dbVal ?? '').trim();
  if (fromDb) return fromDb;
  return String(localVal ?? '').trim();
}

export function mergeVenueWithLocalExtras(venue) {
  if (!venue) return venue;
  const local = readVenueLocalExtras(venue);
  return {
    ...venue,
    description: coalesceVenueField(venue.description, local.description),
    kakao_url: coalesceVenueField(venue.kakao_url, local.kakao_url),
    instagram_url: coalesceVenueField(venue.instagram_url, local.instagram_url),
    image_url: venue.image_url || local.image_url || null,
  };
}

export function applyLocalExtrasToVenueList(venues) {
  return (venues || []).map((v) => mergeVenueWithLocalExtras(v));
}

/** locations 컬럼 + location_extras 행 + localStorage 병합 */
export function mergeVenueWithStoredExtras(venue, extrasRow) {
  if (!venue) return venue;
  if (!extrasRow) return mergeVenueWithLocalExtras(venue);
  const fromTable = {
    description: extrasRow.description,
    kakao_url: extrasRow.kakao_url,
    instagram_url: extrasRow.instagram_url,
    image_url: extrasRow.image_url,
  };
  const withTable = {
    ...venue,
    description: coalesceVenueField(venue.description, fromTable.description),
    kakao_url: coalesceVenueField(venue.kakao_url, fromTable.kakao_url),
    instagram_url: coalesceVenueField(venue.instagram_url, fromTable.instagram_url),
    image_url: venue.image_url || fromTable.image_url || null,
  };
  return mergeVenueWithLocalExtras(withTable);
}

