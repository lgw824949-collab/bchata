import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Navigation, Clock, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function WishlistModal({ onClose }) {
  const [parties, setParties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      // localStorage에서 찜한 ID 목록 가져오기 (다양한 키 호환성 지원)
      const likedIdsStr = localStorage.getItem('liked_ids') || localStorage.getItem('liked_parties') || '[]';
      const likedIds = JSON.parse(likedIdsStr);

      if (!Array.isArray(likedIds) || likedIds.length === 0) {
        setParties([]);
        setIsLoading(false);
        return;
      }

      // Supabase에서 해당 ID의 파티들 조회
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .in('id', likedIds)
        .order('date', { ascending: true });

      if (error) throw error;
      setParties(data || []);
    } catch (err) {
      console.error('찜한 파티를 불러오는 중 오류 발생:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlike = (id) => {
    // 로컬 스토리지에서 제거
    const likedIdsStr = localStorage.getItem('liked_ids') || localStorage.getItem('liked_parties') || '[]';
    let likedIds = [];
    try {
      likedIds = JSON.parse(likedIdsStr);
    } catch (e) {}

    const updatedIds = likedIds.filter(item => item !== id);
    localStorage.setItem('liked_ids', JSON.stringify(updatedIds));
    localStorage.setItem('liked_parties', JSON.stringify(updatedIds)); // 호환성 보장

    // 화면 목록에서 즉시 제거
    setParties(prev => prev.filter(p => p.id !== id));
  };

  const openMap = (address) => {
    if (!address) return;
    const query = encodeURIComponent(address);
    window.open(`https://map.kakao.com/link/search/${query}`, '_blank');
  };

  return (
    <>
      {/* 오버레이 배경 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 190000 }}
      />

      {/* 모달 컨테이너 (서랍식 하단에서 올라오는 프리미엄 모달) */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed', inset: 0, background: 'var(--color-bg, #ffffff)', zIndex: 190001,
          display: 'flex', flexDirection: 'column', height: '100dvh',
          paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* 헤더 영역 */}
        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--color-border, #e2e8f0)', background: 'var(--color-bg, #ffffff)', flexShrink: 0 }}>
          <div style={{ color: 'var(--color-text-main, #1e293b)', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E53935' }} />
            찜한 파티 목록
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--color-border, #e2e8f0)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main, #1e293b)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 본문 리스트 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F8FAFC' }}>
          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
              목록을 불러오는 중...
            </div>
          ) : parties.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={32} color="#E53935" fill="#E53935" opacity={0.3} />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', color: '#1E293B', fontSize: '18px', fontWeight: 900 }}>찜한 파티가 없습니다</p>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>마음에 드는 파티의 하트를 눌러 보관해보세요!</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {parties.map(p => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      border: '1px solid #F1F5F9',
                      display: 'flex',
                      gap: '15px',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                  >
                    {/* 포스터 썸네일 */}
                    {p.poster_url ? (
                      <img
                        src={p.poster_url}
                        style={{ width: '75px', height: '100px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0, background: '#F1F5F9' }}
                        alt={p.title}
                      />
                    ) : (
                      <div style={{ width: '75px', height: '100px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Calendar size={24} color="#94A3B8" />
                      </div>
                    )}

                    {/* 파티 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#E53935', background: '#FEF2F2', padding: '2px 8px', borderRadius: '6px' }}>
                          {p.broadRegion || '전국'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                          {p.date}
                        </span>
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                        {p.title}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                          <Clock size={12} /> {p.time?.split('-')[0] || '20:00'}
                        </span>
                        <span
                          onClick={() => openMap(p.address || p.locationName)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Navigation size={12} color="#E53935" fill="#E53935" />
                          <span style={{ textDecoration: 'underline' }}>{p.locationName || '장소 미지정'}</span>
                        </span>
                      </div>
                    </div>

                    {/* 찜 해제 하트 버튼 */}
                    <button
                      onClick={() => handleUnlike(p.id)}
                      style={{
                        background: '#FEF2F2',
                        border: 'none',
                        borderRadius: '50%',
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'transform 0.1s'
                      }}
                      title="찜 해제"
                    >
                      <Heart size={20} color="#E53935" fill="#E53935" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
