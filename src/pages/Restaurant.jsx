import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Navigation, Info, AlertCircle, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Restaurant = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
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
        setError(null);
      },
      { timeout: 10000 }
    );
  }, []);

  // 2. API 호출
  useEffect(() => {
    if (!coords) return;

    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const url = `/api/restaurant?lat=${coords.lat}&lon=${coords.lon}`;
        const response = await fetch(url);
        const json = await response.json();

        // 소상공인 API 응답 구조: json.body.items
        if (json.body && json.body.items) {
          const list = json.body.items.map(item => ({
            id: item.bizesId,
            name: item.bizesNm,
            branch: item.brchNm,
            category: item.indsMclsNm,
            address: item.lnoAddr || item.rdnmAddr || '주소 정보 없음',
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            distance: calculateDistance(coords.lat, coords.lon, parseFloat(item.lat), parseFloat(item.lon))
          })).sort((a, b) => a.distance - b.distance);
          
          setRestaurants(list);
        } else {
          setRestaurants([]);
        }
      } catch (err) {
        console.error(err);
        setError('맛집 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [coords]);

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
      width: '100%', height: '100vh', background: '#F8FAFC',
      display: 'flex', flexDirection: 'column', fontFamily: "'Pretendard', sans-serif"
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '20px', display: 'flex', alignItems: 'center', background: '#fff',
        borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', marginRight: '10px' }}>
          <ChevronLeft size={24} color="#1E293B" />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', margin: 0 }}>🍽️ 뒤풀이 맛집</h1>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}
            >
              <div style={{ 
                width: '40px', height: '40px', border: '4px solid #F1F5F9', 
                borderTop: '4px solid #F59E0B', borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ marginTop: '16px', color: '#64748B', fontWeight: 600 }}>주변 맛집을 찾는 중...</p>
            </motion.div>
          ) : error ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
              <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#1E293B', fontWeight: 700, marginBottom: '8px' }}>오류가 발생했습니다</p>
              <p style={{ color: '#64748B', fontSize: '14px' }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '10px', background: '#F59E0B', color: '#fff', border: 'none', fontWeight: 700 }}>재시도</button>
            </motion.div>
          ) : restaurants.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍱</div>
              <p style={{ color: '#1E293B', fontWeight: 700, marginBottom: '8px' }}>근처에 음식점이 없습니다</p>
              <p style={{ color: '#64748B', fontSize: '14px' }}>반경 1km 이내에 등록된 맛집이 없네요.</p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isFallback && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '12px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>📍</span>
                  <span style={{ fontSize: '13px', color: '#B45309', fontWeight: 700 }}>현위치를 가져올 수 없어 서울 기준으로 표시합니다</span>
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>검색 결과 {restaurants.length}개</div>
              {restaurants.map((res) => (
                <motion.div key={res.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#fff', borderRadius: '16px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B', margin: 0 }}>{res.name}</h3>
                        {res.branch && <span style={{ fontSize: '12px', color: '#64748B' }}>({res.branch})</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '12px' }}>
                        <MapPin size={12} />
                        <span>{res.address}</span>
                      </div>
                    </div>
                    <div style={{ background: '#FFF7ED', color: '#EA580C', fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                      {res.distance.toFixed(1)}km
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Utensils size={14} color="#F59E0B" />
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{res.category}</span>
                  </div>

                  <button onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(res.name + ' ' + res.address)}`, '_blank')}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#F59E0B', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '8px', justifyContent: 'center' }}
                  >
                    <Navigation size={16} />카카오맵 길찾기
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      
      <div style={{ padding: '20px', textAlign: 'center', background: '#fff', borderTop: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>데이터 제공: 소상공인시장진흥공단</p>
      </div>
    </div>
  );
};

export default Restaurant;
