import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  PARTY_WISHLIST_UPDATED_EVENT,
  fetchRemoteWishlistPartyIds,
  loadWishlistPartiesFromStorage,
  mergeWishlistParties,
  saveWishlistPartiesToStorage,
  syncWishlistToggleToSupabase,
  toggleWishlistPartiesLocal,
} from '../lib/partyWishlistStore';

/**
 * 파티 찜 목록 — localStorage + Supabase(party_wishlists) 동기화
 * @param {object[]} [partiesCatalog] DB 병합 시 party 객체 복원용
 */
export function usePartyWishlist(partiesCatalog = []) {
  const [wishlistParties, setWishlistParties] = useState(() =>
    loadWishlistPartiesFromStorage(),
  );
  const hydratedRef = useRef(false);
  const catalogRef = useRef(partiesCatalog);
  catalogRef.current = partiesCatalog;

  useEffect(() => {
    const onUpdate = (e) => {
      setWishlistParties(e.detail ?? loadWishlistPartiesFromStorage());
    };
    window.addEventListener(PARTY_WISHLIST_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(PARTY_WISHLIST_UPDATED_EVENT, onUpdate);
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const remoteIds = await fetchRemoteWishlistPartyIds(supabase);
      if (cancelled) return;
      hydratedRef.current = true;
      if (!remoteIds.length) return;
      setWishlistParties((prev) => {
        const merged = mergeWishlistParties(
          prev,
          remoteIds,
          catalogRef.current,
        );
        saveWishlistPartiesToStorage(merged);
        return merged;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || !partiesCatalog?.length) return;
    setWishlistParties((prev) => {
      const ids = prev.map((item) =>
        typeof item === 'object' && item !== null ? item.id : item,
      );
      const needsObject = ids.some(
        (id) =>
          id != null &&
          typeof prev.find((p) =>
            typeof p === 'object' ? p.id === id : p === id,
          ) !== 'object',
      );
      if (!needsObject) return prev;
      const merged = mergeWishlistParties(prev, ids, partiesCatalog);
      saveWishlistPartiesToStorage(merged);
      return merged;
    });
  }, [partiesCatalog]);

  const toggleWishlistParty = useCallback((e, partyObj) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!partyObj?.id) return;

    setWishlistParties((prev) => {
      const wasWishlisted = prev.some((item) => {
        if (typeof item === 'object' && item !== null) return item.id === partyObj.id;
        return item === partyObj.id;
      });
      const nextList = toggleWishlistPartiesLocal(prev, partyObj);
      saveWishlistPartiesToStorage(nextList);
      void syncWishlistToggleToSupabase(partyObj.id, !wasWishlisted, supabase);
      return nextList;
    });
  }, []);

  return { wishlistParties, toggleWishlistParty, setWishlistParties };
}
