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
    // const channel = supabase.channel('live_checkins').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bar_checkins' }, () => fetchCounts()).subscribe()
    // return () => { supabase.removeChannel(channel) }
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

  const lang = i18n.language.startsWith('en') ? 'en' : 'ko';
  const onLangChange = (l) => i18n.changeLanguage(l);
  
  const parsed = useMemo(() => {
    const text = regionalReports[currentIndex] || '';
    const match = text.match(/\[.*?\]\s*(.*?)\s+(\d+)/) || text.match(/(.*?)\s+(\d+)/);
    if (match) return { name: match[1], count: match[2] };
    return null;
  }, [regionalReports, currentIndex]);

  return (
    <div style={{ background:'#0f172a', height:'44px', display:'flex', alignItems:'center', padding:'0 16px', gap:10 }}>
      <style>{`
        .lc-tag { background:#E53935; color:#fff; font-size:9px; font-weight:900; padding:2px 7px; border-radius:3px; letter-spacing:2px; flex-shrink:0; }
        .lc-dot { width:5px; height:5px; background:#E53935; border-radius:50%; flex-shrink:0; animation:lc-blink 1s infinite; }
        @keyframes lc-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .lc-name { color:rgba(255,255,255,0.8); font-size:13px; font-family:monospace; margin-right:8px; }
        .lc-count { color:#E53935; font-size:18px; font-weight:900; font-family:monospace; }
        .lc-default { color:rgba(255,255,255,0.5); font-size:12px; font-family:monospace; }
        .lc-lang { display:flex; margin-left:auto; flex-shrink:0; }
        .lc-lang-btn { background:transparent; border:none; color:rgba(255,255,255,0.3); font-size:10px; font-weight:700; padding:4px 8px; cursor:pointer; letter-spacing:1px; }
        .lc-lang-btn.on { color:#E53935; }
      `}</style>
      <span className="lc-tag">LIVE</span>
      <span className="lc-dot" />
      {parsed ? (
        <div style={{ display:'flex', alignItems:'center', flex:1, minWidth:0 }}>
          <span className="lc-name">{parsed.name}</span>
          <span className="lc-count">{parsed.count}</span>
        </div>
      ) : (
        <span className="lc-default" style={{ flex:1 }}>{displayText}</span>
      )}
      <div className="lc-lang">
        <button className={`lc-lang-btn${lang==='ko'?' on':''}`} onClick={() => onLangChange && onLangChange('ko')}>KO</button>
        <span style={{ color:'rgba(255,255,255,0.2)', fontSize:10, alignSelf:'center' }}>|</span>
        <button className={`lc-lang-btn${lang==='en'?' on':''}`} onClick={() => onLangChange && onLangChange('en')}>EN</button>
      </div>
    </div>
  )
}

export default LiveCount
