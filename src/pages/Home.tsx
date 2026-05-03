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
        borderRadius: '12px', 
        padding: '10px 16px',
        gap: '12px',
        borderBottom: '1px solid #F1F5F9',
        cursor: 'pointer',
        width: '100%',
        minHeight: '70px'
      }}
    >
      {/* 포스터 (썸네일) */}
      <div 
        onClick={() => onSelect(item.poster_url)} 
        style={{ width: '50px', height: '50px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}
      >
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
      </div>

      {/* 1열: 라틴 LIVE -> 지도 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: '950', color: '#1E293B', whiteSpace: 'nowrap' }}>{item.locationName || '라틴'}</span>
        {isLive && (
          <div style={{ 
            background: '#FF1744', color: '#fff', fontSize: '8px', fontWeight: '950',
            padding: '1.5px 4px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap'
          }}>
            LIVE ● {liveCount || 0}
          </div>
        )}
        <div style={{ marginLeft: '4px', display: 'flex', alignItems: 'center' }}>
          <Navigation size={12} color="#FF1744" fill="#FF1744" />
        </div>
      </div>

      {/* 2열: 타이틀 (한 줄로 쭉!) */}
      <div 
        onClick={() => onSelect(item.poster_url)} 
        style={{ flex: 1, minWidth: 0 }}
      >
        <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cleanTitle.replace(/^\[.*?\]\s*|서울\s*|전국\s*/g, '')}
        </h3>
      </div>

      {/* 3열: 날짜 요일 금액 비율 (옆으로 나란히!) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', whiteSpace: 'nowrap' }}>
          {(() => { const d = new Date(item.date); return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_KOR[d.getDay()]})`; })()}
        </div>
        <div style={{ fontSize: '12px', fontWeight: '950', color: '#FF1744', whiteSpace: 'nowrap' }}>{displayFee}</div>
        <div style={{ fontSize: '8px', color: '#94A3B8', fontWeight: '900', background: '#F1F5F9', padding: '1px 3px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
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
    </div>
  )
}

export default HomePage
