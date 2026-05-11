import React, { useState, useEffect, useRef } from 'react';
import { X, Navigation, MapPin, Loader2, Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BAR_DATABASE } from '../lib/BarLib';

const IncheonRoute = ({ parties, userCoords, setUserCoords, onClose }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [loading, setLoading] = useState(!userCoords);
  const mapContainer = useRef(null);

  const calcDist = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    if (!userCoords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          if (setUserCoords) setUserCoords(coords);
          setLoading(false);
        },
        () => setLoading(false),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, [userCoords, setUserCoords]);

  const nearbyParties = parties
    .map(p => {
      const lat = p.locations?.latitude || p.lat;
      const lon = p.locations?.longitude || p.lon;
      const dist = userCoords ? calcDist(userCoords.lat, userCoords.lon, lat, lon) : 9999;
      return { ...p, distance: dist, lat, lon };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps || !mapContainer.current || !userCoords) return;
    const lat = userCoords.lat;
    const lon = userCoords.lon;
    const map = new window.kakao.maps.Map(mapContainer.current, { center: new window.kakao.maps.LatLng(lat, lon), level: 4 });
    const bounds = new window.kakao.maps.LatLngBounds();
    const myPos = new window.kakao.maps.LatLng(lat, lon);
    new window.kakao.maps.Marker({ position: myPos, map: map });
    bounds.extend(myPos);

    nearbyParties.forEach((p) => {
      if (p.lat && p.lon) {
        const pos = new window.kakao.maps.LatLng(p.lat, p.lon);
        new window.kakao.maps.Marker({ position: pos, map: map });
        bounds.extend(pos);
      }
    });
    if (nearbyParties.length > 0) map.setBounds(bounds);
  }, [userCoords, nearbyParties]);

  const handleRoute = (party) => {
    const locName = (party.locationName || '').trim();
    const barInfo = BAR_DATABASE.find(b => b.name.trim() === locName || b.aliases?.some(a => a.trim() === locName));
    const addr = barInfo?.address || party.address || locName;
    const url = isEn 
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`
      : `https://map.kakao.com/link/to/${encodeURIComponent(addr)}`;
    window.open(url, '_blank');
  };

  if (!userCoords && loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, backgroundColor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#2563EB" />
        <p style={{ marginTop: 16, fontWeight: 800 }}>주변 성지 분석 중...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 2147483647, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '80vh', background: '#fff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* 미니 지도 */}
        <div style={{ width: '100%', height: '220px', background: '#eee', flexShrink: 0 }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* 심플 리스트 영역 */}
        <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Trophy size={20} color="#F59E0B" />
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>내 주변 추천 성지</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nearbyParties.map((party, idx) => (
              <button 
                key={party.id} 
                onClick={() => handleRoute(party)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px', background: idx === 0 ? '#F8FAFC' : '#fff',
                  borderRadius: '20px', border: idx === 0 ? '1.5px solid #2563EB' : '1px solid #F1F5F9',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 32, height: 32, background: idx === 0 ? '#2563EB' : '#F1F5F9', color: idx === 0 ? '#fff' : '#64748B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 2 }}>{party.locationName || party.title}</div>
                    <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>현재 위치에서 {party.distance < 1 ? `${Math.round(party.distance*1000)}m` : `${party.distance.toFixed(1)}km`}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2563EB', fontWeight: 700, fontSize: 14 }}>
                  안내 <ChevronRight size={16} />
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 32, padding: 16, background: '#F8FAFC', borderRadius: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
              가장 가까운 요일의 파티 일정을 기준으로 분석되었습니다.<br/>
              순위별 성지 이름을 클릭하면 즉시 경로 안내가 시작됩니다.
            </p>
          </div>
        </div>

        <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #F1F5F9' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '18px', borderRadius: '18px', background: '#F1F5F9', color: '#475569', border: 'none', fontSize: 16, fontWeight: '800' }}>닫기</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IncheonRoute;
