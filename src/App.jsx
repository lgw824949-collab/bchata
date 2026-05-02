import { useState, useEffect, useMemo, useRef } from 'react'
import { Home as HomeIcon, Users, Plus, LogOut, Heart, X, MessageSquare, RefreshCw, CloudSun, Utensils, Zap, Languages, Bell, Star, Navigation, CreditCard, Settings, Map as MapIcon, BarChart, Gift, Coffee, User, Menu, Music2, GraduationCap, Tent, Flag, Download, Globe, ShieldCheck, Calendar, Camera, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, logActivity } from './lib/supabase'
import RegisterForm from './RegisterForm'
import AdminDashboard from './AdminDashboard'
import HomePage from './pages/Home'
import Community from './pages/Community'
import ClassNewsPage from './pages/ClassNews'
import PostClub from './pages/PostClub'
import Auth from './components/Auth'
import Parking from './pages/Parking'
import Restaurant from './pages/Restaurant'
import SajuModal from './components/SajuModal'
import IncheonRoute from './components/IncheonRoute'
import WeatherModal from './components/WeatherModal'
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import { BAR_DATABASE, findBarByName } from './lib/BarLib';

// [번역 비용 최적화를 위한 정적 맵핑]
const REGION_MAP_EN = {
  '전국': 'Nationwide',
  '서울': 'Seoul', '경기/인천': 'Gyeonggi/Incheon', '경상도': 'Gyeongsang', 
  '전라도': 'Jeolla', '충청도': 'Chungcheong', '강원/제주': 'Gangwon/Jeju'
};

const CITY_MAP_EN = {
  '서울': 'Seoul', '인천': 'Incheon', '대구': 'Daegu', '부산': 'Busan', '광주': 'Gwangju', 
  '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong', '수원': 'Suwon', '성남': 'Seongnam',
  '의정부': 'Uijeongbu', '안산': 'Ansan', '고양': 'Goyang', '용인': 'Yongin', '부천': 'Bucheon'
};

// [포스터 줌 전용 컴포넌트 - 전역 분리]
const PosterModal = ({ src, onClose }) => {
  const imgRef = useRef();
  
  const onUpdate = ({ x, y, scale }) => {
    if (imgRef.current) {
      imgRef.current.style.transform = make3dTransformValue({ x, y, scale });
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'poster.jpg';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Save failed:', err);
      window.open(src, '_blank');
    }
  };

  return (
    <div style={{ 
      position:'fixed', 
      inset:0, 
      zIndex:2000000, 
      backgroundColor:'rgba(0,0,0,0.98)', 
      display:'flex', 
      alignItems:'center', 
      justifyContent:'center',
      height: '100dvh', // 모바일 브라우저 주소창 고려
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* 닫기 버튼 */}
      <button 
        onClick={onClose} 
        style={{ 
          position:'absolute', top:'calc(40px + env(safe-area-inset-top))', left:'20px', 
          background:'rgba(255,255,255,0.2)', border:'none', 
          borderRadius:'50%', width:'52px', height:'52px', 
          color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          zIndex: 2000001,
          backdropFilter: 'blur(15px)'
        }}
      ><ChevronLeft size={32} /></button>

      {/* 줌 컨테이너 (가용 화면 전체 사용) */}
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QuickPinchZoom onUpdate={onUpdate} wheelScaleFactor={500} tapZoomFactor={2}>
          <img 
            ref={imgRef}
            src={src} 
            alt="poster" 
            style={{ 
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
              willChange: 'transform',
              userSelect: 'none'
            }} 
          />
        </QuickPinchZoom>
      </div>
      
      {/* 하단 저장 버튼 */}
      <div style={{ position: 'absolute', bottom: 'calc(40px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', zIndex: 100002 }}>
        <button 
          onClick={handleSave}
          style={{ 
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.3)',
            cursor: 'pointer',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}
        >
          <Download size={22} />
        </button>
      </div>
    </div>
  );
};

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}><div style={{ background: '#FF1744', color: '#fff', padding: '8px 16px', borderRadius: '50px', fontSize: '11px', fontWeight: '900' }}>REALTIME GPS</div><ChevronLeft size={28} onClick={onClose} style={{ cursor: 'pointer', color: '#64748B' }} /></div>
            <h2 style={{ fontSize: '26px', fontWeight: '1000', marginBottom: '30px', color: '#1E293B' }}>{isIncheon ? '성지 상륙 분석' : '최단 경로 최적화'} 🛰️<br/><span style={{ color: '#FF1744' }}>{targetDest.name}</span></h2>
            <div style={{ padding: '30px', background: '#F8FAFC', borderRadius: '30px', display: 'flex', gap: '20px', marginBottom: '30px', border: '1px solid #E2E8F0' }}>
              <div style={{ flex: 1 }}><p style={{ color: '#64748B', fontSize: '12px' }}>실제 거리</p><p style={{ fontSize: '26px', fontWeight: '1000', color: '#FF1744' }}>{tracker.distance}km</p></div>
              <div style={{ flex: 1 }}><p style={{ color: '#64748B', fontSize: '12px' }}>예상 소요</p><p style={{ fontSize: '26px', fontWeight: '1000', color: '#1E293B' }}>{tracker.duration}분</p></div>
            </div>
            <button onClick={() => isIncheon ? setAmguho(naturalIncheonDB[0]) : onClose()} style={{ width: '100%', padding: '22px', borderRadius: '25px', background: '#FF1744', color: '#fff', border: 'none', fontSize: '18px', fontWeight: '1000', boxShadow: '0 10px 20px rgba(255, 23, 68, 0.2)' }}>{isIncheon ? '암구호 수신하기' : '확인 완료'}</button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: '22px', fontWeight: '1000', marginBottom: '30px', color: '#1E293B' }}>성지 암구호</h3><div style={{ background: '#FEF2F2', padding: '30px', borderRadius: '30px', border: '2px solid #FF1744', marginBottom: '30px' }}><p style={{ color: '#FF1744', fontWeight: '700' }}>Q: {amguho.q}</p><p style={{ fontSize: '20px', fontWeight: '1000', marginTop: '10px', color: '#1E293B' }}>A: {amguho.a}</p></div><button onClick={onClose} style={{ width: '100%', padding: '20px', borderRadius: '20px', background: '#FF1744', color: '#FFFFFF', fontWeight: '1000', border: 'none' }}>작전 시작</button></div>
        )}
      </motion.div>
    </motion.div>
  );
};

