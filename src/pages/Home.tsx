import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, MapPin, Calendar, User, Music, ChevronRight, ShieldCheck, X, Home as HomeIcon, ChevronLeft, CloudSun, Utensils, Zap, PlusCircle, Languages, Bell, Globe, Navigation, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import { supabase } from '../lib/supabase';
import { BAR_DATABASE, findBarByName } from '../data/barDatabase';
import { KMA_REGION_COORDS, fetchWeatherForecast, parseKmaWeather, HOME_REGION_MAP } from '../utils/kmaApi'

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

const GENRE_MAP = {
  '바차타': { key: 'b_ratio', label: 'B', label_en: 'Bachata', color: '#FF1744' },
  '살사':   { key: 's_ratio', label: 'S', label_en: 'Salsa', color: '#FF1744' },
  '쥬크':   { key: 'j_ratio', label: 'J', label_en: 'Zouk', color: '#FF1744' },
  '키좀바': { key: 'k_ratio', label: 'K', label_en: 'Kizomba', color: '#FF1744' },
};

const REGION_FILTER = {
  '서울': (p) => p.broadRegion === '서울',
  '경기/인천': (p) => p.broadRegion === '경기/인천',
  '경상도': (p) => p.broadRegion === '경상도',
  '전라도': (p) => p.broadRegion === '전라도',
  '충청도': (p) => p.broadRegion === '충청도',
  '강원/제주': (p) => p.broadRegion === '강원/제주',
  '인천': (p) => p.broadRegion === '경기/인천',
  '부산': (p) => p.broadRegion === '경상도',
  '대구': (p) => p.broadRegion === '경상도',
  '대전': (p) => p.broadRegion === '충청도',
  '광주': (p) => p.broadRegion === '전라도',
  '기타': (p) => true
};
const MAIN_REGIONS = ['서울', '경기/인천', '경상', '전라', '충청', '강원/제주'];
const REGION_MAP_EN = {
  '서울': 'Seoul', '경기/인천': 'Gyeonggi/Incheon', '경상도': 'Gyeongsang', 
  '전라도': 'Jeolla', '충청도': 'Chungcheong', '강원/제주': 'Gangwon/Jeju'
};

const PosterImage = ({ src, onClick, alt = "파티 포스터" }) => {
  const imgRef = useRef();
  const onUpdate = ({ x, y, scale }) => { if (imgRef.current) imgRef.current.style.transform = make3dTransformValue({ x, y, scale }); };
  return (
    <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', borderRadius: '12px', background: '#000', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <QuickPinchZoom onUpdate={onUpdate} wheelScaleFactor={500} tapZoomFactor={2}>
        <img ref={imgRef} src={src} alt={alt} onClick={onClick} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', willChange: 'transform' }} />
      </QuickPinchZoom>
    </div>
  );
};

