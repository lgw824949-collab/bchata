import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, MapPin, Calendar, User, Music, ChevronRight, ShieldCheck, X, Home as HomeIcon, ChevronLeft, CloudSun, Utensils, Zap, PlusCircle, Languages, Bell, Globe, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import LiveCount from '../components/LiveCount'
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
  // 별칭/도시별 매핑 (필터링 충돌 방지)
  '인천': (p) => p.broadRegion === '경기/인천',
  '부산': (p) => p.broadRegion === '경상도',
  '대구': (p) => p.broadRegion === '경상도',
  '대전': (p) => p.broadRegion === '충청도',
  '광주': (p) => p.broadRegion === '전라도',
  '기타': (p) => true
};
const MAIN_REGIONS = ['서울', '경기/인천', '경상', '전라', '충청', '강원/제주'];

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

const PartyCard = ({ item, onSelect }) => {
  const isLive = (() => {
    const now = new Date();
    const pDate = new Date(item.date);
    if (now.toDateString() !== pDate.toDateString()) return false;
    const startStr = item.time?.split('-')[0].trim() || '21:00';
    const [h, m] = startStr.split(':').map(Number);
    const startDate = new Date(now);
    startDate.setHours(h, m, 0, 0);
    return now >= startDate;
  })();

  const cleanTitle = item.title?.split(' ㅣ ')[0] || '';
  const displayTime = item.time?.split('-')[0].trim() || '21:00';
  const displayFee = (() => {
    if (!item.fee) return '1.2만';
    const f = String(item.fee);
    if (f.includes('만')) return f.replace('원', '');
    const num = parseInt(f.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return f;
    if (num === 0) return '무료';
    return (num / 10000).toFixed(1).replace('.0', '') + '만';
  })();

  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const openMap = (e) => {
    e.stopPropagation();
    const address = item.address || item.locationName;
    const query = encodeURIComponent(address);
    const url = isEn 
      ? `https://www.google.com/maps/search/?api=1&query=${query}`
      : `https://map.kakao.com/link/search/${query}`;
    window.open(url, '_blank');
  };

  return (
    <div 
      onClick={() => onSelect(item.poster_url)} 
      style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        border: '1px solid #EAEEF4', 
        cursor: 'pointer', 
        height: '115px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
        width: '100%' 
      }}
    >
      {/* 왼쪽: 포스터 영역 */}
      <div style={{ width: '85px', height: '115px', backgroundColor: '#f8f8f8', flexShrink: 0, position: 'relative' }}>
        <img src={item.poster_url} alt="Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {isLive && (
          <div style={{ position: 'absolute', top: '5px', left: '5px', background: '#FF1744', color: 'white', fontSize: '9px', fontWeight: '950', padding: '2px 5px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '5px', height: '5px', background: 'white', borderRadius: '50%', display: 'inline-block' }}></span>
            LIVE
          </div>
        )}
      </div>

      {/* 오른쪽: 정보 영역 (위치 -> 제목 -> 상세) */}
      <div style={{ padding: '10px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, flex: 1, height: '100%' }}>
        {/* Line 1: 위치 및 화살표 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{item.locationName}</span>
          <div onClick={openMap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFF1F0', cursor: 'pointer', color: '#E53935' }}>
            <Navigation size={10} fill="currentColor" />
          </div>
        </div>

        {/* Line 2: 파티 제목 */}
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>
          {cleanTitle}
        </div>

        {/* Line 3: 상세 뱃지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', marginTop: '6px' }}>
          {/* 날짜 뱃지 */}
          <span style={{ background: '#FEF2F2', color: '#FF1744', borderRadius: '99px', padding: '3px 9px', fontSize: '11px', fontWeight: '600' }}>
            {(() => { const d = new Date(item.date); return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_KOR[d.getDay()]})`; })()}
          </span>
          {/* 시간 뱃지 */}
          <span style={{ background: '#f1f5f9', color: '#64748B', borderRadius: '99px', padding: '3px 9px', fontSize: '11px', fontWeight: '600' }}>
            {displayTime}
          </span>
          {/* 참가비 텍스트 */}
          <span style={{ color: '#475569', fontSize: '11px', fontWeight: '800', marginLeft: '2px' }}>
            {displayFee}
          </span>
          {/* 음악비율 그룹박스 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '99px', padding: '3px 8px' }}>
            {Object.entries(GENRE_MAP).map(([name, info]) => (
              item[info.key] > 0 && <span key={name} style={{ color: info.color, fontWeight: '700', fontSize: '10px' }}>{info.label}{item[info.key]}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const RollingContainer = ({ items, onSelect }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => { if (items.length <= 1) return; const timer = setInterval(() => { setIndex((prev) => (prev + 1) % items.length); }, 3000); return () => clearInterval(timer); }, [items.length]);
  return (
    <div style={{ position: 'relative', height: '110px', width: '100%', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.div key={items[index].id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} style={{ position: 'absolute', width: '100%' }}>
          <PartyCard item={items[index]} onSelect={onSelect} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const FilterBar = ({ filterRegion, setFilterRegion, filterGenre, setFilterGenre }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const REGION_MAP_EN = {
    '서울': 'Seoul', '경기/인천': 'Gyeonggi/Incheon', '경상도': 'Gyeongsang', 
    '전라도': 'Jeolla', '충청도': 'Chungcheong', '강원/제주': 'Gangwon/Jeju'
  };
  const regions = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];
  const genres = Object.keys(GENRE_MAP);
  return (
    <div style={{ padding: '0 15px 12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#94A3B8' }}><MapPin size={16} /></div>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="filter-scroll">
          {regions.map(r => (
            <button key={r} 
              onClick={() => {
                const newVal = filterRegion === r ? '' : r;
                console.log('지역 선택:', newVal);
                setFilterRegion(newVal);
              }} 
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', background: filterRegion === r ? '#FF1744' : '#F1F5F9', color: filterRegion === r ? '#fff' : '#64748B', transition: 'all 0.2s' }}
            >
              {isEn ? REGION_MAP_EN[r] : r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#94A3B8' }}><Music size={16} /></div>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="filter-scroll">
          {genres.map(g => (
            <button key={g} 
              onClick={() => {
                const newVal = filterGenre === g ? '' : g;
                console.log('장르 선택:', newVal);
                setFilterGenre(newVal);
              }} 
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', background: filterGenre === g ? '#FF1744' : '#F1F5F9', color: filterGenre === g ? '#fff' : '#64748B', transition: 'all 0.2s' }}
            >
              {isEn ? GENRE_MAP[g].label_en : g}
            </button>
          ))}
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
  showLatinModal, setShowLatinModal, setShowSaju, latinCat, setLatinCat, selPatternId, setSelPatternId, regionalTheme, recordTraffic, IncheonBanner, venueCounts, openAnalysis,
  showGridModal, setShowGridModal, gridRegion, setGridRegion, filterStep, setFilterStep,
  handleOpenModal, handleCloseModal
}) => {
  const { t, i18n } = useTranslation();
  const [isPaused, setIsPaused] = useState(false);
  const [weatherMap, setWeatherMap] = useState({});
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
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

  const allDatesInMonth = useMemo(() => {
    const year = 2026;
    const month = selectedMonth;
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push({ date: '', fullDate: '', dayName: '', isCurrentMonth: false });
    for (let d = 1; d <= lastDate; d++) {
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, d);
      const dayNames = ['일','월','화','수','목','금','토'];
      days.push({ date: d, fullDate, dayName: dayNames[dateObj.getDay()], isCurrentMonth: true });
    }
    return days;
  }, [selectedMonth]);

  useEffect(() => {
    const setVh = () => { document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`); };
    window.addEventListener('resize', setVh);
    setVh();
    return () => window.removeEventListener('resize', setVh);
  }, []);

  return (
    <div className="app-container" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* 📌 [영역 A: 브랜드 헤더 - 스크롤되어 사라짐] */}
      <div style={{ padding: '40px 24px 28px', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', border: '1px solid #f1f5f9', borderRadius: '50%' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
          <span style={{ fontSize: '10px', color: '#FF1744', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Social Culture Experience
          </span>
          <h1 style={{ fontSize: '48px', fontWeight: 950, color: '#0f172a', letterSpacing: '-3px', lineHeight: 0.9, margin: 0 }}>
            오늘밤<span style={{ color: '#FF1744', fontStyle: 'italic', marginLeft: '-2px' }}>빠</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '2px', height: '40px', background: '#FF1744', marginTop: '4px' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
              바차타 · 살사 · 소셜
            </p>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
              만원대로 즐기는 도심 속 <span style={{ color: '#FF1744', fontWeight: 700 }}>전율의 밤</span>
            </p>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '44px', right: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '8px', color: '#cbd5e1', fontWeight: 900, letterSpacing: '1px', marginBottom: '4px' }}>EST. 2024</span>
          <div style={{ width: '24px', height: '1px', background: '#cbd5e1' }}></div>
        </div>
      </div>

      {/* 📌 [영역 B: 날짜 선택바 - 상단 고정(Sticky)] */}
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
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <motion.div animate={isPaused ? {} : { x: ['100%', '-100%'] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} style={{ whiteSpace: 'nowrap', color: '#fff', fontSize: '13px', fontWeight: '900' }}>📢 [실시간] 밤빠가 전하는 전국 소셜 파티 실시간 인원 중계 중! 🔥</motion.div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} style={{ width: '100%', background: '#fff' }}>
        <div style={{ minHeight: '101%' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '120px' }}>{Array(6).fill(0).map((_, i) => <div key={i} style={{ height: '140px', width: '100%', background: '#f9f9f9', borderBottom: '1px solid #eee' }} />)}</div>
          ) : (
            <div style={{ width: '100%', padding: '0 0 20px 0', backgroundColor: '#f2f2f2' }}>
              <LiveCount />
              {carouselParties.length > 0 && (
                <div style={{ margin: '0 0 15px', padding: '10px 0 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
                  <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#FF1744' }}>HOT</span> PICK 5</h2>
                    {/* 언어 토글 버튼 이동 배치 */}
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
                              <div style={{ fontSize: '8px', fontWeight: 950, color: '#fff', display: 'flex', gap: '2px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>{(() => { const d = new Date(item.date); return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_KOR[d.getDay()]})`; })()}</span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>{item.time?.split('-')[0].trim() || '21:00'}</span>
                                <span style={{ background: 'rgba(255,235,59,0.3)', color: '#FFEB3B', padding: '1px 4px', borderRadius: '4px' }}>{(() => { if (!item.fee) return '1.2만'; const f = String(item.fee); if (f.includes('만')) return f.replace('원', ''); const num = parseInt(f.replace(/[^0-9]/g, '')); if (isNaN(num)) return f; return (num/10000).toFixed(1).replace('.0', '') + '만'; })()}</span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                                  {Object.entries(GENRE_MAP).filter(([_, info]) => item[info.key] > 0).map(([_, info]) => `${info.label}${item[info.key]}`).join('')}
                                </span>
                              </div>
                            </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}
              {IncheonBanner && <IncheonBanner />}
              {(() => {
                const regions = filterRegion ? [filterRegion] : ["서울", "경기/인천", "경상도", "전라도", "충청도", "강원/제주"];
                return regions.map((regionName) => {
                  const regionParties = filteredParties.filter(p => {

                    // 1. 지역 조건 매칭
                    const filterFn = REGION_FILTER[regionName];
                    if (filterFn && !filterFn(p)) return false;
                    
                    // 2. 장르 조건 매칭
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
                          {regionName}
                        </div>
                        <button 
                          onClick={() => {
                            setGridRegion(regionName);
                            handleOpenModal(setShowGridModal, true);
                          }}
                          style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          전체보기 <ChevronRight size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 15px 20px' }}>
                        {regionParties.length === 0 ? (
                          <div style={{ padding: '30px', color: '#94A3B8', textAlign: 'center' }}>{t('no_parties')}</div>
                        ) : (() => {
                          const offset = shuffleOffset % regionParties.length;
                          const rotated = [...regionParties.slice(offset), ...regionParties.slice(0, offset)];
                          return rotated.slice(0, regionName === '서울' ? 3 : 2).map(item => (
                            <PartyCard key={item.id} item={item} onSelect={(url) => handleOpenModal(setSelectedPoster, url)} />
                          ));
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
                            // 모든 날짜 클릭 시 3단계 필터 필터 플로우 활성화
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                      {(() => {
                        const filtered = filteredParties.filter(p => {
                          // 지역 필터 적용
                          const filterFn = REGION_FILTER[filterRegion];
                          if (filterRegion && filterFn) {
                            if (!filterFn(p)) return false;
                          }

                          // 장르 필터 적용
                          if (filterGenre && GENRE_MAP[filterGenre]) {
                            if (!(p[GENRE_MAP[filterGenre].key] > 0)) return false;
                          }
                          return true;
                        });



                        return filtered.length === 0 ? (
                          <div style={{ gridColumn: 'span 2', padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>해당 조건의 파티가 없습니다 😅</div>
                        ) : (
                          filtered.map(party => {
                            const cleanTitle = party.title?.split(' ㅣ ')[0] || '';
                            const addr = party.address || '';
                            let displayRegion = '전국';
                            if (addr.includes('서울')) displayRegion = '서울';
                            else if (addr.includes('경기')) displayRegion = '경기';
                            else if (addr.includes('인천')) displayRegion = '인천';
                            else if (addr.includes('부산')) displayRegion = '부산';
                            else if (addr.includes('대구')) displayRegion = '대구';
                            else if (addr.includes('대전')) displayRegion = '대전';
                            else if (addr.includes('광주')) displayRegion = '광주';

                            return (
                              <div key={party.id} onClick={() => handleOpenModal(setSelectedPoster, party.poster_url)} style={{ aspectRatio: '1 / 1.4', borderRadius: '12px', overflow: 'hidden', position: 'relative', background: '#F1F5F9', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <img src={party.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
                                {(() => {
                                  const now = new Date();
                                  const pDate = new Date(party.date);
                                  const startStr = party.time?.split('-')[0].trim() || '21:00';
                                  const [h, m] = startStr.split(':').map(Number);
                                  const startDate = new Date(now);
                                  startDate.setHours(h, m, 0, 0);
                                  if (now.toDateString() === pDate.toDateString() && now >= startDate) {
                                    return (
                                      <div style={{ position: 'absolute', top: '35px', left: '8px', background: '#FF1744', color: 'white', fontSize: '9px', fontWeight: '950', padding: '2px 5px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 10 }}>
                                        <span style={{ width: '5px', height: '5px', background: 'white', borderRadius: '50%', display: 'inline-block' }}></span>
                                        LIVE
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(255, 255, 255, 0.9)', color: '#1E293B', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>{displayRegion}</div>
                                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  {Object.entries(GENRE_MAP).map(([name, info]) => (
                                    party[info.key] > 0 && <span key={name} style={{ background: `${info.color}F2`, color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 950 }}>{info.label}{party[info.key]}</span>
                                  ))}
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'white' }}>
                                  <div style={{ fontSize: '11px', color: '#FFEB3B', fontWeight: 950, marginBottom: '3px' }}>{party.locationName}</div>
                                  <div style={{ fontSize: '13px', fontWeight: 950, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '5px' }}>{cleanTitle}</div>
                                  <div style={{ fontSize: '9px', fontWeight: 900, color: '#fff', display: 'flex', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>{(() => { const d = new Date(party.date); return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_KOR[d.getDay()]})`; })()}</span>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>{party.time?.split('-')[0].trim() || '21:00'}</span>
                                    <span style={{ color: '#94A3B8', fontWeight: 950, fontSize: '11px' }}>{(() => { if (!party.fee) return '1.2만'; const f = String(party.fee); if (f.includes('만')) return f.replace('원', ''); const num = parseInt(f.replace(/[^0-9]/g, '')); if (isNaN(num)) return f; return (num/10000).toFixed(1).replace('.0', '') + '만'; })()}</span>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                                      {Object.entries(GENRE_MAP).filter(([_, info]) => party[info.key] > 0).map(([_, info]) => `${info.label}${party[info.key]}`).join('')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        );
                      })()}
                    </div>
                    <button onClick={handleCloseModal} style={{ width: '100%', height: '54px', borderRadius: '16px', background: '#1E293B', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none' }}>확인 완료</button>
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
              {/* 상단 바 */}
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

              {/* 그리드 본문 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '2px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: gridRegion === '서울' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', 
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
                        {/* 간단 정보 오버레이 */}
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
