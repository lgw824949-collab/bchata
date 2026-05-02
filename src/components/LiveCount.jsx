import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE } from '../data/barDatabase'

const LiveCount = () => {
  const [counts, setCounts] = useState({})
  const [boosters, setBoosters] = useState({ hongdae: 1.0, gangnam: 1.0, others: 1.0 })
  
  const getTodayKST = () => {
    const kst = new Date(Date.now() + (9 * 60 * 60 * 1000))
    return kst.toISOString().split('T')[0]
  }

  const isNowInPartyTime = (dateStr, startTime, endTime) => {
    const now = new Date()
    const start = new Date(`${dateStr}T${startTime}:00`)
    let end = new Date(`${dateStr}T${endTime}:00`)
    if (end < start) end.setDate(end.getDate() + 1)
    const startWithBuffer = new Date(start.getTime() - 30 * 60 * 1000)
    return now >= startWithBuffer && now <= end
  }

  const fetchCounts = async () => {
    const todayStr = getTodayKST()
    try {
      const [{ data: parties }, { data: locations }] = await Promise.all([
        supabase.from('parties').select('*').eq('date', todayStr),
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

  const fetchBoosters = async () => {
    try {
      const { data } = await supabase.from('live_boosters').select('*')
      if (data) {
        const mapped = data.reduce((acc, curr) => {
          acc[curr.region] = curr.multiplier
          return acc
        }, { hongdae: 1.0, gangnam: 1.0, others: 1.0 })
        setBoosters(mapped)
      }
    } catch (err) {
      console.error('Booster fetch error:', err)
    }
  }

  useEffect(() => {
    fetchCounts()
    fetchBoosters()
    const channel = supabase
      .channel('live_checkins')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bar_checkins' }, () => fetchCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_boosters' }, () => fetchBoosters())
      .subscribe()

    const visitor_id = localStorage.getItem('bchata_visitor_id') || Math.random().toString(36).substring(2, 15)
    localStorage.setItem('bchata_visitor_id', visitor_id)

    const checkIn = async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords
      const todayStr = getTodayKST()
      
      const getDist = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }

      const nearBar = BAR_DATABASE.find(bar => bar.lat && bar.lon && getDist(lat, lon, bar.lat, bar.lon) < 1)
      
      if (nearBar) {
        const { data: locData } = await supabase.from('locations').select('id').eq('name', nearBar.name).maybeSingle()
        if (!locData) return;
        const { data: activeParty } = await supabase.from('parties').select('*').eq('date', todayStr).eq('location_id', locData.id).maybeSingle()
        if (!activeParty || !isNowInPartyTime(activeParty.date, activeParty.time, activeParty.end_time)) return
        const lastCheckKey = `last_checkin_${nearBar.name}`
        const lastCheckTime = localStorage.getItem(lastCheckKey)
        const now = Date.now()
        if (!lastCheckTime || now - parseInt(lastCheckTime) > 30 * 60 * 1000) {
          await supabase.from('bar_checkins').insert({ bar_name: nearBar.name, region: nearBar.region, visitor_id, lat, lon })
          localStorage.setItem(lastCheckKey, now.toString())
        }
      }
    }

    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(checkIn, null, { enableHighAccuracy: true })
    return () => { supabase.removeChannel(channel) }
  }, [])

  const abbreviateRegion = (region) => {
    if (!region) return '';
    return region.replace('인천광역시', '인천').replace('서울특별시', '서울').replace('부산광역시', '부산').replace('경기도', '경기');
  };

  const areaSummary = useMemo(() => {
    const AREAS = {
      '홍대 성지': ['보니따', '홍턴', '부에나', '까리베', '마콘도', '팰리스', '안단테', '놀이터', '하바나', '아난타라', '솔SOL', '꼼애야', '맘보'],
      '상암 성지': ['상암', '디지털미디어시티'],
      '강남 성지': ['강남', '신사', '역삼', '선릉']
    };

    const summaries = {};
    Object.entries(counts).forEach(([key, count]) => {
      const parts = key.split('|');
      const barName = parts[1] || '';
      
      for (const [area, keywords] of Object.entries(AREAS)) {
        if (keywords.some(k => barName.includes(k))) {
          let multiplier = boosters.others || 1.0;
          if (area === '홍대 성지') multiplier = boosters.hongdae || 1.0;
          if (area === '강남 성지') multiplier = boosters.gangnam || 1.0;
          
          summaries[area] = (summaries[area] || 0) + Math.round(count * multiplier);
        }
      }
    });

    return Object.entries(summaries).map(([area, total]) => ({
      area,
      total,
      message: total > 100 ? '🔥 열기 폭발!' : total > 50 ? '✨ 열기 고조!' : '🏃 집결 중!'
    }));
  }, [counts, boosters]);

  const liveList = useMemo(() => {
    const HONGDAE_BARS = ['보니따', '홍턴', '부에나2차', '까리베 2차', '마콘도', '팰리스클럽', '안단테', '놀이터 2차', '하바나', '아난타라', '솔SOL빠2차', '꼼애야 2차'];
    const list = Object.entries(counts)
      .map(([key, count]) => {
        const parts = key.split('|');
        const region = parts[0] || '';
        const barName = parts[1] || '';
        
        let multiplier = boosters.others || 1.0;
        if (HONGDAE_BARS.some(h => barName.includes(h))) multiplier = boosters.hongdae || 1.0;
        else if (region.includes('서울') || region.includes('강남')) multiplier = boosters.gangnam || 1.0;
        
        return [key, Math.round(count * multiplier)];
      })
      .filter(([_, count]) => count >= 10)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return list;
  }, [counts, boosters]);

  return (
    <div style={{ background: '#0F172A', padding: '10px 0', borderBottom: '1px solid #1E293B', overflow: 'hidden' }}>
      <style>{`
        .live-dot { animation: blink 1.5s infinite; } 
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .ticker-container { display: flex; animation: scroll 30s linear infinite; gap: 40px; }
        @keyframes scroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-150%); } }
        .live-text { font-family: 'Pretendard', sans-serif; white-space: nowrap; }
      `}</style>

      <div className="ticker-container">
        {areaSummary.length === 0 && liveList.length === 0 && (
          <span className="live-text" style={{ color: '#94A3B8', fontSize: '13px' }}>
            🎵 밤빠가 전하는 전국 소셜 파티 실시간 인원 중계 중! 🔥
          </span>
        )}
        {/* 1. 성지 구역 요약 (광고판 중계) */}
        {areaSummary.map(item => (
          <div key={item.area} className="live-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#FF1744', color: '#fff', fontSize: '10px', fontWeight: '950', padding: '2px 8px', borderRadius: '4px' }}>BROADCAST</span>
            <span style={{ fontWeight: 900, fontSize: '15px', color: '#FFFFFF' }}>
              [{item.area}] 반경 1km 내 <span style={{ color: '#FF1744' }}>{item.total}명</span> 집결 중!
            </span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#2ECC71' }}>{item.message}</span>
          </div>
        ))}

        {/* 2. 개별 바 인원 현황 */}
        {liveList.map(([key, count]) => {
          const parts = key.split('|');
          const barName = parts[1] || '';
          const shortRegion = abbreviateRegion(parts[0]);
          return (
            <div key={key} className="live-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="live-dot" style={{ color: '#FF1744', fontSize: '10px' }}>●</span>
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#94A3B8' }}>
                {shortRegion} {barName}
              </span>
              <span style={{ fontWeight: 900, fontSize: '18px', color: '#FFFFFF', marginLeft: '4px' }}>
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
