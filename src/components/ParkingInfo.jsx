// src/components/ParkingInfo.jsx
// 공유주차장 정보 표시 모달

import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';

const ParkingInfo = ({ bar, onClose }) => {
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParking = async () => {
      if (!bar) return;
      try {
        const apiKey = import.meta.env.VITE_PARKING_API_KEY;
        // 공유누리 API 호출 (사용자 지정 URL)
        const baseUrl = `https://www.eshare.go.kr/eshare-openapi/rsrc/list/010700/${apiKey}`;
        
        // 공공데이터 특성상 전체 목록을 가져온 후 거리 계산이 필요할 수 있음
        const response = await fetch(baseUrl);
        const data = await response.json();
        
        // 데이터 구조 처리 (eshare API 응답 구조 기반 추측 및 방어적 코딩)
        const rawList = data.data || data.list || (Array.isArray(data) ? data : []);
        
        // 거리 계산 함수 (Haversine)
        const getDistance = (lat1, lon1, lat2, lon2) => {
          if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
          const R = 6371; // km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        const processed = rawList
          .map(item => {
            const itemLat = parseFloat(item.la || item.lat || item.latitude);
            const itemLon = parseFloat(item.lo || item.lng || item.longitude);
            return {
              name: item.rsrcNm || item.name || item.title || '공유주차장',
              dist: getDistance(bar.lat, bar.lon, itemLat, itemLon)
            };
          })
          .filter(item => item.dist < 3) // 3km 이내
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 5);

        setParkingLots(processed);
      } catch (error) {
        console.error('Parking API error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParking();
  }, [bar]);

  if (!bar) return null;

  return (
    <div 
      id="parking-modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 10020,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out'
      }} 
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .parking-modal { animation: slideUp 0.3s ease-out; }
      `}</style>
      
      <div 
        className="parking-modal"
        style={{
          background: '#ffffff',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '380px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 장식 바 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
          background: 'linear-gradient(90deg, #3b82f6, #60a5fa)'
        }} />

        <button 
          id="close-parking-modal"
          onClick={onClose} 
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: '#f8fafc', border: 'none', borderRadius: '12px',
            width: '36px', height: '36px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s'
          }}
        >
          <X size={18} color="#64748b" />
        </button>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '20px', fontWeight: 900, color: '#1e293b', 
            margin: 0, display: 'flex', alignItems: 'center', gap: '8px' 
          }}>
            <MapPin size={22} color="#3b82f6" fill="#dbeafe" /> 📍 주변 공유주차장
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            {bar.name} 주변 3km 이내 주차 정보
          </p>
        </div>

        {loading ? (
          <div style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', padding: '40px 0', gap: '12px' 
          }}>
            <Loader2 size={32} color="#3b82f6" className="animate-spin" />
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>정보를 찾는 중입니다...</span>
          </div>
        ) : parkingLots.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {parkingLots.map((lot, idx) => (
              <div key={idx} style={{
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #f1f5f9',
                transition: 'transform 0.2s'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '15px', color: '#334155', fontWeight: 700 }}>
                    - {lot.name}
                  </span>
                </div>
                <div style={{
                  background: '#dbeafe',
                  color: '#1e40af',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 800
                }}>
                  {lot.dist.toFixed(1)}km
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', padding: '40px 0', 
            background: '#f8fafc', borderRadius: '16px'
          }}>
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
              주변에 등록된 공유주차장이 없습니다.
            </span>
          </div>
        )}

        <div style={{ 
          marginTop: '24px', paddingTop: '16px', 
          borderTop: '1px dashed #e2e8f0',
          fontSize: '11px', color: '#94a3b8', textAlign: 'center',
          fontWeight: 500
        }}>
          데이터 제공: 공유누리(eshare.go.kr) 오픈 API
        </div>
      </div>
    </div>
  );
};

export default ParkingInfo;