const PartyCard = ({ item, onSelect, liveCount = 0 }) => {
  const isTimeLive = (() => {
    const now = new Date();
    const pDate = new Date(item.date);
    const startStr = (item.time?.split('-')[0] || '20:00').trim();
    let [sH, sM] = [20, 0];
    if (startStr.includes(':')) {
      const parts = startStr.split(':').map(Number);
      sH = parts[0]; sM = parts[1] || 0;
    }
    const startDate = new Date(pDate);
    startDate.setHours(sH, sM, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 7);
    const startWithBuffer = new Date(startDate.getTime() - 30 * 60 * 1000);
    return now >= startWithBuffer && now <= endDate;
  })();

  const isLive = isTimeLive || liveCount > 0;
  const cleanTitle = item.title?.split(' ㅣ ')[0] || '';
  const displayFee = (() => {
    if (!item.fee) return '1.2만';
    const f = String(item.fee);
    if (f.includes('만')) return f.replace('원', '');
    const num = parseInt(f.replace(/[^0-9]/g, ''));
    if (isNaN(num) || num === 0) return '무료';
    return (num / 10000).toFixed(1).replace('.0', '') + '만';
  })();

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center',
        backgroundColor: '#FFFFFF', 
        borderRadius: '16px', 
        padding: '12px 16px',
        gap: '12px',
        borderBottom: '1px solid #F1F5F9',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '4px',
        width: '100%'
      }}
    >
      {/* 0열: 포스터 */}
      <div 
        onClick={() => onSelect(item.poster_url)} 
        style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
      </div>

      {/* 1열: 장소명 & 라이브 배지 */}
      <div style={{ width: '85px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ fontSize: '11px', fontWeight: '900', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.locationName || '장소미정'}
          </span>
          <Navigation size={10} color="#FF1744" fill="#FF1744" style={{ flexShrink: 0 }} />
        </div>
        {isLive && (
          <div style={{ 
            background: '#FF1744', color: '#fff', fontSize: '8px', fontWeight: '950',
            padding: '1px 4px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', gap: '2px', alignSelf: 'flex-start'
          }}>
            LIVE ● {liveCount || 0}
          </div>
        )}
      </div>

      {/* 2열: 타이틀 */}
      <div 
        onClick={() => onSelect(item.poster_url)} 
        style={{ flex: 1, minWidth: 0 }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B', margin: 0, lineHeight: '1.4', wordBreak: 'keep-all' }}>
          {cleanTitle.replace(/^\[.*?\]\s*|서울\s*|전국\s*/g, '')}
        </h3>
      </div>

      {/* 3열: 날짜/요일 + 가격 + 음악비율 */}
      <div style={{ width: '75px', flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B' }}>
          {(() => { const d = new Date(item.date); return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_KOR[d.getDay()]})`; })()}
        </div>
        <div style={{ fontSize: '13px', fontWeight: '950', color: '#FF1744' }}>{displayFee}</div>
        <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '900', background: '#F8FAFC', padding: '1px 4px', borderRadius: '4px', alignSelf: 'flex-end' }}>
          {Object.entries(GENRE_MAP).filter(([_, info]) => item[info.key] > 0).map(([_, info]) => `${info.label}${item[info.key]}`).join('')}
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ 
  parties, lessons, loading, selectedMonth, setSelectedMonth, selectedWeek, setSelectedWeek, 
  selectedDate, setSelectedDate, selectedRegion, setSelectedRegion, isExpanded, setIsExpanded,
  view, setView, setSelectedPoster, fetchParties, formatItemDate, formatFee, filteredParties, weekData,
  resetToToday, showFullCalendar, setShowFullCalendar, likedIds, toggleLike, logActivity, handleRegister, fourteenDays,
  showFilterPanel, setShowFilterPanel, filterRegion, setFilterRegion, filterGenre, setFilterGenre,
  showFilteredResults, setShowFilteredResults, isMenuOpen, setIsMenuOpen, showWeather, setShowWeather,
  showLatinModal, setShowLatinModal, showSaju, latinCat, setLatinCat, selPatternId, setSelPatternId, regionalTheme, recordTraffic, IncheonBanner, venueCounts, openAnalysis,
  showGridModal, setShowGridModal, gridRegion, setGridRegion, filterStep, setFilterStep,
  handleOpenModal, handleCloseModal
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [liveCounts, setLiveCounts] = useState({});

  useEffect(() => {
    const fetchLiveCounts = async () => {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      try {
        const { data: checkins } = await supabase
          .from('bar_checkins')
          .select('bar_name')
          .gte('checked_in_at', thirtyMinsAgo.toISOString());
        
        if (checkins) {
          const grouped = checkins.reduce((acc, curr) => {
            if (!curr.bar_name) return acc;
            acc[curr.bar_name] = (acc[curr.bar_name] || 0) + 1;
            return acc;
          }, {});
          setLiveCounts(grouped);
        }
      } catch (err) {
        console.error('Home LiveCount fetch error:', err);
      }
    };

    fetchLiveCounts();
    const channel = supabase
      .channel('home_live_checkins')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bar_checkins' }, () => fetchLiveCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const [isPaused, setIsPaused] = useState(false);
  const [weatherMap, setWeatherMap] = useState({});
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const isAfter9AM = useMemo(() => {
    const now = new Date();
    return now.getHours() >= 9;
  }, []);
  const scrollRef = useRef(null);
  const regionListRef = useRef(null);
  const [shuffleOffset, setShuffleOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShuffleOffset(prev => prev + 1);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadRegionalWeather = async () => {
      const weatherResults = {};
      await Promise.all(Object.entries(HOME_REGION_MAP).map(async ([homeName, kmaName]) => {
        const coords = KMA_REGION_COORDS[kmaName];
        if (coords) {
          const data = await fetchWeatherForecast(coords.nx, coords.ny);
          if (data) {
            const parsed = parseKmaWeather(data.sky, data.pty);
            weatherResults[homeName] = { icon: parsed.icon, temp: data.t1h };
          }
        }
      }));
      setWeatherMap(weatherResults);
    };
    loadRegionalWeather();
  }, []);

  const carouselParties = useMemo(() => {
    const all = parties || [];
    return [...all].filter(p => p.poster_url).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [parties]);

  useEffect(() => {
    const setVh = () => { document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`); };
    window.addEventListener('resize', setVh);
    setVh();
    return () => window.removeEventListener('resize', setVh);
  }, []);

  return (
    <div className="app-container" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      
      <div style={{ padding: '28px 24px' }}>
        <p style={{ fontSize: '10px', color: '#E53935', letterSpacing: '4px', fontWeight: 700, margin: '0 0 12px' }}>SOCIAL CULTURE EXPERIENCE</p>
        <p style={{ fontSize: '13px', color: '#999', margin: '0 0 4px' }}>오늘 저녁, 혼자 집에 있을 건가요?</p>
        <p style={{ fontSize: '26px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-1px', lineHeight: 1.15 }}>전국 어디서든</p>
        <p style={{ fontSize: '26px', fontWeight: 900, color: '#E53935', margin: '0 0 14px', letterSpacing: '-1px', lineHeight: 1.15 }}>만원대면 충분해요</p>
        <div style={{ borderLeft: '3px solid #E53935', paddingLeft: '12px' }}>
          <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>바차타 · 살사 · 소셜</p>
          <p style={{ fontSize: '12px', color: '#bbb', margin: '4px 0 0' }}>도심 속 전율의 밤</p>
        </div>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#ffffff', borderBottom: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: '0 10px' }}>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '8px', padding: '10px 0', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="date-stream-bar">
          {fourteenDays.map((item) => {
            const isSelected = selectedDate === item.fullDate;
            const isHoliday = item.dayOfWeek === 0 || (item.month === '5' && item.date === '5');
            const isSaturday = item.dayOfWeek === 6;
            const dayColor = isSelected ? '#fff' : (isHoliday ? '#FF1744' : (isSaturday ? '#FF1744' : '#94A3B8'));
            const labelColor = isSelected ? '#FF1744' : (isHoliday ? '#FF1744' : (isSaturday ? '#FF1744' : '#94A3B8'));
            return (
              <div key={item.fullDate} 
                onClick={() => {
                  setSelectedDate(item.fullDate); 
                  if (regionListRef.current) {
                    regionListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '13.5%', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '10px', fontWeight: '700', color: labelColor, marginBottom: '2px' }}>{item.dayName}</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#FF1744' : 'transparent', border: item.isToday && !isSelected ? '1px solid #FF1744' : 'none' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? '#fff' : dayColor }}>{item.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '12px 10px 8px' }}>
        <div style={{ height: '32px', background: '#0f172a', borderRadius: '16px', display: 'flex', alignItems: 'center', overflow: 'hidden', padding: '0 12px' }}>
          <button onClick={() => setIsPaused(!isPaused)} style={{ background: isPaused ? '#FF1744' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 8px', marginRight: '10px', cursor: 'pointer' }}>{isPaused ? '▶ PLAY' : '⏸ STOP'}</button>
          <div style={{ flex: 1, overflow: 'hidden' }} />
        </div>
      </div>

      <div ref={scrollRef} style={{ width: '100%', background: '#fff' }}>
        <div style={{ minHeight: '101%' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '120px' }}>{Array(6).fill(0).map((_, i) => <div key={i} style={{ height: '140px', width: '100%', background: '#f9f9f9', borderBottom: '1px solid #eee' }} />)}</div>
          ) : (
            <div style={{ width: '100%', padding: '0 0 20px 0', backgroundColor: '#f2f2f2' }}>
              {carouselParties.length > 0 && (
                <div style={{ margin: '0 0 15px', padding: '10px 0 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
                  <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#FF1744' }}>HOT</span> PICK 5</h2>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => i18n.changeLanguage(i18n.language.startsWith('ko') ? 'en' : 'ko')}
                      style={{
                        background: '#F1F5F9',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        color: '#1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {i18n.language.startsWith('ko') ? '🇺🇸 EN' : '🇰🇷 KO'}
                    </motion.button>
                  </div>
                  <div style={{ width: '100%', overflow: 'hidden', padding: '10px 0' }}>
                    <motion.div animate={isPaused ? {} : { x: [0, -775] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ display: 'flex', gap: '15px', paddingLeft: '20px', width: 'max-content' }}>
                      {carouselParties.map((item) => (
                        <div key={item.id} onClick={() => handleOpenModal(setSelectedPoster, item.poster_url)} style={{ width: '140px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', position: 'relative' }}>
                          <img src={item.poster_url} style={{ width: '100%', height: '190px', objectFit: 'cover' }} alt="Pick" />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'white' }}>
                            <div style={{ fontSize: '10px', color: '#FFEB3B', fontWeight: 950, marginBottom: '2px' }}>{item.locationName}</div>
                            <div style={{ fontSize: '11px', fontWeight: '950', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{item.title}</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}
              {IncheonBanner && <IncheonBanner />}
              {(() => {
                const regions = ["서울", "경기/인천", "경상도", "전라도", "충청도", "강원/제주"];
                return regions.map((regionName) => {
                  const regionParties = (parties || [])
                    .filter(p => p.date === selectedDate)
                    .filter(p => REGION_FILTER[regionName](p))
                    .filter(p => {
                      if (filterGenre && GENRE_MAP[filterGenre]) {
                        if (!(p[GENRE_MAP[filterGenre].key] > 0)) return false;
                      }
                      return true;
                    });

                  const isFirst = regionName === '서울';

                  return (
                    <section 
                      key={regionName} 
                      ref={isFirst ? regionListRef : null}
                      style={{ marginBottom: '15px', background: '#fff' }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: '900', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF1744' }} />
                          {isEn ? (REGION_MAP_EN[regionName] || regionName) : regionName}
                        </div>
                        <button 
                          onClick={() => {
                            setGridRegion(regionName);
                            handleOpenModal(setShowGridModal, true);
                          }}
                          style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          {isEn ? 'View All' : '전체보기'} <ChevronRight size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {regionParties.length === 0 ? (
                          <div style={{ padding: '40px', background: '#F8FAFC', borderRadius: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: '700', margin: '0 15px 20px' }}>{t('no_parties')}</div>
                        ) : (() => {
                          const maxCount = regionName === '서울' ? 6 : 3;
                          return regionParties.slice(0, maxCount).map(item => {
                            const barInfo = findBarByName(item.locationName || item.studio_name);
                            return (
                              <PartyCard 
                                key={item.id} 
                                item={item} 
                                liveCount={barInfo ? (liveCounts[barInfo.name] || 0) : 0}
                                onSelect={(url) => handleOpenModal(setSelectedPoster, url)} 
                              />
                            );
                          });
                        })()}
                      </div>
                    </section>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFullCalendar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 170000 }} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', bottom: '90px', left: '10px', right: '10px', background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: 170001, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B' }}>{selectedMonth}월</span><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setSelectedMonth(m => m > 1 ? m-1 : 12)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px' }}><ChevronLeft size={18} /></button><button onClick={() => setSelectedMonth(m => m < 12 ? m+1 : 1)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px' }}><ChevronRight size={18} /></button></div></div>
                <button onClick={handleCloseModal} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E293B' }}>
                  <ChevronLeft size={28} />
                </button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', minHeight: '350px' }}>
                {!showFilterPanel && !showFilteredResults ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: d === '일' ? '#FF1744' : d === '토' ? '#FF1744' : '#999', padding: '5px 0' }}>{d}</div>)}
                    {allDatesInMonth.map((day) => {
                      if (!day.date) return <div key={Math.random()} />;
                      const isWeekend = day.dayName === '금' || day.dayName === '토';
                      const isSelected = selectedDate === day.fullDate;
                      return (
                        <div 
                          key={day.fullDate} 
                          onClick={() => { 
                            if (day.fullDate < todayStr) return;
                            setSelectedDate(day.fullDate); 
                            handleOpenModal(setShowFilterPanel, true);
                            setFilterStep(1);
                          }} 
                          style={{ height: '46px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#fff' : (day.dayName === '일' ? '#FF1744' : (isWeekend ? '#FF1744' : '#1E293B')), backgroundColor: isSelected ? '#FF1744' : 'transparent', borderRadius: '14px', cursor: day.fullDate < todayStr ? 'default' : 'pointer', opacity: day.fullDate < todayStr ? 0.3 : 1 }}
                        >
                          {day.date}
                        </div>
                      );
                    })}
                  </div>
                ) : showFilterPanel && !showFilteredResults ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    {filterStep === 1 ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                          <button onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); setShowFilteredResults(false); setFilterStep(1); }} style={{ background: '#F8FAFC', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#FF1744', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={16} /> 닫기</button>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 950, color: '#1E293B', marginBottom: '15px' }}>{t('filter_where')}</div>
                        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '15px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                          {['서울', '경기/인천', '부산', '대구', '대전', '광주', '기타'].map(r => (
                            <button key={r} onClick={() => { setFilterRegion(r); handleOpenModal(setFilterStep, 2); }} style={{ flexShrink: 0, padding: '14px 24px', borderRadius: '14px', background: filterRegion === r ? '#FF1744' : '#F8FAFC', color: filterRegion === r ? '#fff' : '#64748B', fontWeight: 700, border: 'none', transition: 'all 0.2s' }}>{r}</button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                          <button onClick={handleCloseModal} style={{ background: '#F8FAFC', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><ChevronLeft size={16} /> 지역 다시 선택</button>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 950, color: '#1E293B', marginBottom: '15px' }}>{t('filter_genre')}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                          {['바차타', '살사', '쥬크', '키좀바'].map(g => (
                            <button key={g} onClick={() => { setFilterGenre(g); handleOpenModal(setShowFilteredResults, true); }} style={{ padding: '24px 15px', borderRadius: '18px', background: filterGenre === g ? '#1E293B' : '#F8FAFC', color: filterGenre === g ? '#fff' : '#64748B', fontWeight: 800, fontSize: '16px', border: 'none' }}>{g}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <button onClick={handleCloseModal} style={{ background: '#F8FAFC', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><ChevronLeft size={16} /> 장르 다시 선택</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {(() => {
                        const filtered = filteredParties.filter(p => {
                          const filterFn = REGION_FILTER[filterRegion];
                          if (filterRegion && filterFn) {
                            if (!filterFn(p)) return false;
                          }
                          if (filterGenre && GENRE_MAP[filterGenre]) {
                            if (!(p[GENRE_MAP[filterGenre].key] > 0)) return false;
                          }
                          return true;
                        });

                        return filtered.length === 0 ? (
                          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>해당 조건의 파티가 없습니다 😅</div>
                        ) : (
                          filtered.map(party => {
                            const barInfo = findBarByName(party.locationName || party.studio_name);
                            return (
                              <PartyCard 
                                key={party.id} 
                                item={party} 
                                liveCount={barInfo ? (liveCounts[barInfo.name] || 0) : 0}
                                onSelect={(url) => handleOpenModal(setSelectedPoster, url)} 
                              />
                            );
                          })
                        );
                      })()}
                    </div>
                    <button onClick={handleCloseModal} style={{ width: '100%', height: '54px', borderRadius: '16px', background: '#1E293B', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', marginTop: '20px' }}>확인 완료</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGridModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={handleCloseModal} 
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 180000 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ 
                position: 'fixed', 
                inset: 0, 
                background: '#000', 
                zIndex: 180001, 
                display: 'flex', 
                flexDirection: 'column',
                height: '100dvh',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
              }}
            >
              <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button 
                    onClick={handleCloseModal}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF1744' }} />
                    {gridRegion} 전체보기
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '2px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '2px' 
                }}>
                  {(() => {
                    const filtered = filteredParties.filter(p => {
                      const filterFn = REGION_FILTER[gridRegion];
                      return filterFn ? filterFn(p) : true;
                    });
                    return filtered.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          handleOpenModal(setSelectedPoster, item.poster_url);
                        }}
                        style={{ aspectRatio: '3/4', overflow: 'hidden', background: '#111', position: 'relative' }}
                      >
                        <img 
                          src={item.poster_url} 
                          alt="Poster" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 5px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: '#fff' }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.locationName}</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                {filteredParties.filter(p => {
                  const filterFn = REGION_FILTER[gridRegion];
                  return filterFn ? filterFn(p) : true;
                }).length === 0 && (
                  <div style={{ padding: '100px 0', textAlign: 'center', color: '#64748B', fontWeight: '700' }}>해당 지역에 등록된 파티가 없습니다.</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HomePage
