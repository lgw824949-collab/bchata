import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, MessageCircle, Globe } from 'lucide-react';
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
  const [selectedBar, setSelectedBar] = useState(null);

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

      // 주소(address) 컬럼 기준 지역 분류 로직
      const classified = rawList.map(loc => {
        const text = `${loc.address || ''} ${loc.name || ''}`;
        let region = '서울';

        if (text.includes('서울')) region = '서울';
        else if (text.includes('경기') || text.includes('인천')) region = '경기/인천';
        else if (text.includes('부산') || text.includes('대구') || text.includes('경북') || text.includes('경남') || text.includes('울산') || text.includes('창원') || text.includes('포항') || text.includes('구미')) region = '경상도';
        else if (text.includes('광주') || text.includes('전북') || text.includes('전남') || text.includes('여수') || text.includes('순천') || text.includes('목포')) region = '전라도';
        else if (text.includes('대전') || text.includes('충북') || text.includes('충남') || text.includes('세종') || text.includes('청주') || text.includes('천안')) region = '충청도';
        else if (text.includes('강원') || text.includes('제주') || text.includes('춘천') || text.includes('원주')) region = '강원/제주';
        else region = '서울'; // 기본값

        return { ...loc, region };
      });

      setLocations(classified);
    } catch (err) {
      console.error('BAR 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoClick = (url) => {
    const targetUrl = url || 'https://open.kakao.com/o/gP43rNri';
    window.open(targetUrl, '_blank');
  };

  const handleInstaClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const currentBars = locations.filter(loc => loc.region === activeTab);

  return (
    <>
      {/* 백그라운드 오버레이 */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 190000 }} 
      />
      
      {/* 메인 모달 윈도우 */}
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }} 
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={{ 
          position: 'fixed', inset: 0, background: '#ffffff', zIndex: 190001, 
          display: 'flex', flexDirection: 'column', height: '100dvh',
          paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* 모달 상단 헤더 */}
        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
          <div style={{ color: '#1E293B', fontSize: '18px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E53935' }} />
            전국 BAR 대관문의
          </div>
          <button 
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E293B', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* 안내 텍스트 배너 */}
        <div style={{ padding: '20px 20px 10px', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#1E293B', letterSpacing: '-0.5px' }}>
            원하시는 BAR를 선택해주세요
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
            아이콘을 탭하시면 상세 주소 확인 및 실시간 대관 문의가 가능합니다.
          </p>
        </div>

        {/* 지역 탭 네비게이션 */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 20px 0', borderBottom: '1px solid #E2E8F0', flexShrink: 0, scrollbarWidth: 'none', gap: '16px' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: '0 0 auto',
                  padding: '12px 4px',
                  borderBottom: isActive ? '3px solid #E53935' : '3px solid transparent',
                  color: isActive ? '#E53935' : '#94A3B8',
                  fontWeight: 900,
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {tab.label}
              </div>
            );
          })}
        </div>

        {/* 가로 스크롤 BAR 목록 컨테이너 */}
        <div style={{ flex: 1, padding: '30px 20px', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
          {isLoading ? (
            <div style={{ margin: 'auto', color: '#94A3B8', fontWeight: 700, fontSize: '15px' }}>
              BAR 정보를 불러오는 중...
            </div>
          ) : currentBars.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#94A3B8' }}>
              <p style={{ fontWeight: 900, fontSize: '16px', color: '#475569', margin: '0 0 4px' }}>등록된 BAR가 없습니다</p>
              <p style={{ fontSize: '13px', margin: 0 }}>다른 지역 탭을 확인해보세요.</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '16px' }}>
                가로로 스크롤하여 탐색 ({currentBars.length}개)
              </p>
              
              {/* 가로 스크롤 영역 */}
              <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '20px', scrollbarWidth: 'none' }}>
                {currentBars.map(bar => (
                  <motion.div
                    key={bar.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedBar(bar)}
                    style={{ 
                      flex: '0 0 auto', 
                      width: '84px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      cursor: 'pointer' 
                    }}
                  >
                    {/* 원형 이미지 또는 기본 이모지 */}
                    <div style={{ 
                      width: '74px', 
                      height: '74px', 
                      borderRadius: '50%', 
                      background: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      border: '2px solid #F1F5F9',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      overflow: 'hidden',
                      marginBottom: '10px',
                      position: 'relative'
                    }}>
                      {bar.image_url ? (
                        <img 
                          src={bar.image_url} 
                          alt={bar.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <span style={{ fontSize: '32px', userSelect: 'none' }}>🎵</span>
                      )}
                    </div>

                    {/* BAR 이름 */}
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 900, 
                      color: '#1E293B', 
                      textAlign: 'center',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {bar.name || '이름 없음'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* BAR 클릭 시 나타나는 미니 팝업 모달 */}
      <AnimatePresence>
        {selectedBar && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 190005, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            {/* 팝업 뒷배경 클릭 시 닫힘 */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedBar(null)} 
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} 
            />

            {/* 팝업 카드 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{ 
                background: '#ffffff', 
                borderRadius: '24px', 
                padding: '24px', 
                width: '100%', 
                maxWidth: '340px', 
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <button 
                onClick={() => setSelectedBar(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>

              <div style={{ paddingRight: '24px' }}>
                <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#1E293B' }}>
                  {selectedBar.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '8px' }}>
                  <MapPin size={15} color="#E53935" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, lineHeight: 1.4 }}>
                    {selectedBar.address || '등록된 상세 주소가 없습니다.'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {/* 카카오 문의 버튼 */}
                <button
                  onClick={() => handleKakaoClick(selectedBar.kakao_url)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#FEE500',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: 950,
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(254, 229, 0, 0.2)'
                  }}
                >
                  <MessageCircle size={18} fill="#000" /> 카카오 문의
                </button>

                {/* 인스타 버튼 (instagram_url 있을 때만 표시) */}
                {selectedBar.instagram_url && (
                  <button
                    onClick={() => handleInstaClick(selectedBar.instagram_url)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '14px',
                      fontWeight: 900,
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(220, 39, 67, 0.2)'
                    }}
                  >
                    <Globe size={18} /> 인스타 구경하기
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
