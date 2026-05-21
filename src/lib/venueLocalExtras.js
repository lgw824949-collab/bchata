const STORAGE_KEY = 'bchata:venue-local-extras';

const OPTIONAL_LOCATION_COLS = ['description', 'kakao_url', 'instagram_url', 'image_url'];

export function isMissingLocationsColumnError(err) {
  const msg = String(err?.message || '');
  return err?.code === 'PGRST204' || (/schema cache/i.test(msg) && OPTIONAL_LOCATION_COLS.some((c) => msg.includes(c)));
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

export function mergeVenueWithLocalExtras(venue) {
  if (!venue) return venue;
  const local = readVenueLocalExtras(venue);
  return {
    ...venue,
    description: venue.description ?? local.description ?? '',
    kakao_url: venue.kakao_url ?? local.kakao_url ?? '',
    instagram_url: venue.instagram_url ?? local.instagram_url ?? '',
    image_url: venue.image_url ?? local.image_url ?? null,
  };
}
