import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import {
  LOCATIONS_WITH_REGION_NAME,
  logSupabaseError,
  resolveLocationRegionLabel,
} from '../lib/locationsQuery'
import { PARTIES_SELECT, logPartiesFetchError } from '../lib/partiesQuery'

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
      const [partiesRes, locationsRes] = await Promise.all([
        supabase.from('parties').select(PARTIES_SELECT).in('date', [todayStr, yesterdayStr]),
        supabase.from('locations').select(LOCATIONS_WITH_REGION_NAME),
      ])

      if (partiesRes.error) {
        logPartiesFetchError(partiesRes.error)
        throw partiesRes.error
      }
      if (locationsRes.error) {
        logSupabaseError('LiveCount.locations', locationsRes.error)
        throw locationsRes.error
      }

      const parties = partiesRes.data
      const locations = locationsRes.data

      if (!parties || parties.length === 0) { setCounts({}); return; }

      const locationMap = (locations || []).reduce((acc, loc) => {
        acc[loc.id] = {
          name: loc.name,
          region: resolveLocationRegionLabel(loc),
        }
        return acc
      }, {})

      const liveParties = parties.filter(p => isNowInPartyTime(p.date, p.time))
      if (liveParties.length === 0) { setCounts({}); return; }

      const grouped = liveParties.reduce((acc, p) => {
        const loc = locationMap[p.location_id]
        const region = loc?.region || '\uc804\uad6d'
        const key = `${region}|\ud30c\ud2f0`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      grouped['\uc804\uad6d|total'] = liveParties.length
      setCounts(grouped)
    } catch (err) {
      logPartiesFetchError(err)
      console.error('[LiveCount] fetchCounts failed:', err)
    }
  }

  useEffect(() => {
    fetchCounts()
    // const channel = supabase.channel('live_checkins').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bar_checkins' }, () => fetchCounts()).subscribe()
    // return () => { supabase.removeChannel(channel) }
  }, [])

  const abbreviateRegion = (region) => {
    const maps = {
      '\uc11c\uc6b8\ud2b9\ubcc4\uc2dc': '\uc11c\uc6b8',
      '\uc778\ucc9c\uad11\uc5ed\uc2dc': '\uc778\ucc9c',
      '\ubd80\uc0b0\uad11\uc5ed\uc2dc': '\ubd80\uc0b0',
      '\uacbd\uae30\ub3c4': '\uacbd\uae30',
      '\ucda9\uccad\ub3c4': '\ucda9\uccad',
      '\uc804\ub77c\ub3c4': '\uc804\ub77c',
      '\uacbd\uc0c1\ub3c4': '\uacbd\uc0c1',
      '\uac15\uc6d0\ub3c4': '\uac15\uc6d0',
    };
    const short = maps[region] || region;

    const translationKeys = {
      '\uc11c\uc6b8': 'region_seoul',
      '\uc778\ucc9c': 'region_incheon',
      '\ubd80\uc0b0': 'region_busan',
      '\uacbd\uae30': 'region_gyeonggi_incheon',
      '\ucda9\uccad': 'region_chungcheong',
      '\uc804\ub77c': 'region_jeolla',
      '\uacbd\uc0c1': 'region_gyeongsang',
      '\uc804\uad6d': 'Nationwide',
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
    <div style={{ background:'#0f172a', height:'44px', display:'flex', alignItems:'center', padding:'0 16px', gap:8, overflowX:'auto' }}>
      <style>{`
        .lc-tag { background:#E53935; color:#fff; font-size:9px; font-weight:900; padding:2px 7px; border-radius:3px; letter-spacing:2px; flex-shrink:0; }
        .lc-dot { width:5px; height:5px; background:#E53935; border-radius:50%; flex-shrink:0; animation:lc-blink 1s infinite; }
        @keyframes lc-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .lc-lang { display:flex; margin-left:auto; flex-shrink:0; }
        .lc-lang-btn { background:transparent; border:none; color:rgba(255,255,255,0.3); font-size:10px; font-weight:700; padding:4px 8px; cursor:pointer; letter-spacing:1px; }
        .lc-lang-btn.on { color:#E53935; }
      `}</style>
      <span className="lc-tag">LIVE</span>
      <span className="lc-dot" />
      {counts['\uc804\uad6d|total'] ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <span style={{ color:'#ffffff', fontSize:'12px', fontWeight:700, whiteSpace:'nowrap' }}>
            {'\uc804\uad6d '}{counts['\uc804\uad6d|total']}{'\uac1c \ud30c\ud2f0 \uc9c4\ud589\uc911'}
          </span>
          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:10 }}>|</span>
          {Object.entries(counts)
            .filter(([k]) => !k.includes('\uc804\uad6d'))
            .map(([k, v]) => {
              const region = abbreviateRegion(k.split('|')[0])
              return (
                <span key={k} style={{ color:'rgba(255,255,255,0.7)', fontSize:'11px', whiteSpace:'nowrap' }}>
                  {region} <span style={{ color:'#E53935', fontWeight:900 }}>{v}</span>
                </span>
              )
            })
          }
        </div>
      ) : (
        <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', flex:1 }}>{displayText}</span>
      )}
      <div className="lc-lang">
        <button className={`lc-lang-btn${lang==='ko'?' on':''}`} onClick={() => onLangChange('ko')}>KO</button>
        <span style={{ color:'rgba(255,255,255,0.2)', fontSize:10, alignSelf:'center' }}>|</span>
        <button className={`lc-lang-btn${lang==='en'?' on':''}`} onClick={() => onLangChange('en')}>EN</button>
      </div>
    </div>
  )
}

export default LiveCount
