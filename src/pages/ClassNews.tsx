import React, { useState, useMemo, useRef } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Clock, Calendar, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

const ClassCard = ({ item, onSelect }) => {
  const levelColors = {
    '입문': '#2ECC71',
    '초급': '#3B82F6',
    '중급': '#F59E0B',
    '상급': '#EF4444',
    '고급': '#EF4444'
  };
  const badgeColor = levelColors[item.level] || '#64748B';
  const weekText = item.week_type?.includes('주차') 
    ? item.week_type.replace('주차', '주 과정') 
    : (item.week_type || '상시 운영');

  return (
    <div 
      onClick={() => onSelect(item.poster_url)}
      style={{ 
        width: '160px',
        minWidth: '160px',
        flexShrink: 0,
        background: '#fff', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        scrollSnapAlign: 'start',
        border: '1px solid #F1F5F9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      {/* 포스터 영역 (160x200) */}
      <div style={{ width: '160px', height: '200px', background: '#1a1a2e', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {item.poster_url ? (
          <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="Poster" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', fontSize: '12px', fontWeight: 800 }}>
            No Poster
          </div>
        )}
        
        {/* 레벨 배지 */}
        <div style={{ 
          position: 'absolute', top: '8px', left: '8px',
          background: badgeColor, color: '#fff', 
          fontSize: '10px', fontWeight: '800', 
          padding: '2px 7px', borderRadius: '4px',
          zIndex: 10
        }}>
          {item.level || '입문'}
        </div>
      </div>

      {/* 정보 영역 */}
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#FF3B30' }}>{item.genre}</span>
          <Navigation size={11} color="#FF3B30" fill="#FF3B30" />
        </div>
        
        <h3 style={{ 
          fontSize: '13px', fontWeight: '900', color: '#1E293B', 
          margin: '0 0 6px', height: '36px', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', lineHeight: '1.4'
        }}>{item.title}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ 
            fontSize: '11px', color: '#64748B', fontWeight: '700',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
          }}>
            {item.studio_name}
          </div>
          
          <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>
            {item.day_of_week} · {item.start_time?.slice(0,5)}
          </div>
          
          <div style={{ color: '#2ECC71', fontWeight: '800', fontSize: '11px', marginTop: '2px' }}>
            {(() => {
              const d = new Date(item.start_date);
              return `${d.getMonth() + 1}/${d.getDate()} · ${weekText}`;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

const ClassNewsPage = ({ lessons: allLessons, loading: lessonsLoading, selectedMonth, setSelectedMonth, setSelectedPoster, handleRegister }) => {
  const [filterGenre, setFilterGenre] = useState('전체');
  const [filterLevel, setFilterLevel] = useState('전체');

  const filtered = useMemo(() => {
    return (allLessons || []).filter(l => {
      if (l.category_type !== 'class') return false;
      if (l.status !== 'approved') return false;
      const genreMatch = filterGenre === '전체' || l.genre === filterGenre;
      const levelMatch = filterLevel === '전체' || l.level === filterLevel;
      return genreMatch && levelMatch;
    });
  }, [allLessons, filterGenre, filterLevel]);

  const regions = ["서울", "경기,인천", "경상도", "충청도", "전라도", "강원,제주"];

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* 상단 헤더 & 월 선택 */}
      <div style={{ padding: '30px 20px 20px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '950', color: '#0f172a', margin: 0 }}>
          {selectedMonth}월 <span style={{ color: '#2ECC71' }}>LEVEL UP</span>
        </h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setSelectedMonth(m => m > 1 ? m - 1 : 12)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} /></button>
          <button onClick={() => setSelectedMonth(m => m < 12 ? m + 1 : 1)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* 스티키 이중 필터 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 20px' }} className="no-scrollbar">
            {['전체', '바차타', '살사', '키좀바', '쥬크'].map(g => (
              <button key={g} onClick={() => setFilterGenre(g)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '99px', fontSize: '11px', fontWeight: '800', border: 'none', background: filterGenre === g ? '#2ECC71' : '#F1F5F9', color: filterGenre === g ? '#fff' : '#64748B' }}>{g}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 20px' }} className="no-scrollbar">
            {['전체', '입문', '초급', '중급', '상급'].map(l => (
              <button key={l} onClick={() => setFilterLevel(l)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '99px', fontSize: '11px', fontWeight: '800', border: 'none', background: filterLevel === l ? '#1E293B' : '#F1F5F9', color: filterLevel === l ? '#fff' : '#64748B' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 0' }}>
        {lessonsLoading ? (
          <div style={{ padding: '100px 0', textAlign: 'center', color: '#2ECC71', fontWeight: 800 }}>로딩 중...</div>
        ) : (
          <>
            {(() => {
              const grouped = regions.reduce((acc, name) => {
                acc[name] = filtered.filter(l => {
                  const text = `${l.city || ''} ${l.broadRegion || ''} ${l.region || ''} ${l.address || ''} ${l.studio_name || ''}`.toLowerCase();
                  if (name === "서울") return text.includes("서울");
                  if (name === "경기,인천") return text.includes("경기") || text.includes("인천") || text.includes("부천") || text.includes("수원") || text.includes("의정부") || text.includes("안양") || text.includes("고양") || text.includes("일산") || text.includes("성남") || text.includes("분당") || text.includes("평택") || text.includes("시흥");
                  if (name === "경상도") return text.includes("경상") || text.includes("경남") || text.includes("경북") || text.includes("부산") || text.includes("대구") || text.includes("울산");
                  if (name === "전라도") return text.includes("전라") || text.includes("전남") || text.includes("전북") || text.includes("광주");
                  if (name === "충청도") return text.includes("충청") || text.includes("충남") || text.includes("충북") || text.includes("대전") || text.includes("세종");
                  if (name === "강원,제주") return text.includes("강원") || text.includes("제주");
                  return false;
                }).slice(0, 20);
                return acc;
              }, {});

              return regions.map(regionName => {
                const regionLessons = grouped[regionName];
                return (
                  <section key={regionName} style={{ marginBottom: '32px' }}>
                    <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#2ECC71', fontSize: '14px' }}>●</span>
                      <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#1E293B', margin: 0 }}>{regionName}</h2>
                      <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '800' }}>({regionLessons.length})</span>
                    </div>
                    {regionLessons.length > 0 ? (
                      <div 
                        className="hide-scrollbar no-scrollbar"
                        onMouseDown={(e) => {
                          const el = e.currentTarget;
                          el.style.cursor = 'grabbing';
                          el.style.userSelect = 'none';
                          const startX = e.pageX - el.offsetLeft;
                          const scrollLeft = el.scrollLeft;
                          const onMouseMove = (e) => {
                            const x = e.pageX - el.offsetLeft;
                            const walk = (x - startX) * 2;
                            el.scrollLeft = scrollLeft - walk;
                          };
                          const onMouseUp = () => {
                            el.style.cursor = 'grab';
                            el.style.removeProperty('user-select');
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                          };
                          document.addEventListener('mousemove', onMouseMove);
                          document.addEventListener('mouseup', onMouseUp);
                        }}
                        style={{ 
                          display: 'flex', gap: '12px', padding: '0 20px',
                          overflowX: 'auto', scrollSnapType: 'x mandatory',
                          cursor: 'grab',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        {regionLessons.map(item => (
                          <ClassCard key={item.id} item={item} onSelect={setSelectedPoster} />
                        ))}
                        <div style={{ width: '20px', flexShrink: 0 }} /> {/* 여백용 */}
                      </div>
                    ) : (
                      <div style={{ padding: '20px', margin: '0 20px', background: '#F8FAFC', borderRadius: '12px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: '700' }}>
                        이 지역에 등록된 포스터가 없습니다.
                      </div>
                    )}
                  </section>
                );
              });
            })()}
            {filtered.length === 0 && (
              <div style={{ padding: '100px 20px', textAlign: 'center', color: '#94A3B8', fontWeight: '800' }}>해당 조건의 클래스가 없습니다 😅</div>
            )}
          </>
        )}
      </div>


      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ClassNewsPage;
