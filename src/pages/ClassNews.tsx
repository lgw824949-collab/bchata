import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Navigation, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClassCard = ({ item, onSelect }) => {
  const levelColors = {
    '입문': '#2ECC71',
    '초급': '#3B82F6',
    '중급': '#F59E0B',
    '상급': '#EF4444',
    '고급': '#EF4444'
  };
  const badgeColor = levelColors[item.level] || '#64748B';

  return (
    <div 
      onClick={() => onSelect(item.poster_url)}
      style={{ 
        width: '160px',
        flexShrink: 0,
        cursor: 'pointer',
        scrollSnapAlign: 'start'
      }}
    >
      <div style={{ width: '160px', height: '200px', position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
        {item.poster_url ? (
          <img src={item.poster_url} style={{ width: '160px', height: '200px', objectFit: 'cover', display: 'block' }} alt="" />
        ) : (
          <div style={{ width: '160px', height: '200px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px' }}>No Poster</div>
        )}
        <div style={{ 
          position: 'absolute', top: '8px', left: '8px',
          background: badgeColor, color: '#fff', 
          padding: '2px 6px', borderRadius: '4px', 
          fontSize: '10px', fontWeight: '900',
          zIndex: 10
        }}>
          {item.level || '입문'}
        </div>
      </div>
      <div style={{ padding: '8px 2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ color: '#FF3B30', fontSize: '11px', fontWeight: '800' }}>{item.genre}</div>
        <div style={{ 
          color: '#1E293B', fontSize: '13px', fontWeight: '900', 
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
        }}>{item.title}</div>
        <div style={{ color: '#64748B', fontSize: '11px', fontWeight: '500' }}>{item.studio_name}</div>
        <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '500' }}>
          {item.day_of_week} · {item.start_time?.slice(0, 5)}
        </div>
        <div style={{ color: '#2ECC71', fontSize: '11px', fontWeight: '700' }}>
          활동비 {item.fee}
        </div>
      </div>
    </div>
  );
};

const ClassNewsPage = ({ lessons: allLessons, loading: lessonsLoading, selectedMonth, setSelectedMonth, setSelectedPoster }) => {
  const [filterGenre, setFilterGenre] = useState('전체');
  const [filterLevel, setFilterLevel] = useState('전체');
  const [gridRegion, setGridRegion] = useState(null);

  const filtered = useMemo(() => {
    return (allLessons || []).filter(l => {
      if (l.category_type !== 'class') return false;
      if (l.status !== 'approved') return false;
      const genreMatch = filterGenre === '전체' || l.genre === filterGenre;
      const levelMatch = filterLevel === '전체' || l.level === filterLevel;
      return genreMatch && levelMatch;
    });
  }, [allLessons, filterGenre, filterLevel]);

  const regions = useMemo(() => ["서울", "경기,인천", "경상도", "충청도", "전라도", "강원,제주"], []);

  const groupedLessons = useMemo(() => {
    return regions.reduce((acc, name) => {
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
  }, [filtered, regions]);

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      <div style={{ padding: '30px 20px 20px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '950', color: '#0f172a', margin: 0 }}>
          {selectedMonth}월 <span style={{ color: '#2ECC71' }}>LEVEL UP</span>
        </h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setSelectedMonth(m => m > 1 ? m - 1 : 12)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} /></button>
          <button onClick={() => setSelectedMonth(m => m < 12 ? m + 1 : 1)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} /></button>
        </div>
      </div>

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
            {regions.map(regionName => {
              const regionLessons = groupedLessons[regionName];
              return (
                <section key={regionName} style={{ marginBottom: '32px' }}>
                  <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#2ECC71', fontSize: '14px' }}>●</span>
                      <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#1E293B', margin: 0 }}>{regionName}</h2>
                      <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '800' }}>({regionLessons.length})</span>
                    </div>
                    <button 
                      onClick={() => setGridRegion(regionName)}
                      style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      전체보기 <ChevronRight size={14} />
                    </button>
                  </div>
                    {regionLessons.length > 0 ? (
                      <div 
                        className="no-scrollbar"
                        onMouseDown={(e) => {
                          const el = e.currentTarget;
                          el.dataset.isDown = 'true';
                          el.dataset.startX = (e.pageX - el.offsetLeft).toString();
                          el.dataset.scrollLeft = el.scrollLeft.toString();
                          el.style.cursor = 'grabbing';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget;
                          el.dataset.isDown = 'false';
                          el.style.cursor = 'grab';
                        }}
                        onMouseUp={(e) => {
                          const el = e.currentTarget;
                          el.dataset.isDown = 'false';
                          el.style.cursor = 'grab';
                        }}
                        onMouseMove={(e) => {
                          const el = e.currentTarget;
                          if (el.dataset.isDown !== 'true') return;
                          e.preventDefault();
                          const x = e.pageX - el.offsetLeft;
                          const walk = (x - Number(el.dataset.startX)) * 2;
                          el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
                        }}
                        style={{ 
                          display: 'flex',
                          overflowX: 'auto',
                          WebkitOverflowScrolling: 'touch',
                          scrollSnapType: 'x mandatory',
                          msOverflowStyle: 'none',
                          scrollbarWidth: 'none',
                          gap: '12px',
                          padding: '0 16px 16px',
                          cursor: 'grab'
                        }}
                      >
                        {regionLessons.map(item => (
                          <ClassCard key={item.id} item={item} onSelect={setSelectedPoster} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '20px', margin: '0 20px', background: '#F8FAFC', borderRadius: '12px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: '700' }}>
                        이 지역에 등록된 포스터가 없습니다.
                      </div>
                    )}
                  </section>
                );
              })}
            {filtered.length === 0 && (
              <div style={{ padding: '100px 20px', textAlign: 'center', color: '#94A3B8', fontWeight: '800' }}>해당 조건의 클래스가 없습니다 😅</div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {gridRegion && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setGridRegion(null)} 
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
                <div style={{ color: '#fff', fontSize: '18px', fontWeight: '900' }}>{gridRegion} 전체보기</div>
                <button onClick={() => setGridRegion(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <X size={24} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {(groupedLessons[gridRegion] || []).slice(0, 15).map(item => (
                    <div key={item.id} onClick={() => { setSelectedPoster(item.poster_url); setGridRegion(null); }} style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', borderRadius: '16px' }}>
                      <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ClassNewsPage;
