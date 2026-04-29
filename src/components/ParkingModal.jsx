import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ParkingModal = ({ onClose }) => {
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParkingData = async () => {
      try {
        setLoading(true);
        // 1. GPS 현재 위치 받기
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        const { latitude: userLat, longitude: userLon } = position.coords;

        // 2. 공유자원 주차장 API 호출
        const apiKey = import.meta.env.VITE_PARKING_API_KEY;
        const response = await fetch(`https://www.eshare.go.kr/eshare-openapi/rsrc/list/010700/${apiKey}`);
        const data = await response.json();
        
        const rawList = data.data || data.list || (Array.isArray(data) ? data : []);

        // 거리 계산 함수
        const getDistance = (lat1, lon1, lat2, lon2) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        };

        const processed = rawList
          .map(item => {
            const itemLat = parseFloat(item.la || item.lat || item.latitude);
            const itemLon = parseFloat(item.lo || item.lng || item.longitude);
            const dist = getDistance(userLat, userLon, itemLat, itemLon);
            return {
              name: item.rsrcNm || item.name || '공유주차장',
              address: item.addr || item.address || '주소 정보 없음',
              lat: itemLat,
              lon: itemLon,
              distance: dist
            };
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3);

        setParkingLots(processed);
      } catch (err) {
        console.error('Parking fetch error:', err);
        setError('위치 정보를 가져오거나 주차장 데이터를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchParkingData();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000000,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: '400px',
          background: '#FFFFFF', borderRadius: '32px',
          padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '24px', right: '24px',
            background: '#F1F5F9', border: 'none', borderRadius: '14px',
            padding: '8px', color: '#64748B', cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ background: '#3b82f6', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '4px 12px', borderRadius: '50px', display: 'inline-block', marginBottom: '10px' }}>ESHAPE API LIVE</div>
          <h2 style={{ fontSize: '22px', fontWeight: 1000, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🅿️ 주변 공유주차장
          </h2>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>내 위치 기준 가장 가까운 무료/공유 주차장</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 size={40} color="#3b82f6" className="animate-spin" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#94A3B8', fontSize: '14px', fontWeight: 600 }}>주변 주차장을 탐색하고 있습니다...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 0', background: '#FEF2F2', borderRadius: '20px' }}>
            <p style={{ color: '#EF4444', fontSize: '14px', fontWeight: 600 }}>{error}</p>
          </div>
        ) : parkingLots.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {parkingLots.map((lot, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.02, backgroundColor: '#F8FAFC' }}
                style={{
                  padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0',
                  background: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onClick={() => window.open(`https://map.kakao.com/link/to/${lot.name},${lot.lat},${lot.lon}`, '_blank')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.address}</div>
                  </div>
                  <div style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: 900, flexShrink: 0, marginLeft: '10px' }}>
                    {lot.distance.toFixed(1)}km
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#3b82f6', fontWeight: 700 }}>
                  <Navigation size={12} /> 카카오맵 길찾기 →
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', background: '#F8FAFC', borderRadius: '20px' }}>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>주변에 등록된 공유주차장이 없습니다.</p>
          </div>
        )}

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <p style={{ color: '#CBD5E1', fontSize: '10px' }}>데이터 제공: 공공데이터포털 공유누리</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ParkingModal;
