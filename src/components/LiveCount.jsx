import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE } from '../data/barDatabase'

const LiveCount = ({ isPaused = false }) => {
  const [counts, setCounts] = useState({})
  
  const getTodayKST = () => {
    const kst = new Date(Date.now() + (9 * 60 * 60 * 1000))
    if (kst.getHours() < 5) {
      kst.setDate(kst.getDate() - 1)
    }
    return kst.toISOString().split('T')[0]
  }

  const getYesterdayKST = () => {
    const kst = new Date(Date.now() + (9 * 60 * 60 * 1000))
    if (kst.getHours() < 5) {
      kst.setDate(kst.getDate() - 2)
    } else {
      kst.setDate(kst.getDate() - 1)
    }
    return kst.toISOString().split('T')[0]
  }

  const isNowInPartyTime = (dateStr, startTime, endTime) => {
    const now = new Date()
    const start = new Date(`${dateStr}T${startTime}:00`)
    const startWithBuffer = new Date(start.getTime() - 30 * 60 * 1000)

    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 1);
    end.setHours(3, 0, 0, 0);

    return now >= startWithBuffer && now <= end
  }

  const fetchCounts = async () => {
    const todayStr = getTodayKST()
    const yesterdayStr = getYesterdayKST()

    try {
      const [{ data: parties }, { data: locations }] = await Promise.all([
        supabase.from('parties').select('*').in('date', [todayStr, yesterdayStr]),
        supabase.from('locations').select('id, name')
      ]);

      if (!parties || parties.length === 0) {
        setCounts({})
        return
      }

      const locationMap = (locations || []).reduce((acc, loc) => {
        acc[loc.id] = loc.name;
        return acc;
      }, {});

      const liveBarNames = parties
        .filter(p => isNowInPartyTime(p.date, p.time, p.end_time))
        .map(p => locationMap[p.location_id] || p.locationName)
        .filter(Boolean)

      if (liveBarNames.length === 0) {
        setCounts({})
        return
      }

      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
      const { data: checkins } = await supabase
        .from('bar_checkins')
        .select('bar_name, region')
        .in('bar_name', liveBarNames)
        .gte('checked_in_at', thirtyMinsAgo.toISOString())
      
      if (checkins) {
        const grouped = checkins.reduce((acc, curr) => {
          if (!curr.bar_name) return acc;
          const key = `${curr.region || '전국'}|${curr.bar_name}`
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})
        setCounts(grouped)
      }
    } catch (err) {
      console.error('LiveCount fetch error:', err);
    }
  }

  useEffect(() => {
    fetchCounts()
    const channel = supabase
      .channel('live_checkins')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bar_checkins' }, () => fetchCounts())
      .subscribe()

    const visitor_id = localStorage.getItem('bchata_visitor_id') || Math.random().toString(36).substring(2, 15)
    localStorage.setItem('bchata_visitor_id', visitor_id)

    const checkIn = async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords
      const todayStr = getTodayKST()
      const yesterdayStr = getYesterdayKST()
      
      const getDist = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }

      const nearBar = BAR_DATABASE.find(bar => bar.lat && bar.lon && getDist(lat, lon, bar.lat, bar.lon) < 0.1)
      
      if (nearBar) {
        const { data: locData } = await supabase.from('locations').select('id, name').eq('name', nearBar.name).maybeSingle()
        if (!locData) return;
        
        const officialName = locData.name;
        
        const { data: activeParties } = await supabase.from('parties').select('*').in('date', [todayStr, yesterdayStr]).eq('location_id', locData.id)
        const isCurrentlyLive = (activeParties || []).some(p => isNowInPartyTime(p.date, p.time, p.end_time))
        
        if (!isCurrentlyLive) return

        const lastCheckKey = `last_checkin_${officialName}`
        const lastCheckTime = localStorage.getItem(lastCheckKey)
        const now = Date.now()
        if (!lastCheckTime || now - parseInt(lastCheckTime) > 30 * 60 * 1000) {
          await supabase.from('bar_checkins').insert({ bar_name: officialName, region: nearBar.region, visitor_id, lat, lon })
          localStorage.setItem(lastCheckKey, now.toString())
        }
      }
    }

    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(checkIn, null, { enableHighAccuracy: true })
    return () => { supabase.removeChannel(channel) }
  }, [])

  const abbreviateRegion = (region) => {
    if (!region) return '';
    const maps = { '서울특별시': '서울', '인천광역시': '인천', '부산광역시': '부산', '경기도': '경기', '충청도': '충청', '전라도': '전라', '경상도': '경상' };
    return maps[region] || region;
  };

  const areaSummary = useMemo(() => {
    const AREAS = {
      '홍대 성지': ['보니따', '홍턴', '부에나', '까리베', '마콘도', '팰리스', '안단테', '놀이터', '하바나', '아난타라', '솔SOL', '꼼애야', '맘보'],
      '상암 성지': ['상암', '디지털미디어시티'],
      '강남 성지': ['강남', '신사', '역삼', '선릉', '라틴'],
      '인천 성지': ['엘마르', '라씬', 'LBT', '부평', '구월']
    };

    const summaries = {};
    Object.entries(counts).forEach(([key, count]) => {
      const parts = key.split('|');
      const barName = parts[1] || '';
      
      for (const [area, keywords] of Object.entries(AREAS)) {
        if (keywords.some(k => barName.includes(k))) {
          summaries[area] = (summaries[area] || 0) + count;
        }
      }
    });

    return Object.entries(summaries).map(([area, total]) => ({
      area,
      total,
      message: total > 80 ? '🔥 열기 폭발!' : total > 30 ? '✨ 열기 고조!' : '🏃 집결 중!'
    }));
  }, [counts]);

  const liveList = useMemo(() => {
    return Object.entries(counts)
      .filter(([_, count]) => count >= 1) 
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [counts]);

  return (
    <div style={{ background: '#0F172A', padding: '12px 0', borderBottom: '1px solid #1E293B', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        .live-pulse { animation: pulse 2s infinite; } 
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); } 70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); } 100% { transform: scale(1); opacity: 1; } }
        .ticker-container { 
          display: flex; 
          animation: scroll 35s linear infinite; 
          gap: 50px; 
          align-items: center;
          animation-play-state: ${isPaused ? 'paused' : 'running'};
        }
        @keyframes scroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-180%); } }
        .live-text { font-family: 'Pretendard', sans-serif; white-space: nowrap; }
      `}</style>

      <div className="ticker-container">
        {areaSummary.length === 0 && liveList.length === 0 && (
          <span className="live-text" style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.5px' }}>
            {isPaused ? '⏸ 중계 일시 정지됨' : '🎵 밤빠가 전하는 전국 소셜 파티 실시간 인원 중계 중! 🔥'}
          </span>
        )}

        {/* 1. 성지 구역 요약 */}
        {areaSummary.map(item => (
          <div key={item.area} className="live-text" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 23, 68, 0.1)', padding: '6px 16px', borderRadius: '30px', border: '1px solid rgba(255, 23, 68, 0.2)' }}>
            <span style={{ color: '#FF1744', fontSize: '10px', fontWeight: 950, letterSpacing: '1px' }}>BROADCAST</span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#FFFFFF' }}>
              [{item.area}] <span style={{ color: '#FF1744' }}>{item.total}명</span> 집결!
            </span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#2ECC71' }}>{item.message}</span>
          </div>
        ))}

        {/* 2. 개별 바 인원 현황 (리뉴얼 디자인) */}
        {liveList.map(([key, count]) => {
          const parts = key.split('|');
          const barName = parts[1] || '';
          const shortRegion = abbreviateRegion(parts[0]);
          return (
            <div key={key} className="live-text" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 14px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="live-pulse" style={{ width: 8, height: 8, background: '#22D3EE', borderRadius: '50%', boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#94A3B8' }}>{shortRegion}</span>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#F8FAFC' }}>{barName}</span>
              </div>
              <span style={{ fontWeight: 950, fontSize: '20px', color: '#22D3EE', marginLeft: '6px', fontFamily: 'Pretendard, system-ui' }}>
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LiveCount
