import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Navigation, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BAR_DATABASE } from '../data/barDatabase';

const Parking = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bars, setBars] = useState({});
  const [selectedBar, setSelectedBar] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [fetchingParking, setFetchingParking] = useState(false);

  // 1. 바 목록 로딩 (로컬 마스터 데이터 사용)
  useEffect(() => {
    const loadBars = () => {
      setLoading(true);
      try {
        const validBars = BAR_DATABASE.filter(bar => bar.lat && bar.lon);
        // 지역별 그룹화 (주소 기준)
        const groups = validBars.reduce((acc, bar) => {
          const addr = bar.address || '';
          let region = '기타';
          
          if (addr.includes('서울')) region = '서울';
          else if (addr.includes('인천') || addr.includes('경기')) region = '인천/경기';
          else if (addr.includes('부산') || addr.includes('경남') || addr.includes('대구') || addr.includes('경북') || addr.includes('경상')) region = '경상';
          else if (addr.includes('광주') || addr.includes('전남') || addr.includes('전북') || addr.includes('전라')) region = '전라';
          else if (addr.includes('대전') || addr.includes('충남') || addr.includes('충북') || addr.includes('충청') || addr.includes('세종') || addr.includes('천안') || addr.includes('청주')) region = '충청';
          else if (addr.includes('강원')) region = '강원';
          else if (addr.includes('제주')) region = '제주';

          if (!acc[region]) acc[region] = [];
          acc[region].push(bar);
          return acc;
        }, {});
        
        // 지역 정렬 순서 정의
        const order = ['서울', '인천/경기', '경상', '전라', '충청', '강원', '제주'];
        const sortedGroups = {};
        order.forEach(key => {
          if (groups[key]) sortedGroups[key] = groups[key];
        });
        
        setBars(sortedGroups);
      } catch (err) {
        console.error(err);
        setError('장소 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadBars();
  }, []);

  // 2. 바 선택 시 주차장 호출
  const handleSelectBar = async (bar) => {
    setSelectedBar(bar);
    setFetchingParking(true);
    setParkingLots([]);
    setError(null);
    
    try {
      const url = `/api/parking?lat=${bar.lat}&lon=${bar.lon}`;
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
          distance: calculateDistance(bar.lat, bar.lon, item.lattitud, item.longitud)
        })).sort((a, b) => a.distance - b.distance);
        
        setParkingLots(list);
      } else {
        setParkingLots([]);
      }
    } catch (err) {
      console.error(err);
      setError('주차장 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setFetchingParking(false);
    }
  };

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
        <button 
          onClick={selectedBar ? () => setSelectedBar(null) : onBack}
          style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', marginRight: '10px' }}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', margin: 0 }}>
          {selectedBar ? `${selectedBar.name} 주변 주차장` : '🅿️ 주차장 찾기'}
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <AnimatePresence mode="wait">
          {!selectedBar ? (
            // 바 목록
            <motion.div key="bar-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 1000, color: '#1E293B', marginBottom: '8px' }}>어느 바 근처 주차장을 찾으세요?</h2>
                <p style={{ color: '#64748B', fontSize: '14px' }}>방문하실 장소를 선택하면 주변 주차장을 안내해 드립니다.</p>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {Object.entries(bars).map(([region, regionBars]) => (
                    <div key={region}>
                      <h3 style={{ fontSize: '14px', color: '#64748B', fontWeight: 800, marginBottom: '12px', paddingLeft: '4px' }}>
                        {region}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {regionBars.map(bar => (
                          <motion.div
                            key={bar.name}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectBar(bar)}
                            style={{
                              background: '#fff', padding: '16px 20px', borderRadius: '16px',
                              border: '1px solid #E2E8F0', cursor: 'pointer',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>{bar.name}</div>
                              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{bar.address}</div>
                            </div>
                            <ChevronLeft size={20} color="#CBD5E1" style={{ transform: 'rotate(180deg)' }} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            // 주차장 목록
            <motion.div key="parking-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              {fetchingParking ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', marginTop: '60px' }}>
                   <div style={{ 
                    width: '40px', height: '40px', border: '4px solid #F1F5F9', 
                    borderTop: '4px solid #E53935', borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  <p style={{ marginTop: '16px', color: '#64748B', fontWeight: 600 }}>주변 주차장을 찾는 중...</p>
                </div>
              ) : parkingLots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>😅</div>
                  <p style={{ color: '#1E293B', fontWeight: 700, marginBottom: '8px' }}>반경 내 주차장 정보가 없어요</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                    {selectedBar.name} 근처 검색 결과 {parkingLots.length}개
                  </div>
                  {parkingLots.map((lot, idx) => (
                    <motion.div
                      key={lot.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: '#fff', borderRadius: '16px', padding: '18px',
                        border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        position: 'relative'
                      }}
                    >
                      {idx === 0 && <div style={{ position: 'absolute', top: '-10px', left: '-10px', fontSize: '24px' }}>🥇</div>}
                      {idx === 1 && <div style={{ position: 'absolute', top: '-10px', left: '-10px', fontSize: '24px' }}>🥈</div>}
                      {idx === 2 && <div style={{ position: 'absolute', top: '-10px', left: '-10px', fontSize: '24px' }}>🥉</div>}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ padding: '20px', textAlign: 'center', background: '#fff', borderTop: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>데이터 제공: 공공데이터포털 (공유누리)</p>
      </div>
    </div>
otion.div>
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
