import React, { useState, useEffect, useMemo } from 'react';
import { Navigation, MapPin, Music, Award, Clock, DollarSign, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

const ClassCard = ({ item, onSelect }) => {
  const levelColors = {
    '입문': '#2ECC71',
    '초급': '#3498DB',
    '중급': '#F39C12',
    '상급': '#E74C3C',
    '고급': '#E74C3C'
  };
  const badgeColor = levelColors[item.level] || '#64748B';
  const weekText = item.week_type?.includes('주차') 
    ? item.week_type.replace('주차', '주 과정') 
    : (item.week_type || '상시 운영');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(item.poster_url)}
      style={{ 
        background: '#fff', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        border: '1px solid #F1F5F9',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 포스터 이미지 */}
      <div style={{ width: '100%', aspectRatio: '4/5', background: '#F1F5F9', overflow: 'hidden' }}>
        {item.poster_url ? (
          <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
            <Music size={32} />
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div style={{ padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ 
            background: badgeColor, 
            color: '#fff', 
            fontSize: '10px', 
            fontWeight: '900', 
            padding: '2px 8px', 
            borderRadius: '6px' 
          }}>{item.level || '입문'}</span>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#FF1744' }}>{item.genre}</span>
        </div>
        
        <h3 style={{ 
          fontSize: '14px', 
          fontWeight: '900', 
          color: '#1E293B', 
          margin: '0 0 10px',
          height: '40px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.4'
        }}>{item.title}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
            <MapPin size={12} /> {item.studio_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
            <Clock size={12} /> {item.day_of_week} · {item.start_time?.slice(0,5)}~{item.end_time?.slice(0,5)}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', marginTop: '4px' }}>
            {(() => {
              const d = new Date(item.start_date);
              return `${d.getMonth() + 1}/${d.getDate()} 시작 · ${weekText}`;
            })()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ClassNewsPage = ({ lessons: allLessons, loading: lessonsLoading, selectedMonth, setSelectedMonth, setSelectedPoster }) => {
  const [filterGenre, setFilterGenre] = useState('전체');
  const [filterLevel, setFilterLevel] = useState('전체');

  // 📍 상단 HOT PICK 5 데이터 추출
  const carouselLessons = useMemo(() => {
    return [...(allLessons || [])]
      .filter(l => l.poster_url)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [allLessons]);

  const filtered = useMemo(() => {
    return (allLessons || []).filter(l => {
      const d = new Date(l.start_date);
      if (d.getMonth() + 1 !== selectedMonth) return false;
      const genreMatch = !filterGenre || filterGenre === '전체' || l.genre === filterGenre;
      const levelMatch = !filterLevel || filterLevel === '전체' || l.level === filterLevel;
      return genreMatch && levelMatch;
    });
  }, [allLessons, selectedMonth, filterGenre, filterLevel]);

  const regions = ["서울", "경기/인천", "경상도", "전라도", "충청도", "강원/제주"];

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* 상단 헤더 & 월 선택 */}
      <div style={{ padding: '40px 20px 25px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '950', color: '#0f172a', margin: 0 }}>
            {selectedMonth}월 <span style={{ color: '#2ECC71' }}>클래스</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>나에게 딱 맞는 댄스 수업 찾기</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setSelectedMonth(m => m > 1 ? m - 1 : 12)} 
            style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => setSelectedMonth(m => m < 12 ? m + 1 : 1)} 
            style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 필터 영역 (주차 필터 제거) */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', padding: '10px 20px', borderBottom: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="no-scrollbar">
            {['전체', '바차타', '살사', '키좀바', '쥬크'].map(g => (
              <button key={g} onClick={() => setFilterGenre(g)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', border: 'none', background: filterGenre === g ? '#2ECC71' : '#F1F5F9', color: filterGenre === g ? '#fff' : '#64748B', transition: 'all 0.2s' }}>{g}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="no-scrollbar">
            {['전체', '입문', '초급', '중급', '상급'].map(l => (
              <button key={l} onClick={() => setFilterLevel(l)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', border: 'none', background: filterLevel === l ? '#1E293B' : '#F1F5F9', color: filterLevel === l ? '#fff' : '#64748B', transition: 'all 0.2s' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 0' }}>
        {lessonsLoading ? (
          <div style={{ padding: '100px 0', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="#2ECC71" style={{ margin: '0 auto' }} /></div>
        ) : (
          <>
            {carouselLessons.length > 0 && (
              <div style={{ margin: '0 0 25px', padding: '10px 0 25px', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ padding: '0 20px 15px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#2ECC71' }}>HOT</span> PICK 5
                  </h2>
                </div>
                <div style={{ width: '100%', overflow: 'hidden' }}>
                  <motion.div 
                    animate={{ x: [0, -800] }} 
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    style={{ display: 'flex', gap: '15px', paddingLeft: '20px', width: 'max-content' }}
                  >
                    {[...carouselLessons, ...carouselLessons].map((item, idx) => (
                      <div 
                        key={`${item.id}-${idx}`} 
                        onClick={() => setSelectedPoster(item.poster_url)}
                        style={{ width: '140px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', position: 'relative', cursor: 'pointer' }}
                      >
                        <img src={item.poster_url} style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="Hot Class" />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: '#fff' }}>
                          <div style={{ fontSize: '11px', fontWeight: '900' }}>{item.instructor}</div>
                          <div style={{ fontSize: '10px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            )}

            {(() => {
              const grouped = regions.reduce((acc, name) => {
                acc[name] = filtered.filter(l => {
                  const text = `${l.city || ''} ${l.broadRegion || ''} ${l.region || ''} ${l.address || ''} ${l.studio_name || ''}`.toLowerCase();
                  if (name === "서울") return text.includes("서울") || text.includes("강남") || text.includes("홍대") || text.includes("잠실") || text.includes("성수") || text.includes("신림") || text.includes("건대");
                  if (name === "경기/인천") return text.includes("경기") || text.includes("인천") || text.includes("부천") || text.includes("수원") || text.includes("의정부") || text.includes("안양") || text.includes("고양") || text.includes("일산") || text.includes("성남") || text.includes("분당") || text.includes("평택") || text.includes("시흥");
                  if (name === "경상도") return text.includes("경상") || text.includes("경남") || text.includes("경북") || text.includes("부산") || text.includes("대구") || text.includes("울산") || text.includes("창원") || text.includes("포항") || text.includes("구미") || text.includes("진주") || text.includes("양산") || text.includes("거제") || text.includes("안동");
                  if (name === "전라도") return text.includes("전라") || text.includes("전남") || text.includes("전북") || text.includes("광주") || text.includes("전주") || text.includes("목포") || text.includes("여수") || text.includes("순천") || text.includes("군산") || text.includes("익산");
                  if (name === "충청도") return text.includes("충청") || text.includes("충남") || text.includes("충북") || text.includes("대전") || text.includes("세종") || text.includes("천안") || text.includes("청주") || text.includes("아산") || text.includes("충주") || text.includes("당진") || text.includes("공주");
                  if (name === "강원/제주") return text.includes("강원") || text.includes("제주") || text.includes("춘천") || text.includes("원주") || text.includes("강릉") || text.includes("서귀포") || text.includes("속초");
                  return false;
                });
                return acc;
              }, {});

              return regions.map(regionName => {
                const regionLessons = grouped[regionName];
                if (regionLessons.length === 0) return null;
                return (
                  <section key={regionName} style={{ marginBottom: '40px' }}>
                    <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '4px', height: '18px', background: '#2ECC71', borderRadius: '2px' }} />
                      <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#1E293B', margin: 0 }}>{regionName}</h2>
                      <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '800' }}>{regionLessons.length}</span>
                    </div>
                    <div style={{ 
                      padding: '0 20px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: '15px'
                    }}>
                      {regionLessons.map(item => (
                        <ClassCard key={item.id} item={item} onSelect={setSelectedPoster} />
                      ))}
                    </div>
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
    </div>
  );
};

export default ClassNewsPage;
