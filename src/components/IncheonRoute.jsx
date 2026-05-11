import React, { useState } from 'react';
import { X, Navigation, MapPin, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BAR_DATABASE } from '../lib/BarLib';

const IncheonRoute = ({ parties, userCoords, onClose }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [loading, setLoading] = useState(false);

  // 거리 계산 함수 (Haversine)
  const calcDist = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 파티 데이터 가공: 거리 계산 및 필터링
  const processedParties = parties.map(p => {
    const lat = p.locations?.latitude || p.lat;
    const lon = p.locations?.longitude || p.lon;
    const dist = userCoords ? calcDist(userCoords.lat, userCoords.lon, lat, lon) : 9999;
    return { ...p, distance: dist };
  });

  // '지능형 경로' (거리순 안내)
  const nearbyParties = processedParties
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  const handleRoute = (party) => {
    const locationName = (party.locationName || '').trim()
    
    const barInfo = BAR_DATABASE.find(b => 
      b.name.trim() === locationName ||
      b.aliases?.some(a => a.trim() === locationName) ||
      locationName.includes(b.name.trim()) ||
      b.name.trim().includes(locationName)
    )
    
    const destAddress = barInfo?.address || party.address || locationName
    
    if (!navigator.geolocation) {
      const url = isEn 
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destAddress)}`
        : `https://map.kakao.com/link/search/${encodeURIComponent(destAddress)}`;
      window.open(url, '_blank');
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false)
        const url = isEn 
          ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destAddress)}`
          : `https://map.kakao.com/link/to/${encodeURIComponent(destAddress)}`;
        window.open(url, '_blank');
      },
      (err) => {
        setLoading(false);
        const url = isEn 
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destAddress)}`
          : `https://map.kakao.com/link/search/${encodeURIComponent(destAddress)}`;
        window.open(url, '_blank');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

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
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>지능형 주변 경로 🛰️</h2>
              <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>{userCoords ? '현재 위치 기준 최단 거리 성지 탐색' : '인천 지역 성지 탐색 및 최단 경로'}</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '8px', color: '#fff', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 목록 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F8FAFC' }}>
          {nearbyParties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <Info size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '16px', fontWeight: '700' }}>{userCoords ? '주변 100km 이내에 파티 정보가 없습니다.' : '위치 권한을 허용하시면 주변 성지를 안내해 드립니다.'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {nearbyParties.map((party) => (
                <div key={party.id} style={{ 
                  background: '#fff', borderRadius: '22px', padding: '16px', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' 
                }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '80px', height: '100px', borderRadius: '15px', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', position: 'relative' }}>
                      <img 
                        src={party.poster_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=200'} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      {party.distance < 9999 && (
                        <div style={{ position:'absolute', bottom:4, right:4, background:'rgba(37,99,235,0.9)', color:'#fff', fontSize:9, padding:'2px 6px', borderRadius:4, fontWeight:900 }}>
                          {party.distance < 1 ? `${Math.round(party.distance*1000)}m` : `${party.distance.toFixed(1)}km`}
                        </div>
                      )}
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
                        {loading ? (isEn ? 'Checking...' : '위치 확인 중...') : (isEn ? 'Route' : '경로 안내')}
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
