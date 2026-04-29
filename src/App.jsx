import { useState, useEffect, useMemo, useRef } from 'react'
import { Home as HomeIcon, Users, Plus, LogOut, Heart, X, MessageSquare, RefreshCw, CloudSun, Utensils, Zap, Languages, Bell, Star, Navigation, CreditCard, Settings, Map as MapIcon, BarChart, Gift, Coffee, User, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, logActivity } from './lib/supabase'
import { PATTERNS, CATS_LATIN } from './data/latin_patterns_native'
import RegisterForm from './RegisterForm'
import AdminDashboard from './AdminDashboard'
import HomePage from './pages/Home'
import ClassNewsPage from './pages/ClassNews'
import PostClub from './pages/PostClub'
import Auth from './components/Auth'
import Parking from './pages/Parking'
import Restaurant from './pages/Restaurant'
import SajuModal from './components/SajuModal'
import IncheonRoute from './components/IncheonRoute'
import WeatherModal from './components/WeatherModal'
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';

// --- [BAMPPA PREMIUM ENGINE: GPS & NATIONWIDE INTELLIGENCE] ---
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

const VENUE_COORDS = {
  'dongam_01': { lat: 37.4715, lon: 126.7028, name: '동암역 (댄스 성지)', region: '인천' },
  'bupyeong_01': { lat: 37.4894, lon: 126.7224, name: '부평 엘마', region: '인천' },
  'songdo_01': { lat: 37.3813, lon: 126.6548, name: '송도 살사클럽', region: '인천' },
  'juan_01': { lat: 37.4651, lon: 126.6807, name: '주안 라틴로드', region: '인천' },
  'gangnam_01': { lat: 37.4979, lon: 127.0276, name: '강남 턴', region: '서울' },
  'hongdae_01': { lat: 37.5565, lon: 126.9239, name: '홍대 보니따', region: '서울' },
  'iteawon_01': { lat: 37.5345, lon: 126.9942, name: '이태원 맘보', region: '서울' },
  'busan_01': { lat: 35.1796, lon: 129.0756, name: '부산 서면 킹', region: '부산' },
  'daegu_01': { lat: 35.8714, lon: 128.6014, name: '대구 동성로 라틴', region: '대구' },
  'daejeon_01': { lat: 36.3504, lon: 127.3845, name: '대전 둔산 살사', region: '대전' },
  'gwangju_01': { lat: 35.1595, lon: 126.8526, name: '광주 상무 클럽', region: '광주' },
  'cheongju_01': { lat: 36.634, lon: 127.458, name: '청정 리코빠', region: '충북' }
};

const naturalIncheonDB = [
  { t: "⚓ 상륙작전", q: "오늘 상륙인가요?", a: "벌써 점령했습니다!" },
  { t: "💃 동암역", q: "동암 급행 타셨나요?", a: "당신께 급행 정착입니다!" }
];

