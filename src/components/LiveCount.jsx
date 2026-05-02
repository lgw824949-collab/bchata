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

  const liveList = useMemo(() => {
    const HONGDAE_BARS = ['보니따', '홍턴', '부에나2차', '까리베 2차', '마콘도', '팰리스클럽', '안단테', '놀이터 2차', '하바나', '아난타라', '솔SOL빠2차', '꼼애야 2차'];
    let hongdaeTotal = 0;
    
    // 홍대 인원 합산 (부스터 적용)
    Object.entries(counts).forEach(([key, count]) => {
      const parts = key.split('|');
      const barName = parts[1] || '';
      if (HONGDAE_BARS.some(h => barName.includes(h))) {
        hongdaeTotal += Math.round(count * (boosters.hongdae || 1.0));
      }
    });

    const list = Object.entries(counts)
      .map(([key, count]) => {
        const parts = key.split('|');
        const region = parts[0] || '';
        const barName = parts[1] || '';
        
        // 지역별 부스터 결정
        let multiplier = boosters.others || 1.0;
        if (HONGDAE_BARS.some(h => barName.includes(h))) multiplier = boosters.hongdae || 1.0;
        else if (region.includes('서울') || region.includes('강남')) multiplier = boosters.gangnam || 1.0;
        
        return [key, Math.round(count * multiplier)];
      })
      .filter(([_, count]) => count >= 10) // 부스터 적용 후 10명 이상인 것만 (좀 더 풍성하게)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (hongdaeTotal > 0) {
      list.unshift(['서울|🔥 홍턴(홍대)', hongdaeTotal]);
    }
    return list;
  }, [counts, boosters]);

  if (liveList.length === 0) return null

  return (
    <div style={{ background: '#0F172A', padding: '8px 20px', display: 'flex', alignItems: 'center', overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: '1px solid #1E293B', scrollbarWidth: 'none', msOverflowStyle: 'none', gap: '24px' }}>
      <style>{`
        .live-dot { animation: blink 1.5s infinite; } 
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .live-text { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
      `}</style>
      {liveList.map(([key, count]) => {
        const parts = key.split('|');
        const region = parts[0] || '';
        const barName = parts[1] || '';
        const shortRegion = abbreviateRegion(region);
        return (
          <div key={key} className="live-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="live-dot" style={{ color: '#FF1744', fontSize: '10px' }}>●</span>
            <span style={{ fontWeight: 900, fontSize: '14px', color: '#FFFFFF' }}>
              {shortRegion && `${shortRegion} `}{barName}
            </span>
            <span style={{ fontWeight: 300, fontSize: '22px', color: '#FF1744', marginLeft: '4px' }}>
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default LiveCount
