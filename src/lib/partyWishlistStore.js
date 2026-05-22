import { supabase } from './supabase';

export const PARTY_WISHLIST_TABLE = 'party_wishlists';
const WISHLIST_DB_SYNC_ENABLED =
  String(import.meta.env.VITE_ENABLE_PARTY_WISHLIST_SYNC || '').toLowerCase() === 'true';
const DEVICE_ID_KEY = 'bchata_wishlist_device_id';
const STORAGE_KEY = 'wishlist_parties';
const LEGACY_KEYS = ['liked_ids', 'liked_parties'];

export const PARTY_WISHLIST_UPDATED_EVENT = 'party-wishlist-updated';

export function getWishlistDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

export function isPartyWishlisted(wishlistParties, partyId) {
  if (partyId == null || !Array.isArray(wishlistParties)) return false;
  return wishlistParties.some((item) => {
    if (typeof item === 'object' && item !== null) return item.id === partyId;
    return item === partyId;
  });
}

export function loadWishlistPartiesFromStorage() {
  try {
    const str =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('liked_ids') ||
      localStorage.getItem('liked_parties') ||
      '[]';
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWishlistPartiesToStorage(list) {
  const nextList = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    for (const key of LEGACY_KEYS) {
      if (localStorage.getItem(key) != null) {
        localStorage.setItem(key, JSON.stringify(nextList));
      }
    }
  } catch {
    /* ignore quota errors */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(PARTY_WISHLIST_UPDATED_EVENT, { detail: nextList }),
    );
  }
  return nextList;
}

export function mergeWishlistParties(localList, remoteIds, partiesCatalog = []) {
  const byId = new Map();
  for (const item of localList || []) {
    const id = typeof item === 'object' && item !== null ? item.id : item;
    if (id != null) byId.set(String(id), item);
  }
  for (const rid of remoteIds || []) {
    const sid = String(rid);
    if (byId.has(sid)) continue;
    const found = (partiesCatalog || []).find((p) => String(p.id) === sid);
    byId.set(sid, found || rid);
  }
  return Array.from(byId.values());
}

export function toggleWishlistPartiesLocal(prev, partyObj) {
  if (!partyObj?.id) return prev || [];
  const list = Array.isArray(prev) ? prev : [];
  const already = isPartyWishlisted(list, partyObj.id);
  if (already) {
    return list.filter((item) => {
      if (typeof item === 'object' && item !== null) return item.id !== partyObj.id;
      return item !== partyObj.id;
    });
  }
  return [...list, partyObj];
}

let fetchWarned = false;

/** @returns {Promise<string[]>} */
export async function fetchRemoteWishlistPartyIds(client = supabase) {
  if (!WISHLIST_DB_SYNC_ENABLED) return [];
  if (!client) return [];
  const deviceId = getWishlistDeviceId();
  const { data, error } = await client
    .from(PARTY_WISHLIST_TABLE)
    .select('party_id')
    .eq('device_id', deviceId);

  if (error) {
    if (!fetchWarned) {
      console.warn('[wishlist] Supabase fetch skipped:', error.message);
      fetchWarned = true;
    }
    return [];
  }
  return (data || []).map((row) => row.party_id).filter(Boolean);
}

export async function syncWishlistToggleToSupabase(partyId, isAdding, client = supabase) {
  if (!WISHLIST_DB_SYNC_ENABLED) return;
  if (!client || partyId == null) return;
  const deviceId = getWishlistDeviceId();
  const pid = String(partyId);

  try {
    if (isAdding) {
      const { error } = await client.from(PARTY_WISHLIST_TABLE).insert({
        party_id: pid,
        device_id: deviceId,
      });
      if (error && error.code !== '23505') throw error;
    } else {
      const { error } = await client
        .from(PARTY_WISHLIST_TABLE)
        .delete()
        .eq('party_id', pid)
        .eq('device_id', deviceId);
      if (error) throw error;
    }
  } catch (err) {
    if (!syncWishlistToggleToSupabase._warned) {
      console.warn('[wishlist] Supabase sync skipped:', err?.message || err);
      syncWishlistToggleToSupabase._warned = true;
    }
  }
}

export async function removePartyFromSupabaseWishlist(partyId, client = supabase) {
  return syncWishlistToggleToSupabase(partyId, false, client);
}
