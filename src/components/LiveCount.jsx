import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE } from '../data/barDatabase'

const LiveCount = () => {
  const [counts, setCounts] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
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

  const items = useMemo(() => {
    const list = Object.entries(counts)
      .filter(([_, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => {
        const parts = key.split('|');
        return `[${abbreviateRegion(parts[0])}] ${parts[1]} ${count}`;
      });
    return list.length > 0 ? list : ['🎵 전국 소셜 파티 실시간 인원 중계 중! 🔥'];
  }, [counts]);

  // 타이핑 효과 로직
  useEffect(() => {
    let timeout;
    const currentFullText = items[currentIndex];

    if (isTyping) {
      if (displayText.length < currentFullText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, 50); // 타이핑 속도
      } else {
        setIsTyping(false);
        timeout = setTimeout(() => setIsTyping(true), 3000); // 3초 유지 후 다음으로
      }
    } else {
      // 다음 텍스트로 전환
      setDisplayText('');
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setIsTyping(true);
    }
    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentIndex, items]);

  return (
    <div style={{ background: '#0F172A', height: '36px', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
      <style>{`
        .live-pulse-dot { width: 6px; height: 6px; background: #FF5722; border-radius: 50%; margin-right: 12px; position: relative; box-shadow: 0 0 12px #FF5722; }
        .live-pulse-dot::after { content: ''; position: absolute; inset: -4px; border: 1px solid #FF5722; border-radius: 50%; animation: pulse-ring 1.5s infinite; }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
        .typewriter-text { font-family: 'Pretendard', monospace; color: #F8FAFC; font-size: 15px; font-weight: 800; letter-spacing: -0.2px; }
        .cursor { border-right: 2px solid #FF5722; animation: blink 0.7s infinite; margin-left: 2px; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div className="live-pulse-dot" />
      <div className="typewriter-text">
        {displayText}
        <span className="cursor" />
      </div>
    </div>
  )
}

export default LiveCount
