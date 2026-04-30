import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, MapPin, Calendar, User, Music, ChevronRight, ShieldCheck, X, Home as HomeIcon, ChevronLeft, CloudSun, Utensils, Zap, PlusCircle, Languages, Bell } from 'lucide-react';
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
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 400, fontFamily: "'Pretendard', sans-serif" }}>지도 →</span>
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
              const fee = String(item.entry_fee || '1.2만');
              return fee.includes('만') ? fee : (parseInt(fee.replace(/[^0-9]/g, ''))/10000).toFixed(1).replace('.0','') + '만';
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
    <div 
      onClick={() => onSelect(item.poster_url)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #F1F5F9',
        cursor: 'pointer',
        height: '220px',
        width: '100%',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{ height: '130px', backgroundColor: '#f8f8f8', flexShrink: 0 }}>
        <img src={item.poster_url} alt="포스터" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, justifyContent: 'center', minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 900, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.locationName}</div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
          {item.title?.replace(/\[.*?\]/g, '').replace('오늘밤빠', '').replace('밤빠', '').trim()}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflow: 'hidden' }}>
          <span style={{ background: '#FFF1F0', color: '#E53935', padding: '1px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 700 }}>
             {(() => {
              const d = new Date(item.date);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            })()}
          </span>
          <span style={{ background: '#E6F4FF', color: '#1677FF', padding: '1px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 700 }}>
            {item.time?.split('-')[0].trim() || '20:00'}
          </span>
        </div>
      </div>
    </div>
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6 }}
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

const HomePage = ({ 
  parties, lessons, loading, selectedMonth, setSelectedMonth, selectedWeek, setSelectedWeek, 
  selectedDate, setSelectedDate, selectedRegion, setSelectedRegion, isExpanded, setIsExpanded,
  view, setView, setSelectedPoster, fetchParties, formatItemDate, formatFee, filteredParties, weekData,
  resetToToday, showFullCalendar, setShowFullCalendar, allDatesInMonth, likedIds, toggleLike, logActivity, handleRegister, fourteenDays,
  showFilterPanel, setShowFilterPanel, filterRegion, setFilterRegion, filterGenre, setFilterGenre,
  showFilteredResults, setShowFilteredResults, isMenuOpen, setIsMenuOpen, showWeather, setShowWeather,
  showLatinModal, setShowLatinModal, setShowSaju, latinCat, setLatinCat, selPatternId, setSelPatternId, regionalTheme, recordTraffic, IncheonBanner, venueCounts, openAnalysis
}) => {
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

  // 브라우저 뒤로가기 버튼 대응 (그리드 오버레이 닫기)


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
      // Logic for show/hide scroll to top if needed
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
      
      {/* 📌 [영역 A: 상단 고정석] - 슬림 통합형 (고정형 레이아웃) */}
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '500px',
        zIndex: 100000, 
        background: '#ffffff', 
        borderBottom: '1px solid #eee'
      }}>
        {/* (1) 1층: 로고 + 날짜 통합바 */}
        <div style={{ 
          height: '60px', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 15px'
        }}>

          
          {/* 📅 가로 스트림형 날짜 선택 (7일치 노출) */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            overflowX: 'auto', 
            gap: '8px', 
            padding: '5px 0',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }} className="date-stream-bar">
            {fourteenDays.map((item) => {
              const isSelected = selectedDate === item.fullDate;
              let dayColor = '#94A3B8';
              if (item.dayOfWeek === 0) dayColor = '#E53935';
              if (item.dayOfWeek === 6) dayColor = '#94A3B8';

              return (
                <div 
                  key={item.fullDate} 
                  onClick={() => setSelectedDate(item.fullDate)}
                  style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '13.5%', // 약 7일치가 한 화면에 들어오도록 설정
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '700',
                    color: isSelected ? '#E53935' : '#94A3B8',
                    marginBottom: '2px'
                  }}>
                    {item.dayName}
                  </span>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? '#E53935' : 'transparent',
                    border: item.isToday && !isSelected ? '1px solid #E53935' : 'none'
                  }}>
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: '800',
                      color: isSelected ? '#fff' : (isSelected ? '#E53935' : dayColor)
                    }}>
                      {item.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ width: '10px' }} />
        </div>

        {/* (2) 2층: 미니 LED 전광판 (라운딩 블랙) */}
        <div style={{ padding: '5px 10px 10px' }}>
          <div style={{ 
            height: '38px', 
            background: '#000', 
            borderRadius: '19px', 
            display: 'flex', 
            alignItems: 'center', 
            overflow: 'hidden',
            position: 'relative',
            padding: '0 15px'
          }}>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              style={{
                background: isPaused ? '#E53935' : 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '900',
                padding: '4px 8px',
                marginRight: '10px',
                zIndex: 10,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isPaused ? '▶ PLAY' : '⏸ STOP'}
            </button>

            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <motion.div 
                animate={isPaused ? {} : { x: ['100%', '-100%'] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                style={{ 
                  whiteSpace: 'nowrap', 
                  color: isPaused ? '#FFD700' : '#00FF00', 
                  fontSize: '13px', 
                  fontWeight: '900',
                  fontFamily: 'monospace'
                }}
              >
                {(() => {
                  const hotVenues = Object.entries(venueCounts || {})
                    .filter(([id, count]) => count > 0)
                    .map(([id, count]) => {
                      const party = parties.find(p => {
                        const loc = Array.isArray(p.locations) ? p.locations[0] : p.locations;
                        return loc?.id === id;
                      });
                      return `[${party?.cityName || '인천'} ${party?.locationName || '빠'} ${count}명]`;
                    });
                  
                  return hotVenues.length > 0 
                    ? `🛰️ 실시간 핫플: ${hotVenues.join(' ')} 접속 중! 🔥`
                    : `📢 [실시간] 밤빠가 전하는 전국 소셜 파티 실시간 인원 중계 중! 🔥`;
                })()}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* 📌 [영역 B: 개별 스크롤석] - 화이트 스트리트 리스트 */}
      <main 
        ref={scrollRef} 
        onTouchMove={handlePinchZoom}
        onTouchEnd={handleTouchEnd}
        style={{ 
          flex: 1, 
          WebkitOverflowScrolling: 'touch',
          width: '100%',
          padding: '130px 0 0 0', // 📌 헤더 높이만큼 여백 확보 (60px + 70px)
          background: '#fff',
          ...zoomContainerStyle
        }}
      >
        <div style={{ minHeight: '101%', paddingBottom: '80px' }}>
 
          {loading ? (
            <div className="grid-skeleton" style={{ display: 'flex', flexDirection: 'column', marginTop: '120px' }}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i} style={{ height: '140px', width: '100%', background: '#f9f9f9', borderBottom: '1px solid #eee' }} />
              ))}
            </div>
          ) : (
            <div style={{ 
              width: '100%', 
              padding: '0 0 20px 0',
              backgroundColor: '#f2f2f2',
              minHeight: '100vh'
            }}>
              <LiveCount />

              {/* 🏆 [전국 공통] HOT PICK 5 (순위 포함) */}
              {carouselParties.length > 0 && (
                <div className="hot-pick-container" style={{ 
                  margin: '0 0 15px', 
                  padding: '10px 0 20px', 
                  background: '#fff', 
                  borderBottom: '1px solid #eee' 
                }}>
                  <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '950', letterSpacing: '-0.02em', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#E53935' }}>HOT</span> PICK 5 
                      <span style={{ fontSize: '11px', fontWeight: '400', color: '#94A3B8', backgroundColor: '#f5f5f5', padding: '2px 8px', borderRadius: '10px' }}>전국 인기</span>
                    </h2>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <div 
                        onClick={() => setView('admin')}
                        style={{ padding: '5px', cursor: 'pointer', color: '#333' }}
                      >
                        <ShieldCheck size={20} strokeWidth={2.5} />
                      </div>
                      <div 
                        onClick={() => setShowFullCalendar(!showFullCalendar)}
                        style={{ padding: '5px', cursor: 'pointer', color: showFullCalendar ? '#FF3B30' : '#333' }}
                      >
                        <Calendar size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                  <div 
                    style={{ 
                      width: '100%',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#fff',
                      padding: '10px 0'
                    }}
                  >
                    <motion.div 
                      animate={isPaused ? {} : { x: [0, -775] }}
                      transition={{ 
                        duration: 20, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                      style={{ 
                        display: 'flex', 
                        gap: '15px', 
                        paddingLeft: '20px',
                        width: 'max-content'
                      }}
                    >
                      {/* 포스터 리스트 (무한 롤링을 위해 2번 반복) */}
                      {carouselParties.slice(0, 5).map((item, index) => (
                        <div 
                          key={`hot-pick-${index}-${item.id}`}
                          onClick={() => setSelectedPoster(item.poster_url)}
                          style={{ 
                            width: '140px', 
                            flexShrink: 0, 
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                            backgroundColor: '#f9f9f9'
                          }}
                        >
                          
                          <div style={{ width: '100%', height: '190px' }}>
                            <img 
                              src={item.poster_url} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              alt={`Pick ${index + 1}`}
                            />
                          </div>
                          
                          {/* 하단 투명 블랙 그라데이션 및 정보 */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '15px 10px 8px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                            color: 'white'
                          }}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                const address = item.address || item.locationName
                                window.open(
                                  `https://map.kakao.com/link/search/${encodeURIComponent(address)}`,
                                  '_blank'
                                )
                              }}
                              style={{
                                display:'flex', alignItems:'center', gap:6,
                                marginBottom:4, cursor:'pointer',
                              }}
                            >
                              <span style={{ fontSize:11 }}>📍</span>
                              <span style={{
                                fontSize:11, fontWeight:900,
                                color:'#E53935',
                                textDecoration:'underline',
                                textDecorationColor:'rgba(229, 57, 53, 0.3)',
                                letterSpacing:'-0.3px',
                              }}>
                                {item.locationName}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}



              {/* 🛰️ [인천 특화] 프리미엄 큐레이션 배너 (HOT PICK 바로 아래 배치) */}
              {IncheonBanner && <IncheonBanner />}
              {(() => {
                const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
                const curH = kstNow.getUTCHours();
                const curM = kstNow.getUTCMinutes();
                const curTotal = curH * 60 + curM;

                const dayParties = parties.filter(p => {
                  // 1. 해당 날짜에 시작하는 파티는 무조건 노출
                  if (p.date === selectedDate) return true;

                  // 2. 전날 시작해서 오늘 새벽에 끝나는 파티 처리
                  const prevDate = new Date(new Date(selectedDate).getTime() - 86400000).toISOString().split('T')[0];
                  if (p.date === prevDate && p.time && p.time.includes('-')) {
                    const parts = p.time.split('-');
                    const endPart = parts[1].trim();
                    const [eh, em] = endPart.split(':').map(Number);
                    
                    if (!isNaN(eh)) {
                      const endTotal = eh * 60 + (em || 0);
                      // 종료 시간이 시작 시간보다 빠르면(새벽 종료), 현재 시간이 종료 전인지 확인
                      const startPart = parts[0].trim();
                      const [sh] = startPart.split(':').map(Number);
                      if (eh < sh && curTotal < endTotal) return true;
                    }
                  }
                  return false;
                });
                const regions = ["서울", "경기/인천", "충청도", "전라도", "경상도", "강원/제주"];
                
                return regions.map((regionName) => {
                  const regionParties = dayParties.filter(p => {
                    const r = p.broadRegion || '';
                    const city = p.cityName || '';
                    
                    if (regionName === "서울") return r === '서울' || city === '서울';
                    if (regionName === "경기/인천") return r === '경기/인천' || city === '경기' || city === '인천';
                    if (regionName === "충청도") return r === '충청' || city === '충남' || city === '충북' || city === '대전' || city === '세종';
                    if (regionName === "경상도") return r === '경상' || city === '경남' || city === '경북' || city === '부산' || city === '대구' || city === '울산';
                    if (regionName === "전라도") return r === '전라' || city === '전남' || city === '전북' || city === '광주';
                    if (regionName === "강원/제주") return r === '강원/제주' || city === '강원' || city === '제주';
                    return false;
                  });

                  // 10초마다 순서를 강력하게 뒤섞는 페어 익스포저(Fair Exposure) 알고리즘
                  const shuffledParties = [...regionParties].sort((a, b) => {
                    // ID와 shuffleKey를 사인 함수에 넣어 매번 새로운 무작위 패턴 생성
                    const valA = Math.sin((parseInt(String(a.id).replace(/[^0-9]/g, '')) || 0) + shuffleKey * 133.7);
                    const valB = Math.sin((parseInt(String(b.id).replace(/[^0-9]/g, '')) || 0) + shuffleKey * 133.7);
                    return valA - valB;
                  });

                  return (
                    <section key={regionName} style={{ marginBottom: '15px' }}>
                      <div 
                        onClick={() => setSelectedRegionGrid(regionName)}
                        style={{ 
                          fontSize: '18px', fontWeight: '900', padding: '15px 15px 10px', 
                          color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E53935' }} />
                        {regionName}
                        {weatherMap[regionName] && (
                          <span style={{ fontSize: '13px', fontWeight: '400', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {weatherMap[regionName].icon} {weatherMap[regionName].temp}°
                          </span>
                        )}
                        <ChevronRight size={18} color="#94A3B8" />
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '400', marginLeft: 'auto' }}>전체보기</span>
                      </div>

                      <div className="party-vertical-list" style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '0 15px 20px'
                      }}>
                        {(() => {
                          // 1. 해당 지역 및 날짜 필터링 및 최신순 정렬
                          const filtered = parties
                            .filter(p => p.region === regionName && p.date === selectedDate)
                            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
                          
                          // 2. 지역별 고정 개수 설정
                          let fixedLimit = 2;
                          if (regionName === '서울' || regionName === '경기' || regionName === '인천') fixedLimit = 3;
                          
                          const fixedParties = filtered.slice(0, fixedLimit);
                          const rollingParties = filtered.slice(fixedLimit);

                          if (filtered.length === 0) {
                            return (
                              <div style={{ padding: '30px 0', color: '#94A3B8', fontSize: '13px', textAlign: 'center', width: '100%', fontWeight: '500' }}>
                                이 지역은 아직 등록된 파티가 없습니다.
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* 고정 노출 영역 */}
                              {fixedParties.map((item) => (
                                <PartyCard key={item.id} item={item} onSelect={setSelectedPoster} />
                              ))}

                              {/* 롤링 노출 영역 (남은 데이터가 있을 때만) */}
                              {rollingParties.length > 0 && (
                                <RollingContainer items={rollingParties} onSelect={setSelectedPoster} />
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </section>
                  );
                });
              })()}
              {parties.filter(p => p.date === selectedDate).length === 0 && (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999', fontSize: '15px' }}>
                  오늘 예정된 파티가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </main>



      {/* Scroll to Top Button */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          width: '44px',
          height: '44px',
          borderRadius: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          cursor: 'pointer'
        }}
        onClick={() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      >
        ↑
      </motion.div>



      <AnimatePresence>
        {showFullCalendar && (
          <motion.div
            initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            style={{
              position: 'fixed', top: '70px', right: '15px', width: '320px',
              background: '#fff', borderRadius: '20px', padding: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 10005
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ChevronLeft size={20} onClick={() => setSelectedMonth(m => m > 1 ? m-1 : 12)} style={{ cursor: 'pointer' }} />
                <span style={{ fontSize: '18px', fontWeight: 900 }}>{selectedMonth}월</span>
                <ChevronRight size={20} onClick={() => setSelectedMonth(m => m < 12 ? m+1 : 1)} style={{ cursor: 'pointer' }} />
              </div>
              <button onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); }} style={{ border: 'none', background: 'none', fontSize: '18px' }}>✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
              {['일','월','화','수','목','금','토'].map(d => (
                <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: d === '일' ? '#FF4D4D' : d === '토' ? '#D4A017' : '#999', padding: '5px 0' }}>{d}</div>
              ))}
              {allDatesInMonth.map((day) => {
                const hasEvents = parties.some(p => p.date === day.fullDate);
                const isToday = day.fullDate === new Date().toISOString().split('T')[0];
                const isSelected = selectedDate === day.fullDate;
                const isWeekend = day.dayName === '금' || day.dayName === '토';
                
                return (
                  <div 
                    key={day.fullDate} 
                    onClick={() => {
                      setSelectedDate(day.fullDate);
                      if (isWeekend) {
                        setShowFilterPanel(true);
                      } else {
                        setShowFilterPanel(false);
                        setShowFullCalendar(false);
                      }
                    }}
                    style={{ 
                      height: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: isSelected ? 800 : 500,
                      color: isSelected ? '#fff' : (isWeekend ? '#D4A017' : (day.isCurrentMonth ? '#333' : '#ccc')),
                      backgroundColor: isSelected ? '#FF3B30' : 'transparent',
                      borderRadius: '8px', cursor: 'pointer', position: 'relative',
                      border: isToday && !isSelected ? '1px solid #FF3B30' : 'none'
                    }}
                  >
                    {day.date}
                    {hasEvents && !isSelected && (
                      <div style={{ 
                        width: '4px', height: '4px', borderRadius: '50%', position: 'absolute', bottom: '3px',
                        backgroundColor: isWeekend ? '#D4A017' : '#22C55E'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
              {showFilterPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', background: '#111', margin: '15px -20px -20px', padding: '20px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}
                >
                  <div style={{ width: '100%', height: '1px', background: '#333', marginBottom: '15px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#D4A017', marginBottom: '15px' }}>
                    {(() => {
                      const d = new Date(selectedDate);
                      return `${d.getMonth() + 1}월 ${d.getDate()}일`;
                    })()}
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>지역</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['전체', '서울', '경기·인천', '경상', '전라', '충청', '강원·제주'].map(r => (
                        <button 
                          key={r}
                          onClick={() => setFilterRegion(r)}
                          style={{ 
                            padding: '6px 12px', borderRadius: '15px', fontSize: '11px', fontWeight: 700,
                            background: filterRegion === r ? '#D4A017' : '#222',
                            color: filterRegion === r ? '#fff' : '#888',
                            border: 'none', cursor: 'pointer'
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>종목</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['전체', '살사', '바차타', '쥬크', '키좀바'].map(g => (
                        <button 
                          key={g}
                          onClick={() => setFilterGenre(g)}
                          style={{ 
                            padding: '6px 12px', borderRadius: '15px', fontSize: '11px', fontWeight: 700,
                            background: filterGenre === g ? '#D4A017' : '#222',
                            color: filterGenre === g ? '#fff' : '#888',
                            border: 'none', cursor: 'pointer'
                          }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowFilteredResults(true)}
                    style={{ 
                      width: '100%', height: '56px', borderRadius: '18px', background: '#D4AF37', color: '#000', 
                      fontSize: '17px', fontWeight: '800', border: 'none', cursor: 'pointer', marginTop: 'auto'
                    }}
                  >
                    파티 {
                      parties.filter(p => {
                        if (p.date !== selectedDate) return false;
                        const r = p.broadRegion || '';
                        if (filterRegion === '경기·인천') {
                          if (!r.includes('경기') && !r.includes('인천')) return false;
                        } else if (!r.includes(filterRegion)) return false;
                        if (!p.title?.includes(filterGenre) && !p.genre?.includes(filterGenre)) return false;
                        return true;
                      }).length
                    }개 결과 보기
                  </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* View 3: Results Grid */}
              {showFilteredResults && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#888' }}>{selectedDate}</span>
                    <span style={{ fontSize: '13px', color: '#D4AF37', fontWeight: 700 }}>{filterRegion} · {filterGenre}</span>
                  </div>

                  <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', 
                    maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' 
                  }}>
                    {parties
                      .filter(p => {
                        if (p.date !== selectedDate) return false;
                        const r = p.broadRegion || '';
                        if (filterRegion === '경기·인천') {
                          if (!r.includes('경기') && !r.includes('인천')) return false;
                        } else if (!r.includes(filterRegion)) return false;
                        if (!p.title?.includes(filterGenre) && !p.genre?.includes(filterGenre)) return false;
                        return true;
                      })
                      .slice(0, 10)
                      .map(party => (
                        <div key={party.id} onClick={() => setSelectedPoster(party.poster_url)} style={{ cursor: 'pointer' }}>
                          <div style={{ aspectRatio: '3/4', borderRadius: '12px', overflow: 'hidden', background: '#222', marginBottom: '8px' }}>
                            <img src={party.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.title}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>{party.locationName}</div>
                        </div>
                      ))}
                    {parties.filter(p => {
                      if (p.date !== selectedDate) return false;
                      const r = p.broadRegion || '';
                      if (filterRegion === '경기·인천') {
                        if (!r.includes('경기') && !r.includes('인천')) return false;
                      } else if (!r.includes(filterRegion)) return false;
                      if (!p.title?.includes(filterGenre) && !p.genre?.includes(filterGenre)) return false;
                      return true;
                    }).length === 0 && (
                      <div style={{ gridColumn: 'span 2', padding: '60px 0', textAlign: 'center', color: '#666' }}>
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); setShowFilteredResults(false); }}
                    style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none' }}
                  >
                    확인
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>      {/* 지역별 포스터 그리드 오버레이 */}
      <AnimatePresence>
        {selectedRegionGrid && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#fff',
              zIndex: 100002,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* 상단 헤더 (슬림화) */}
            <div style={{ 
              padding: '12px 16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: '#fff',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  onClick={() => setSelectedRegionGrid(null)}
                  style={{ background: '#f8fafc', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1e293b' }}
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 950, color: '#1e293b', margin: 0 }}>{selectedRegionGrid}</h2>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>{selectedDate} 파티</p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedRegionGrid(null)}
                style={{ 
                  background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#64748b'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 포스터 그리드 (2x5 규격 화면 꽉 차게 최적화) */}
            <div 
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '8px', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '6px', 
                background: '#f8fafc',
                paddingBottom: '30px'
              }}
            >
              {(() => {
                const filtered = parties.filter(p => {
                  if (p.date !== selectedDate) return false;
                  const r = p.broadRegion || '';
                  const city = p.cityName || '';
                  
                  if (selectedRegionGrid === "서울") return r === '서울' || city === '서울';
                  if (selectedRegionGrid === "경기/인천") return r === '경기/인천' || city === '경기' || city === '인천';
                  if (selectedRegionGrid === "충청도") return r === '충청' || city === '충남' || city === '충북' || city === '대전' || city === '세종';
                  if (selectedRegionGrid === "경상도") return r === '경상' || city === '경남' || city === '경북' || city === '부산' || city === '대구' || city === '울산';
                  if (selectedRegionGrid === "전라도") return r === '전라' || city === '전남' || city === '전북' || city === '광주';
                  if (selectedRegionGrid === "강원/제주") return r === '강원/제주' || city === '강원' || city === '제주';
                  return false;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ gridColumn: 'span 2', padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>등록된 파티가 없습니다</h3>
                    </div>
                  );
                }

                return filtered.map((party) => (
                  <motion.div
                    key={party.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPoster(party.poster_url)}
                    style={{
                      aspectRatio: '1 / 1.3', borderRadius: '8px', overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)', background: '#fff',
                      position: 'relative', cursor: 'pointer', border: '1px solid #f1f5f9'
                    }}
                  >
                    <img 
                      src={party.poster_url} 
                      alt="포스터" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    {/* 텍스트 오버레이 (이미지 위로 겹쳐서 세로 공간 확보) */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 6px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                      color: 'white',
                      pointerEvents: 'none'
                    }}>
                      <div style={{ fontSize: '8px', color: '#ffcd3c', fontWeight: 900, marginBottom: '1px' }}>
                        {party.locationName}
                      </div>
                      <div style={{ 
                        fontSize: '10px', fontWeight: 800,
                        display: 'block', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {party.title}
                      </div>
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>



    </div>
  )
}

export default HomePage
