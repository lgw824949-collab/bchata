import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE } from '../data/barDatabase'

const LiveCount = () => {
  const [counts, setCounts] = useState({})
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

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
    end.setHours(3, 0, 0, 0)
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
      if (!parties || parties.length === 0) { setCounts({}); return; }
      const locationMap = (locations || []).reduce((acc, loc) => { acc[loc.id] = loc.name; return acc; }, {});
      const liveBarNames = parties
        .filter(p => isNowInPartyTime(p.date, p.time))
        .map(p => locationMap[p.location_id] || p.locationName)
        .filter(Boolean)
      if (liveBarNames.length === 0) { setCounts({}); return; }
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
      const { data: checkins } = await supabase.from('bar_checkins').select('bar_name, region').in('bar_name', liveBarNames).gte('checked_in_at', thirtyMinsAgo.toISOString())
      if (checkins) {
        const grouped = checkins.reduce((acc, curr) => {
          if (!curr.bar_name) return acc;
          const key = `${curr.region || '전국'}|${curr.bar_name}`
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})
        setCounts(grouped)
      }
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    fetchCounts()
    const channel = supabase.channel('live_checkins').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bar_checkins' }, () => fetchCounts()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const abbreviateRegion = (region) => {
    const maps = { '서울특별시': '서울', '인천광역시': '인천', '부산광역시': '부산', '경기도': '경기', '충청도': '충청', '전라도': '전라', '경상도': '경상' };
    return maps[region] || region;
  };

  const fullReport = useMemo(() => {
    if (Object.keys(counts).length === 0) return '🎵 전국 소셜 파티 실시간 인원 중계 중! 🔥';

    const byRegion = {};
    Object.entries(counts).forEach(([key, count]) => {
      const [region, name] = key.split('|');
      const shortRegion = abbreviateRegion(region);
      if (!byRegion[shortRegion]) byRegion[shortRegion] = [];
      byRegion[shortRegion].push(`${name} ${count}`);
    });

    return Object.entries(byRegion)
      .map(([reg, venues]) => `[${reg}] ${venues.join(', ')}`)
      .join(' | ');
  }, [counts]);

  // 타이핑 효과 로직 (속도 감속 및 정돈)
  useEffect(() => {
    let timeout;
    if (isTyping) {
      if (displayText.length < fullReport.length) {
        timeout = setTimeout(() => {
          setDisplayText(fullReport.slice(0, displayText.length + 1));
        }, 120); // 타이핑 속도 대폭 감속 (0.12초)
      } else {
        setIsTyping(false);
        timeout = setTimeout(() => {
          setIsTyping(true);
          setDisplayText('');
        }, 5000); // 5초 유지 후 재시작
      }
    }
    return () => clearTimeout(timeout);
  }, [displayText, isTyping, fullReport]);

  return (
    <div style={{ background: '#0F172A', height: '36px', display: 'flex', alignItems: 'center', padding: '0 4px', position: 'relative' }}>
      <style>{`
        .neon-line { position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #39FF14, transparent); box-shadow: 0 0 8px #39FF14; opacity: 0.6; }
        .live-label { background: #39FF14; color: #000; font-size: 10px; font-weight: 950; padding: 2px 6px; border-radius: 4px; margin-right: 12px; letter-spacing: 0.5px; }
        .report-text { font-family: 'Pretendard', monospace; color: #F8FAFC; font-size: 14px; font-weight: 700; letter-spacing: -0.3px; display: flex; align-items: center; }
        .cursor { border-right: 2px solid #39FF14; animation: blink 0.8s infinite; margin-left: 2px; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div className="neon-line" />
      <span className="live-label">LIVE</span>
      <div className="report-text">
        {displayText}
        <span className="cursor" />
      </div>
    </div>
  )
}

export default LiveCount
