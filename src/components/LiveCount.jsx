import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

const LiveCount = () => {
  const { t, i18n } = useTranslation()
  const [counts, setCounts] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  const liveMessages = useMemo(() => [
    t('live_msg_1'), t('live_msg_2'), t('live_msg_3'), t('live_msg_4'), t('live_msg_5'),
    t('live_msg_6'), t('live_msg_7'), t('live_msg_8'), t('live_msg_9'), t('live_msg_10'),
    t('live_msg_11'), t('live_msg_12'), t('live_msg_13'), t('live_msg_14'), t('live_msg_15')
  ], [t])

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
    const maps = { 
      '서울특별시': '서울', '인천광역시': '인천', '부산광역시': '부산', 
      '경기도': '경기', '충청도': '충청', '전라도': '전라', '경상도': '경상' 
    };
    const short = maps[region] || region;
    
    const translationKeys = {
      '서울': 'region_seoul',
      '인천': 'region_incheon',
      '부산': 'region_busan',
      '경기': 'region_gyeonggi_incheon',
      '충청': 'region_chungcheong',
      '전라': 'region_jeolla',
      '경상': 'region_gyeongsang',
      '전국': 'Nationwide'
    };
    
    return t(translationKeys[short] || short);
  };

  const regionalReports = useMemo(() => {
    if (Object.keys(counts).length === 0) return liveMessages;

    const byRegion = {};
    Object.entries(counts).forEach(([key, count]) => {
      const [region, name] = key.split('|');
      const translatedRegion = abbreviateRegion(region);
      if (!byRegion[translatedRegion]) byRegion[translatedRegion] = [];
      byRegion[translatedRegion].push(`${name} ${count}`);
    });

    return Object.entries(byRegion).map(([reg, venues]) => `[${reg}] ${venues.join(', ')}`);
  }, [counts, liveMessages, t]);

  useEffect(() => {
    let timeout;
    const currentFullText = regionalReports[currentIndex] || '';

    if (isTyping) {
      if (displayText.length < currentFullText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, 80);
      } else {
        setIsTyping(false);
        timeout = setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % regionalReports.length);
          setDisplayText('');
          setIsTyping(true);
        }, 4000); 
      }
    }
    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentIndex, regionalReports]);

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
          position: relative;
          top: 2px;
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
