import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE } from '../data/barDatabase'

const LIVE_MESSAGES = [
  "오늘 밤도 전국 플로어는 뜨겁습니다 🔥",
  "지금 이 순간, 어딘가에서 음악이 흐르고 있어요 🎵",
  "오늘 밤 파티, 아직 자리 있어요 💃",
  "전국 댄서들이 지금 움직이고 있어요 ✨",
  "플로어 위에서 만나요, 오늘 밤 🌙",
  "음악이 있는 곳에 당신의 밤이 있어요 🎶",
  "처음이어도 괜찮아요, 파티는 열려 있어요 🚪",
  "지금 근처 파티를 찾아보세요 📍",
  "오늘 밤의 선택이 새로운 인연을 만들어요 💫",
  "전국 어디서든, 만원이면 충분해요 🎉",
  "좋은 음악, 좋은 사람, 오늘 밤 여기 🌟",
  "퇴근 후 뭐하지? 답은 플로어에 있어요 👟",
  "혼자여도 괜찮아요, 플로어에선 모두가 친구예요 🤝",
  "오늘 밤만큼은 특별하게 💎",
  "지금 체크인하면 오늘 밤이 달라져요 🗺️",
]

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

  // 지역별로 분리된 리포트 배열 생성
  const regionalReports = useMemo(() => {
    if (Object.keys(counts).length === 0) return LIVE_MESSAGES;

    const byRegion = {};
    Object.entries(counts).forEach(([key, count]) => {
      const [region, name] = key.split('|');
      const shortRegion = abbreviateRegion(region);
      if (!byRegion[shortRegion]) byRegion[shortRegion] = [];
      byRegion[shortRegion].push(`${name} ${count}`);
    });

    return Object.entries(byRegion).map(([reg, venues]) => `[${reg}] ${venues.join(', ')}`);
  }, [counts]);

  // 타이핑 및 지역 로테이션 효과 로직
  useEffect(() => {
    let timeout;
    const currentFullText = regionalReports[currentIndex] || '';

    if (isTyping) {
      if (displayText.length < currentFullText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, 80); // 타이핑 속도 최적화
      } else {
        setIsTyping(false);
        // 문장 완성 후 4초간 대기
        timeout = setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % regionalReports.length);
          setDisplayText('');
          setIsTyping(true);
        }, 4000); 
      }
    }
    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentIndex, regionalReports]);

  const parseReport = (text) => {
    // "[서울] 라틴 21" 형태가 포함되어 있는지 확인하여 파싱
    // 로테이션 방식이므로 하나의 텍스트 안에 여러 장소가 있을 수 있음. 
    // 여기서는 가장 앞의 장소 정보를 대표로 파싱하거나, 전체를 텍스트로 보여줌
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
        .report-content {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-family: 'Pretendard', sans-serif;
        }
        .live-region {
          color: rgba(255,255,255,0.5);
          font-size: 12px;
        }
        .live-data-text {
          color: #E8D5A3;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: -0.2px;
        }
        .cursor-gold {
          border-right: 2px solid #FFD700;
          animation: blink-gold 1s infinite;
          margin-left: 2px;
          height: 14px;
          display: inline-block;
          vertical-align: middle;
        }
        @keyframes blink-gold { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div className="live-pill">
        <span className="live-dot2" />
        <span className="live-word">LIVE</span>
      </div>

      <div className="report-content">
        <span className="live-data-text">
          {displayText}
          <span className="cursor-gold" />
        </span>
      </div>
    </div>
  )
}

export default LiveCount
