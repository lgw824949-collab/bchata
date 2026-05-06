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

  const parseReport = (text) => {
    // "[서울] 라틴 21" → { region: "서울", name: "라틴", count: "21" } 형태로 파싱
    const match = text.match(/\[(.+?)\]\s*(.+?)\s+(\d+)/)
    if (match) return { region: match[1], name: match[2], count: match[3] }
    return null
  }
  const parsed = parseReport(displayText)

  return (
    <div style={{
      background: 'transparent',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      position: 'relative',
    }}>
      <style>{`
        .live-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          border: 1px solid rgba(201,168,76,0.6);
          border-radius: 20px;
          padding: 3px 10px 3px 7px;
          margin-right: 12px;
          flex-shrink: 0;
          background: rgba(0,0,0,0.25);
        }
        .live-dot2 {
          width: 6px;
          height: 6px;
          background: #FFD700;
          border-radius: 50%;
          animation: pulse2 1.5s ease-in-out infinite;
        }
        @keyframes pulse2 {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #FFD700; }
          50% { opacity: 0.3; box-shadow: none; }
        }
        .live-word {
          color: #FFD700;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }
        .live-region {
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          margin-right: 6px;
        }
        .live-name {
          color: #E8D5A3;
          font-size: 13px;
          font-weight: 500;
          margin-right: 8px;
        }
        .live-count {
          color: #FFD700;
          font-size: 18px;
          font-weight: 800;
          animation: blink-count 1.2s ease-in-out infinite;
          letter-spacing: -0.5px;
        }
        @keyframes blink-count {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .live-unit {
          color: rgba(201,168,76,0.7);
          font-size: 11px;
          margin-left: 2px;
        }
        .live-default {
          color: rgba(232,213,163,0.6);
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.5px;
        }
      `}</style>

      <div className="live-pill">
        <span className="live-dot2" />
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
        <span className="live-default">{displayText}</span>
      )}
    </div>
  )
}

export default LiveCount
