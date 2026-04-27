import React, { useMemo, useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, User, Calendar, Home as HomeIcon, Music, MapPin, Heart, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MAIN_REGIONS = ['전국', '서울', '경기/인천', '경상', '전라', '충청', '강원/제주']
const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토']

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-img skeleton" />
    <div className="skeleton-text">
      <div className="skeleton-title skeleton" />
      <div className="skeleton-body skeleton" />
      <div className="skeleton-small skeleton" />
    </div>
  </div>
)

const CachedImage = ({ src, alt, className, objectFit = 'contain' }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#f8f8f8', overflow: 'hidden' }}>
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



const ClassNewsPage = ({ 
  parties, loading, selectedMonth, setSelectedMonth, selectedWeek, setSelectedWeek, 
  selectedDate, setSelectedDate, selectedRegion, setSelectedRegion, isExpanded, setIsExpanded,
  view, setView, setSelectedPoster, fetchParties, formatItemDate, formatFee, filteredParties, weekData,
  resetToToday, showFullCalendar, setShowFullCalendar, allDatesInMonth, likedIds, toggleLike, logActivity, handleRegister, fourteenDays, recordTraffic, regionalTheme, venueCounts, openAnalysis, setIsMenuOpen
}) => {
  const [regionOrder, setRegionOrder] = useState(['서울', '경기/인천', '경상', '전라', '충청', '강원/제주'])
  const [posterOffset, setPosterOffset] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const pauseTimerRef = useRef(null)

  const handleInteraction = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 10000); // Resume after 10 seconds of inactivity
  };

  useEffect(() => {
    const regionTimer = setInterval(() => {
      if (!isPaused) {
        setRegionOrder(prev => {
          const next = [...prev];
          const first = next.shift();
          if (first) next.push(first);
          return next;
        });
      }
    }, 20000); 

    const posterTimer = setInterval(() => {
      if (!isPaused) {
        setPosterOffset(prev => prev + 1);
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
    return filteredParties || []
  }, [filteredParties])

  const carouselParties = useMemo(() => {
    // Always show top 5 nationwide for maximum exclusivity and simplicity
    const all = parties || []
    const list = [...all].sort((a, b) => (b.views || b.id) - (a.views || a.id)).slice(0, 5)
    return list.filter(p => p.poster_url)
  }, [parties])
  return (
    <div style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#fff' }}>
      <div className="tabs-container">
        {/* 
          ============================================================
          🔒 LOCKED COMPONENT — DO NOT MODIFY ANYTHING IN THIS BLOCK
          심볼명: 밤빠 브랜드 심볼
          파일: logo.png
          경고: ID, 클래스, 인라인 스타일, src, 크기 일체 수정 금지
          AI 수정 금지 / No AI edits / 담당자 외 변경 불가
          ============================================================
        */}
        {/* 📌 [소셜 파티와 동일한 초슬림 단일 헤더] */}
        <header id="__LOCKED__main-header" style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 15px',
          background: 'white',
          borderBottom: '1px solid #f1f5f9',
          position: 'fixed',
          top: 0,
          zIndex: 100000,
        }}>
          {/* 1. 햄버거 메뉴 + 로고 */}
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px', flexShrink: 0 }}>
            <div 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsMenuOpen(true); 
              }} 
              style={{ 
                cursor: 'pointer', 
                fontSize: '28px', 
                marginRight: '10px', 
                padding: '15px 20px', 
                marginLeft: '-20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 100005,
                pointerEvents: 'auto',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ☰
            </div>
            <img src="/logo.png" alt="밤빠" style={{ height: '45px', width: 'auto', filter: 'brightness(0.9)' }} />
          </div>

          {/* 2. 날짜 선택 (가로 롤링) - 한 줄로 통합 */}
          <div style={{ 
            display: 'flex', overflowX: 'auto', gap: '15px', whiteSpace: 'nowrap',
            msOverflowStyle: 'none', scrollbarWidth: 'none', flex: 1, padding: '5px 0'
          }} className="no-scrollbar">
            {fourteenDays.map((item, i) => {
              const isSelected = selectedDate === item.fullDate;
              let dayColor = '#333';
              if (item.dayOfWeek === 0) dayColor = '#FF4D4D';
              if (item.dayOfWeek === 6) dayColor = '#2196F3';

              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(item.fullDate)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '40px', cursor: 'pointer', position: 'relative' }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', color: isSelected ? '#FF4D4D' : '#999', marginBottom: '2px' }}>
                    {item.isToday ? '오늘' : item.dayName}
                  </span>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isSelected ? '#FF4D4D' : 'transparent',
                    border: item.isToday && !isSelected ? '1px solid #FF4D4D' : 'none',
                    transition: 'all 0.2s'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: isSelected ? '#fff' : dayColor }}>
                      {item.date}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 3. 우측 여백 (더욱 슬림하게 유지) */}
          <div style={{ marginLeft: '10px' }} />
        </header>

        {/* (2) 2층: 네온 광고판 (실시간 집계 엔진) */}
        <div style={{ 
          background: '#000', 
          padding: '8px 15px', 
          display: 'flex', 
          alignItems: 'center',
          height: '40px'
        }}>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            style={{
              background: isPaused ? '#FF3B30' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '900',
              padding: '4px 8px',
              marginRight: '10px',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {isPaused ? '▶ PLAY' : '⏸ STOP'}
          </button>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <motion.div 
              animate={isPaused ? {} : { x: ['100%', '-100%'] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              style={{ 
                whiteSpace: 'nowrap', 
                color: '#00FF00', 
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

      <main style={{ padding: '100px 0 80px 0', overflowY: 'auto', flex: 1 }}>
        <div className="list-header">
           오늘의 강습 & 소식
        </div>
        <div className="list-content">
          {loading ? (
            <div className="grid-skeleton">
              {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayParties.length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {carouselParties.length > 0 && (
                    <div className="poster-ticker-container" style={{ margin: '20px 0 30px', padding: '16px 0', overflow: 'hidden', position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ padding: '0 20px 16px', fontSize: '15px', fontVariantNumeric: 'tabular-nums', fontWeight: 900, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#f97316', borderRadius: '50%', boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)' }} /> 
                        <span style={{ letterSpacing: '-0.02em' }}>HOT PICK 5</span>
                      </div>
                      <motion.div 
                        className="poster-ticker"
                        animate={{ x: [0, -(carouselParties.length * 132)] }}
                        transition={{ 
                          duration: carouselParties.length * 3.5,
                          repeat: Infinity, 
                          ease: "linear" 
                        }}
                        style={{ display: 'flex', gap: '12px', padding: '0 20px' }}
                      >
                        {[...carouselParties, ...carouselParties].map((item, i) => (
                          <motion.div 
                            key={`${item.id}-${i}`} 
                            className="carousel-item"
                            whileHover={{ 
                              scale: 1.05, 
                              y: -10,
                              boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            onClick={() => openAnalysis()}
                            onMouseEnter={handleInteraction}
                            onTouchStart={handleInteraction}
                            style={{ cursor: 'pointer', width: '120px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', position: 'relative' }}
                          >
                            <CachedImage src={item.poster_url} alt="" className="card-image" />
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  )}

                  <div className="region-group-list">
                    <AnimatePresence mode="popLayout">
                      {regionOrder.map((regionName) => {
                        const regionParties = displayParties.filter(p => {
                          const r = p.broadRegion || '';
                          if (regionName === "서울") return r.includes('서울');
                          if (regionName === "경기/인천") return r.includes('경기') || r.includes('인천');
                          if (regionName === "충청도") return r.includes('충청') || r.includes('대전');
                          if (regionName === "경상도") return r.includes('경상') || r.includes('부산') || r.includes('대구') || r.includes('울산');
                          if (regionName === "전라도") return r.includes('전라') || r.includes('광주');
                          if (regionName === "강원/제주") return r.includes('강원') || r.includes('제주');
                          return r.includes(regionName);
                        });

                        if (regionParties.length === 0 && view === 'likes') return null;
                        
                        return (
                          <motion.div 
                            layout
                            key={regionName} 
                            className="region-section"
                            style={{ marginBottom: '10px' }}
                          >
                            <div style={{ 
                              fontSize: '18px', fontWeight: '900', padding: '15px 15px 10px', 
                              color: '#333', display: 'flex', alignItems: 'center', gap: '8px',
                              background: '#fff'
                            }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2196F3' }} />
                              {regionName}
                            </div>

                            <div className="vertical-class-list">
                            {regionParties.length > 0 ? (
                              regionParties.map((item) => (
                                <motion.div 
                                  layout
                                  key={item.id} 
                                  onClick={() => openAnalysis()}
                                  style={{ 
                                    display: 'flex', padding: '14px 16px', gap: '14px', 
                                    background: '#fff', borderBottom: '1px solid #f1f5f9',
                                    cursor: 'pointer', position: 'relative', alignItems: 'center'
                                  }}
                                >
                                  {/* 1. 왼쪽 80x80 포스터 */}
                                  {/* 1. 왼쪽 80x80 포스터 */}
                                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                    <CachedImage src={item.poster_url} alt="" />
                                    {/* LIVE 뱃지 로직 */}
                                    {(() => {
                                      const now = new Date();
                                      const partyDate = new Date(item.date);
                                      const isToday = now.getFullYear() === partyDate.getFullYear() && 
                                                      now.getMonth() === partyDate.getMonth() && 
                                                      now.getDate() === partyDate.getDate();
                                      
                                      if (isToday) {
                                        const startTimeStr = item.time?.split('-')[0].trim() || '20:00';
                                        const [hours, minutes] = startTimeStr.split(':').map(Number);
                                        const partyStartTime = new Date(partyDate);
                                        partyStartTime.setHours(hours, minutes, 0);
                                        
                                        const liveStart = new Date(partyStartTime.getTime() - 30 * 60 * 1000);
                                        const liveEnd = new Date(partyStartTime.getTime() + 4 * 60 * 60 * 1000); // 4시간 동안
                                        
                                        if (now >= liveStart && now <= liveEnd) {
                                          return (
                                            <div style={{ 
                                              position: 'absolute', top: '5px', right: '5px', 
                                              backgroundColor: '#FF0000', color: '#fff', fontSize: '9px', 
                                              fontWeight: 'bold', padding: '2px 4px', borderRadius: '3px', 
                                              zIndex: 5, boxShadow: '0 0 6px rgba(255,0,0,0.3)'
                                            }}>
                                              LIVE
                                            </div>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  
                                  {/* 2. 오른쪽 텍스트 정보 (뉴스 피드 스타일) */}
                                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '14px' }}>
                                    {/* (Row 1) 날짜 · 시간 · 장소 */}
                                    <div style={{ 
                                      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px',
                                      fontSize: '12px', color: '#888', marginBottom: '6px'
                                    }}>
                                      <span style={{ color: '#FF4B4B', fontWeight: 'bold' }}>
                                        {(() => {
                                          const d = new Date(item.date);
                                          const dayName = ['일','월','화','수','목','금','토'][d.getDay()];
                                          return `${d.getMonth()+1}/${d.getDate()}(${dayName})`;
                                        })()}
                                      </span>
                                      <span>·</span>
                                      <span style={{ color: '#2563EB', fontWeight: 'bold' }}>{item.time?.split('-')[0] || '20:00'}</span>
                                      <span>·</span>
                                      <span 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const address = item.locations?.address || '';
                                          const searchQuery = address ? `${address} ${item.locationName}` : item.locationName;
                                          window.open(`https://map.kakao.com/link/search/${encodeURIComponent(searchQuery)}`, '_blank');
                                        }}
                                        style={{ color: '#059669', fontWeight: 'bold', textDecoration: 'underline' }}
                                      >
                                        {item.locationName}
                                      </span>
                                    </div>

                                    {/* (Row 2) 강습 제목 */}
                                    <div style={{ 
                                      fontSize: '16px', fontWeight: '900', color: '#111', 
                                      lineHeight: '1.4', marginBottom: '8px',
                                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                      {item.title}
                                    </div>
                                    
                                    {/* (Row 3) 상세 정보 칩 */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                      {item.instructor && (
                                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', fontWeight: 800 }}>
                                          {item.instructor}
                                        </span>
                                      )}
                                      {item.level && (
                                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '6px', fontWeight: 800 }}>
                                          {item.level}
                                        </span>
                                      )}
                                      <span style={{ fontSize: '11px', padding: '2px 8px', background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', borderRadius: '6px', fontWeight: 800 }}>
                                        {formatFee(item.fee)}
                                      </span>
                                      {item.genre && (
                                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', borderRadius: '6px', fontWeight: 800 }}>
                                          {item.genre}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                                    {/* 찜 버튼 */}
                                    <div 
                                      onClick={(e) => { e.stopPropagation(); toggleLike(item.id); }}
                                    >
                                      <Heart size={20} fill={likedIds.some(id => String(id) === String(item.id)) ? '#FF4B4B' : 'none'} color={likedIds.some(id => String(id) === String(item.id)) ? '#FF4B4B' : '#ccc'} strokeWidth={3} />
                                    </div>
                                    <div style={{ color: '#ccc' }}>
                                      <ChevronRight size={20} strokeWidth={1.5} />
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                             ) : (
                               <div style={{ 
                                 display: 'flex', padding: '14px 16px', gap: '14px', 
                                 background: '#fff', borderBottom: '1px solid #f1f5f9',
                                 alignItems: 'center', opacity: 0.6
                               }}>
                                 <div style={{ 
                                   width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                                   background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee'
                                 }}>
                                   <img src="/logo.png" alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
                                 </div>
                                 
                                 <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                   <div style={{ fontSize: '12px', color: '#888', fontWeight: 'bold', marginBottom: '6px' }}>정보 준비중</div>
                                   <div style={{ fontSize: '16px', fontWeight: '900', color: '#333', lineHeight: '1.4', marginBottom: '8px' }}>
                                     해당 지역의 새로운 소식을 준비하고 있습니다
                                   </div>
                                   <div style={{ display: 'flex', gap: '6px' }}>
                                     <span style={{ fontSize: '11px', padding: '2px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', borderRadius: '6px', fontWeight: 800 }}>
                                       Today Bamba
                                     </span>
                                   </div>
                                 </div>
                               </div>
                             )}
                          </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                  등록된 강습 정보가 없습니다.
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  )
}

export default ClassNewsPage
