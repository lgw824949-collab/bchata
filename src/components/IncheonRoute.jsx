import React, { useState } from 'react';
import { X, Navigation, MapPin, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const IncheonRoute = ({ parties, onClose }) => {
  const [loading, setLoading] = useState(false);

  // 인천 지역 파티 필터링
  const incheonParties = parties.filter(p => 
    p.cityName === '인천' || 
    p.broadRegion === '경기/인천' || 
    p.address?.includes('인천') ||
    p.locationName?.includes('인천')
  );

  const handleRoute = (party) => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const { latitude, longitude } = pos.coords;
        // 네이버 지도 길찾기 URL: https://map.naver.com/v5/directions
        // 현재위치(슬래시 -) -> 목적지 주소
        const destAddress = encodeURIComponent(party.address || party.locationName);
        const url = `https://map.naver.com/v5/directions/-/${destAddress}`;
        window.open(url, '_blank');
      },
      (err) => {
        setLoading(false);
        console.error(err);
        alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
        // 위치 정보를 가져오지 못해도 주소로 검색 연결
        const destAddress = encodeURIComponent(party.address || party.locationName);
        window.open(`https://map.naver.com/v5/search/${destAddress}`, '_blank');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{ 
        position: 'fixed', inset: 0, zIndex: 2147483647, 
        backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' 
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: '100%', maxHeight: '85vh', background: '#fff', 
          borderTopLeftRadius: '30px', borderTopRightRadius: '30px', 
          overflow: 'hidden', display: 'flex', flexDirection: 'column' 
        }}
      >
        {/* 헤더: 블루 계열 */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1E40AF, #3B82F6)', 
          padding: '24px 20px', color: '#fff', position: 'relative' 
        }}>
          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', margin: '0 auto 15px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>인천 경로 안내 ⚓</h2>
              <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>인천 지역 성지 탐색 및 최단 경로</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '8px', color: '#fff', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 목록 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F8FAFC' }}>
          {incheonParties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <Info size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '16px', fontWeight: '700' }}>인천 지역 파티 정보를 준비 중입니다.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {incheonParties.map((party) => (
                <div key={party.id} style={{ 
                  background: '#fff', borderRadius: '22px', padding: '16px', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' 
                }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '80px', height: '100px', borderRadius: '15px', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0' }}>
                      <img 
                        src={party.poster_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=200'} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#1E293B', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {party.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '12px', marginBottom: '12px' }}>
                        <MapPin size={14} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.locationName}</span>
                      </div>
                      <button 
                        onClick={() => handleRoute(party)}
                        disabled={loading}
                        style={{ 
                          width: '100%', padding: '12px', borderRadius: '14px', 
                          background: '#2563EB', color: '#fff', border: 'none', 
                          fontSize: '14px', fontWeight: '900', display: 'flex', 
                          alignItems: 'center', justifyContent: 'center', gap: '8px',
                          boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
                          cursor: 'pointer'
                        }}
                      >
                        <Navigation size={16} />
                        {loading ? '위치 확인 중...' : '경로 안내'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #F1F5F9' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '18px', borderRadius: '18px', background: '#F1F5F9', color: '#475569', border: 'none', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IncheonRoute;
