import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Navigation, Clock, Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function WishlistModal({ onClose, setSelectedPoster }) {
  const [activeTab, setActiveTab] = useState('parties'); // 'parties' | 'bootcamps' | 'festivals'
  const [items, setItems] = useState({
    parties: [],
    bootcamps: [],
    festivals: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllWishlists();
  }, []);

  const fetchAllWishlists = async () => {
    setIsLoading(true);
    try {
      // 1. 파티 로드 ('wishlist_parties' 우선, 없으면 'liked_ids' 등 호환성 체크)
      const pStr = localStorage.getItem('wishlist_parties') || localStorage.getItem('liked_ids') || localStorage.getItem('liked_parties') || '[]';
      const pData = parseAndLoad(pStr);

      // 2. 부트캠프 로드
      const bStr = localStorage.getItem('wishlist_bootcamps') || '[]';
      const bData = parseAndLoad(bStr);

      // 3. 페스티벌 로드
      const fStr = localStorage.getItem('wishlist_festivals') || '[]';
      const fData = parseAndLoad(fStr);

      // ID 배열인 경우 Supabase에서 실제 데이터 조회, 이미 전체 객체 배열인 경우 그대로 사용
      const [resolvedParties, resolvedBootcamps, resolvedFestivals] = await Promise.all([
        resolveItems(pData, 'parties'),
        resolveItems(bData, 'bootcamps'),
        resolveItems(fData, 'festivals')
      ]);

      setItems({
        parties: resolvedParties,
        bootcamps: resolvedBootcamps,
        festivals: resolvedFestivals
      });
    } catch (err) {
      console.error('찜한 항목을 불러오는 중 오류 발생:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 문자열을 배열로 파싱
  const parseAndLoad = (str) => {
    try {
      const parsed = JSON.parse(str);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      return [];
    }
  };

  // 항목 배열이 ID 목록이면 Supabase에서 조회, 객체 목록이면 바로 반환
  const resolveItems = async (arr, table) => {
    if (arr.length === 0) return [];
    
    // 첫 번째 원소가 이미 객체(id 포함)인 경우
    if (typeof arr[0] === 'object' && arr[0] !== null) {
      return arr;
    }

    // ID 배열인 경우 Supabase에서 가져오기
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .in('id', arr);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`${table} 데이터 조회 오류:`, err);
      return [];
    }
  };

  // 찜 해제 핸들러
  const handleUnlike = (id, tabType) => {
    // 1. 화면의 State에서 즉시 제거
    setItems(prev => ({
      ...prev,
      [tabType]: prev[tabType].filter(item => item.id !== id)
    }));

    // 2. 로컬 스토리지 키 매핑 업데이트
    const storageKeyMap = {
      parties: 'wishlist_parties',
      bootcamps: 'wishlist_bootcamps',
      festivals: 'wishlist_festivals'
    };
    const targetKey = storageKeyMap[tabType];
    
    const str = localStorage.getItem(targetKey) || '[]';
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        // 객체 배열인 경우 item.id 비교, ID 문자열/숫자 배열인 경우 item 직접 비교
        const updated = parsed.filter(item => {
          if (typeof item === 'object' && item !== null) return item.id !== id;
          return item !== id;
        });
        localStorage.setItem(targetKey, JSON.stringify(updated));

        // 파티 탭의 경우 이전 호환성 키도 함께 동기화
        if (tabType === 'parties') {
          if (localStorage.getItem('liked_ids')) localStorage.setItem('liked_ids', JSON.stringify(updated));
          if (localStorage.getItem('liked_parties')) localStorage.setItem('liked_parties', JSON.stringify(updated));
        }
      }
    } catch (e) {}
  };

  const openMap = (address) => {
    if (!address) return;
    const query = encodeURIComponent(address);
    window.open(`https://map.kakao.com/link/search/${query}`, '_blank');
  };

  const currentList = items[activeTab] || [];

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
      
      {/* 모달 컨테이너 (서랍식 하단에서 올라오는 프리미엄 디자인) */}
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
            찜하기 보관함
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'var(--color-border, #e2e8f0)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main, #1e293b)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 탭 네비게이션 (파티 / 부트캠프 / 페스티벌) */}
        <div style={{ display: 'flex', padding: '10px 20px 0', borderBottom: '1px solid #E2E8F0', background: '#fff', flexShrink: 0 }}>
          {[
            { id: 'parties', label: '파티', count: items.parties.length },
            { id: 'bootcamps', label: '부트캠프', count: items.bootcamps.length },
            { id: 'festivals', label: '페스티벌', count: items.festivals.length }
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '14px 0',
                borderBottom: activeTab === tab.id ? '3px solid #E53935' : '3px solid transparent',
                color: activeTab === tab.id ? '#E53935' : '#94A3B8',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {tab.label}
              <span style={{ 
                fontSize: '11px', 
                padding: '2px 6px', 
                borderRadius: '10px', 
                background: activeTab === tab.id ? '#FEF2F2' : '#F1F5F9', 
                color: activeTab === tab.id ? '#E53935' : '#94A3B8',
                fontWeight: 900
              }}>
                {tab.count}
              </span>
            </div>
          ))}
        </div>

        {/* 본문 리스트 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F8FAFC' }}>
          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
              항목을 불러오는 중...
            </div>
          ) : currentList.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={32} color="#E53935" fill="#E53935" opacity={0.3} />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', color: '#1E293B', fontSize: '18px', fontWeight: 900 }}>찜한 항목이 없습니다 🤍</p>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>마음에 드는 항목의 하트를 눌러 보관해보세요!</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {currentList.map(item => (
                  <motion.div 
                    key={item.id || Math.random()}
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
                    {/* 포스터 썸네일 (클릭 시 확대 모달 연동) */}
                    {item.poster_url ? (
                      <img 
                        src={item.poster_url} 
                        onClick={() => {
                          if (setSelectedPoster) setSelectedPoster(item.poster_url);
                        }}
                        style={{ width: '75px', height: '100px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0, background: '#F1F5F9', cursor: 'pointer' }} 
                        alt={item.title || '포스터'} 
                        title="포스터 크게 보기"
                      />
                    ) : (
                      <div style={{ width: '75px', height: '100px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Calendar size={24} color="#94A3B8" />
                      </div>
                    )}

                    {/* 아이템 상세 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#E53935', background: '#FEF2F2', padding: '2px 8px', borderRadius: '6px' }}>
                          {activeTab === 'parties' ? (item.broadRegion || '소셜') : activeTab === 'bootcamps' ? '부트캠프' : '페스티벌'}
                        </span>
                        {item.date || item.period || item.schedule ? (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                            {item.date || item.period || item.schedule}
                          </span>
                        ) : null}
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                        {item.title || '제목 없음'}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {item.instructor && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                            <User size={12} /> {item.instructor}
                          </span>
                        )}
                        {item.time && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                            <Clock size={12} /> {item.time?.split('-')[0] || '20:00'}
                          </span>
                        )}
                        {(item.address || item.locationName || item.location) && (
                          <span 
                            onClick={() => openMap(item.address || item.locationName || item.location)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                          >
                            <Navigation size={12} color="#E53935" fill="#E53935" /> 
                            <span style={{ textDecoration: 'underline' }}>{item.locationName || item.location || item.address}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 찜 해제 하트 버튼 */}
                    <button
                      onClick={() => handleUnlike(item.id, activeTab)}
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
