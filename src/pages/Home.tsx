import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, MapPin, Calendar, User, Music, ChevronRight, ShieldCheck, X, Home as HomeIcon, ChevronLeft, CloudSun, Utensils, Zap, PlusCircle, Languages, Bell, Globe, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import LiveCount from '../components/LiveCount'
import { KMA_REGION_COORDS, fetchWeatherForecast, parseKmaWeather, HOME_REGION_MAP } from '../utils/kmaApi'

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];
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
  return (
    <div onClick={() => onSelect(item.poster_url)} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #F1F5F9', cursor: 'pointer', height: '110px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', width: '100%' }}>
      <div style={{ width: '80px', height: '110px', backgroundColor: '#f8f8f8', flexShrink: 0 }}>
        <img src={item.poster_url} alt="포스터" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1, gap: '4px' }}>
        <div style={{ display:'flex', alignItems:'center', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>{item.locationName}</span>
          <div onClick={(e) => { e.stopPropagation(); const address = item.address || item.locationName; window.open(`https://map.kakao.com/link/search/${encodeURIComponent(address)}`, '_blank'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#E53935' }}>
            <Navigation size={14} fill="currentColor" />
          </div>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
          {item.title?.replace(/\[.*?\]/g, '').replace('오늘밤빠', '').replace('밤빠', '').trim()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', overflow: 'hidden' }}>
          <span style={{ background: '#FFF1F0', color: '#E53935', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            {(() => { const d = new Date(item.date); const days = ['일', '월', '화', '수', '목', '금', '토']; return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`; })()}
          </span>
          <span style={{ background: '#E6F4FF', color: '#1677FF', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{item.time?.split('-')[0].trim() || '20:00'}</span>
          <span style={{ background: '#FFFBE6', color: '#D46B08', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
            {(() => { const fee = String(item.fee || '1.2만'); if (fee === '무료' || fee.includes('무료')) return '무료'; return fee.includes('만') ? fee : (parseInt(fee.replace(/[^0-9]/g, ''))/10000).toFixed(1) + '만'; })()}
          </span>
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
  const regions = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];
  const genres = ['바차타', '살사', '쥬크', '키좀바'];
  return (
    <div style={{ padding: '0 15px 12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#94A3B8' }}><MapPin size={16} /></div>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '6px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="filter-scroll">
          {regions.map(r => (
            <button key={r} onClick={() => setFilterRegion(filterRegion === r ? '' : r)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', background: filterRegion === r ? '#E53935' : '#F1F5F9', color: filterRegion === r ? '#fff' : '#64748B', transition: 'all 0.2s' }}>{r}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#94A3B8' }}><Music size={16} /></div>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '6px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="filter-scroll">
          {genres.map(g => (
            <button key={g} onClick={() => setFilterGenre(filterGenre === g ? '' : g)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', background: filterGenre === g ? '#1E293B' : '#F1F5F9', color: filterGenre === g ? '#fff' : '#64748B', transition: 'all 0.2s' }}>{g}</button>
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
  showLatinModal, setShowLatinModal, setShowSaju, latinCat, setLatinCat, selPatternId, setSelPatternId, regionalTheme, recordTraffic, IncheonBanner, venueCounts, openAnalysis
}) => {
  const { t, i18n } = useTranslation();
  const [isPaused, setIsPaused] = useState(false);
  const [weatherMap, setWeatherMap] = useState({});
  const scrollRef = useRef(null);

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
    <div className="app-container" style={{ height: 'calc(var(--vh, 1vh) * 100)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', width: '100%', top: 0, left: 0, background: '#fff' }}>
      
      {/* 📌 [영역 A: 상단 고정석] */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '500px', zIndex: 100000, background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ height: '50px', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
          <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '8px', padding: '5px 0', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="date-stream-bar">
            {fourteenDays.map((item) => {
              const isSelected = selectedDate === item.fullDate;
              return (
                <div key={item.fullDate} onClick={() => setSelectedDate(item.fullDate)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '13.5%', cursor: 'pointer' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: isSelected ? '#E53935' : '#94A3B8', marginBottom: '2px' }}>{item.dayName}</span>
                  <div style={{ width: '30px', height: '30px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#E53935' : 'transparent', border: item.isToday && !isSelected ? '1px solid #E53935' : 'none' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? '#fff' : (item.isToday ? '#E53935' : '#94A3B8') }}>{item.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '2px 10px 8px' }}>
          <div style={{ height: '32px', background: '#000', borderRadius: '16px', display: 'flex', alignItems: 'center', overflow: 'hidden', padding: '0 12px' }}>
            <button onClick={() => setIsPaused(!isPaused)} style={{ background: isPaused ? '#E53935' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 8px', marginRight: '10px', cursor: 'pointer' }}>{isPaused ? '▶ PLAY' : '⏸ STOP'}</button>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <motion.div animate={isPaused ? {} : { x: ['100%', '-100%'] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} style={{ whiteSpace: 'nowrap', color: isPaused ? '#FFD700' : '#00FF00', fontSize: '13px', fontWeight: '900' }}>📢 [실시간] 밤빠가 전하는 전국 소셜 파티 실시간 인원 중계 중! 🔥</motion.div>
            </div>
          </div>
        </div>

        <FilterBar filterRegion={filterRegion} setFilterRegion={setFilterRegion} filterGenre={filterGenre} setFilterGenre={setFilterGenre} />
      </div>

      <main ref={scrollRef} style={{ flex: 1, WebkitOverflowScrolling: 'touch', width: '100%', padding: '170px 0 0 0', background: '#fff', overflowY: 'auto' }}>
        <div style={{ minHeight: '101%', paddingBottom: '80px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '120px' }}>{Array(6).fill(0).map((_, i) => <div key={i} style={{ height: '140px', width: '100%', background: '#f9f9f9', borderBottom: '1px solid #eee' }} />)}</div>
          ) : (
            <div style={{ width: '100%', padding: '0 0 20px 0', backgroundColor: '#f2f2f2', minHeight: '100vh' }}>
              <LiveCount />
              {carouselParties.length > 0 && (
                <div style={{ margin: '0 0 15px', padding: '10px 0 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
                  <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#E53935' }}>HOT</span> PICK 5</h2>
                    <div onClick={() => i18n.changeLanguage(i18n.language.startsWith('ko') ? 'en' : 'ko')} style={{ padding: '5px', cursor: 'pointer', color: '#E53935', display: 'flex', alignItems: 'center', gap: '3px' }}><Globe size={20} strokeWidth={2.5} /><span style={{ fontSize: '10px', fontWeight: 900 }}>{i18n.language.startsWith('ko') ? 'EN' : 'KO'}</span></div>
                  </div>
                  <div style={{ width: '100%', overflow: 'hidden', padding: '10px 0' }}>
                    <motion.div animate={isPaused ? {} : { x: [0, -775] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ display: 'flex', gap: '15px', paddingLeft: '20px', width: 'max-content' }}>
                      {carouselParties.map((item) => (
                        <div key={item.id} onClick={() => setSelectedPoster(item.poster_url)} style={{ width: '140px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', position: 'relative' }}>
                          <img src={item.poster_url} style={{ width: '100%', height: '190px', objectFit: 'cover' }} alt="Pick" />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', color: 'white' }}>
                            <div style={{ fontSize: '11px', fontWeight: 900, color:'#E53935' }}>{item.locationName}</div>
                            <div style={{ fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}
              {IncheonBanner && <IncheonBanner />}
              {(() => {
                const dayParties = parties.filter(p => p.date === selectedDate);
                const regions = filterRegion ? [filterRegion] : ["서울", "경기/인천", "충청도", "전라도", "경상도", "강원/제주"];
                return regions.map((regionName) => {
                  const regionParties = dayParties.filter(p => {
                    const r = p.broadRegion || '';
                    const city = p.cityName || '';
                    if (regionName === "서울") return r === '서울' || city === '서울';
                    if (regionName === "경기/인천") return r === '경기/인천' || city === '경기' || city === '인천';
                    return r.includes(regionName.replace('도', '')) || city.includes(regionName.replace('도', ''));
                  });
                  return (
                    <section key={regionName} style={{ marginBottom: '15px', background: '#fff' }}>
                      <div style={{ fontSize: '18px', fontWeight: '900', padding: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E53935' }} />{regionName}<ChevronRight size={18} color="#94A3B8" /></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 15px 20px' }}>{regionParties.length === 0 ? <div style={{ padding: '30px', color: '#94A3B8', textAlign: 'center' }}>{t('no_parties')}</div> : regionParties.slice(0, 3).map(item => <PartyCard key={item.id} item={item} onSelect={setSelectedPoster} />)}</div>
                    </section>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showFullCalendar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); setShowFilteredResults(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100004 }} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', bottom: '90px', left: '10px', right: '10px', background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: 100005, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B' }}>{selectedMonth}월</span><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setSelectedMonth(m => m > 1 ? m-1 : 12)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px' }}><ChevronLeft size={18} /></button><button onClick={() => setSelectedMonth(m => m < 12 ? m+1 : 1)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px' }}><ChevronRight size={18} /></button></div></div>
                <button onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); setShowFilteredResults(false); }} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px' }}><X size={22} /></button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', minHeight: '350px' }}>
                {!showFilterPanel && !showFilteredResults ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: d === '일' ? '#FF4D4D' : d === '토' ? '#D4A017' : '#999', padding: '5px 0' }}>{d}</div>)}
                    {allDatesInMonth.map((day) => {
                      if (!day.date) return <div key={Math.random()} />;
                      const isWeekend = day.dayName === '금' || day.dayName === '토';
                      const isSelected = selectedDate === day.fullDate;
                      return (
                        <div key={day.fullDate} onClick={() => { setSelectedDate(day.fullDate); if (isWeekend) setShowFilterPanel(true); else setShowFullCalendar(false); }} style={{ height: '46px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#fff' : (day.dayName === '일' ? '#EF4444' : (isWeekend ? '#D4A017' : '#1E293B')), backgroundColor: isSelected ? (isWeekend ? '#D4A017' : '#E53935') : 'transparent', borderRadius: '14px', cursor: 'pointer' }}>{day.date}</div>
                      );
                    })}
                  </div>
                ) : showFilterPanel ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <button onClick={() => { setShowFilterPanel(false); setFilterRegion(''); setSelPatternId(''); setFilterGenre(''); }} style={{ background: '#F8FAFC', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><ChevronLeft size={16} /> 날짜 다시 선택</button>
                    </div>
                    <div style={{ marginBottom: '20px' }}><div style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B', marginBottom: '12px' }}>어느 지역으로 가시나요?</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{['서울', '경기·인천', '경상', '전라', '충청', '강원·제주'].map(r => <button key={r} onClick={() => { setFilterRegion(r); setSelPatternId(''); }} style={{ padding: '10px 18px', borderRadius: '14px', fontSize: '13px', fontWeight: 700, background: filterRegion === r ? '#E53935' : '#F8FAFC', color: filterRegion === r ? '#fff' : '#64748B', border: '1px solid #F1F5F9' }}>{r}</button>)}</div></div>
                    {filterRegion && <div style={{ marginBottom: '20px' }}><div style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B', marginBottom: '12px' }}>상세 지역 선택</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{['전체', ...new Set(parties.filter(p => p.date === selectedDate && (filterRegion === '경기·인천' ? (p.broadRegion?.includes('경기') || p.broadRegion?.includes('인천')) : p.broadRegion?.includes(filterRegion))).map(p => p.locationName))].map(loc => <button key={loc} onClick={() => setSelPatternId(loc === '전체' ? '' : loc)} style={{ padding: '10px 18px', borderRadius: '14px', fontSize: '13px', fontWeight: 700, background: selPatternId === (loc === '전체' ? '' : loc) ? '#1E293B' : '#F8FAFC', color: selPatternId === (loc === '전체' ? '' : loc) ? '#fff' : '#64748B', border: '1px solid #F1F5F9' }}>{loc}</button>)}</div></div>}
                    <div style={{ marginBottom: '30px' }}><div style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B', marginBottom: '12px' }}>어떤 춤을 추시나요?</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{['전체', '살사', '바차타', '쥬크', '키좀바'].map(g => <button key={g} onClick={() => setFilterGenre(g === '전체' ? '' : g)} style={{ padding: '10px 18px', borderRadius: '14px', fontSize: '13px', fontWeight: 700, background: filterGenre === (g === '전체' ? '' : g) ? '#D4A017' : '#F8FAFC', color: filterGenre === (g === '전체' ? '' : g) ? '#fff' : '#64748B', border: '1px solid #F1F5F9' }}>{g}</button>)}</div></div>
                    <button onClick={() => setShowFilteredResults(true)} style={{ width: '100%', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', color: '#fff', fontSize: '17px', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)' }}>파티 검색 결과 보기</button>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <button onClick={() => setShowFilteredResults(false)} style={{ background: '#F8FAFC', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><ChevronLeft size={16} /> 필터 다시 선택</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                      {parties.filter(p => {
                        if (p.date !== selectedDate) return false;
                        const r = p.broadRegion || '';
                        if (filterRegion && filterRegion !== '전체') { if (filterRegion === '경기·인천') { if (!r.includes('경기') && !r.includes('인천')) return false; } else if (!r.includes(filterRegion)) return false; }
                        if (selPatternId && p.locationName !== selPatternId) return false;
                        if (filterGenre && !p.title?.includes(filterGenre) && !p.genre?.includes(filterGenre)) return false;
                        return true;
                      }).map(party => (
                        <div key={party.id} onClick={() => setSelectedPoster(party.poster_url)} style={{ aspectRatio: '1 / 1.4', borderRadius: '12px', overflow: 'hidden', position: 'relative', background: '#F1F5F9' }}>
                          <img src={party.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', color: 'white' }}><div style={{ fontSize: '10px', color: '#FFEB3B', fontWeight: 900 }}>{party.locationName}</div><div style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.title}</div></div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); setShowFilteredResults(false); }} style={{ width: '100%', height: '54px', borderRadius: '16px', background: '#1E293B', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none' }}>확인 완료</button>
                  </motion.div>
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
