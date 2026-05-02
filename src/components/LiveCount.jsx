import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE } from '../data/barDatabase'

const LiveCount = () => {
  const [counts, setCounts] = useState({})
  
  // KST 기준 오늘 날짜 문자열 (YYYY-MM-DD)
  const getTodayKST = () => {
    const kst = new Date(Date.now() + (9 * 60 * 60 * 1000))
    return kst.toISOString().split('T')[0]
  }

  // 현재 시간이 파티 시간대(버퍼 30분 포함)인지 확인하는 함수
  const isNowInPartyTime = (dateStr, startTime, endTime) => {
    const now = new Date()
    const start = new Date(`${dateStr}T${startTime}:00`)
    let end = new Date(`${dateStr}T${endTime}:00`)
    
    // 종료 시간이 시작 시간보다 빠르면 다음 날로 처리 (예: 21:00 ~ 02:00)
    if (end < start) {
      end.setDate(end.getDate() + 1)
    }
    
    // 시작 30분 전부터 종료 시점까지를 유효 시간으로 인정
    const startWithBuffer = new Date(start.getTime() - 30 * 60 * 1000)
    return now >= startWithBuffer && now <= end
  }

  const fetchCounts = async () => {
    const todayStr = getTodayKST()
    
    // 1. 오늘 열리는 파티와 장소 데이터 각각 호출 (400 에러 방지)
    const [{ data: parties }, { data: locations }] = await Promise.all([
      supabase.from('parties').select('*').eq('date', todayStr),
      supabase.from('locations').select('id, name')
    ]);

    if (!parties || parties.length === 0) {
      setCounts({})
      return
    }

    // 장소 ID Map 생성
    const locationMap = (locations || []).reduce((acc, loc) => {
      acc[loc.id] = loc.name;
      return acc;
    }, {});

    // 2. 현재 시간이 파티 시간대인 '라이브 장소' 리스트 추출
    const liveBarNames = parties
      .filter(p => isNowInPartyTime(p.date, p.time, p.end_time))
      .map(p => locationMap[p.location_id] || p.locationName)
      .filter(Boolean)

    if (liveBarNames.length === 0) {
      setCounts({})
      return
    }

    // 3. 라이브 장소들에 대해서만 최근 30분 체크인 집계
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
    const { data: checkins } = await supabase
      .from('bar_checkins')
      .select('bar_name, region')
      .in('bar_name', liveBarNames)
      .gte('checked_in_at', thirtyMinsAgo.toISOString())
    
    if (checkins) {
      const grouped = checkins.reduce((acc, curr) => {
        const key = `${curr.region}|${curr.bar_name}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      setCounts(grouped)
    }
  }

  useEffect(() => {
    fetchCounts()

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

    const visitor_id = localStorage.getItem('bchata_visitor_id') || Math.random().toString(36).substring(2, 15)
    localStorage.setItem('bchata_visitor_id', visitor_id)

    const checkIn = async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords
      const todayStr = getTodayKST()
      
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

      const nearBar = BAR_DATABASE.find(bar => getDist(lat, lon, bar.lat, bar.lon) < 1)
      
      if (nearBar) {
        // 1. 해당 장소명의 ID를 먼저 찾기 (400 에러 방지)
        const { data: locData } = await supabase
          .from('locations')
          .select('id')
          .eq('name', nearBar.name)
          .maybeSingle()

        if (!locData) return;

        // 2. 해당 장소 ID로 오늘 파티 일정이 있는지 확인
        const { data: activeParty } = await supabase
          .from('parties')
          .select('*')
          .eq('date', todayStr)
          .eq('location_id', locData.id)
          .maybeSingle()

        // 파티 시간이 아니면 체크인 기록 안 함
        if (!activeParty || !isNowInPartyTime(activeParty.date, activeParty.time, activeParty.end_time)) {
          return
        }

        const lastCheckKey = `last_checkin_${nearBar.name}`
        const lastCheckTime = localStorage.getItem(lastCheckKey)
        const now = Date.now()

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
            <span className="live-dot" style={{ color: '#059669', fontSize: '10px' }}>●</span>
            <span style={{ fontWeight: 900, fontSize: '14px', color: '#FFFFFF' }}>
              {shortRegion && `${shortRegion} `}{barName}
            </span>
            <span style={{ fontWeight: 300, fontSize: '22px', color: '#059669', marginLeft: '4px' }}>
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default LiveCount
