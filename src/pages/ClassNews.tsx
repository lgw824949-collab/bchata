import React, { useState, useEffect, useMemo } from 'react';
import { Navigation, MapPin, Music, Award, Clock, DollarSign, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

const ClassCard = ({ item, onSelect }) => {
  const openMap = (e) => {
    e.stopPropagation();
    const query = encodeURIComponent(item.address || item.studio_name);
    window.open(`https://map.kakao.com/link/search/${query}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(item.poster_url)}
      style={{ 
        display: 'flex', gap: '12px', padding: '12px', background: '#fff', 
        borderRadius: '16px', border: '1px solid #F1F5F9', marginBottom: '10px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer'
      }}
    >
      {/* 왼쪽: 포스터 */}
      <div style={{ width: '80px', height: '110px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', background: '#f8f8f8' }}>
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
      </div>

      {/* 오른쪽: 정보 (3열 레이아웃) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, padding: '2px 0' }}>
        {/* 1열: 강사명 & 지도 📍 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B' }}>{item.instructor}</span>
          <span onClick={openMap} style={{ fontSize: '18px', cursor: 'pointer' }}>📍</span>
        </div>

        {/* 2열: 제목 */}
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </h3>

        {/* 3열: 상세 정보 (한 줄에 통합) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '11px', fontWeight: '800' }}>
          <span style={{ color: '#2ECC71' }}>{item.genre}</span>
          <span style={{ color: '#94A3B8' }}>·</span>
          <span style={{ color: '#FF1744' }}>{item.level}</span>
          <span style={{ color: '#94A3B8' }}>·</span>
          <span style={{ color: '#64748B' }}>
            {item.day_of_week?.split(',')[0]} {item.start_time?.split(':')[0]}:{item.start_time?.split(':')[1]}
          </span>
          <span style={{ color: '#94A3B8' }}>·</span>
          <span style={{ color: '#1E293B' }}>
            {(() => { if (!item.fee) return '1.2만'; const f = String(item.fee); const num = parseInt(f.replace(/[^0-9]/g, '')); if (isNaN(num)) return f; return (num/10000).toFixed(1).replace('.0', '') + '만'; })()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const ClassNewsPage = ({ setSelectedPoster }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState('전체');
  const [filterGenre, setFilterGenre] = useState('전체');
  const [filterLevel, setFilterLevel] = useState('전체');

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('classes_info')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (!error) setLessons(data || []);
      } catch (err) {
        console.error('Error fetching classes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const filtered = useMemo(() => {
    return lessons.filter(l => {
      // 1. 주차 필터: 선택된 주차와 맞거나, 혹은 아무것도 선택되지 않았을 때(전체) 다 보여줌
      const weekMatch = !selectedWeek || selectedWeek === '전체' || l.week_type === selectedWeek;
      const genreMatch = !filterGenre || filterGenre === '전체' || l.genre === filterGenre;
      const levelMatch = !filterLevel || filterLevel === '전체' || l.level === filterLevel;
      return weekMatch && genreMatch && levelMatch;
    });
  }, [lessons, selectedWeek, filterGenre, filterLevel]);

  const regions = ["서울", "경기/인천", "경상도", "전라도", "충청도", "강원/제주"];

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* 상단 헤더 */}
      <div style={{ padding: '30px 20px 20px', background: '#fff' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '950', color: '#0f172a', margin: 0 }}>오늘밤 <span style={{ color: '#2ECC71' }}>클래스</span></h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>나에게 딱 맞는 댄스 수업 찾기</p>
      </div>

      {/* 3단 필터 영역 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', padding: '10px 20px', borderBottom: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 1단: 주차 필터 (동그라미 버튼) */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
            {['1주차', '2주차', '3주차', '4주차', '5주차'].map(w => (
              <button 
                key={w} 
                onClick={() => setSelectedWeek(w)} 
                style={{ 
                  flexShrink: 0, width: '54px', height: '54px', borderRadius: '50%', 
                  fontSize: '11px', fontWeight: '800', border: 'none', 
                  background: selectedWeek === w ? '#2ECC71' : '#F1F5F9', 
                  color: selectedWeek === w ? '#fff' : '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: selectedWeek === w ? '0 4px 10px rgba(46, 204, 113, 0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {w.replace('주차', 'WK')}
              </button>
            ))}
          </div>

          {/* 2단: 장르 필터 */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
            {['바차타', '살사', '키좀바', '쥬크'].map(g => (
              <button key={g} onClick={() => setFilterGenre(filterGenre === g ? '전체' : g)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', border: 'none', background: filterGenre === g ? '#2ECC71' : '#F1F5F9', color: filterGenre === g ? '#fff' : '#64748B' }}>{g}</button>
            ))}
          </div>

          {/* 3단: 레벨 필터 */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="no-scrollbar">
            {['입문', '초급', '중급', '상급'].map(l => (
              <button key={l} onClick={() => setFilterLevel(filterLevel === l ? '전체' : l)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', border: 'none', background: filterLevel === l ? '#1E293B' : '#F1F5F9', color: filterLevel === l ? '#fff' : '#64748B' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 수업 리스트 (지역별 섹션) */}
      <div style={{ padding: '20px 0' }}>
        {loading ? (
          <div style={{ padding: '100px 0', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="#2ECC71" style={{ margin: '0 auto' }} /></div>
        ) : (
          (() => {
            const regions = ["서울", "경기/인천", "경상도", "전라도", "충청도", "강원/제주"];
            return regions.map(regionName => {
              // 지역 매칭 로직 강화 (city 또는 broadRegion 확인)
              const regionLessons = filtered.filter(l => 
                l.city === regionName || 
                l.broadRegion === regionName || 
                (regionName === "서울" && (l.city?.includes("서울") || l.region?.includes("서울"))) ||
                (regionName === "경기/인천" && (l.city?.includes("경기") || l.city?.includes("인천") || l.region?.includes("경기") || l.region?.includes("인천")))
              );
              
              if (regionLessons.length === 0) return null;

              return (
                <section key={regionName} style={{ marginBottom: '30px' }}>
                  <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '16px', background: '#2ECC71', borderRadius: '2px' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B', margin: 0 }}>{regionName}</h2>
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700' }}>{regionLessons.length}</span>
                  </div>
                  <div style={{ padding: '0 20px' }}>
                    {regionLessons.map(item => (
                      <ClassCard key={item.id} item={item} onSelect={setSelectedPoster} />
                    ))}
                  </div>
                </section>
              );
            });
          })()
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '100px 0', textAlign: 'center', color: '#94A3B8', fontWeight: '700' }}>등록된 수업이 없습니다 😅</div>
        )}
      </div>
    </div>
  );
};

export default ClassNewsPage;
