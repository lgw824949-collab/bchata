import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE } from '../data/barDatabase'

const LiveCount = () => {
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

  const liveList = useMemo(() => {
    return Object.entries(counts)
      .filter(([_, count]) => count >= 1) 
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [counts]);

  return (
    <div style={{ background: '#0F172A', overflow: 'hidden' }}>
      <style>{`
        .live-wave { 
          width: 8px; height: 8px; background: #FF5722; border-radius: 50%; position: relative; 
          box-shadow: 0 0 10px rgba(255, 87, 34, 0.8);
        }
        .live-wave::after {
          content: ''; position: absolute; inset: -4px; border: 1px solid #FF5722; border-radius: 50%;
          animation: wave 1.5s infinite;
        }
        @keyframes wave { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
        .ticker-container { 
          display: flex; 
          animation: scroll 40s linear infinite; 
          gap: 40px; 
          align-items: center;
        }
        @keyframes scroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-200%); } }
        .live-text { font-family: 'Pretendard', sans-serif; white-space: nowrap; color: #F8FAFC; font-size: 15px; font-weight: 800; display: flex; alignItems: center; gap: 8px; }
      `}</style>

      <div className="ticker-container">
        {liveList.length === 0 && (
          <span className="live-text" style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>
            🎵 밤빠가 전하는 전국 소셜 파티 실시간 인원 중계 중! 🔥
          </span>
        )}

        {liveList.map(([key, count]) => {
          const parts = key.split('|');
          const barName = parts[1] || '';
          const shortRegion = abbreviateRegion(parts[0]);
          return (
            <div key={key} className="live-text">
              <div className="live-wave" />
              <span>[{shortRegion}] {barName}</span>
              <span style={{ color: '#FF5722', fontWeight: 950, fontSize: '18px' }}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LiveCount