const DynamicAnalysisModal = ({ isOpen, onClose, userCoords, isSajuCall }) => {
  const [targetDest, setTargetDest] = useState(null);
  const [tracker, setTracker] = useState({ distance: '0.0', duration: '0' });
  const [amguho, setAmguho] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const findTarget = (lat, lon) => {
      let nearest = null; let minDist = Infinity;
      Object.values(VENUE_COORDS).forEach(venue => {
        const dist = calculateDistance(lat, lon, venue.lat, venue.lon);
        if (dist < minDist) { minDist = dist; nearest = venue; }
      });
      setTargetDest(nearest);
      const d = calculateDistance(lat, lon, nearest.lat, nearest.lon);
      setTracker({ distance: d.toFixed(1), duration: Math.ceil(d * 10) + 5 });
    };
    if (userCoords) findTarget(userCoords.lat, userCoords.lon);
    else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => findTarget(pos.coords.latitude, pos.coords.longitude),
        err => {
          console.error("GPS Current Position Error:", err);
          if (err.code === err.PERMISSION_DENIED) {
            alert("위치 권한이 거부되었습니다. 최적화된 경로 안내를 위해 위치 권한을 허용해주세요.");
          }
        }
      );
    }
  }, [isOpen, userCoords]);

  if (!isOpen || !targetDest) return null;
  const isIncheon = targetDest.region === '인천' && isSajuCall;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000000, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', background: '#FFFFFF', borderRadius: '35px', padding: '40px 30px', boxShadow: '0 50px 100px rgba(0,0,0,0.1)', color: '#1E293B' }}>
        {!amguho ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}><div style={{ background: '#E53935', color: '#fff', padding: '8px 16px', borderRadius: '50px', fontSize: '11px', fontWeight: '900' }}>REALTIME GPS</div><X size={24} onClick={onClose} style={{ cursor: 'pointer', color: '#64748B' }} /></div>
            <h2 style={{ fontSize: '26px', fontWeight: '1000', marginBottom: '30px', color: '#1E293B' }}>{isIncheon ? '성지 상륙 분석' : '최단 경로 최적화'} 🛰️<br/><span style={{ color: '#E53935' }}>{targetDest.name}</span></h2>
            <div style={{ padding: '30px', background: '#F8FAFC', borderRadius: '30px', display: 'flex', gap: '20px', marginBottom: '30px', border: '1px solid #E2E8F0' }}>
              <div style={{ flex: 1 }}><p style={{ color: '#64748B', fontSize: '12px' }}>실제 거리</p><p style={{ fontSize: '26px', fontWeight: '1000', color: '#E53935' }}>{tracker.distance}km</p></div>
              <div style={{ flex: 1 }}><p style={{ color: '#64748B', fontSize: '12px' }}>예상 소요</p><p style={{ fontSize: '26px', fontWeight: '1000', color: '#1E293B' }}>{tracker.duration}분</p></div>
            </div>
            <button onClick={() => isIncheon ? setAmguho(naturalIncheonDB[0]) : onClose()} style={{ width: '100%', padding: '22px', borderRadius: '25px', background: '#E53935', color: '#fff', border: 'none', fontSize: '18px', fontWeight: '1000', boxShadow: '0 10px 20px rgba(229, 57, 53, 0.2)' }}>{isIncheon ? '암구호 수신하기' : '확인 완료'}</button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: '22px', fontWeight: '1000', marginBottom: '30px', color: '#1E293B' }}>성지 암구호</h3><div style={{ background: '#FFEBEE', padding: '30px', borderRadius: '30px', border: '2px solid #E53935', marginBottom: '30px' }}><p style={{ color: '#E53935', fontWeight: '700' }}>Q: {amguho.q}</p><p style={{ fontSize: '20px', fontWeight: '1000', marginTop: '10px', color: '#1E293B' }}>A: {amguho.a}</p></div><button onClick={onClose} style={{ width: '100%', padding: '20px', borderRadius: '20px', background: '#E53935', color: '#FFFFFF', fontWeight: '1000', border: 'none' }}>작전 시작</button></div>
        )}
      </motion.div>
    </motion.div>
  );
};

