import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Send, MessageSquare, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TABS = [
  { id: '서울', label: '서울' },
  { id: '경기/인천', label: '경기인천' },
  { id: '경상도', label: '경상도' },
  { id: '전라도', label: '전라도' },
  { id: '충청도', label: '충청도' },
  { id: '강원/제주', label: '강원제주' }
];

export default function RentalModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('서울');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const rawList = data || [];

      // App.jsx와 동일한 broadRegion 분류 로직 완벽 적용
      const classified = rawList.map(loc => {
        const fullSearchText = `${loc.address || ''} ${loc.name || ''} ${loc.city_name || loc.cityName || ''}`;
        let broadRegion = '전국';

        if (fullSearchText.includes('부산') || fullSearchText.includes('대구') || fullSearchText.includes('울산') || fullSearchText.includes('경상') || fullSearchText.includes('경남') || fullSearchText.includes('경북') || fullSearchText.includes('창원') || fullSearchText.includes('포항') || fullSearchText.includes('김해')) broadRegion = '경상도';
        else if (fullSearchText.includes('서울') || fullSearchText.includes('강남') || fullSearchText.includes('홍대') || fullSearchText.includes('잠실') || fullSearchText.includes('성수') || fullSearchText.includes('서초') || fullSearchText.includes('영등포') || fullSearchText.includes('신림') || fullSearchText.includes('건대')) broadRegion = '서울';
        else if (fullSearchText.includes('경기') || fullSearchText.includes('인천') || fullSearchText.includes('부천') || fullSearchText.includes('수원') || fullSearchText.includes('안양') || fullSearchText.includes('의정부') || fullSearchText.includes('분당') || fullSearchText.includes('일산')) broadRegion = '경기/인천';
        else if (fullSearchText.includes('광주') || fullSearchText.includes('전라') || fullSearchText.includes('전남') || fullSearchText.includes('전북') || fullSearchText.includes('전주') || fullSearchText.includes('목포') || fullSearchText.includes('여수') || fullSearchText.includes('순천')) broadRegion = '전라도';
        else if (fullSearchText.includes('대전') || fullSearchText.includes('충남') || fullSearchText.includes('충북') || fullSearchText.includes('충청') || fullSearchText.includes('세종') || fullSearchText.includes('천안') || fullSearchText.includes('청주')) broadRegion = '충청도';
        else if (fullSearchText.includes('강원') || fullSearchText.includes('제주') || fullSearchText.includes('춘천') || fullSearchText.includes('원주') || fullSearchText.includes('서귀포')) broadRegion = '강원/제주';
        else broadRegion = '서울'; // 기본값 서울 편입

        return {
          ...loc,
          broadRegion
        };
      });

      setLocations(classified);
    } catch (err) {
      console.error('BAR 목록을 불러오는 중 오류 발생:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInquiry = (barName) => {
    const msg = barName ? `[${barName}] 대관 문의드립니다.` : '대관 및 제휴 문의드립니다.';
    alert(`${msg}\n연결되는 실시간 카카오톡 채팅방에 문의를 남겨주세요!`);
    window.open('https://open.kakao.com/o/gP43rNri', '_blank');
  };

  const openMap = (address, name) => {
    const query = encodeURIComponent((name || '') + ' ' + (address || ''));
    window.open(`https://map.kakao.com/link/search/${query}`, '_blank');
  };

  const currentList = locations.filter(loc => loc.broadRegion === activeTab);

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
            전국 BAR 대관문의
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'var(--color-border, #e2e8f0)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main, #1e293b)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 상단 간편 대관 배너 */}
        <div style={{ padding: '16px 20px 4px', flexShrink: 0 }}>
          <div 
            onClick={() => handleInquiry('')}
            style={{ 
              background: 'linear-gradient(135deg, #E53935, #B71C1C)', 
              color: '#fff', 
              padding: '16px 20px', 
              borderRadius: '16px', 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(229, 57, 53, 0.25)'
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '4px' }}>
                실시간 1:1 상담
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900 }}>원하시는 장소가 목록에 없으신가요?</div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>간편 맞춤형 대관 문의 시작하기</div>
            </div>
            <div style={{ background: '#fff', color: '#E53935', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900 }}>
              <Send size={16} />
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 15px 0', borderBottom: '1px solid #E2E8F0', background: '#fff', flexShrink: 0, scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const count = locations.filter(loc => loc.broadRegion === tab.id).length;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: '0 0 auto',
                  padding: '12px 14px',
                  borderBottom: activeTab === tab.id ? '3px solid #E53935' : '3px solid transparent',
                  color: activeTab === tab.id ? '#E53935' : '#94A3B8',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {tab.label}
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', background: activeTab === tab.id ? '#FEF2F2' : '#F1F5F9', color: activeTab === tab.id ? '#E53935' : '#94A3B8' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* 본문 리스트 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F8FAFC' }}>
          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
              전국 BAR 정보를 불러오는 중...
            </div>
          ) : currentList.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={28} color="#94A3B8" />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', color: '#1E293B', fontSize: '16px', fontWeight: 900 }}>등록된 BAR 장소가 없습니다</p>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>상단의 간편 문의 배너를 통해 직접 문의해보세요!</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {currentList.map(loc => (
                  <motion.div 
                    key={loc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ 
                      background: '#fff', 
                      borderRadius: '16px', 
                      padding: '18px', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)', 
                      border: '1px solid #F1F5F9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', marginBottom: '4px' }}>
                          {loc.name || '이름 없음'}
                        </div>
                        <div 
                          onClick={() => openMap(loc.address, loc.name)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <MapPin size={13} color="#E53935" style={{ flexShrink: 0 }} />
                          <span style={{ textDecoration: 'underline' }}>{loc.address || '주소 미지정'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 대관문의 버튼 */}
                    <button
                      onClick={() => handleInquiry(loc.name)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#FEF2F2',
                        color: '#E53935',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 900,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.15s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#FEE2E2'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#FEF2F2'}
                    >
                      <MessageSquare size={15} /> 대관문의
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
