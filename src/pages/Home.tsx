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
  const onUpdate = ({ x, y, scale }) => {
    if (imgRef.current) {
      imgRef.current.style.transform = make3dTransformValue({ x, y, scale });
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      aspectRatio: '3/4', 
      overflow: 'hidden', 
      borderRadius: '12px', 
      background: '#000',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <QuickPinchZoom onUpdate={onUpdate} wheelScaleFactor={500} tapZoomFactor={2}>
        <img 
          ref={imgRef}
          src={src} 
          alt={alt} 
          onClick={onClick}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: 'block',
            willChange: 'transform'
          }} 
        />
      </QuickPinchZoom>
    </div>
  );
};

const CachedImage = ({ src, alt, className, objectFit = 'cover' }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
      <img 
        src={src} 
        alt={alt} 
        className={className} 
        loading="lazy" 
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        style={{ 
          opacity: isLoaded ? 1 : 0, 
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
          height: '100%',
          objectFit: objectFit,
          display: 'block'
        }}
      />
      {!isLoaded && <div className="shimmer-placeholder" />}
    </div>
  );
};

const PartyCard = ({ item, onSelect }) => {
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
        border: '1px solid #F1F5F9',
        cursor: 'pointer',
        height: '110px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        width: '100%'
      }}
    >
      <div style={{ width: '80px', height: '110px', backgroundColor: '#f8f8f8', flexShrink: 0 }}>
        <img src={item.poster_url} alt="포스터" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1, gap: '4px' }}>
        <div style={{ display:'flex', alignItems:'center', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B', fontFamily: "'Pretendard', sans-serif" }}>{item.locationName}</span>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              const address = item.address || item.locationName;
              window.open(`https://map.kakao.com/link/search/${encodeURIComponent(address)}`, '_blank');
            }}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px', borderRadius: '50%',
              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
              cursor: 'pointer', color: '#E53935'
            }}
          >
            <Navigation size={14} fill="currentColor" />
          </div>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Pretendard', sans-serif", marginBottom: '4px' }}>
          {item.title?.replace(/\[.*?\]/g, '').replace('오늘밤빠', '').replace('밤빠', '').trim()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', overflow: 'hidden', fontFamily: "'Pretendard', sans-serif" }}>
          <span style={{ background: '#FFF1F0', color: '#E53935', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            {(() => {
              const d = new Date(item.date);
              const days = ['일', '월', '화', '수', '목', '금', '토'];
              return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
            })()}
          </span>
          <span style={{ background: '#E6F4FF', color: '#1677FF', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{item.time?.split('-')[0].trim() || '20:00'}</span>
          <span style={{ background: '#FFFBE6', color: '#D46B08', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
            {(() => {
              const fee = String(item.fee || '1.2만');
              if (fee === '무료' || fee.includes('무료')) return '무료';
              return fee.includes('만') ? fee : (parseInt(fee.replace(/[^0-9]/g, ''))/10000).toFixed(1) + '만';
            })()}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #F0F0F0', padding: '2px 8px', borderRadius: '12px' }}>
            {(() => {
              const ratios = [
                { l: 'S', v: item.s_ratio || 0, c: '#E53935' },
                { l: 'B', v: item.b_ratio || 0, c: '#1D9E75' },
                { l: 'K', v: item.k_ratio || 0, c: '#7C3AED' },
                { l: 'J', v: item.j_ratio || 0, c: '#F59E0B' }
              ].filter(r => r.v > 0).sort((a, b) => b.v - a.v);
              return ratios.map((r, idx) => (
                <React.Fragment key={r.l}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: r.c }}>{r.l}{r.v}</span>
                  {idx < ratios.length - 1 && <span style={{ fontSize: '8px', color: '#E2E8F0', margin: '0 2px' }}>·</span>}
                </React.Fragment>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

const RollingContainer = ({ items, onSelect }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div style={{ position: 'relative', height: '110px', width: '100%', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={items[index].id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          style={{ position: 'absolute', width: '100%' }}
        >
          <PartyCard item={items[index]} onSelect={onSelect} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const GridPartyCard = ({ item, onSelect }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(item.poster_url)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid #F1F5F9',
        cursor: 'pointer',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s ease'
      }}
    >
      <div style={{ aspectRatio: '1 / 1.4', backgroundColor: '#f8f9fa', flexShrink: 0, overflow: 'hidden' }}>
        <img src={item.poster_url} alt="포스터" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, justifyContent: 'center', minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#E53935', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.locationName}</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px', fontFamily: "'Pretendard', sans-serif" }}>
          {item.title?.replace(/\[.*?\]/g, '').replace('오늘밤빠', '').replace('밤빠', '').trim()}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflow: 'hidden' }}>
          <span style={{ background: '#FFF1F0', color: '#E53935', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
             {(() => {
              const d = new Date(item.date);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            })()}
          </span>
          <span style={{ background: '#F8FAFC', color: '#64748B', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
            {item.time?.split('-')[0].trim() || '20:00'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const GridRollingContainer = ({ items, onSelect }) => {
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalPages]);

  const currentItems = items.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <div style={{ minHeight: '500px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px' 
          }}
        >
          {currentItems.map((item) => (
            <GridPartyCard key={item.id} item={item} onSelect={onSelect} />
          ))}
        </motion.div>
      </AnimatePresence>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '25px' }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === page ? '#E53935' : '#CBD5E1', transition: 'background 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  );
};

const SkeletonCard = () => (
  <div style={{ background: '#f3f4f6', borderRadius: '12px', height: '240px', width: '100%', position: 'relative', overflow: 'hidden' }}>
    <div className="shimmer-placeholder" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
  </div>
);

const FilterBar = ({ 
  filterRegion, setFilterRegion, 
  filterGenre, setFilterGenre 
}) => {
  const regions = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];
  const genres = ['바차타', '살사', '쥬크', '키좀바'];

  return (
    <div style={{ padding: '0 15px 12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#94A3B8' }}><MapPin size={16} /></div>
        <div style={{ 
          flex: 1,
          display: 'flex', 
          overflowX: 'auto', 
          gap: '6px', 
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }} className="filter-scroll">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setFilterRegion(filterRegion === r ? '' : r)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                border: 'none',
                background: filterRegion === r ? '#E53935' : '#F1F5F9',
                color: filterRegion === r ? '#fff' : '#64748B',
                transition: 'all 0.2s'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#94A3B8' }}><Music size={16} /></div>
        <div style={{ 
          flex: 1,
          display: 'flex', 
          overflowX: 'auto', 
          gap: '6px',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }} className="filter-scroll">
          {genres.map(g => (
            <button
              key={g}
              onClick={() => setFilterGenre(filterGenre === g ? '' : g)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                border: 'none',
                background: filterGenre === g ? '#1E293B' : '#F1F5F9',
                color: filterGenre === g ? '#fff' : '#64748B',
                transition: 'all 0.2s'
              }}
            >
              {g}
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
  showLatinModal, setShowLatinModal, setShowSaju, latinCat, setLatinCat, selPatternId, setSelPatternId, regionalTheme, recordTraffic, IncheonBanner, venueCounts, openAnalysis
}) => {
  const { t, i18n } = useTranslation();
  const regionKeyMap = {
    "서울": "seoul",
    "경기/인천": "gyeonggi_incheon",
    "충청도": "chungcheong",
    "전라도": "jeolla",
    "경상도": "gyeongsang",
    "강원/제주": "gangwon_jeju"
  };
  const [isPaused, setIsPaused] = useState(false)
  const [regionOrder, setRegionOrder] = useState(['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'])
  const [posterOffset, setPosterOffset] = useState(0)
  const [representativeIndex, setRepresentativeIndex] = useState(0)
  const [selectedRegionGrid, setSelectedRegionGrid] = useState(null)
  const pauseTimerRef = useRef(null)
  const contentRef = useRef(null)
  const [weatherMap, setWeatherMap] = useState({})

  useEffect(() => {
    const loadRegionalWeather = async () => {
      const weatherResults = {};
      await Promise.all(
        Object.entries(HOME_REGION_MAP).map(async ([homeName, kmaName]) => {
          const coords = KMA_REGION_COORDS[kmaName];
          if (coords) {
            const data = await fetchWeatherForecast(coords.nx, coords.ny);
            if (data) {
              const parsed = parseKmaWeather(data.sky, data.pty);
              weatherResults[homeName] = { icon: parsed.icon, temp: data.t1h };
            }
          }
        })
      );
      setWeatherMap(weatherResults);
    };
    loadRegionalWeather();
  }, []);

  // --- 브라우저 뒤로가기 대응 (그리드 오버레이 전용) ---
  useEffect(() => {
    const handlePopState = () => {
      if (selectedRegionGrid) {
        setSelectedRegionGrid(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedRegionGrid]);

  useEffect(() => {
    if (selectedRegionGrid) {
      window.history.pushState({ grid: selectedRegionGrid }, '');
    }
  }, [selectedRegionGrid]);

  const [zoomScale, setZoomScale] = useState(1);
  const [isScrollingLocked, setIsScrollingLocked] = useState(false);
  const initialDistanceRef = useRef(null);
  const hotPickRef = useRef(null);
  const carouselParties = useMemo(() => {
    const all = parties || [];
    return [...all]
      .filter(p => p.poster_url)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [parties]);

  // 달력 날짜 생성 로직 (현재 월 기준)
  const allDatesInMonth = useMemo(() => {
    const year = 2026; // 기준 연도
    const month = selectedMonth;
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0(일) ~ 6(토)
    const lastDate = new Date(year, month, 0).getDate();
    
    const days = [];
    // 1일 앞의 빈 칸 채우기
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ date: '', fullDate: '', dayName: '', isCurrentMonth: false });
    }
    // 실제 날짜 채우기
    for (let d = 1; d <= lastDate; d++) {
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, d);
      const dayNames = ['일','월','화','수','목','금','토'];
      days.push({ 
        date: d, 
        fullDate, 
        dayName: dayNames[dateObj.getDay()], 
        isCurrentMonth: true 
      });
    }
    return days;
  }, [selectedMonth]);

  const handlePinchZoom = (e) => {
    if (e.touches.length === 2) {
      // 줌이 시작되면 스크롤 정지 활성화
      setIsScrollingLocked(true);
      
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );

      if (initialDistanceRef.current === null) {
        initialDistanceRef.current = distance;
      } else {
        // 줌 배율 계산 및 적용 (최대 3배까지)
        const newScale = Math.min(Math.max(distance / initialDistanceRef.current, 1), 3);
        setZoomScale(newScale);
      }
    }
  };

  const handleTouchEnd = () => {
    // 손가락을 떼면 스크롤 정지 해제
    setIsScrollingLocked(false);
    initialDistanceRef.current = null;
  };

  const zoomContainerStyle = {
    touchAction: isScrollingLocked ? 'none' : 'pan-y pinch-zoom',
    transform: `scale(${zoomScale})`,
    transformOrigin: 'center top',
    transition: isScrollingLocked ? 'none' : 'transform 0.1s ease-out',
    overflow: isScrollingLocked ? 'hidden' : 'auto'
  };

  const handleInteraction = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 10000); // Resume after 10 seconds of inactivity
  };

  const [shuffleKey, setShuffleKey] = useState(0);

  useEffect(() => {
    const regionTimer = setInterval(() => {
      // 10초마다 무조건 셔플 (사용자 조작 여부와 상관없이 형평성 유지)
      setShuffleKey(prev => prev + 1);

      if (!isPaused) {
        setRegionOrder(prev => {
          const next = [...prev];
          const first = next.shift();
          if (first) next.push(first);
          return next;
        });
      }
    }, 10000); 

    const posterTimer = setInterval(() => {
      if (!isPaused) {
        setPosterOffset(prev => prev + 1);
        setRepresentativeIndex(prev => prev + 1);
      }
    }, 10000); 

    return () => {
      clearInterval(regionTimer);
      clearInterval(posterTimer);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [isPaused]);

  const currentYear = 2026
  const currentWeekDays = (weekData && weekData[selectedWeek - 1]) ? weekData[selectedWeek - 1].days : []

  const displayParties = useMemo(() => {
    const list = parties || []
    const filtered = filteredParties || []
    const likes = likedIds || []
    
    if (view === 'likes') {
      return list.filter(p => likes.some(id => String(id) === String(p.id)))
    }
    return filtered
  }, [view, filteredParties, parties, likedIds])

  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Scroll handling logic
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll, { passive: true });
    };
  }, []);

  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    window.addEventListener('resize', setVh);
    setVh();
    return () => window.removeEventListener('resize', setVh);
  }, []);

  return (
    <div className="app-container" style={{ 
      height: '100vh',
      height: 'calc(var(--vh, 1vh) * 100)',
      display: 'flex',
      flexDirection: 'column', 
      overflow: 'hidden',
      position: 'fixed',
      width: '100%',
      top: 0,
      left: 0,
      background: '#fff' 
    }}>
      
      {/* 📌 [영역 A: 상단 고정석] */}
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '500px',
        zIndex: 100000, 
        background: '#ffffff', 
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ height: '50px', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
          <div style={{ 
            flex: 1, display: 'flex', overflowX: 'auto', gap: '8px', padding: '5px 0',
            msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
          }} className="date-stream-bar">
            {fourteenDays.map((item) => {
              const isSelected = selectedDate === item.fullDate;
              let dayColor = '#94A3B8';
              if (item.dayOfWeek === 0) dayColor = '#E53935';
              return (
                <div 
                  key={item.fullDate} 
                  onClick={() => setSelectedDate(item.fullDate)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '13.5%', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '10px', fontWeight: '700', color: isSelected ? '#E53935' : '#94A3B8', marginBottom: '2px' }}>{item.dayName}</span>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isSelected ? '#E53935' : 'transparent', border: item.isToday && !isSelected ? '1px solid #E53935' : 'none'
                  }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? '#fff' : (item.isToday ? '#E53935' : dayColor) }}>{item.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '2px 10px 8px' }}>
          <div style={{ height: '32px', background: '#000', borderRadius: '16px', display: 'flex', alignItems: 'center', overflow: 'hidden', padding: '0 12px' }}>
            <button onClick={() => setIsPaused(!isPaused)} style={{ background: isPaused ? '#E53935' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 8px', marginRight: '10px', cursor: 'pointer' }}>
              {isPaused ? '▶ PLAY' : '⏸ STOP'}
            </button>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <motion.div animate={isPaused ? {} : { x: ['100%', '-100%'] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} style={{ whiteSpace: 'nowrap', color: isPaused ? '#FFD700' : '#00FF00', fontSize: '13px', fontWeight: '900' }}>
                📢 [실시간] 밤빠가 전하는 전국 소셜 파티 실시간 인원 중계 중! 🔥
              </motion.div>
            </div>
          </div>
        </div>

        <FilterBar filterRegion={filterRegion} setFilterRegion={setFilterRegion} filterGenre={filterGenre} setFilterGenre={setFilterGenre} />
      </div>

      <main 
        ref={scrollRef} 
        onTouchMove={handlePinchZoom}
        onTouchEnd={handleTouchEnd}
        style={{ flex: 1, WebkitOverflowScrolling: 'touch', width: '100%', padding: '170px 0 0 0', background: '#fff', ...zoomContainerStyle }}
      >
        <div style={{ minHeight: '101%', paddingBottom: '80px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '120px' }}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i} style={{ height: '140px', width: '100%', background: '#f9f9f9', borderBottom: '1px solid #eee' }} />
              ))}
            </div>
          ) : (
            <div style={{ width: '100%', padding: '0 0 20px 0', backgroundColor: '#f2f2f2', minHeight: '100vh' }}>
              <LiveCount />
              {carouselParties.length > 0 && (
                <div style={{ margin: '0 0 15px', padding: '10px 0 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
                  <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#E53935' }}>HOT</span> PICK 5 
                    </h2>
                    <div onClick={() => i18n.changeLanguage(i18n.language.startsWith('ko') ? 'en' : 'ko')} style={{ padding: '5px', cursor: 'pointer', color: '#E53935', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Globe size={20} strokeWidth={2.5} /><span style={{ fontSize: '10px', fontWeight: 900 }}>{i18n.language.startsWith('ko') ? 'EN' : 'KO'}</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', overflow: 'hidden', padding: '10px 0' }}>
                    <motion.div animate={isPaused ? {} : { x: [0, -775] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ display: 'flex', gap: '15px', paddingLeft: '20px', width: 'max-content' }}>
                      {carouselParties.map((item, index) => (
                        <div key={item.id} onClick={() => setSelectedPoster(item.poster_url)} style={{ width: '140px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
                          <img src={item.poster_url} style={{ width: '100%', height: '190px', objectFit: 'cover' }} alt="Pick" />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px 10px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white' }}>
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
                      <div onClick={() => setSelectedRegionGrid(regionName)} style={{ fontSize: '18px', fontWeight: '900', padding: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E53935' }} />
                        {regionName}
                        <ChevronRight size={18} color="#94A3B8" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 15px 20px' }}>
                        {regionParties.length === 0 ? <div style={{ padding: '30px', color: '#94A3B8', textAlign: 'center' }}>{t('no_parties')}</div> : regionParties.slice(0, 3).map(item => <PartyCard key={item.id} item={item} onSelect={setSelectedPoster} />)}
                      </div>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); setShowFilteredResults(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10004 }} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', bottom: '90px', left: '10px', right: '10px', background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: 100005, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
              <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B' }}>{selectedMonth}월</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setSelectedMonth(m => m > 1 ? m-1 : 12)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px' }}><ChevronLeft size={18} /></button>
                    <button onClick={() => setSelectedMonth(m => m < 12 ? m+1 : 1)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px' }}><ChevronRight size={18} /></button>
                  </div>
                </div>
                <button onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); setShowFilteredResults(false); }} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px' }}><X size={22} /></button>
              </div>
              
              {!showFilterPanel && !showFilteredResults && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
                  {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: d === '일' ? '#FF4D4D' : d === '토' ? '#D4A017' : '#999' }}>{d}</div>)}
                  {allDatesInMonth.map((day) => {
                    const hasEvents = parties.some(p => p.date === day.fullDate);
                    const isToday = day.fullDate === new Date().toISOString().split('T')[0];
                    const isSelected = selectedDate === day.fullDate;
                    const isWeekend = day.dayName === '금' || day.dayName === '토';
                    return (
                      <div key={day.fullDate} onClick={() => { setSelectedDate(day.fullDate); if (isWeekend) setShowFilterPanel(true); else setShowFullCalendar(false); }} style={{ height: '46px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#fff' : (day.dayName === '일' ? '#EF4444' : (isWeekend ? '#D4A017' : (day.isCurrentMonth ? '#1E293B' : '#CBD5E1'))), backgroundColor: isSelected ? (isWeekend ? '#D4A017' : '#E53935') : 'transparent', borderRadius: '14px', cursor: 'pointer', position: 'relative' }}>
                        <span>{day.date}</span>
                        {hasEvents && !isSelected && <div style={{ width: '4px', height: '4px', borderRadius: '50%', position: 'absolute', bottom: '6px', backgroundColor: isWeekend ? '#D4A017' : '#E53935' }} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {showFilterPanel && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ overflowY: 'auto', flex: 1 }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#94A3B8', marginBottom: '10px' }}><MapPin size={14} /> 광역 지역</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['서울', '경기·인천', '경상', '전라', '충청', '강원·제주'].map(r => (
                        <button key={r} onClick={() => { setFilterRegion(r); setSelPatternId(''); }} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, background: filterRegion === r ? '#E53935' : '#F8FAFC', color: filterRegion === r ? '#fff' : '#64748B', border: '1px solid #F1F5F9' }}>{r}</button>
                      ))}
                    </div>
                  </div>
                  {filterRegion && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#94A3B8', marginBottom: '10px' }}><Navigation size={14} /> 세부 지역</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['전체', ...new Set(parties.filter(p => p.date === selectedDate && (filterRegion === '경기·인천' ? (p.broadRegion?.includes('경기') || p.broadRegion?.includes('인천')) : p.broadRegion?.includes(filterRegion))).map(p => p.locationName))].map(loc => (
                          <button key={loc} onClick={() => setSelPatternId(loc === '전체' ? '' : loc)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, background: selPatternId === (loc === '전체' ? '' : loc) ? '#1E293B' : '#F8FAFC', color: selPatternId === (loc === '전체' ? '' : loc) ? '#fff' : '#64748B', border: '1px solid #F1F5F9' }}>{loc}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#94A3B8', marginBottom: '10px' }}><Music size={14} /> 종목</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['전체', '살사', '바차타', '쥬크', '키좀바'].map(g => (
                        <button key={g} onClick={() => setFilterGenre(g === '전체' ? '' : g)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, background: filterGenre === (g === '전체' ? '' : g) ? '#D4A017' : '#F8FAFC', color: filterGenre === (g === '전체' ? '' : g) ? '#fff' : '#64748B', border: '1px solid #F1F5F9' }}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setShowFilteredResults(true)} style={{ width: '100%', height: '54px', borderRadius: '16px', background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', color: '#fff', fontSize: '16px', fontWeight: '900', border: 'none' }}>파티 결과 보기</button>
                </motion.div>
              )}

              {showFilteredResults && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ overflowY: 'auto', flex: 1 }}>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {parties.filter(p => {
                      if (p.date !== selectedDate) return false;
                      const r = p.broadRegion || '';
                      if (filterRegion && filterRegion !== '전체') {
                        if (filterRegion === '경기·인천') { if (!r.includes('경기') && !r.includes('인천')) return false; }
                        else if (!r.includes(filterRegion)) return false;
                      }
                      if (selPatternId && p.locationName !== selPatternId) return false;
                      if (filterGenre && !p.title?.includes(filterGenre) && !p.genre?.includes(filterGenre)) return false;
                      return true;
                    }).map(party => (
                      <div key={party.id} onClick={() => setSelectedPoster(party.poster_url)} style={{ aspectRatio: '1 / 1.4', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        <img src={party.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', color: 'white' }}>
                          <div style={{ fontSize: '10px', color: '#FFEB3B', fontWeight: 900 }}>{party.locationName}</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); setShowFilteredResults(false); }} style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '12px', background: '#F1F5F9', color: '#1E293B', fontWeight: 700, border: 'none' }}>확인</button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRegionGrid && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} style={{ position: 'fixed', inset: 0, backgroundColor: '#fff', zIndex: 100002, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setSelectedRegionGrid(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '10px', width: '36px', height: '36px' }}><ChevronLeft size={20} /></button>
                <div><h2 style={{ fontSize: '16px', fontWeight: 950 }}>{selectedRegionGrid}</h2></div>
              </div>
              <button onClick={() => setSelectedRegionGrid(null)}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', background: '#f8fafc' }}>
              {parties.filter(p => p.date === selectedDate && (selectedRegionGrid === '서울' ? p.broadRegion === '서울' : p.broadRegion?.includes(selectedRegionGrid.replace('도', '')))).map(party => (
                <div key={party.id} onClick={() => setSelectedPoster(party.poster_url)} style={{ aspectRatio: '1 / 1.4', borderRadius: '12px', overflow: 'hidden', position: 'relative', background: '#fff' }}>
                  <img src={party.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', color: 'white' }}>
                    <div style={{ fontSize: '11px', color: '#FFEB3B', fontWeight: 900 }}>{party.locationName}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>{party.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HomePage
