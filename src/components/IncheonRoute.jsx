import React, { useState, useEffect, useRef } from 'react';
import { X, Navigation, MapPin, Loader2, Trophy, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BAR_DATABASE } from '../lib/BarLib';

const IncheonRoute = ({ parties, userCoords, setUserCoords, onClose }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [loading, setLoading] = useState(!userCoords);
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  // 거리 계산 함수 (Haversine)
  const calcDist = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 위치 정보가 없을 경우 즉시 요청 (이미 권한이 있다면 자동으로 진행됨)
  useEffect(() => {
    if (!userCoords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          if (setUserCoords) setUserCoords(coords);
          setLoading(false);
        },
        (err) => {
          setLoading(false);
          console.error("Location error:", err);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, [userCoords, setUserCoords]);

  // 파티 데이터 가공: 거리 계산 및 필터링
  const processedParties = userCoords ? parties.map(p => {
    const lat = p.locations?.latitude || p.lat;
    const lon = p.locations?.longitude || p.lon;
    const dist = calcDist(userCoords.lat, userCoords.lon, lat, lon);
    return { ...p, distance: dist, lat, lon };
  }) : [];

  // 내 위치에서 가장 가까운 TOP 3 성지
  const nearbyParties = processedParties
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  // --- 카카오 지도 초기화 ---
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps || !mapContainer.current || !userCoords) return;

    const lat = userCoords.lat;
    const lon = userCoords.lon;
    const options = { center: new window.kakao.maps.LatLng(lat, lon), level: 4 };
    const map = new window.kakao.maps.Map(mapContainer.current, options);
    mapRef.current = map;

    const bounds = new window.kakao.maps.LatLngBounds();

    // 1. 내 위치 마커
    const myPos = new window.kakao.maps.LatLng(lat, lon);
    new window.kakao.maps.Marker({ position: myPos, map: map, title: '내 위치' });
    bounds.extend(myPos);

    const overlay = new window.kakao.maps.CustomOverlay({
      position: myPos,
      content: '<div style="padding:5px 12px; background:#2563EB; color:#fff; border-radius:20px; font-size:11px; font-weight:900; box-shadow:0 4px 12px rgba(0,0,0,0.2)">현재 내 위치</div>',
      yAnchor: 2.5
    });
    overlay.setMap(map);

    // 2. TOP 3 성지 마커
    nearbyParties.forEach((party, idx) => {
      if (!party.lat || !party.lon) return;
      const pos = new window.kakao.maps.LatLng(party.lat, party.lon);
      const m = new window.kakao.maps.Marker({ position: pos, map: map });
      bounds.extend(pos);

      const iwContent = `<div style="padding:10px; font-size:12px; font-weight:800; color:#0F172A; min-width:140px; text-align:center">${idx + 1}위: ${party.title}</div>`;
      const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent, removable: true });
      window.kakao.maps.event.addListener(m, 'click', () => infowindow.open(map, m));
    });

    if (nearbyParties.length > 0) map.setBounds(bounds);
  }, [userCoords, nearbyParties]);

  const handleRoute = (party) => {
    const locationName = (party.locationName || '').trim();
    const barInfo = BAR_DATABASE.find(b => 
      b.name.trim() === locationName || b.aliases?.some(a => a.trim() === locationName) || locationName.includes(b.name.trim())
    );
    const destAddress = barInfo?.address || party.address || locationName;
    const url = isEn 
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destAddress)}`
      : `https://map.kakao.com/link/to/${encodeURIComponent(destAddress)}`;
    window.open(url, '_blank');
  };

  if (!userCoords && loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 2147483647, backgroundColor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 size={50} color="#2563EB" /></motion.div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>주변 성지 분석 중...</h2>
        <p style={{ color: '#64748B', fontSize: 14 }}>최적의 경로를 찾고 있습니다.</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 2147483647, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', height: '94vh', background: '#fff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ background: '#0F172A', padding: '24px 20px', color: '#fff', flexShrink: 0 }}>
          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 15px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Trophy size={22} color="#FFD700" />
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color:'#FFD700' }}>내 주변 성지 TOP 3</h2>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '8px', color: '#fff' }}><X size={20} /></button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* 지도 영역 */}
          <div style={{ width: '100%', height: '350px', background: '#E2E8F0', flexShrink: 0, borderBottom:'1px solid #E2E8F0' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          </div>

          <div style={{ padding: '24px 20px', background:'#F8FAFC' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
              <h4 style={{ fontSize:18, fontWeight:900, color:'#0F172A', margin:0 }}>최단 거리 추천 리스트</h4>
              <span style={{ fontSize:12, color:'#64748B' }}>실시간 위치 기반</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {nearbyParties.map((party, idx) => (
                <div key={party.id} style={{ 
                  background: '#fff', borderRadius: '24px', padding: '20px', 
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', border: idx === 0 ? '2px solid #FFD700' : '1px solid #F1F5F9',
                  position: 'relative'
                }}>
                  {idx === 0 && <div style={{ position:'absolute', top:0, right:0, background:'#FFD700', color:'#000', fontSize:10, fontWeight:900, padding:'4px 12px', borderBottomLeftRadius:16 }}>BEST CHOICE</div>}
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ width: '90px', height: '120px', borderRadius: '18px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      <img src={party.poster_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=200'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(15, 23, 42, 0.9)', color:'#fff', fontSize:10, padding:'4px 10px', borderRadius:10, fontWeight:800 }}>{party.distance < 1 ? `${Math.round(party.distance*1000)}m` : `${party.distance.toFixed(1)}km`}</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize:idx === 0 ? 20 : 18, fontWeight:900, color:'#0F172A', marginBottom:6 }}>{idx + 1}위 {party.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '13px', marginBottom: '16px' }}><MapPin size={14} />{party.locationName}</div>
                      <button onClick={() => handleRoute(party)} style={{ width: '100%', padding: '14px', borderRadius: '16px', background: idx === 0 ? '#0F172A' : '#2563EB', color: '#fff', border: 'none', fontSize: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Navigation size={16} /> 경로 안내 시작
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', padding: '18px', borderRadius: '22px', background: '#F1F5F9', color: '#475569', border: 'none', fontSize: '16px', fontWeight: '800' }}>닫기</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IncheonRoute;
