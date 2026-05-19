import React, { useEffect, useMemo, useState } from 'react';
import PartyCard from './PartyCard';
import { supabase } from '../lib/supabase';

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

const normDate = (d: string | null | undefined) => (d ? String(d).slice(0, 10) : '');

/** KST 오늘 (새벽 4시 전 = 전날, Home과 동일) */
const getKSTTodayStr = () => {
  const now = new Date();
  if (now.getHours() < 4) now.setDate(now.getDate() - 1);
  const kst = now.toLocaleString('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [m, d, y] = kst.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

const partyMatchesToday = (row: Record<string, unknown>, todayStr: string) => {
  if (row.date) return normDate(String(row.date)) === todayStr;
  if (row.start_time) return normDate(String(row.start_time)) === todayStr;
  return false;
};

type TonightFeedProps = {
  onSelect: (item: Record<string, unknown>) => void;
};

const TonightFeed = ({ onSelect }: TonightFeedProps) => {
  const [parties, setParties] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const todayStr = useMemo(() => getKSTTodayStr(), []);

  const dateLabel = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${mm}/${dd} (${DAYS_KOR[dt.getDay()]})`;
  }, [todayStr]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [partiesRes, nullDateRes, locationsRes] = await Promise.all([
          supabase.from('parties').select('*').eq('status', 'approved').eq('date', todayStr),
          supabase.from('parties').select('*').eq('status', 'approved').is('date', null).not('start_time', 'is', null),
          supabase.from('locations').select('id, name'),
        ]);

        if (cancelled) return;

        const locationMap = (locationsRes.data || []).reduce<Record<string, string>>((acc, loc) => {
          acc[loc.id] = loc.name;
          return acc;
        }, {});

        const byDate = partiesRes.data || [];
        const byStartTime = (nullDateRes.data || []).filter((p) => partyMatchesToday(p, todayStr));
        const seen = new Set<string>();
        const merged = [...byDate, ...byStartTime].filter((p) => {
          const id = String(p.id);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        const mapped = merged.map((p) => ({
          ...p,
          locationName:
            locationMap[p.location_id as string] ||
            p.location_name ||
            p.locationName ||
            p.studio_name ||
            '장소 미지정',
        }));

        mapped.sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
        setParties(mapped);
      } catch (err) {
        console.error('TonightFeed fetch error:', err);
        if (!cancelled) setParties([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [todayStr]);

  if (loading || parties.length === 0) return null;

  return (
    <section style={{ padding: '0 16px 16px', background: 'transparent' }}>
      <style>{`
        .tonight-feed-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '20px', lineHeight: 1 }} aria-hidden>
          🌙
        </span>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 900,
            color: 'var(--color-text-main)',
            margin: 0,
            letterSpacing: '-0.4px',
          }}
        >
          오늘 밤
        </h2>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-sub)',
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            padding: '4px 10px',
            borderRadius: '999px',
          }}
        >
          {dateLabel}
        </span>
      </header>
      <div
        className="tonight-feed-scroll"
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '4px',
        }}
      >
        {parties.map((item) => (
          <div key={String(item.id)} style={{ minWidth: '200px', maxWidth: '280px', flex: '0 0 auto' }}>
            <PartyCard item={item} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TonightFeed;
