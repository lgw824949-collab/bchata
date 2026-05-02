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
        display: 'flex', gap: '15px', padding: '15px', background: '#fff', 
        borderRadius: '16px', border: '1px solid #F1F5F9', marginBottom: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer'
      }}
    >
      {/* 왼쪽: 포스터 */}
      <div style={{ width: '80px', height: '110px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', background: '#f8f8f8' }}>
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
      </div>

      {/* 오른쪽: 정보 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B', marginBottom: '2px' }}>{item.instructor}</div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>{item.title}</div>
        
        <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
          <span style={{ background: '#F0FFF4', color: '#2ECC71', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>{item.genre}</span>
          <span style={{ background: '#FFF5F5', color: '#FF1744', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>{item.level}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
          <Clock size={12} /> {item.day_of_week} {item.start_time}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#475569' }}>
            <span style={{ fontWeight: '700' }}>{item.city}</span>
            <span style={{ color: '#2ECC71', fontWeight: '800' }}>{item.fee}</span>
          </div>
          <button onClick={openMap} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#64748B' }}>
            <Navigation size={10} fill="currentColor" /> 지도
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ClassNewsPage = ({ setSelectedPoster }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const genreMatch = filterGenre === '전체' || l.genre === filterGenre;
      const levelMatch = filterLevel === '전체' || l.level === filterLevel;
      return genreMatch && levelMatch;
    });
  }, [lessons, filterGenre, filterLevel]);

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* 상단 헤더 */}
      <div style={{ padding: '30px 20px 20px', background: '#fff' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '950', color: '#0f172a', margin: 0 }}>오늘밤 <span style={{ color: '#2ECC71' }}>클래스</span></h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>나에게 딱 맞는 댄스 수업 찾기</p>
      </div>

      {/* 필터 영역 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', padding: '10px 20px', borderBottom: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
            {['전체', '바차타', '살사', '키좀바', '쥬크'].map(g => (
              <button key={g} onClick={() => setFilterGenre(g)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', border: 'none', background: filterGenre === g ? '#2ECC71' : '#F1F5F9', color: filterGenre === g ? '#fff' : '#64748B' }}>{g}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="no-scrollbar">
            {['전체', '입문', '초급', '중급', '상급'].map(l => (
              <button key={l} onClick={() => setFilterLevel(l)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', border: 'none', background: filterLevel === l ? '#1E293B' : '#F1F5F9', color: filterLevel === l ? '#fff' : '#64748B' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 수업 리스트 */}
      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '100px 0', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="#2ECC71" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '100px 0', textAlign: 'center', color: '#94A3B8', fontWeight: '700' }}>등록된 수업이 없습니다 😅</div>
        ) : (
          filtered.map(item => (
            <ClassCard key={item.id} item={item} onSelect={setSelectedPoster} />
          ))
        )}
      </div>
    </div>
  );
};

export default ClassNewsPage;
