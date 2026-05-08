import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { findBarByName } from '../data/barDatabase'

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
        const rawName = (Array.isArray(p.locations) ? p.locations[0]?.name : p.locations?.name) || p.location_name || p.locationName || p.address;
        const barInfo = findBarByName(rawName);
        const name = barInfo ? barInfo.name : rawName;
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

  // ─── 새 로직 추가: parsed(지역별 인원) 및 displayText 제어 ───
  const [displayText, setDisplayText] = useState('')
  const [parsed, setParsed] = useState(null)

  useEffect(() => {
    // 1. 공지 메시지 로테이션
    let msgIdx = 0
    const msgInterval = setInterval(() => {
      setDisplayText(liveMessages[msgIdx])
      msgIdx = (msgIdx + 1) % liveMessages.length
    }, 5000)
    setDisplayText(liveMessages[0])

    // 2. 실시간 인원 데이터(counts) 로테이션
    const updateParsed = () => {
      const flat = []
      Object.entries(counts).forEach(([reg, items]) => {
        items.forEach(it => {
          const [name, count] = it.split(' ')
          flat.push({ region: reg, name, count })
        })
      })
      if (flat.length > 0) {
        let idx = 0
        const pInterval = setInterval(() => {
          setParsed(flat[idx])
          idx = (idx + 1) % flat.length
        }, 3000)
        setParsed(flat[0])
        return pInterval
      } else {
        setParsed(null)
      }
    }
    const pInterval = updateParsed()
    
    return () => {
      clearInterval(msgInterval)
      if (pInterval) clearInterval(pInterval)
    }
  }, [counts, liveMessages])

  return (
    <div style={{ background: 'linear-gradient(90deg, #0d0d0d, #1a1200, #0d0d0d)', height: '40px', display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .gold-line { position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #C9A84C, #FFD700, #C9A84C, transparent); opacity: 0.8; }
        .gold-line-top { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #C9A84C, #FFD700, #C9A84C, transparent); opacity: 0.4; }
        .live-pill { display: flex; align-items: center; gap: 5px; border: 1px solid rgba(201,168,76,0.6); border-radius: 20px; padding: 3px 10px 3px 7px; margin-right: 12px; flex-shrink: 0; background: rgba(0,0,0,0.25); }
        .live-dot { width: 6px; height: 6px; background: #FFD700; border-radius: 50%; animation: pulse2 1.5s ease-in-out infinite; }
        @keyframes pulse2 { 0%, 100% { opacity: 1; box-shadow: 0 0 6px #FFD700; } 50% { opacity: 0.3; box-shadow: none; } }
        .live-word { color: #FFD700; font-size: 10px; font-weight: 700; letter-spacing: 2px; }
        .live-count { color: #FFD700; font-size: 18px; font-weight: 800; animation: blink-count 1.2s ease-in-out infinite; }
        @keyframes blink-count { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .live-region { color: rgba(255,255,255,0.5); font-size: 12px; margin-right: 6px; }
        .live-name { color: #E8D5A3; font-size: 13px; font-weight: 500; margin-right: 8px; }
        .live-unit { color: rgba(201,168,76,0.7); font-size: 11px; margin-left: 2px; }
        .live-default { color: rgba(232,213,163,0.6); font-size: 12px; letter-spacing: 0.5px; }
        .cursor-gold { border-right: 1.5px solid #C9A84C; animation: blink-gold 1s infinite; margin-left: 2px; height: 14px; display: inline-block; }
        @keyframes blink-gold { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
      <div className="gold-line" />
      <div className="gold-line-top" />
      <div className="live-pill">
        <span className="live-dot" />
        <span className="live-word">LIVE</span>
      </div>
      {parsed ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span className="live-region">[{parsed.region}]</span>
          <span className="live-name">{parsed.name}</span>
          <span className="live-count">{parsed.count}</span>
          <span className="live-unit">명</span>
        </div>
      ) : (
        <span className="live-default">{displayText}<span className="cursor-gold" /></span>
      )}
    </div>
  )
}

export default LiveCount
