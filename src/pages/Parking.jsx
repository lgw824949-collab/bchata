import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Navigation, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Parking = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [coords, setCoords] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  // 1. 현위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('GPS를 지원하지 않는 브라우저입니다.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setIsFallback(false);
      },
      (err) => {
        console.warn('Geolocation error, falling back to Seoul:', err);
        setCoords({ lat: 37.5665, lon: 126.9780 });
        setIsFallback(true);
        setError(null); // 권한 거부 시 에러 표시 대신 fallback 진행
      },
      { timeout: 10000 }
    );
  }, []);

  // 2. API 호출
  useEffect(() => {
    if (!coords) return;

    const fetchParking = async () => {
      setLoading(true);
      try {
        const apiKey = import.meta.env.VITE_PARKING_API_KEY;
        const url = `https://apis.data.go.kr/1741000/ResrceOpenShareService/getResrceLctnList?serviceKey=${apiKey}&pageNo=1&numOfRows=20&type=json&resrceCtgryId=010800&lctnLattitud=${coords.lat}&lctnLongitud=${coords.lon}&radius=2`;

        const response = await fetch(url);
        const json = await response.json();

        if (json.ResrceOpenShareList && json.ResrceOpenShareList[1] && json.ResrceOpenShareList[1].row) {
          const list = json.ResrceOpenShareList[1].row.map(item => ({
            id: item.resrceId,
            name: item.resrceNm,
            address: item.addr || item.lctnAddr || '주소 정보 없음',
            lat: item.lattitud,
            lon: item.longitud,
            fee: item.utiliFee || '정보 없음',
            distance: calculateDistance(coords.lat, coords.lon, item.lattitud, item.longitud)
          })).sort((a, b) => a.distance - b.distance);
          
          setParkingLots(list);
        } else {
          setParkingLots([]);
        }
      } catch (err) {
        console.error(err);
        setError('주차장 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchParking();
  }, [coords]);

  // 거리 계산 (Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Pretendard', sans-serif"
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button 
          onClick={onBack}
          style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', marginRight: '10px' }}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', margin: 0 }}>🅿️ 주변 공유주차장</h1>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}
            >
              <div style={{ 
                width: '40px', height: '40px', border: '4px solid #F1F5F9', 
                borderTop: '4px solid #E53935', borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ marginTop: '16px', color: '#64748B', fontWeight: 600 }}>주변 주차장을 찾는 중...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '40px 20px' }}
            >
              <AlertCircle size={48} color="#E53935" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#1E293B', fontWeight: 700, marginBottom: '8px' }}>오류가 발생했습니다</p>
              <p style={{ color: '#64748B', fontSize: '14px' }}>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '10px', background: '#E53935', color: '#fff', border: 'none', fontWeight: 700 }}
              >재시도</button>
            </motion.div>
          ) : parkingLots.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 20px' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
              <p style={{ color: '#1E293B', fontWeight: 700, marginBottom: '8px' }}>근처에 공유주차장이 없습니다</p>
              <p style={{ color: '#64748B', fontSize: '14px' }}>반경 2km 이내에 등록된 주차장이 없네요.</p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isFallback && (
                <div style={{ 
                  background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', 
                  padding: '12px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <span style={{ fontSize: '16px' }}>📍</span>
                  <span style={{ fontSize: '13px', color: '#B45309', fontWeight: 700 }}>
                    현위치를 가져올 수 없어 서울 기준으로 표시합니다
                  </span>
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                검색 결과 {parkingLots.length}개
              </div>
              {parkingLots.map((lot) => (
                <motion.div
                  key={lot.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#fff', borderRadius: '16px', padding: '18px',
                    border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B', margin: '0 0 4px 0' }}>{lot.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '12px' }}>
                        <MapPin size={12} />
                        <span>{lot.address}</span>
                      </div>
                    </div>
                    <div style={{ 
                      background: '#FFEBEE', color: '#E53935', fontSize: '11px', 
                      fontWeight: 900, padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' 
                    }}>
                      {lot.distance.toFixed(1)}km
                    </div>
                  </div>

                  <div style={{ 
                    background: '#F8FAFC', borderRadius: '12px', padding: '12px', 
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' 
                  }}>
                    <Info size={14} color="#64748B" />
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                      요금: <span style={{ color: '#1E293B' }}>{lot.fee}</span>
                    </span>
                  </div>

                  <button 
                    onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(lot.name + ' ' + lot.address)}`, '_blank')}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '10px',
                      background: '#E53935', color: '#fff', border: 'none',
                      fontSize: '14px', fontWeight: 900, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <Navigation size={16} />
                    카카오맵 길찾기
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      
      <div style={{ padding: '20px', textAlign: 'center', background: '#fff', borderTop: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>데이터 제공: 공공데이터포털 (공유누리)</p>
      </div>
    </div>
  );
};

export default Parking;
