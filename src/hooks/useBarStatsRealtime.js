import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchBarStatsMap, resolveBarStats, bumpBarClickCount } from '../lib/barStatsQuery';

/**
 * 메인 Social BAR 카드·BAR 상세가 동일한 집계 맵을 쓰도록 Realtime 구독
 * @param {object|null} venue locations 행 또는 { id, name }
 */
export function useBarStatsRealtime(venue) {
  const [statsMap, setStatsMap] = useState({});

  const reloadStats = useCallback(async () => {
    if (!supabase) return;
    try {
      const map = await fetchBarStatsMap(supabase);
      setStatsMap(map);
    } catch (err) {
      console.warn('[useBarStatsRealtime] reloadStats failed:', err);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;
    const load = async () => {
      try {
        const map = await fetchBarStatsMap(supabase);
        if (!cancelled) setStatsMap(map);
      } catch (err) {
        console.warn('[useBarStatsRealtime] load failed:', err);
      }
    };

    load();

    const channelId = `bar-live-stats-${venue?.id ?? 'all'}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bar_checkins' },
        () => {
          load();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parties' },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [venue?.id]);

  useEffect(() => {
    const onVenueView = (e) => {
      const viewed = e.detail?.venue;
      if (!viewed || !venue) return;
      const sameId =
        viewed.id != null &&
        venue.id != null &&
        String(viewed.id) === String(venue.id);
      const sameName =
        String(viewed.name || '')
          .trim()
          .toLowerCase() ===
        String(venue.name || '')
          .trim()
          .toLowerCase();
      if (sameId || sameName) {
        bumpBarClickCount(setStatsMap, venue, 1);
      }
    };
    window.addEventListener('bchata-venue-view', onVenueView);
    return () => window.removeEventListener('bchata-venue-view', onVenueView);
  }, [venue]);

  const stats = useMemo(() => {
    if (!venue) return { liveCount: 0, clickCount: 0 };
    return resolveBarStats(venue, statsMap);
  }, [venue, statsMap]);

  return { stats, statsMap, reloadStats };
}
