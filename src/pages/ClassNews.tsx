import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, MapPin, Calendar, User, Music, ChevronRight, ShieldCheck, X, Home as HomeIcon, ChevronLeft, CloudSun, Utensils, Zap, PlusCircle, Languages, Bell, Globe, Navigation, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import { KMA_REGION_COORDS, fetchWeatherForecast, parseKmaWeather, HOME_REGION_MAP } from '../utils/kmaApi'

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

const GENRE_MAP = {
  '바차타': { key: 'genre', label: 'B', label_en: 'Bachata', color: '#FF1744' },
  '살사':   { key: 'genre', label: 'S', label_en: 'Salsa', color: '#FF1744' },
  '쥬크':   { key: 'genre', label: 'J', label_en: 'Zouk', color: '#FF1744' },
  '키좀바': { key: 'genre', label: 'K', label_en: 'Kizomba', color: '#FF1744' },
};

const REGION_MAP_EN = {
  '서울': 'Seoul', '경기/인천': 'Gyeonggi/Incheon', '경상도': 'Gyeongsang', 
  '전라도': 'Jeolla', '충청도': 'Chungcheong', '강원/제주': 'Gangwon/Jeju'
};

const ClassCard = ({ item, onSelect }) => {
  const { i18n, t } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const cleanTitle = item.title?.split(' ㅣ ')[0] || '';
  const displayTime = item.start_time || '19:00';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const date = d.getDate();
    const dayName = DAYS_KOR[d.getDay()];
    return `${m}/${date}(${dayName})`;
  };

  const displayFee = (() => {
    if (!item.fee) return '1.5만';
    const f = String(item.fee);
    if (f.includes('만')) return f.replace('원', '');
    const num = parseInt(f.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return f;
    return (num / 10000).toFixed(1).replace('.0', '') + '만';
  })();

  return (
    <div 
      onClick={() => onSelect(item.poster_url)} 
      style={{ 
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#000',
        aspectRatio: '1 / 1.4',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <img src={item.poster_url} alt="Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      
      {/* 날짜 오버레이 (상단 왼쪽) */}
      <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#2ECC71', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '3px 7px', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
        {formatDate(item.start_date)}
      </div>

      {/* 정보 오버레이 (하단) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: '#fff' }}>
        <div style={{ fontSize: '10px', color: '#FFEB3B', fontWeight: '900', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.studio_name}</div>
        <div style={{ fontSize: '12px', fontWeight: '950', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{cleanTitle}</div>
        <div style={{ display: 'flex', gap: '4px', fontSize: '8px', fontWeight: '800' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>{displayTime}</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>{displayFee}</span>
        </div>
      </div>
    </div>
  );
};

const FilterBar = ({ filterRegion, setFilterRegion, filterGenre, setFilterGenre }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const regions = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];
  const genres = Object.keys(GENRE_MAP);
  return (
    <div style={{ padding: '0 15px 12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#94A3B8' }}><MapPin size={16} /></div>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="filter-scroll">
          {regions.map(r => (
            <button key={r} 
              onClick={() => setFilterRegion(filterRegion === r ? '' : r)} 
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
              onClick={() => setFilterGenre(filterGenre === g ? '' : g)} 
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

const ClassNewsPage = ({ 
  lessons, loading, selectedDate, setSelectedDate, view, setView, setSelectedPoster, handleOpenModal, handleCloseModal, fourteenDays
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const regionListRef = useRef(null);
  
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setShuffleOffset(prev => prev + 1);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const carouselLessons = useMemo(() => {
    const all = lessons || [];
    return [...all].filter(l => l.poster_url).sort((a, b) => new Date(b.start_date) - new Date(a.start_date)).slice(0, 5);
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return (lessons || []).filter(l => {
      // 기간이 지난 수업 필터링 (종료일 기준)
      if (l.duration && l.duration.includes('~')) {
        const endDate = l.duration.split('~')[1].trim();
        if (endDate && endDate < todayStr) return false;
      }
      // 시작일이 오늘 이후인 것은 노출, 하지만 아예 과거에 시작해서 종료일이 없는 경우도 고려
      if (filterRegion && l.broadRegion !== filterRegion) return false;
      if (filterGenre && l.genre !== filterGenre) return false;
      return true;
    });
  }, [lessons, filterRegion, filterGenre, todayStr]);

  return (
    <div className="app-container" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* 📌 [영역 A: 브랜드 헤더] */}
      <div style={{ padding: '40px 24px 28px', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', border: '1px solid #f1f5f9', borderRadius: '50%' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
          <span style={{ fontSize: '10px', color: '#2ECC71', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Dance Academy & Lessons
          </span>
          <h1 style={{ fontSize: '48px', fontWeight: 950, color: '#0f172a', letterSpacing: '-3px', lineHeight: 0.9, margin: 0 }}>
            오늘밤<span style={{ color: '#2ECC71', fontStyle: 'italic', marginLeft: '-2px' }}>클래스</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '2px', height: '40px', background: '#2ECC71', marginTop: '4px' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
              아카데미 · 강습 · 워크샵
            </p>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
              기초부터 심화까지 전국의 모든 <span style={{ color: '#2ECC71', fontWeight: 700 }}>댄스 클래스</span>
            </p>
          </div>
        </div>
      </div>

      {/* 📌 [영역 B: 날짜 선택바] */}
      <div style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#ffffff', borderBottom: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: '0 10px' }}>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '8px', padding: '10px 0', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="date-stream-bar">
          {fourteenDays.map((item) => {
            const isSelected = selectedDate === item.fullDate;
            return (
              <div key={item.fullDate} 
                onClick={() => setSelectedDate(item.fullDate)} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '13.5%', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '10px', fontWeight: '700', color: isSelected ? '#2ECC71' : '#94A3B8', marginBottom: '2px' }}>{item.dayName}</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#2ECC71' : 'transparent', border: item.isToday && !isSelected ? '1px solid #2ECC71' : 'none' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? '#fff' : '#94A3B8' }}>{item.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '12px 10px 8px' }}>
        <div style={{ height: '32px', background: '#0f172a', borderRadius: '16px', display: 'flex', alignItems: 'center', overflow: 'hidden', padding: '0 12px' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <motion.div animate={{ x: ['100%', '-100%'] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} style={{ whiteSpace: 'nowrap', color: '#fff', fontSize: '13px', fontWeight: '900' }}>📢 [실시간] 전국의 댄스 아카데미 및 개인 강습 정보 실시간 업데이트 중! 🔥</motion.div>
          </div>
        </div>
      </div>

      <FilterBar filterRegion={filterRegion} setFilterRegion={setFilterRegion} filterGenre={filterGenre} setFilterGenre={setFilterGenre} />

      <div style={{ width: '100%', padding: '0 0 20px 0', backgroundColor: '#f2f2f2' }}>
        {carouselLessons.length > 0 && (
          <div style={{ margin: '0 0 15px', padding: '10px 0 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
            <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#2ECC71' }}>NEW</span> CLASS 5</h2>
            </div>
            <div style={{ width: '100%', overflow: 'hidden', padding: '10px 0' }}>
              <motion.div animate={{ x: [0, -775] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ display: 'flex', gap: '15px', paddingLeft: '20px', width: 'max-content' }}>
                {carouselLessons.map((item) => (
                  <div key={item.id} onClick={() => handleOpenModal(setSelectedPoster, item.poster_url)} style={{ width: '140px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', position: 'relative' }}>
                    <img src={item.poster_url} style={{ width: '100%', height: '190px', objectFit: 'cover' }} alt="Pick" />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'white' }}>
                      <div style={{ fontSize: '10px', color: '#FFEB3B', fontWeight: 950, marginBottom: '2px' }}>{item.studio_name}</div>
                      <div style={{ fontSize: '11px', fontWeight: '950', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{item.title}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        )}

        {(() => {
          const regions = filterRegion ? [filterRegion] : ["서울", "경기/인천", "경상도", "전라도", "충청도", "강원/제주"];
          return regions.map((regionName) => {
            const regionLessons = filteredLessons.filter(l => l.broadRegion === regionName);

            if (regionLessons.length === 0 && filterRegion) return null;

            return (
              <section key={regionName} style={{ marginBottom: '15px', background: '#fff' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ECC71' }} />
                    {isEn ? (REGION_MAP_EN[regionName] || regionName) : regionName}
                  </div>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '5px', 
                  padding: '0 5px 20px' 
                }}>
                  {regionLessons.length === 0 ? (
                    <div style={{ gridColumn: 'span 3', padding: '30px', color: '#94A3B8', textAlign: 'center' }}>{t('no_classes') || '등록된 수업이 없습니다.'}</div>
                  ) : (() => {
                    const offset = shuffleOffset % regionLessons.length;
                    const rotated = [...regionLessons.slice(offset), ...regionLessons.slice(0, offset)];
                    return rotated.map(item => (
                      <ClassCard key={item.id} item={item} onSelect={(url) => handleOpenModal(setSelectedPoster, url)} />
                    ));
                  })()}
                </div>
              </section>
            );
          });
        })()}
      </div>
    </div>
  );
};

export default ClassNewsPage;
