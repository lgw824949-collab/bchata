import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE } from '../data/barDatabase'

const LiveCount = () => {
  const [counts, setCounts] = useState({})
  
  const fetchCounts = async () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
    const { data, error } = await supabase
      .from('bar_checkins')
      .select('bar_name, region')
      .gte('checked_in_at', thirtyMinsAgo.toISOString())
    
    if (data) {
      const grouped = data.reduce((acc, curr) => {
        const key = `${curr.region}|${curr.bar_name}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      setCounts(grouped)
    }
  }

  useEffect(() => {
    fetchCounts()

    // Supabase Realtime 구독
    const channel = supabase
      .channel('live_checkins')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bar_checkins' 
      }, () => {
        fetchCounts()
      })
      .subscribe()

    // GPS 자동 체크인 로직
    const visitor_id = localStorage.getItem('bchata_visitor_id') || Math.random().toString(36).substring(2, 15)
    localStorage.setItem('bchata_visitor_id', visitor_id)

    const checkIn = async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords
      
      const getDist = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }

      // 1km 이내 BAR 탐색
      const nearBar = BAR_DATABASE.find(bar => getDist(lat, lon, bar.lat, bar.lon) < 1)
      
      if (nearBar) {
        const lastCheckKey = `last_checkin_${nearBar.name}`
        const lastCheckTime = localStorage.getItem(lastCheckKey)
        const now = Date.now()

        // 30분마다 한 번만 자동 체크인 허용
        if (!lastCheckTime || now - parseInt(lastCheckTime) > 30 * 60 * 1000) {
          await supabase.from('bar_checkins').insert({
            bar_name: nearBar.name,
            region: nearBar.region,
            visitor_id,
            lat,
            lon
          })
          localStorage.setItem(lastCheckKey, now.toString())
        }
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(checkIn, null, { enableHighAccuracy: true })
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const abbreviateRegion = (region) => {
    if (!region) return '';
    return region
      .replace('인천광역시', '인천')
      .replace('서울특별시', '서울')
      .replace('부산광역시', '부산')
      .replace('경기도', '경기');
  };

  const liveList = Object.entries(counts)
    .filter(([_, count]) => count >= 50)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  if (liveList.length === 0) return null

  return (
    <div style={{ 
      background: '#0F172A', 
      padding: '8px 20px', 
      display: 'flex', 
      alignItems: 'center', 
      overflowX: 'auto', 
      whiteSpace: 'nowrap', 
      borderBottom: '1px solid #1E293B',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      gap: '24px'
    }}>
      <style>{`
        .live-dot { animation: blink 1.5s infinite; } 
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .live-text { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
      `}</style>
      
      {liveList.map(([key, count]) => {
        const [region, barName] = key.split('|')
        const shortRegion = abbreviateRegion(region)
        return (
          <div key={key} className="live-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="live-dot" style={{ color: '#E53935', fontSize: '10px' }}>●</span>
            <span style={{ fontWeight: 900, fontSize: '14px', color: '#FFFFFF' }}>
              {shortRegion && `${shortRegion} `}{barName}
            </span>
            <span style={{ fontWeight: 300, fontSize: '22px', color: '#E53935', marginLeft: '4px' }}>
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default LiveCount
