import { normalizeVenueNameKey } from './venueDedupe';
import {
  applyLocalExtrasToVenueList,
  mergeVenueWithStoredExtras,
  pickOptionalLocationFields,
} from './venueLocalExtras';

const TABLE = 'location_extras';

let extrasTableAvailable = null;

export function isMissingLocationExtrasTableError(err) {
  const msg = String(err?.message || '');
  return (
    err?.code === 'PGRST205'
    || err?.code === '42P01'
    || /relation.*location_extras.*does not exist/i.test(msg)
    || /Could not find the table/i.test(msg)
  );
}

/** location_extras 테이블 존재 여부 (1회 캐시) */
export async function hasLocationExtrasTable(supabase) {
  if (!supabase) return false;
  if (extrasTableAvailable !== null) return extrasTableAvailable;
  const { error } = await supabase.from(TABLE).select('venue_name').limit(1);
  extrasTableAvailable = !error;
  return extrasTableAvailable;
}

export function resetLocationExtrasTableCache() {
  extrasTableAvailable = null;
}

export function isPersistedLocationId(id) {
  const s = String(id ?? '');
  return s.length > 0 && !/^bar-\d+$/i.test(s);
}

/** @returns {{ byId: Record<string, object>, byName: Record<string, object> }} */
export async function fetchLocationExtrasMap(supabase) {
  const empty = { byId: {}, byName: {} };
  if (!supabase) return empty;
  const ok = await hasLocationExtrasTable(supabase);
  if (!ok) return empty;

  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) {
    if (isMissingLocationExtrasTableError(error)) {
      resetLocationExtrasTableCache();
      return empty;
    }
    throw error;
  }

  const byId = {};
  const byName = {};
  (data || []).forEach((row) => {
    if (row.location_id != null) byId[String(row.location_id)] = row;
    const nk = normalizeVenueNameKey(row.venue_name);
    if (nk) byName[nk] = row;
  });
  return { byId, byName };
}

export function lookupLocationExtra(venue, map) {
  if (!venue || !map) return null;
  const id = String(venue.id ?? '');
  if (id && map.byId?.[id]) return map.byId[id];
  const nk = normalizeVenueNameKey(venue.name);
  return nk && map.byName?.[nk] ? map.byName[nk] : null;
}

export function extraRowToVenueFields(row) {
  if (!row) return {};
  return {
    description: row.description ?? '',
    kakao_url: row.kakao_url ?? '',
    instagram_url: row.instagram_url ?? '',
    image_url: row.image_url ?? null,
  };
}

async function fetchExistingExtra(supabase, venue) {
  const map = await fetchLocationExtrasMap(supabase);
  return lookupLocationExtra(venue, map);
}

/**
 * BAR 이름 기준 upsert — 라틴 등 bar-N ID도 venue_name으로 저장
 */
export async function upsertLocationExtras(supabase, venue, patch) {
  if (!supabase || !venue?.name?.trim()) return null;
  const ok = await hasLocationExtrasTable(supabase);
  if (!ok) return null;

  const existing = await fetchExistingExtra(supabase, venue);
  const venue_name = String(venue.name).trim();
  const location_id = isPersistedLocationId(venue.id)
    ? venue.id
    : (existing?.location_id ?? null);

  const payload = {
    venue_name,
    location_id,
    updated_at: new Date().toISOString(),
  };

  OPTIONAL_LOCATION_COLS.forEach((col) => {
    if (patch && Object.prototype.hasOwnProperty.call(patch, col)) {
      payload[col] = patch[col];
    } else {
      payload[col] = existing?.[col] ?? null;
    }
  });

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'venue_name' })
    .select()
    .single();

  if (error) {
    if (isMissingLocationExtrasTableError(error)) {
      resetLocationExtrasTableCache();
      return null;
    }
    throw error;
  }
  return data;
}

export async function persistVenueOptionalFields(supabase, venue, patch) {
  const optional = pickOptionalLocationFields(patch);
  if (!Object.keys(optional).length) return { extrasRow: null, optional };

  let extrasRow = null;
  try {
    extrasRow = await upsertLocationExtras(supabase, venue, optional);
  } catch (err) {
    console.warn('[location_extras] upsert failed:', err);
  }

  return { extrasRow, optional };
}

export function applyStoredExtrasToVenueList(venues, extrasMap) {
  if (!extrasMap) return applyLocalExtrasToVenueList(venues);
  return (venues || []).map((v) =>
    mergeVenueWithStoredExtras(v, lookupLocationExtra(v, extrasMap)),
  );
}