const IncheonPremiumBanner = ({ onClick, t }) => (
  <div style={{ padding: '0 15px', margin: '8px 0' }}>
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }} 
      style={{ 
        background: 'linear-gradient(90deg, #FFFFFF, #FEF2F2)', 
        borderRadius: '16px', 
        padding: '10px 16px', 
        border: '1px solid #dcfce7', 
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.03)', 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div style={{ background: '#FEF2F2', padding: '6px', borderRadius: '10px', color: '#FF1744', flexShrink: 0 }}>
          <Navigation size={15} strokeWidth={3} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span style={{ color: '#1E293B', fontSize: '14px', fontWeight: '900', whiteSpace: 'nowrap' }}>{t('intelligent_route')}</span>
          <span style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shortest_distance')}</span>
        </div>
      </div>
      <div style={{ background: '#FF1744', color: '#fff', fontSize: '8px', fontWeight: '950', padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>LIVE</div>
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

const SplashScreen = ({ onComplete }) => (
  <motion.div
    initial={{ opacity: 1 }}
    animate={{ 
      scale: [1, 1, 2],
      opacity: [1, 1, 0]
    }}
    transition={{ 
      duration: 3, 
      times: [0, 0.66, 1], // 0-2초 정지, 2-3초 확대/페이드아웃
      ease: "easeInOut" 
    }}
    onAnimationComplete={onComplete}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <img src="/logo.png" alt="BAMPPA" style={{ width: '220px', height: 'auto' }} />
  </motion.div>
);

function App() {
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('ko') ? 'en' : 'ko';
    i18n.changeLanguage(newLang);
  };

  // 환경에 관계없이 정확한 KST(한국 표준시) 날짜를 가져오는 로직
  const getKSTDate = () => {
    const now = new Date();
    const kstString = now.toLocaleString('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [m, d, y] = kstString.split('/');
    // 0 패딩 보장 (MM, DD)
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return { year: parseInt(y), month: parseInt(mm), date: parseInt(dd), dateStr: `${y}-${mm}-${dd}` };
  };

  const todayData = getKSTDate();

  const [showSplash, setShowSplash] = useState(() => {
    // 세션당 한 번만 노출 (새로고침 시 노출 안 됨)
    try {
      return !sessionStorage.getItem('splash_shown');
    } catch (e) {
      return true;
    }
  });
  const [parties, setParties] = useState([]);
  const [displayParties, setDisplayParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayData.dateStr);
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });

  const [showIncheonModal, setShowIncheonModal] = useState(false);
  const [isSajuCall, setIsSajuCall] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [modalScale, setModalScale] = useState(1);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showIncheon, setShowIncheon] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showSaju, setShowSaju] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showFilteredResults, setShowFilteredResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filterRegion, setFilterRegion] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(todayData.month);
  const [showGridModal, setShowGridModal] = useState(false);
  const [gridRegion, setGridRegion] = useState('');
  const [filterStep, setFilterStep] = useState(1);

  // [BAMPPA Navigation Engine]
  const handleOpenModal = (setter, value = true) => {
    window.history.pushState({ modal: true }, '');
    setter(value);
  };

  const handleCloseModal = () => {
    window.history.back();
  };

  useEffect(() => {
    // 1. 초기 접속 시 경로 또는 해시 처리
    if (window.location.pathname === '/parking') {
      setView('parking');
      window.location.hash = 'parking';
    } else if (window.location.pathname === '/restaurant') {
      setView('restaurant');
      window.location.hash = 'restaurant';
    }
  }, []);

  // 2. view 상태가 변경될 때마다 URL Hash 업데이트 및 히스토리 관리
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (view !== currentHash) {
      window.location.hash = view;
    }
  }, [view]);

  // [BAMPPA Navigation Engine]
  // 3. (REMOVED automatic pushState to prevent history loop)

  // 4. 브라우저/휴대폰 뒤로가기 통합 감지 및 강제 제어 로직 (모든 요소 대응)
  useEffect(() => {
    const handlePopState = (event) => {
      // 열려있는 순서의 역순(우선순위)으로 닫기만 하고 이동은 방지
      if (selectedPoster) { setSelectedPoster(null); return; }
      if (showGridModal) { setShowGridModal(false); return; }
      if (showFilteredResults) { setShowFilteredResults(false); return; }
      
      // 필터 단계 처리 (2단계 -> 1단계)
      if (filterStep > 1) { setFilterStep(1); return; }
      
      if (showFilterPanel) { setShowFilterPanel(false); return; }
      if (showFullCalendar) { setShowFullCalendar(false); return; }
      if (isMenuOpen) { setIsMenuOpen(false); return; }
      if (showWeather) { setShowWeather(false); return; }
      if (showSaju) { setShowSaju(false); return; }
      if (showIncheonModal) { setShowIncheonModal(false); return; }
      if (showIncheon) { setShowIncheon(false); return; }

      // 모달이 없는 경우 해시 기반 뷰 전환 처리
      const newHash = window.location.hash.replace('#', '');
      if (newHash && newHash !== view) {
        setView(newHash);
      } else if (!newHash && view !== 'home') {
        setView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, selectedPoster, showFullCalendar, isMenuOpen, showWeather, showSaju, showIncheonModal, showFilterPanel, showFilteredResults, showGridModal, showIncheon]);

  const fetchParties = async () => {
    setLoading(true);
    try {
      // 1. 파티와 장소 데이터를 각각 단순 쿼리로 호출 (400 에러 방지)
      const [partiesRes, locationsRes] = await Promise.all([
        supabase.from('parties').select('*').order('date', { ascending: true }),
        supabase.from('locations').select('id, name')
      ]);

      const rawParties = partiesRes.data || [];
      const rawLocations = locationsRes.data || [];

      // 2. 장소 데이터를 ID 기반 Map으로 변환
      const locationMap = rawLocations.reduce((acc, loc) => {
        acc[loc.id] = loc.name;
        return acc;
      }, {});

      const mapped = rawParties.map(p => {
        // 장소명 매핑 (id 우선, 없으면 기존 필드 활용)
        const locName = locationMap[p.location_id] || p.locationName || p.location_name || '장소 미지정';
        
        // 지역 분류 로직 (주소 + 장소명 + 도시명 통합 검색)
        const fullSearchText = `${p.address || ''} ${locName} ${p.cityName || ''}`;
        let broadRegion = '전국';
        
        if (fullSearchText.includes('서울')) broadRegion = '서울';
        else if (fullSearchText.includes('경기') || fullSearchText.includes('인천')) broadRegion = '경기/인천';
        else if (fullSearchText.includes('부산') || fullSearchText.includes('대구') || fullSearchText.includes('울산') || fullSearchText.includes('경남') || fullSearchText.includes('경북') || fullSearchText.includes('경상')) broadRegion = '경상도';
        else if (fullSearchText.includes('광주') || fullSearchText.includes('전남') || fullSearchText.includes('전북') || fullSearchText.includes('전라')) broadRegion = '전라도';
        else if (fullSearchText.includes('대전') || fullSearchText.includes('충남') || fullSearchText.includes('충북') || fullSearchText.includes('충청') || fullSearchText.includes('세종')) broadRegion = '충청도';
        else if (fullSearchText.includes('강원') || fullSearchText.includes('제주')) broadRegion = '강원/제주';
        
        const barInfo = findBarByName(locName);
        const locationNameEn = barInfo?.name_en || locName;
        const broadRegionEn = REGION_MAP_EN[broadRegion] || broadRegion;
        const cityNameEn = CITY_MAP_EN[p.cityName] || p.cityName || 'Nationwide';

        return { 
          ...p, 
          broadRegion, 
          broadRegionEn,
          cityName: p.cityName || '전국', 
          cityNameEn,
          locationName: locName,
          locationNameEn
        };
      });
      setParties(mapped);
    } catch (err) { console.error('데이터 로딩 오류:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchParties(); }, []);

  // --- 최적화된 번역 엔진 (DB 저장 데이터 우선 사용) ---
  useEffect(() => {
    const todayStr = getKSTDate().dateStr;
    const upcomingParties = parties.filter(p => p.date >= todayStr);
    
    const currentLang = i18n.language || 'ko';
    if (currentLang.startsWith('en')) {
      const translated = upcomingParties.map(p => ({
        ...p,
        title: p.title_en || p.title,
        locationName: p.locationNameEn || p.locationName,
        broadRegion: p.broadRegionEn || p.broadRegion,
        cityName: p.cityNameEn || p.cityName
      }));
      setDisplayParties(translated);
    } else {
      setDisplayParties(upcomingParties);
    }
  }, [i18n.language, parties]);

  useEffect(() => {
    // 날짜 이동 시 히스토리 기록 (view는 해시가 자동 처리)
    window.history.replaceState({ view, date: selectedDate }, '');
  }, [selectedDate]);

  const openAnalysis = (saju = false) => {
    // 사용자가 클릭했을 때만 위치 정보 요청
    
    setIsSajuCall(saju);
    setIsAnalyzing(true);
    setTimeout(() => { setIsAnalyzing(false); setShowIncheonModal(true); }, 1200);
  };

  const sharedProps = {
    parties: displayParties, lessons: [], loading, selectedMonth, setSelectedMonth, selectedWeek: 1, setSelectedWeek: () => {}, 
    selectedDate, setSelectedDate, selectedRegion: '서울', setSelectedRegion: () => {}, 
    view, setView, setSelectedPoster, 
    fourteenDays: Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return { fullDate: formatDateToKSTString(d), date: String(d.getDate()), month: String(d.getMonth() + 1), dayName: DAYS_KOR[d.getDay()], isToday: i === 0, dayOfWeek: d.getDay() };
    }), weekData: [], allDatesInMonth: [], filteredParties: displayParties.filter(p => p.date === selectedDate),
    showFullCalendar, setShowFullCalendar,
    showFilterPanel, setShowFilterPanel,
    showFilteredResults, setShowFilteredResults,
    likedIds: [], toggleLike: () => {},
    filterRegion, setFilterRegion, filterGenre, setFilterGenre,
    showGridModal, setShowGridModal, gridRegion, setGridRegion, filterStep, setFilterStep,
    handleOpenModal, handleCloseModal,
    IncheonBanner: () => <IncheonPremiumBanner t={t} onClick={() => openAnalysis(false)} />, venueCounts: {}, resetToToday: () => { setView('home'); setSelectedDate(todayData.dateStr); }, formatItemDate: (d, t) => `${d} ${t}`, formatFee: (f) => f, handleRegister: () => setView('register'), logActivity: () => {}, regionalTheme: { welcomeMsg: "전국 댄서들을 위한 실시간 정보", specialBanner: true }
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh', position: 'relative' }}>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen 
            onComplete={() => {
              try {
                sessionStorage.setItem('splash_shown', 'true');
              } catch (e) {}
              setShowSplash(false);
            }} 
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{isAnalyzing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000000, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(30px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '60px', height: '60px', border: '4px solid #FFEBEE', borderTop: '4px solid #E53935', borderRadius: '50%', marginBottom: '20px' }} /><h2 style={{ color: '#1E293B', fontSize: '20px', fontWeight: '900' }}>실시간 지능형 분석 중...</h2></motion.div>}</AnimatePresence>

      {/* 햄버거 메뉴 버튼 (드래그 기능 유지) */}
      {!isMenuOpen && (
        <motion.button 
          drag
          dragConstraints={{ left: -450, right: 0, top: 0, bottom: 800 }}
          dragMomentum={false}
          dragElastic={0.05}
          whileDrag={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleOpenModal(setIsMenuOpen, true)}
          style={{ 
            position: 'fixed', top: '20px', right: '20px', zIndex: 1005,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
            border: '1px solid #F1F5F9', borderRadius: '14px', padding: '12px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.12)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Menu size={24} color="#FF1744" />
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
                onClick={handleCloseModal}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px', color: '#FF1744', cursor: 'pointer' }}
              >
                <ChevronLeft size={24} />
              </motion.button>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#1E293B', fontSize: '24px', fontWeight: 900, margin: 0 }}>{t('premium_services')}</h2>
              <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>{t('platform_desc')}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: <Calendar color="#FF1744" />, text: t('view_calendar'), action: () => { setIsMenuOpen(false); handleOpenModal(setShowFullCalendar, true); } },
                { icon: <Camera color="#FF1744" />, text: 'LIVE PICK', action: () => { setView('community'); setIsMenuOpen(false); } },
                { icon: <Utensils color="#FF1744" />, text: t('restaurant'), action: () => { setView('restaurant'); setIsMenuOpen(false); } },
                { icon: <Star color="#FF1744" />, text: t('saju'), action: () => { if(typeof setShowSaju === 'function') { handleOpenModal(setShowSaju, true); setIsMenuOpen(false); } } },
                { icon: <CloudSun color="#FF1744" />, text: t('weather'), action: () => { setIsMenuOpen(false); setTimeout(() => handleOpenModal(setShowWeather, true), 300); } },
                { icon: <MessageSquare color="#FF1744" />, text: '실시간 오픈톡', action: () => { window.open('https://open.kakao.com/o/gP43rNri', '_blank'); setIsMenuOpen(false); } },
                { icon: <Bell color="#FF1744" />, text: t('notice'), action: () => { alert(t('coming_soon')) } },
                { icon: <ShieldCheck color="#FF1744" />, text: t('admin_dashboard'), action: () => { setView('admin'); setIsMenuOpen(false); } },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02, backgroundColor: '#FEF2F2' }}
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
        {view === 'home' ? <HomePage {...sharedProps} /> : 
         view === 'class' ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#1E293B' }}>
             <span style={{ fontSize: '48px', marginBottom: '20px' }}>💃</span>
             <h2 style={{ fontSize: '24px', fontWeight: 900 }}>{t('nav_class')}</h2>
             <p style={{ color: '#64748B', marginTop: '8px' }}>{t('coming_soon')}</p>
           </div>
         ) :
         view === 'bootcamp' ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#1E293B' }}>
             <span style={{ fontSize: '48px', marginBottom: '20px' }}>🏕️</span>
             <h2 style={{ fontSize: '24px', fontWeight: 900 }}>{t('nav_bootcamp')}</h2>
             <p style={{ color: '#64748B', marginTop: '8px' }}>{t('coming_soon')}</p>
           </div>
         ) :
         view === 'festival' ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#1E293B' }}>
             <span style={{ fontSize: '48px', marginBottom: '20px' }}>🎪</span>
             <h2 style={{ fontSize: '24px', fontWeight: 900 }}>{t('nav_festival')}</h2>
             <p style={{ color: '#64748B', marginTop: '8px' }}>{t('coming_soon')}</p>
           </div>
         ) :
         {
            'community': <Community setSelectedPoster={setSelectedPoster} setView={setView} />,
            'post-lesson': <PostClub onBack={() => setView('home')} />,
            'parking': <Parking onBack={() => setView('home')} />,
            'restaurant': <Restaurant onBack={() => setView('home')} />,
            'admin': <AdminDashboard onBack={() => setView('home')} refreshData={fetchParties} />
          }[view] || <AdminDashboard onBack={() => setView('home')} refreshData={fetchParties} />}
      </main>

      <DynamicAnalysisModal isOpen={showIncheonModal} onClose={() => setShowIncheonModal(false)} userCoords={userCoords} isSajuCall={isSajuCall} />
      <AnimatePresence>
        {showIncheon && <IncheonRoute parties={parties} onClose={() => setShowIncheon(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSaju && <SajuModal parties={parties} onClose={() => setShowSaju(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showWeather && <WeatherModal onClose={() => setShowWeather(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {view === 'register' && (
          <RegisterForm 
            onBack={() => setView('home')} 
            onSuccess={() => { fetchParties(); setView('home'); }} 
          />
        )}
      </AnimatePresence>
      
      {/* 포스터 줌인 모달 (컴포넌트 방식) */}
      {selectedPoster && (
        <PosterModal 
          src={selectedPoster} 
          onClose={handleCloseModal} 
        />
      )}

      {view !== 'community' && (
        <nav className="bottom-nav">
          <div 
            className={`nav-item ${view === 'home' ? 'active' : ''}`} 
            onClick={() => { setView('home'); window.scrollTo(0,0); }}
          >
            <Music2 size={22} color={view === 'home' ? '#FF1744' : '#94A3B8'} style={{ marginBottom: '4px' }} />
            <span style={{ fontSize: '10px', fontWeight: view === 'home' ? 900 : 500, color: view === 'home' ? '#FF1744' : '#94A3B8' }}>{t('nav_social')}</span>
          </div>

          <div 
            className={`nav-item ${view === 'class' ? 'active' : ''}`} 
            onClick={() => { setView('class'); window.scrollTo(0,0); }}
          >
            <GraduationCap size={22} color={view === 'class' ? '#FF1744' : '#94A3B8'} style={{ marginBottom: '4px' }} />
            <span style={{ fontSize: '10px', fontWeight: view === 'class' ? 900 : 500, color: view === 'class' ? '#FF1744' : '#94A3B8' }}>{t('nav_class')}</span>
          </div>

          <div className="nav-item central-action" style={{ pointerEvents: 'none', position: 'relative', zIndex: 1001 }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width:'52px', height:'52px',
                borderRadius:'50%',
                background: 'linear-gradient(135deg, #FF1744 0%, #D32F2F 100%)',
                border:'none', color:'#fff',
                display:'flex', alignItems:'center',
                justifyContent:'center', cursor:'pointer',
                boxShadow:'0 8px 25px rgba(255, 23, 68, 0.4)',
                pointerEvents: 'auto'
              }}
              onClick={() => {
                setView('register')
              }}
            >
              <Plus size={28} strokeWidth={3} />
            </motion.button>
            <span style={{ pointerEvents: 'auto', color: '#1E293B', fontSize: '10px' }}>{t('nav_register')}</span>
          </div>

          <div 
            className={`nav-item ${view === 'bootcamp' ? 'active' : ''}`} 
            onClick={() => { setView('bootcamp'); window.scrollTo(0,0); }}
          >
            <Tent size={22} color={view === 'bootcamp' ? '#FF1744' : '#94A3B8'} style={{ marginBottom: '4px' }} />
            <span style={{ fontSize: '10px', fontWeight: view === 'bootcamp' ? 900 : 500, color: view === 'bootcamp' ? '#FF1744' : '#94A3B8' }}>{t('nav_bootcamp')}</span>
          </div>

          <div 
            className={`nav-item ${view === 'festival' ? 'active' : ''}`} 
            onClick={() => { setView('festival'); window.scrollTo(0,0); }}
          >
            <Flag size={22} color={view === 'festival' ? '#FF1744' : '#94A3B8'} style={{ marginBottom: '4px' }} />
            <span style={{ fontSize: '10px', fontWeight: view === 'festival' ? 900 : 500, color: view === 'festival' ? '#FF1744' : '#94A3B8' }}>{t('nav_festival')}</span>
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;
