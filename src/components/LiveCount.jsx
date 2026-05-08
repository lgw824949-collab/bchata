import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

const LiveCount = () => {
  const { t, i18n } = useTranslation()
  const [counts, setCounts] = useState({})
  const [liveVenueCount, setLiveVenueCount] = useState(0)

  const liveMessages = useMemo(() => [
    "혼자여도 괜찮아요! 지금 바로 파티에 조인하세요.",
    "오늘 밤 당신을 기다리는 특별한 소셜 경험이 시작됩니다."
  ], [])

  const getTodayKST = () => {
    const kst = new Date(Date.now() + (9 * 60 * 60 * 1000))
    if (kst.getHours() < 5) kst.setDate(kst.getDate() - 1)
    return kst.toISOString().split('T')[0]
  }

  const getYesterdayKST = () => {
    const kst = new Date(Date.now() + (9 * 60 * 60 * 1000))
    if (kst.getHours() < 5) kst.setDate(kst.getDate() - 2)
    else kst.setDate(kst.getDate() - 1)
    return kst.toISOString().split('T')[0]
  }

  const isNowInPartyTime = (dateStr, startTime) => {
    const now = new Date()
    const start = new Date(`${dateStr}T${startTime}:00`)
    const startWithBuffer = new Date(start.getTime() - 30 * 60 * 1000)
    const end = new Date(start.getTime())
    end.setDate(end.getDate() + 1)
    end.setHours(4, 0, 0, 0) 
    return now >= startWithBuffer && now <= end
  }

  const fetchCounts = async () => {
    const todayStr = getTodayKST()
    const yesterdayStr = getYesterdayKST()
    try {
      const [{ data: parties }] = await Promise.all([
        supabase.from('parties').select('*, locations!location_id(name)').in('date', [todayStr, yesterdayStr])
      ]);

      if (!parties) return;

      const liveParties = parties.filter(p => isNowInPartyTime(p.date, p.time));
      const liveBarNames = liveParties
        .map(p => {
          const locName = Array.isArray(p.locations) ? p.locations[0]?.name : p.locations?.name;
          return locName || p.location_name || p.locationName || p.address;
        })
        .filter(Boolean);

      setLiveVenueCount(liveBarNames.length);

      const initialCounts = {};
      liveParties.forEach(p => {
        const name = (Array.isArray(p.locations) ? p.locations[0]?.name : p.locations?.name) || p.location_name || p.locationName || p.address;
        const reg = p.locations?.broad_region || '전국';
        if (!initialCounts[reg]) initialCounts[reg] = [];
        initialCounts[reg].push(`${name} 0`);
      });

      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
      const { data: checkins } = await supabase.from('bar_checkins')
        .select('bar_name, region')
        .in('bar_name', liveBarNames)
        .gte('checked_in_at', thirtyMinsAgo.toISOString());
        
      if (checkins && checkins.length > 0) {
        const actualCounts = {};
        checkins.forEach(c => {
          const reg = c.region || '기타';
          if (!actualCounts[reg]) actualCounts[reg] = {};
          actualCounts[reg][c.bar_name] = (actualCounts[reg][c.bar_name] || 0) + 1;
        });

        Object.keys(actualCounts).forEach(reg => {
          if (!initialCounts[reg]) initialCounts[reg] = [];
          Object.keys(actualCounts[reg]).forEach(name => {
            const idx = initialCounts[reg].findIndex(v => v.startsWith(name));
            if (idx > -1) {
              initialCounts[reg][idx] = `${name} ${actualCounts[reg][name]}`;
            } else {
              initialCounts[reg].push(`${name} ${actualCounts[reg][name]}`);
            }
          });
        });
      }
      setCounts(initialCounts);
    } catch (err) {
      console.error('LiveCount fetch error:', err);
    }
  };

  useEffect(() => {
    fetchCounts()
    const channel = supabase.channel('live_checkins').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bar_checkins' }, () => fetchCounts()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const currentStatusText = useMemo(() => {
    return liveMessages.join('   |   ');
  }, [liveMessages]);

  return (
    <div style={{
      background: 'transparent',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      <style>{`
        .live-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          border: 1px solid rgba(255, 23, 68, 0.3);
          border-radius: 20px;
          padding: 3px 10px 3px 7px;
          margin-right: 8px;
          flex-shrink: 0;
          background: rgba(229, 57, 53, 0.05);
          z-index: 2;
        }
        .live-dot2 {
          width: 6px;
          height: 6px;
          background: #FF1744;
          border-radius: 50%;
          animation: pulse2 1.5s ease-in-out infinite;
        }
        @keyframes pulse2 {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #FF1744; }
          50% { opacity: 0.3; box-shadow: none; }
        }
        .live-word {
          color: #FF1744;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }
        .marquee-container {
          flex: 1;
          overflow: hidden;
          white-space: nowrap;
          position: relative;
          display: flex;
          align-items: center;
        }
        .marquee-content {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 35s linear infinite;
          color: #FF1744;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Pretendard', sans-serif;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      <div className="live-pill">
        <span className="live-dot2" />
        <span className="live-word">LIVE</span>
      </div>

      <div className="marquee-container">
        <div className="marquee-content">
          {currentStatusText}
        </div>
      </div>
    </div>
  )
}

export default LiveCount
