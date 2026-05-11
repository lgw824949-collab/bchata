import React, { useState, useEffect, useRef } from 'react';
import { X, Navigation, MapPin, Info, Trophy, Lock, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BAR_DATABASE } from '../lib/BarLib';

const IncheonRoute = ({ parties, userCoords, onClose }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
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

  // 파티 데이터 가공: 거리 계산 및 필터링 (권한이 있을 때만 수행)
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

  // --- 권한 요청 함수 ---
  const requestPermission = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // 성공 시 App.jsx의 좌표 업데이트를 기다리거나 직접 상태 반영
        // 여기서는 부모(App.jsx)가 좌표를 업데이트해주면 리렌더링됩니다.
        setLoading(false);
        setPermissionError(false);
      },
      (err) => {
        setLoading(false);
        setPermissionError(true);
        alert('위치 권한 승인이 필요합니다. 설정에서 위치 권한을 허용해 주세요.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- 카카오 지도 초기화 ---
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps || !mapContainer.current || !userCoords) return;

    const lat = userCoords.lat;
    const lon = userCoords.lon;

    const options = {
      center: new window.kakao.maps.LatLng(lat, lon),
      level: 4
    };

    const map = new window.kakao.maps.Map(mapContainer.current, options);
    mapRef.current = map;

    const bounds = new window.kakao.maps.LatLngBounds();

    // 1. 내 위치 마커
    const myPos = new window.kakao.maps.LatLng(lat, lon);
    const marker = new window.kakao.maps.Marker({
      position: myPos,
      title: '내 위치'
    });
    marker.setMap(map);
    bounds.extend(myPos);

    const content = '<div style="padding:5px 10px; background:#2563EB; color:#fff; border-radius:20px; font-size:10px; font-weight:900; box-shadow:0 2px 6px rgba(0,0,0,0.2)">현재 내 위치</div>';
    const customOverlay = new window.kakao.maps.CustomOverlay({
      position: myPos,
      content: content,
      yAnchor: 2.3
    });
    customOverlay.setMap(map);

    // 2. TOP 3 성지 마커
    nearbyParties.forEach((party, idx) => {
      if (!party.lat || !party.lon) return;
      const pos = new window.kakao.maps.LatLng(party.lat, party.lon);
      const m = new window.kakao.maps.Marker({ position: pos, title: party.title });
      m.setMap(map);
      bounds.extend(pos);

      const iwContent = `<div style="padding:8px; font-size:11px; font-weight:700; color:#1E293B; width:120px; text-align:center">${idx + 1}위: ${party.title}</div>`;
      const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent });
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

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 2147483647, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', backdropFilter:'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', height: '94vh', background: '#fff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* 헤더 */}
        <div style={{ background: '#0F172A', padding: '24px 20px', color: '#fff', flexShrink: 0 }}>
          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 15px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Trophy size={22} color="#FFD700" />
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color:'#FFD700' }}>실시간 주변 성지 분석</h2>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '8px', color: '#fff' }}><X size={20} /></button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background:'#F8FAFC' }}>
          {!userCoords ? (
            /* 권한 미승인 시 표시할 전용 화면 */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 30px', textAlign: 'center' }}>
              <div style={{ width: 100, height: 100, background: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <Lock size={48} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', marginBottom: 12 }}>권한 승인이 필요합니다</h3>
              <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.6, marginBottom: 32 }}>
                "내 주변 성지 TOP 3"는 권한을 승인하신<br/>
                80여 명의 멤버분들께만 제공되는 지능형 서비스입니다.<br/>
                현재 위치를 승인하여 실시간 경로를 확인하세요.
              </p>
              <button 
                onClick={requestPermission}
                disabled={loading}
                style={{ width: '100%', maxWidth: 280, padding: '18px', borderRadius: '20px', background: '#2563EB', color: '#fff', border: 'none', fontSize: '17px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)' }}
              >
                {loading ? '권한 확인 중...' : '위치 권한 승인하기'}
              </button>
              <p style={{ marginTop: 24, fontSize: 13, color: '#94A3B8' }}>* 승인된 정보는 거리 계산 외에 저장되지 않습니다.</p>
            </div>
          ) : (
            /* 권한 승인 시 표시할 결과 화면 */
            <>
              {/* 지도 영역 */}
              <div style={{ width: '100%', height: '350px', background: '#E2E8F0', flexShrink: 0, position: 'relative', borderBottom:'1px solid #E2E8F0' }}>
                <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
                <div style={{ position:'absolute', top:16, left:16, background:'rgba(15, 23, 42, 0.8)', color:'#fff', padding:'6px 12px', borderRadius:20, fontSize:11, fontWeight:800, backdropFilter:'blur(4px)', display:'flex', alignItems:'center', gap:6, zIndex:10 }}>
                  <MapIcon size={14} /> 현재 위치 활성화됨
                </div>
              </div>

              {/* 목록 영역 */}
              <div style={{ padding: '24px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
                  <h4 style={{ fontSize:18, fontWeight:900, color:'#0F172A', margin:0 }}>내 위치 기반 TOP 3 추천</h4>
                  <span style={{ fontSize:12, color:'#64748B' }}>* 10분 단위 자동 갱신</span>
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
            </>
          )}
        </div>
        
        <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', padding: '18px', borderRadius: '22px', background: '#F1F5F9', color: '#475569', border: 'none', fontSize: '16px', fontWeight: '800' }}>닫기</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IncheonRoute;
