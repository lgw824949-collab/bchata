import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Navigation, Info, AlertCircle, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getUserCoords, isGeoDenied, readCachedCoords } from '../lib/geoCache';
import AppPageHeader from '../components/AppPageHeader';

const SkeletonCard = () => (
  <div style={{
    background: '#fff', borderRadius: '16px', padding: '18px', border: '1px solid #E2E8F0',
    animation: 'pulse 1.5s infinite ease-in-out'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ width: '60%', height: '16px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '8px' }} />
        <div style={{ width: '40%', height: '12px', background: '#F1F5F9', borderRadius: '4px' }} />
      </div>
      <div style={{ width: '40px', height: '20px', background: '#F1F5F9', borderRadius: '8px' }} />
    </div>
    <div style={{ width: '100%', height: '36px', background: '#F1F5F9', borderRadius: '12px', marginBottom: '16px' }} />
    <div style={{ width: '100%', height: '40px', background: '#F1F5F9', borderRadius: '10px' }} />
  </div>
);

const DEFAULT_RESTAURANTS = [
  { id: 'def-1', name: '홍대 고기집', address: '서울 마포구 홍익로', category: '한식', distance: 0, isDefault: true },
  { id: 'def-2', name: '이태원 멕시칸', address: '서울 용산구 이태원로', category: '양식', distance: 0, isDefault: true },
  { id: 'def-3', name: '강남 포차', address: '서울 강남구 테헤란로', category: '주점', distance: 0, isDefault: true },
];

const Restaurant = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurants, setRestaurants] = useState([]); 
  const [coords, setCoords] = useState(() => {
    const c = readCachedCoords(24 * 60 * 60 * 1000);
    return c ? { lat: c.lat, lon: c.lng } : null;
  });
  const [isFallback, setIsFallback] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. 현위치 — 캐시 우선 (한 번 허용 후 재팝업 없음)
  useEffect(() => {
    const applyCoords = (c, fallback = false) => {
      setCoords({ lat: c.lat, lon: c.lng ?? c.lon });
      setIsFallback(fallback);
      setError(null);
    };

    const cached = readCachedCoords(24 * 60 * 60 * 1000);
    if (cached) {
      applyCoords(cached);
      return;
    }

    if (isGeoDenied()) {
      applyCoords({ lat: 37.5665, lng: 126.978 }, true);
      return;
    }

    getUserCoords({ enableHighAccuracy: false })
      .then((c) => applyCoords(c))
      .catch(() => applyCoords({ lat: 37.5665, lng: 126.978 }, true));
  }, []);

  // 2. API 호출
  useEffect(() => {
    if (!coords) return;

    const fetchRestaurants = async () => {
      const latKey = coords.lat.toFixed(2);
      const lonKey = coords.lon.toFixed(2);
      const cacheKey = `res_cache_${latKey}_${lonKey}`;
      
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 10 * 60 * 1000) { 
          setRestaurants(data);
          setLoading(false);
          return;
        }
      }

      setIsRefreshing(true);
      if (restaurants.length === 0) setLoading(true);

      try {
        const url = `/api/restaurant?lat=${coords.lat}&lon=${coords.lon}`;
        const response = await fetch(url);
        const json = await response.json();

        if (json.body && json.body.items) {
          const list = json.body.items.map(item => ({
            id: item.bizesId,
            name: item.bizesNm,
            branch: item.brchNm,
            category: item.indsMclsNm,
            address: item.rdnmAdr || '주소 정보 없음',
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            distance: calculateDistance(coords.lat, coords.lon, parseFloat(item.lat), parseFloat(item.lon))
          })).sort((a, b) => a.distance - b.distance);
          
          setRestaurants(list);
          localStorage.setItem(cacheKey, JSON.stringify({ data: list, timestamp: Date.now() }));
        }
      } catch (err) {
        console.error('Fetch failed:', err);
      } finally {
        setIsRefreshing(false);
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
      display: 'flex', flexDirection: 'column', fontFamily: "inherit"
    }}>
      <AppPageHeader
        variant="light"
        sticky
        left={(
          <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
            <ChevronLeft size={24} color="#1E293B" />
          </button>
        )}
        center={(
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', margin: 0 }}>🍽️ 뒤풀이 맛집</h1>
        )}
      />

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
              <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#1E293B', fontWeight: 700, marginBottom: '8px' }}>오류가 발생했습니다</p>
              <p style={{ color: '#64748B', fontSize: '14px' }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '10px', background: '#F59E0B', color: '#fff', border: 'none', fontWeight: 700 }}>재시도</button>
            </motion.div>
          ) : restaurants.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍱</div>
              <p style={{ color: '#1E293B', fontWeight: 700, marginBottom: '8px' }}>근처에 음식점이 없습니다</p>
              <p style={{ color: '#64748B', fontSize: '14px' }}>반경 1km 이내에 등록된 맛집이 없네요.</p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                      {typeof res.distance === 'number' ? `${res.distance.toFixed(1)}km` : res.distance}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Utensils size={14} color="#F59E0B" />
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{res.category}</span>
                  </div>

                  <button onClick={() => {
                    const query = encodeURIComponent(res.name + ' ' + res.address);
                    const url = isEn 
                      ? `https://www.google.com/maps/search/?api=1&query=${query}`
                      : `https://map.kakao.com/link/search/${query}`;
                    window.open(url, '_blank');
                  }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#F59E0B', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '8px', justifyContent: 'center' }}
                  >
                    <Navigation size={16} />{isEn ? 'Open in Google Maps' : '카카오맵 길찾기'}
                  </button>
                </motion.div>
              ))}
            </motion.div>
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