const IncheonPremiumBanner = ({ onClick }) => (
  <div style={{ padding: '0 16px', margin: '15px 0' }}>
    <div onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ background: '#FFFFFF', borderRadius: '24px', padding: '16px 20px', border: '1px solid #E2E8F0', boxShadow: '0 15px 40px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ background: '#E53935', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '50px', marginBottom: '8px', display: 'inline-block' }}>NATIONWIDE LIVE</div>
          <h3 style={{ color: '#1E293B', fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0' }}>지능형 경로 최적화 서비스 🛰️</h3>
          <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>현재 위치 기반 최단 거리 성지 탐색 중 →</p>
        </div>
        <div style={{ background: '#FFEBEE', padding: '12px', borderRadius: '18px', color: '#E53935' }}><Navigation size={20} /></div>
      </div>
    </div>
  </div>
);

const BROAD_REGIONS = { '서울': '서울', '인천': '경기/인천', '경기': '경기/인천', '부산': '경상도', '대구': '경상도', '광주': '전라도', '대전': '충청도', '충남': '충청도', '충북': '충청도', '전남': '전라도', '전북': '전라도', '경남': '경상도', '경북': '경상도', '강원': '강원/제주', '제주': '강원/제주' };
const SHORT_CITY_NAMES = { '인천': '인천', '서울': '서울', '경기': '경기', '부산': '부산', '대구': '대구', '광주': '광주', '대전': '대전' };
const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

const formatDateToKSTString = (date) => {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function App() {
  const kst = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
  const todayData = { year: kst.getFullYear(), month: kst.getMonth() + 1, date: kst.getDate(), dateStr: formatDateToKSTString(kst) };

  const [showSplash, setShowSplash] = useState(true);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayData.dateStr);
  const [view, setView] = useState('home');

  const [showIncheonModal, setShowIncheonModal] = useState(false);
  const [isSajuCall, setIsSajuCall] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [showIncheon, setShowIncheon] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showSaju, setShowSaju] = useState(false);
  const [showLatinModal, setShowLatinModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => { setTimeout(() => setShowSplash(false), 2000); }, []);

  useEffect(() => {
    if (window.location.pathname === '/parking') {
      setView('parking');
    } else if (window.location.pathname === '/restaurant') {
      setView('restaurant');
    }
  }, []);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('parties').select('*, locations(*, regions(*))').order('date', { ascending: true });
      const mapped = (data || []).map(p => {
        const loc = Array.isArray(p.locations) ? p.locations[0] : p.locations;
        const reg = loc?.regions ? (Array.isArray(loc.regions) ? loc.regions[0] : loc.regions) : null;
        const regionName = reg?.name || '전국';
        return { ...p, broadRegion: BROAD_REGIONS[regionName] || '전국', cityName: SHORT_CITY_NAMES[regionName] || regionName.substring(0,2), locationName: loc?.name || '장소 미지정' };
      });
      setParties(mapped);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchParties(); }, []);

  const openAnalysis = (saju = false) => {
    // 사용자가 클릭했을 때만 위치 정보 요청
    
    setIsSajuCall(saju);
    setIsAnalyzing(true);
    setTimeout(() => { setIsAnalyzing(false); setShowIncheonModal(true); }, 1200);
  };

  const sharedProps = {
    parties, lessons: [], loading, selectedMonth: todayData.month, setSelectedMonth: () => {}, selectedWeek: 1, setSelectedWeek: () => {}, 
    selectedDate, setSelectedDate, selectedRegion: '서울', setSelectedRegion: () => {}, 
    view, setView, setSelectedPoster, 
    openAnalysis: () => openAnalysis(false), fourteenDays: Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return { fullDate: formatDateToKSTString(d), date: String(d.getDate()), month: String(d.getMonth() + 1), dayName: DAYS_KOR[d.getDay()], isToday: i === 0, dayOfWeek: d.getDay() };
    }), weekData: [], allDatesInMonth: [], filteredParties: parties.filter(p => p.date === selectedDate),
    showFullCalendar: false, setShowFullCalendar: () => {}, likedIds: [], toggleLike: () => {},
    IncheonBanner: () => <IncheonPremiumBanner onClick={() => openAnalysis(false)} />, venueCounts: {}, resetToToday: () => { setView('home'); setSelectedDate(todayData.dateStr); }, formatItemDate: (d, t) => `${d} ${t}`, formatFee: (f) => f, handleRegister: () => setView('register'), logActivity: () => {}, regionalTheme: { welcomeMsg: "전국 댄서들을 위한 실시간 정보", specialBanner: true }
  };
const LatinModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [curCat, setCurCat] = useState('전체');
  const [selId, setSelId] = useState(null);

  if (!isOpen) return null;

  const cats = ['전체', ...CATS_LATIN];
  const filtered = PATTERNS.filter(p => {
    const matchesCat = curCat === '전체' || p.cat === curCat;
    const matchesSearch = p.en.toLowerCase().includes(searchTerm.toLowerCase()) || p.kr.includes(searchTerm);
    return matchesCat && matchesSearch;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
      style={{ position: 'fixed', inset: 0, zIndex: 1000000, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} 
      onClick={onClose}
    >
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '100%', maxWidth: '500px', background: '#FFFFFF', borderRadius: '24px 24px 0 0', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ width: '38px', height: '3px', background: '#E2E8F0', borderRadius: '2px', margin: '12px auto 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 10px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1D9E75', margin: 0, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>LATIN ENGLISH 100</h2>
          <button onClick={onClose} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '50%', width: '32px', height: '32px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '10px 20px' }}>
          <input 
            type="text" 
            placeholder="Search patterns..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '22px', padding: '10px 16px', color: '#1E293B', outline: 'none', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '10px 20px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {cats.map(c => (
            <button key={c} onClick={() => { setCurCat(c); setSelId(null); }} 
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #E2E8F0', background: curCat === c ? '#1D9E75' : 'transparent', color: curCat === c ? '#fff' : '#64748B', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 30px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(p => (
            <div key={p.n} onClick={() => setSelId(selId === p.n ? null : p.n)} 
              style={{ background: '#FFFFFF', border: `1px solid ${selId === p.n ? '#1D9E75' : '#E2E8F0'}`, borderRadius: '10px', padding: '12px 14px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '900', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>#{String(p.n).padStart(2, '0')}</span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>{p.cat}</span>
              </div>
              <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#1E293B', marginBottom: '3px', lineHeight: '1.4', fontFamily: "'Pretendard', sans-serif", whiteSpace: 'normal', overflow: 'visible', wordBreak: 'keep-all' }}>"{p.en}"</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>{p.kr}</div>
              
              <AnimatePresence>
                {selId === p.n && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '0.5px solid #1D9E75', background: '#F8FAFC', margin: '10px -14px -12px', padding: '10px 14px 12px', borderRadius: '0 0 10px 10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px', lineHeight: '1.6' }}>{p.note}</div>
                      <div style={{ fontSize: '11px', color: '#1D9E75', fontStyle: 'italic', lineHeight: '1.5' }}>
                        <span style={{ color: '#94A3B8', fontStyle: 'normal', marginRight: '4px', fontSize: '10px' }}>Example:</span>{p.ex}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>No results found</div>}
        </div>
      </motion.div>
    </motion.div>
  );
};

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh' }}>
      <AnimatePresence>{showSplash && <motion.div exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><motion.img src="/logo.png" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} style={{ width: '200px' }} /></motion.div>}</AnimatePresence>
      <AnimatePresence>{isAnalyzing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000000, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(30px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '60px', height: '60px', border: '4px solid #FFEBEE', borderTop: '4px solid #E53935', borderRadius: '50%', marginBottom: '20px' }} /><h2 style={{ color: '#1E293B', fontSize: '20px', fontWeight: '900' }}>실시간 지능형 분석 중...</h2></motion.div>}</AnimatePresence>

      {/* 햄버거 버튼 */}
      {!isMenuOpen && (
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMenuOpen(true)}
          style={{ 
            position: 'fixed', top: '20px', left: '20px', zIndex: 1000,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
            border: 'none', borderRadius: '12px', padding: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Menu size={24} color="#E53935" />
        </motion.button>
      )}

      {/* 프리미엄 햄버거 메뉴 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', top: 0, bottom: 0, left: 0,
              width: '75vw', maxWidth: '320px',
              zIndex: 1000000,
              background: '#FFFFFF', padding: '24px',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
              borderLeft: '1px solid #E2E8F0'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(false)}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px', color: '#E53935', cursor: 'pointer' }}
              >
                <X size={24} />
              </motion.button>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#1E293B', fontSize: '24px', fontWeight: 900, margin: 0 }}>Premium Services</h2>
              <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>지능형 댄스 라이프 플랫폼</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: <Utensils color="#E53935" />, text: "뒷풀이 맛집", action: () => { setView('restaurant'); setIsMenuOpen(false); } },
                { icon: <Star color="#E53935" />, text: "댄스 사주", action: () => { if(typeof setShowSaju === 'function') { setShowSaju(true); setIsMenuOpen(false); } } },
                { icon: <MessageSquare color="#E53935" />, text: "라틴 영어", action: () => { if(typeof setShowLatinModal === 'function') { setShowLatinModal(true); setIsMenuOpen(false); } } },
                { icon: <CloudSun color="#E53935" />, text: "오늘 날씨", action: () => { setIsMenuOpen(false); setTimeout(() => setShowWeather(true), 300); } },
                { icon: <Bell color="#E53935" />, text: "공지사항", action: () => { alert('준비 중') } },
                { icon: <span style={{ fontSize: '18px' }}>🅿️</span>, text: "주차장", action: () => { setView('parking'); setIsMenuOpen(false); } }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02, backgroundColor: '#FFEBEE' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <span style={{ color: '#1E293B', fontSize: '15px', fontWeight: 800 }}>{item.text}</span>
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '40px', textAlign: 'center' }}>
              <p style={{ color: '#94A3B8', fontSize: '12px' }}>© 2026 BAMPPA All Rights Reserved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {view === 'home' || view === 'likes' ? <HomePage {...sharedProps} /> : 
         view === 'social' ? <ClassNewsPage {...sharedProps} /> : 
         view === 'register' ? <RegisterForm onBack={() => setView('home')} onSuccess={() => { fetchParties(); setView('home'); }} /> : 
         view === 'post-lesson' ? <PostClub onBack={() => setView('social')} /> :
         view === 'parking' ? <Parking onBack={() => setView('home')} /> :
         view === 'restaurant' ? <Restaurant onBack={() => setView('home')} /> :
         <AdminDashboard onBack={() => setView('home')} />}
      </main>



      <DynamicAnalysisModal isOpen={showIncheonModal} onClose={() => setShowIncheonModal(false)} userCoords={userCoords} isSajuCall={isSajuCall} />
      <AnimatePresence>
        {showIncheon && <IncheonRoute parties={parties} onClose={() => setShowIncheon(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSaju && <SajuModal parties={parties} onClose={() => setShowSaju(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showLatinModal && <LatinModal isOpen={showLatinModal} onClose={() => setShowLatinModal(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showWeather && <WeatherModal onClose={() => setShowWeather(false)} />}
      </AnimatePresence>
      
      {selectedPoster && (
        <div 
          style={{ position:'fixed', inset:0, zIndex:100000, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.95)' }} 
          onClick={() => setSelectedPoster(null)}
        >
          <img 
            src={selectedPoster} 
            style={{ maxWidth:'90%', maxHeight:'90%', borderRadius:'12px' }} 
            alt="Poster" 
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => window.location.href = '/'}
            style={{ position:'fixed', top:'20px', left:'20px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'40px', height:'40px', color:'#fff', fontSize:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            ←
          </button>
        </div>
      )}

      <nav className="bottom-nav">
        <div 
          className={`nav-item ${view === 'home' ? 'active' : ''}`} 
          onClick={() => { setView('home'); window.scrollTo(0,0); }}
        >
          <HomeIcon size={24} color={view === 'home' ? '#E53935' : '#94A3B8'} strokeWidth={view === 'home' ? 3 : 2} />
          <span>소셜/파티</span>
        </div>

        <div 
          className={`nav-item ${view === 'likes' ? 'active' : ''}`} 
          onClick={() => { setView('likes'); window.scrollTo(0,0); }}
        >
          <Heart size={24} color={view === 'likes' ? '#E53935' : '#94A3B8'} strokeWidth={view === 'likes' ? 3 : 2} fill={view === 'likes' ? '#E53935' : 'none'} />
          <span>찜</span>
        </div>

        <div className="nav-item central-action" style={{ pointerEvents: 'none', position: 'relative', zIndex: 1001 }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width:'52px', height:'52px',
              borderRadius:'50%',
              background:'#E53935',
              border:'none', color:'#fff',
              display:'flex', alignItems:'center',
              justifyContent:'center', cursor:'pointer',
              boxShadow:'0 4px 15px rgba(0,0,0,0.3)',
              pointerEvents: 'auto'
            }}
            onClick={() => {
              if (view === 'social') setView('post-lesson')
              else setView('register')
            }}
          >
            <Plus size={28} strokeWidth={3} />
          </motion.button>
          <span style={{ pointerEvents: 'auto', color: '#1E293B' }}>등록</span>
        </div>



        <div 
          className={`nav-item ${view === 'social' ? 'active' : ''}`} 
          onClick={() => { setView('social'); window.scrollTo(0,0); }}
        >
          <Users size={24} color={view === 'social' ? '#E53935' : '#94A3B8'} strokeWidth={view === 'social' ? 3 : 2} />
          <span>수업/정보</span>
        </div>

        <div 
          className={`nav-item`} 
          onClick={() => { window.open('https://open.kakao.com/o/gP43rNri', '_blank'); }}
        >
          <MessageSquare size={24} color="#94A3B8" strokeWidth={2} />
          <span>실시간톡</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
