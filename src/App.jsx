import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { Home as HomeIcon, Users, Plus, LogOut, Heart, X, MessageSquare, RefreshCw, CloudSun, Utensils, Zap, Languages, Bell, Star, Navigation, CreditCard, Settings, Map as MapIcon, BarChart, Gift, Coffee, User, Menu, Music2, Tent, Flag, Download, Globe, ShieldCheck, Calendar, Camera, ChevronLeft, ChevronRight, Loader2, UserPlus, Cloud, MessageCircle, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, logActivity } from './lib/supabase'
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import InstructorSection from './components/InstructorSection'
import InstructorRegister from './components/InstructorRegister'

// 페이지 지연 로딩 (Lazy Loading)
const RegisterForm = lazy(() => import('./RegisterForm'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const HomePage = lazy(() => import('./pages/Home'));
const Community = lazy(() => import('./pages/Community'));
const PostClub = lazy(() => import('./pages/PostClub'));
const Bootcamp = lazy(() => import('./pages/Bootcamp'));
const Festival = lazy(() => import('./pages/Festival'));
const Parking = lazy(() => import('./pages/Parking'));
const Restaurant = lazy(() => import('./pages/Restaurant'));
const SajuModal = lazy(() => import('./components/SajuModal'));
const IncheonRoute = lazy(() => import('./components/IncheonRoute'));
const WeatherModal = lazy(() => import('./components/WeatherModal'));

// 로딩 스피너 컴포넌트
const LoadingFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '16px' }}>
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
      <Loader2 size={40} color="#FF1744" />
    </motion.div>
    <p style={{ color: '#94A3B8', fontSize: '14px', fontWeight: 600 }}>잠시만 기다려주세요...</p>
  </div>
);

// --- [CUSTOM ROUTING ENGINE] ---
const useLocation = () => {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  return { pathname };
};

const navigate = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
};

import { BAR_DATABASE, findBarByName } from './data/barDatabase';

const GENRE_MAP = {
  '바차타': { key: 'b_ratio', label: 'B', color: '#059669' },
  '살사':   { key: 's_ratio', label: 'S', color: '#DC2626' },
  '쥬크':   { key: 'j_ratio', label: 'J', color: '#F59E0B' },
  '키좀바': { key: 'k_ratio', label: 'K', color: '#7C3AED' },
};


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

      {/* 줌 컨테이너 (Viewport 전체 사용) */}
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        position: 'relative', 
        overflow: 'hidden', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <QuickPinchZoom 
          onUpdate={onUpdate} 
          wheelScaleFactor={500} 
          tapZoomFactor={2}
          containerProps={{
            style: {
              width: '100%',
              height: '100%'
            }
          }}
        >
          <img 
            ref={imgRef}
            src={src} 
            alt="poster" 
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              willChange: 'transform',
              userSelect: 'none',
              pointerEvents: 'none'
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



const naturalIncheonDB = [
  { t: "⚓ 상륙작전", q: "오늘 상륙인가요?", a: "벌써 점령했습니다!" },
  { t: "💃 동암역", q: "동암 급행 타셨나요?", a: "당신께 급행 정착입니다!" }
];

const DynamicAnalysisModal = ({ isOpen, onClose, userCoords, isSajuCall }) => {
  const [targetDest, setTargetDest] = useState(null);
  const [tracker, setTracker] = useState({ distance: '0.0', duration: '0' });
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [amguho, setAmguho] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const findTarget = (lat, lon) => {
      const venues = BAR_DATABASE
        .filter(b => b.lat && b.lon)
        .map(b => ({
          name: b.name,
          address: b.address,
          lat: b.lat,
          lon: b.lon,
          region: b.region,
          dist: calculateDistance(lat, lon, b.lat, b.lon)
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);

      setTargetDest(venues[0]);
      setNearbyVenues(venues);
      const d = venues[0].dist;
      setTracker({ distance: d.toFixed(1), duration: Math.ceil(d * 10) + 5 });
    };
    if (userCoords) findTarget(userCoords.lat, userCoords.lon);
  }, [isOpen, userCoords]);

  if (!isOpen || !targetDest) return null;
  const isIncheon = targetDest.region === '인천' && isSajuCall;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 1000000, 
        backgroundColor: 'var(--color-bg)', 
        display: 'flex', 
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        style={{ 
          width: '100%', 
          maxWidth: '500px',
          margin: '0 auto',
          minHeight: '100vh',
          background: 'var(--color-bg)', 
          padding: 'calc(20px + env(safe-area-inset-top)) 24px calc(40px + env(safe-area-inset-bottom))', 
          color: 'var(--color-text-main)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {!amguho ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div style={{ background: '#FF1744', color: '#fff', padding: '8px 16px', borderRadius: '50px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>REALTIME GPS</div>
              <button 
                onClick={onClose}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={24} color="#64748B" />
              </button>
            </div>
            
            <h2 style={{ fontSize: '28px', fontWeight: '1000', marginBottom: '30px', color: 'var(--color-text-main)', lineHeight: '1.3' }}>
              {isIncheon ? '성지 상륙 분석' : '최단 경로 최적화'} 🛰️<br/>
              <span style={{ color: '#FF1744' }}>{targetDest.name}</span>
            </h2>

            <div style={{ padding: '30px', background: 'var(--color-card)', borderRadius: '30px', display: 'flex', gap: '20px', marginBottom: '40px', border: '1px solid var(--color-border)' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--color-text-sub)', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>실제 거리</p>
                <p style={{ fontSize: '28px', fontWeight: '1000', color: '#FF1744' }}>{tracker.distance}km</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--color-text-sub)', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>예상 소요</p>
                <p style={{ fontSize: '28px', fontWeight: '1000', color: 'var(--color-text-main)' }}>{tracker.duration}분</p>
              </div>
            </div>

            <div style={{ marginBottom: '40px', flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-text-sub)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={16} fill="var(--color-text-sub)" /> 주변 성지 추천
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {nearbyVenues.map((venue, idx) => (
                  <motion.div 
                    key={idx} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const query = encodeURIComponent(venue.name + ' ' + (venue.address || ''));
                      window.open(`https://map.kakao.com/link/search/${query}`, '_blank');
                    }}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '16px 20px', 
                      background: idx === 0 ? 'rgba(255, 23, 68, 0.05)' : 'var(--color-card)', 
                      borderRadius: '20px', 
                      border: idx === 0 ? '1px solid #FF1744' : '1px solid var(--color-border)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: idx === 0 ? '#FF1744' : 'var(--color-text-main)' }}>{venue.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-sub)', fontWeight: '500' }}>{venue.address}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: idx === 0 ? '#FF1744' : 'var(--color-text-sub)' }}>{venue.dist.toFixed(1)}km</span>
                      <ChevronRight size={18} color={idx === 0 ? '#FF1744' : 'var(--color-border)'} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => isIncheon ? setAmguho(naturalIncheonDB[0]) : onClose()} 
              style={{ 
                width: '100%', 
                padding: '24px', 
                borderRadius: '24px', 
                background: '#FF1744', 
                color: '#fff', 
                border: 'none', 
                fontSize: '18px', 
                fontWeight: '1000', 
                boxShadow: '0 12px 24px rgba(255, 23, 68, 0.2)',
                cursor: 'pointer'
              }}
            >
              {isIncheon ? '암구호 수신하기' : '확인 완료'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '1000', marginBottom: '40px', color: '#1E293B' }}>성지 암구호</h3>
            <div style={{ background: '#FEF2F2', padding: '40px 30px', borderRadius: '35px', border: '2px solid #FF1744', marginBottom: '40px' }}>
              <p style={{ color: '#FF1744', fontWeight: '800', fontSize: '16px', marginBottom: '12px' }}>Q: {amguho.q}</p>
              <p style={{ fontSize: '24px', fontWeight: '1000', color: '#1E293B' }}>A: {amguho.a}</p>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                width: '100%', 
                padding: '22px', 
                borderRadius: '24px', 
                background: '#1E293B', 
                color: '#FFFFFF', 
                fontWeight: '1000', 
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              작전 시작
            </button>
          </div>
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
        background: 'linear-gradient(90deg, #FFFBEB, #FEF3C7)', 
        borderRadius: '16px', 
        padding: '10px 16px', 
        border: '1px solid #FDE68A', 
        boxShadow: '0 4px 15px rgba(251, 191, 36, 0.1)', 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div style={{ background: '#FEF3C7', padding: '6px', borderRadius: '10px', color: '#D97706', flexShrink: 0 }}>
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

const isNowInPartyTime = (dateStr, startTime) => {
  const now = new Date()
  const start = new Date(`${dateStr}T${startTime}:00`)
  // 파티 시작 30분 전부터 체크인 허용
  const startWithBuffer = new Date(start.getTime() - 30 * 60 * 1000)
  // 새벽 3시 또는 시작 후 일정 시간까지 라이브 유지
  const end = new Date(start.getTime())
  end.setDate(end.getDate() + 1)
  end.setHours(4, 0, 0, 0)
  return now >= startWithBuffer && now <= end
}

const SplashScreen = () => {
  const [stage, setStage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setStage(2), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <AnimatePresence mode="wait">
        {stage === 1 ? (
          <motion.img
            key="stage1"
            src="/logo.png"
            alt="BAMPPA"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            style={{ width: '200px', objectFit: 'contain' }}
          />
        ) : (
          <motion.div
            key="stage2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.img
              src="/logo.png"
              alt="BAMPPA"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 1.0], opacity: 1 }}
              transition={{ duration: 0.8, times: [0, 0.6, 1], ease: "easeOut" }}
              style={{ width: '200px', objectFit: 'contain' }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{ marginTop: '24px', textAlign: 'center' }}
            >
              <div style={{ fontSize: '9px', color: '#FF1744', fontWeight: 700, letterSpacing: '1px' }}>
                BACHATA · SALSA · KIZOMBA · ZOUK
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function App() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'ko';
  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('ko') ? 'en' : 'ko';
    i18n.changeLanguage(newLang);
  };

  // 환경에 관계없이 정확한 KST(한국 표준시) 날짜를 가져오는 로직
  const getKSTDate = () => {
    const now = new Date();
    // ⚠️ [벤틀리 특수 로직] 새벽 4시 이전까지는 '전날'로 간주하여 포스터 유지
    if (now.getHours() < 4) {
      now.setDate(now.getDate() - 1);
    }
    const kstString = now.toLocaleString('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [m, d, y] = kstString.split('/');
    // 0 패딩 보장 (MM, DD)
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return { year: parseInt(y), month: parseInt(mm), date: parseInt(dd), dateStr: `${y}-${mm}-${dd}` };
  };

  const todayData = getKSTDate();

  const [showSplash, setShowSplash] = useState(!localStorage.getItem('splash_shown'));

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      localStorage.setItem('splash_shown', 'true');
      setShowSplash(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [showSplash]);

  const [parties, setParties] = useState([]);
  const [bootcamps, setBootcamps] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [displayParties, setDisplayParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayData.dateStr);
  const [showCouponPopup, setShowCouponPopup] = useState(false);
  const location = useLocation();
  const [view, setView] = useState('home');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setView('home');
    else if (path === '/livepick') setView('community');
    else if (path === '/bootcamp') setView('bootcamp');
    else if (path === '/bootcamp/register') setView('bootcamp-register');
    else if (path === '/festival') setView('festival');
    else if (path === '/festival/register') setView('festival-register');
    else if (path === '/parking') setView('parking');
    else if (path === '/restaurant') setView('restaurant');
    else if (path === '/admin') setView('admin');
    else if (path === '/admin-portal') setView('admin-portal');
  }, [location.pathname]);


  const [registerType, setRegisterType] = useState('party');

  const [showIncheonModal, setShowIncheonModal] = useState(false);
  const [isSajuCall, setIsSajuCall] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [modalScale, setModalScale] = useState(1);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showIncheon, setShowIncheon] = useState(false);
  const [showNoticeGuide, setShowNoticeGuide] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showSaju, setShowSaju] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showFilteredResults, setShowFilteredResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showInstructor, setShowInstructor] = useState(false)
  const [showInstructorRegister, setShowInstructorRegister] = useState(false)
  const [filterRegion, setFilterRegion] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(todayData.month);
  const [showGridModal, setShowGridModal] = useState(false);
  const [gridRegion, setGridRegion] = useState('');
  const [filterStep, setFilterStep] = useState(1);
  const [weatherTapCount, setWeatherTapCount] = useState(0);
  const [lastWeatherTap, setLastWeatherTap] = useState(0);
  const weatherTimeoutRef = useRef(null);
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  // 프리미엄 화이트 테마 고정 (시스템 설정 무시)
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      const diff = currentY - lastScrollY.current
      
      if (currentY < 10) {
        setNavVisible(true)
      } else if (Math.abs(diff) > 10) {
        if (diff > 0) {
          setNavVisible(false)
        } else {
          setNavVisible(true)
        }
        lastScrollY.current = currentY
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleWeatherTap = () => {
    const now = Date.now();
    // 500ms 이내 연속 클릭 체크
    const isQuickTap = now - lastWeatherTap < 500;
    const nextCount = isQuickTap ? weatherTapCount + 1 : 1;
    
    setWeatherTapCount(nextCount);
    setLastWeatherTap(now);

    if (nextCount >= 5) {
      // 5번 연속 클릭 시 관리자 포털 진입
      if (weatherTimeoutRef.current) clearTimeout(weatherTimeoutRef.current);
      setView('admin-portal');
      setWeatherTapCount(0);
      setIsMenuOpen(false);
    } else {
      // 일반 클릭 또는 연속 클릭 대기
      if (weatherTimeoutRef.current) clearTimeout(weatherTimeoutRef.current);
      weatherTimeoutRef.current = setTimeout(() => {
        // 300ms 이내에 추가 클릭이 없으면(즉, 카운트가 그대로면) 날씨 모달 열기
        // (nextCount가 1인 경우에만 바로 열어줌으로써 UX 지연 최소화)
        if (nextCount === 1) {
          handleOpenModal(setShowWeather, true);
          setIsMenuOpen(false);
        }
        setWeatherTapCount(0);
      }, 300);
    }
  };

  const handleOpenModal = (setter, value = true) => {
    window.history.pushState({ modal: true }, '');
    setter(value);
  };

  const handleCloseModal = () => {
    window.history.back();
  };

  useEffect(() => {
    if (window.location.pathname === '/parking') {
      setView('parking');
      window.location.hash = 'parking';
    } else if (window.location.pathname === '/restaurant') {
      setView('restaurant');
      window.location.hash = 'restaurant';
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      if (selectedPoster) { setSelectedPoster(null); return; }
      if (showGridModal) { setShowGridModal(false); return; }
      if (showFilteredResults) { setShowFilteredResults(false); return; }
      
      if (filterStep > 1) { setFilterStep(1); return; }
      
      if (showFilterPanel) { setShowFilterPanel(false); return; }
      if (showFullCalendar) { setShowFullCalendar(false); return; }
      if (isMenuOpen) { setIsMenuOpen(false); return; }
      if (showNoticeGuide) { setShowNoticeGuide(false); return; }
      if (showWeather) { setShowWeather(false); return; }
      if (showSaju) { setShowSaju(false); return; }
      if (showIncheonModal) { setShowIncheonModal(false); return; }
      if (showIncheon) { setShowIncheon(false); return; }

      const newHash = window.location.hash.replace('#', '');
      if (newHash && newHash !== view) {
        setView(newHash);
      } else if (!newHash) {
        const path = window.location.pathname;
        if (path === '/livepick') setView('community');
        else if (path === '/festival') setView('festival');
        else if (path === '/bootcamp') setView('bootcamp');
        else if (view !== 'home') setView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, selectedPoster, showFullCalendar, isMenuOpen, showNoticeGuide, showWeather, showSaju, showIncheonModal, showFilterPanel, showFilteredResults, showGridModal, showIncheon]);

  useEffect(() => {
    const couponReceived = localStorage.getItem('coupon_received')
    if (couponReceived) return

    window.addEventListener('appinstalled', () => {
      setShowCouponPopup(true)
      localStorage.setItem('coupon_received', 'true')
    })
  }, [])

  useEffect(() => {
    // 공지사항 가이드 자동 팝업 (디바이스당 한 번)
    const guideShown = localStorage.getItem('notice_guide_shown');
    if (!guideShown) {
      setTimeout(() => {
        setShowNoticeGuide(true);
      }, 1000); // 1초 뒤에 자연스럽게 팝업
    } else {
      // 이미 가이드를 본 사용자라면 즉시 위치 요청 시작
      requestLocation();
    }
  }, []);

  useEffect(() => {
    const handleOpenRegister = () => setView('festival-register');
    window.addEventListener('open-festival-register', handleOpenRegister);
    return () => window.removeEventListener('open-festival-register', handleOpenRegister);
  }, []);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const [partiesRes, locationsRes, bootcampsRes, festivalsRes] = await Promise.all([
        supabase.from('parties').select('*').order('date', { ascending: true }),
        supabase.from('locations').select('id, name'),
        supabase.from('bootcamps').select('*').eq('status', 'active'),
        supabase.from('festivals').select('*').eq('status', 'active')
      ]);

      const rawParties = partiesRes.data || [];
      const rawLocations = locationsRes.data || [];

      const locationMap = rawLocations.reduce((acc, loc) => {
        acc[loc.id] = loc.name;
        return acc;
      }, {});

      const mappedParties = rawParties.map(p => {
        const locName = locationMap[p.location_id] || p.locationName || p.location_name || '장소 미지정';
        
        const fullSearchText = `${p.address || ''} ${locName} ${p.cityName || ''}`;
        let broadRegion = '전국'; 
        
        if (fullSearchText.includes('부산') || fullSearchText.includes('대구') || fullSearchText.includes('울산') || fullSearchText.includes('경상') || fullSearchText.includes('경남') || fullSearchText.includes('경북') || fullSearchText.includes('창원') || fullSearchText.includes('포항') || fullSearchText.includes('김해')) broadRegion = '경상도';
        else if (fullSearchText.includes('서울') || fullSearchText.includes('강남') || fullSearchText.includes('홍대') || fullSearchText.includes('잠실') || fullSearchText.includes('성수') || fullSearchText.includes('서초') || fullSearchText.includes('영등포') || fullSearchText.includes('신림') || fullSearchText.includes('건대')) broadRegion = '서울';
        else if (fullSearchText.includes('경기') || fullSearchText.includes('인천') || fullSearchText.includes('부천') || fullSearchText.includes('수원') || fullSearchText.includes('안양') || fullSearchText.includes('의정부') || fullSearchText.includes('분당') || fullSearchText.includes('일산')) broadRegion = '경기/인천';
        else if (fullSearchText.includes('광주') || fullSearchText.includes('전라') || fullSearchText.includes('전남') || fullSearchText.includes('전북') || fullSearchText.includes('전주') || fullSearchText.includes('목포') || fullSearchText.includes('여수') || fullSearchText.includes('순천')) broadRegion = '전라도';
        else if (fullSearchText.includes('대전') || fullSearchText.includes('충남') || fullSearchText.includes('충북') || fullSearchText.includes('충청') || fullSearchText.includes('세종') || fullSearchText.includes('천안') || fullSearchText.includes('청주')) broadRegion = '충청도';
        else if (fullSearchText.includes('강원') || fullSearchText.includes('제주') || fullSearchText.includes('춘천') || fullSearchText.includes('원주') || fullSearchText.includes('서귀포')) broadRegion = '강원/제주';
        else broadRegion = '전국'; 
        
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
          locationName: barInfo ? barInfo.name : locName,
          locationNameEn
        };
      });
      setParties(mappedParties);
      setBootcamps(bootcampsRes.data || []);
      setFestivals(festivalsRes.data || []);
    } catch (err) { console.error('데이터 로딩 오류:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchParties(); }, []);

  useEffect(() => {
    const todayStr = getKSTDate().dateStr;
    const upcomingParties = parties.filter(p => p.date >= todayStr);
    
    const currentLang = i18n.language || 'ko';
    if (currentLang.startsWith('en')) {
      const translated = upcomingParties.map(p => ({
        ...p,
        title: p.title_en || p.title,
        displayLocationName: p.locationNameEn || p.locationName,
        displayBroadRegion: p.broadRegionEn || p.broadRegion,
        displayCityName: p.cityNameEn || p.cityName
      }));
      setDisplayParties(translated);
    } else {
      const origin = upcomingParties.map(p => ({
        ...p,
        displayLocationName: p.locationName,
        displayBroadRegion: p.broadRegion,
        displayCityName: p.cityName
      }));
      setDisplayParties(origin);
    }
  }, [i18n.language, parties]);

  useEffect(() => {
    window.history.replaceState({ view, date: selectedDate }, '');
  }, [selectedDate]);

  const openAnalysis = (saju = false) => {
    setIsSajuCall(saju);
    setIsAnalyzing(true);
    setTimeout(() => { setIsAnalyzing(false); setShowIncheonModal(true); }, 1200);
  };

  const handleRegister = (type = 'party') => {
    if (type === 'party') {
      navigate('/register-party');
    } else {
      navigate('/register-class');
    }
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setUserCoords(coords);
          console.log("Location obtained:", coords.lat, coords.lon);
          
          // 자동 체크인 트리거
          triggerAutoCheckin(coords);
        },
        (err) => {
          console.error("Location request error:", err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  const triggerAutoCheckin = async (coords) => {
    if (!parties.length || !coords) return;
    
    const todayStr = getKSTDate().dateStr;
    const liveParties = parties.filter(p => p.date === todayStr && isNowInPartyTime(p.date, p.time));
    
    for (const party of liveParties) {
      const locName = party.locationName || party.location_name;
      const barInfo = findBarByName(locName);
      if (!barInfo || !barInfo.lat || !barInfo.lon) continue;
      
      const distance = calculateDistance(coords.lat, coords.lon, barInfo.lat, barInfo.lon);
      
      // 200m (0.2km) 이내일 경우 자동 체크인
      if (distance <= 0.2) {
        const lastCheckinKey = `last_checkin_${barInfo.name}`;
        const lastCheckin = localStorage.getItem(lastCheckinKey);
        const now = Date.now();
        
        // 30분 이내 중복 체크인 방지
        if (!lastCheckin || (now - parseInt(lastCheckin)) > 30 * 60 * 1000) {
          try {
            await supabase.from('bar_checkins').insert([
              { 
                bar_name: barInfo.name, 
                region: barInfo.region || '전국',
                checked_in_at: new Date().toISOString()
              }
            ]);
            localStorage.setItem(lastCheckinKey, now.toString());
            console.log(`Auto check-in success at ${barInfo.name}`);
          } catch (err) {
            console.error("Auto check-in failed:", err);
          }
        }
      }
    }
  };

  useEffect(() => {
    // 주기적으로 자동 위치 갱신 및 체크인 시도 (3분에 한 번)
    const interval = setInterval(() => {
      requestLocation();
    }, 180000);
    return () => clearInterval(interval);
  }, [parties]); // parties가 로드된 후부터 작동

  const sharedProps = {
    parties: displayParties, bootcamps, festivals, loading, selectedMonth, setSelectedMonth, selectedWeek: 1, setSelectedWeek: () => {}, 
    selectedDate, setSelectedDate, selectedRegion: '서울', setSelectedRegion: () => {}, 
    view, setView, setSelectedPoster, 
    fourteenDays: Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = i18n.language.startsWith('en') ? DAYS_EN[d.getDay()] : DAYS_KOR[d.getDay()];
      return { fullDate: formatDateToKSTString(d), date: String(d.getDate()), month: String(d.getMonth() + 1), dayName, isToday: i === 0, dayOfWeek: d.getDay() };
    }), weekData: [], allDatesInMonth: [], filteredParties: displayParties.filter(p => p.date === selectedDate),
    showFullCalendar, setShowFullCalendar,
    showFilterPanel, setShowFilterPanel,
    showFilteredResults, setShowFilteredResults,
    likedIds: [], toggleLike: () => {},
    filterRegion, setFilterRegion, filterGenre, setFilterGenre,
    showGridModal, setShowGridModal, gridRegion, setGridRegion, filterStep, setFilterStep,
    handleOpenModal, handleCloseModal,
    IncheonBanner: () => <IncheonPremiumBanner t={t} onClick={() => openAnalysis(false)} />, venueCounts: {}, resetToToday: () => { setView('home'); setSelectedDate(todayData.dateStr); }, formatItemDate: (d, t) => `${d} ${t}`, formatFee: (f) => f, 
    handleRegister, 
    fetchParties,
    setShowSaju,
    logActivity: () => {}, regionalTheme: { welcomeMsg: "전국 댄서들을 위한 실시간 정보", specialBanner: true }
  };

  return (
    <>
    <div style={{ 
      width: '100%', maxWidth: '500px', margin: '0 auto', 
      background: 'var(--color-bg)', color: 'var(--color-text-main)',
      minHeight: '100vh', position: 'relative',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: showSplash ? 0 : 1 }} 
        transition={{ duration: 0.3, delay: showSplash ? 0 : 0.3 }}
        style={{ width: '100%', minHeight: '100vh', position: 'relative' }}
      >
      <AnimatePresence>{isAnalyzing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000000, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(30px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '60px', height: '60px', border: '4px solid #FFEBEE', borderTop: '4px solid #E53935', borderRadius: '50%', marginBottom: '20px' }} /><h2 style={{ color: '#1E293B', fontSize: '20px', fontWeight: '900' }}>실시간 지능형 분석 중...</h2></motion.div>}</AnimatePresence>

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
          <Menu size={24} color={'#FF1744'} />
        </motion.button>
      )}

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
              background: 'var(--color-bg)', padding: '24px',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
              borderRight: '1px solid var(--color-border)',
              transition: 'background-color 0.3s, border-color 0.3s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseModal}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '10px', color: '#FF1744', cursor: 'pointer' }}
              >
                <ChevronLeft size={24} />
              </motion.button>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: 'var(--color-text-main)', fontSize: '24px', fontWeight: 900, margin: 0 }}>{t('premium_services')}</h2>
              <p style={{ color: 'var(--color-text-sub)', fontSize: '14px', marginTop: '4px' }}>{t('platform_desc')}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 1. 강사 등록 신청 */}
              <button
                type="button"
                onClick={() => { handleCloseModal(); setShowInstructorRegister(true) }}
                style={{
                  width: '100%', padding: '16px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={20} color="#7C3AED" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>강사 등록 신청</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>나도 월드스타</div>
                </div>
              </button>

              {/* 2. 라틴에 진심 */}
              <button
                type="button"
                onClick={() => { handleCloseModal(); setShowInstructor(true) }}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                  background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', border: '1px solid #DDD6FE',
                  cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Music2 size={20} color="#7C3AED" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#7C3AED' }}>라틴에 진심</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>팔로우할 강사를 찾아보세요</div>
                </div>
              </button>

              {/* 3. 달력 */}
              <button
                type="button"
                onClick={() => { setIsMenuOpen(false); handleOpenModal(setShowFullCalendar, true); }}
                style={{
                  width: '100%', padding: '16px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} color="#D97706" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>달력</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>파티 일정 한눈에 보기</div>
                </div>
              </button>

              {/* 4. 뒷풀이 맛집 */}
              <button
                type="button"
                onClick={() => { setView('restaurant'); setIsMenuOpen(false); }}
                style={{
                  width: '100%', padding: '16px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Utensils size={20} color="#E53935" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>뒷풀이 맛집</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>댄서들의 단골 맛집</div>
                </div>
              </button>

              {/* 5. 오늘 날씨 */}
              <button
                type="button"
                onClick={handleWeatherTap}
                style={{
                  width: '100%', padding: '16px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cloud size={20} color="#0284C7" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>오늘 날씨</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>파티 가기 전 날씨 확인</div>
                </div>
              </button>

              {/* 6. 실시간 오픈톡 */}
              <button
                type="button"
                onClick={() => { window.open('https://open.kakao.com/o/gP43rNri', '_blank'); setIsMenuOpen(false); }}
                style={{
                  width: '100%', padding: '16px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FEE500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={20} color="#000" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>실시간 오픈톡</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>댄서들과 실시간 소통</div>
                </div>
              </button>

              {/* 다크모드 토글 (기존 스타일 유지하되 통일감 부여) */}
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                style={{
                  width: '100%', padding: '16px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px',
                  cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Moon size={20} color="#6366F1" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{isDark ? '라이트 모드로 보기' : '다크 모드로 보기'}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>눈이 편안한 테마로 변경</div>
                </div>
              </button>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '40px', textAlign: 'center' }}>
              <p style={{ color: '#94A3B8', fontSize: '12px' }}>© 2026 BAMPPA All Rights Reserved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <Suspense fallback={<LoadingFallback />}>
          {view === 'home' ? <HomePage {...sharedProps} /> : 
           view === 'community' ? <Community setSelectedPoster={setSelectedPoster} setView={setView} /> :
           view === 'bootcamp' ? <Bootcamp onBack={() => navigate('/')} /> :
           view === 'bootcamp-register' ? <Bootcamp onBack={() => navigate('/bootcamp')} initialView="register" /> :
           view === 'festival' ? <Festival onBack={() => navigate('/')} /> :
           view === 'festival-register' ? <Festival onBack={() => navigate('/festival')} initialView="register" /> :
           view === 'parking' ? <Parking onBack={() => navigate('/')} /> :
           view === 'restaurant' ? <Restaurant onBack={() => navigate('/')} /> :
           view === 'register-party' ? <RegisterForm onBack={() => navigate('/')} /> :
           view === 'admin' ? <AdminDashboard setView={setView} onBack={() => setView('admin-portal')} refreshData={fetchParties} /> :
           view === 'admin-portal' ? (
                <div style={{ 
                  height: '100vh', 
                  background: '#0F172A', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '20px',
                  gap: '20px'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <ShieldCheck size={64} color="#FF1744" style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 900 }}>{t('admin_portal')}</h2>
                    <p style={{ color: '#94A3B8', fontSize: '14px' }}>{t('admin_portal_desc')}</p>
                  </div>
                  

                  <button 
                    onClick={() => setView('admin')}
                    style={{ 
                      width: '100%', maxWidth: '320px', padding: '24px', 
                      borderRadius: '20px', background: '#1E293B', color: 'white', 
                      border: '1px solid #334155', fontSize: '18px', fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px'
                    }}
                  >
                    <Music2 size={24} color="#FF1744" /> {t('admin_manage_party')}
                  </button>
                  
                  <button 
                    onClick={() => navigate('/')}
                    style={{ marginTop: '40px', background: 'none', border: 'none', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {t('back_to_main')}
                  </button>
                </div>
              ) : <AdminDashboard onBack={() => navigate('/')} refreshData={fetchParties} />}
        </Suspense>
      </main>

      <nav 
        className="bottom-nav" 
        style={{ 
          position: 'fixed', bottom: '20px', left: '50%',
          transform: navVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(150%)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          width: 'calc(100% - 30px)', maxWidth: '480px', height: '72px',
          background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(30px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 1000,
          borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          padding: '0 10px'
        }}
      >
        <div 
          className="nav-item" 
          onClick={() => navigate('/')}
          style={{ 
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s', position: 'relative', height: '100%',
            color: location.pathname === '/' ? '#E53935' : '#64748B'
          }}
        >
          {location.pathname === '/' && (
            <motion.div 
              layoutId="nav-glow"
              style={{ position: 'absolute', width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(229, 57, 53, 0.15)', filter: 'blur(10px)' }} 
            />
          )}
          <Music2 size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '9px', fontWeight: location.pathname === '/' ? 950 : 700, letterSpacing: '0.5px' }}>SOCIAL</span>
        </div>

        <div 
          className="nav-item" 
          onClick={() => navigate('/livepick')}
          style={{ 
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s', position: 'relative', height: '100%',
            color: location.pathname === '/livepick' ? '#E53935' : '#64748B'
          }}
        >
          {location.pathname === '/livepick' && (
            <motion.div 
              layoutId="nav-glow"
              style={{ position: 'absolute', width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(229, 57, 53, 0.15)', filter: 'blur(10px)' }} 
            />
          )}
          <Camera size={22} strokeWidth={location.pathname === '/livepick' ? 2.5 : 2} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '9px', fontWeight: location.pathname === '/livepick' ? 950 : 700, letterSpacing: '0.5px' }}>LIVE PICK</span>
        </div>

        {/* PREMIUM ACTION BUTTON */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (location.pathname === '/livepick') {
                window.dispatchEvent(new CustomEvent('open-community-upload'));
              } else if (location.pathname === '/bootcamp') {
                navigate('/bootcamp/register');
              } else if (location.pathname === '/festival') {
                navigate('/festival/register');
              } else {
                navigate('/register-party');
              }
            }}
            style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
              border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 8px 25px rgba(229, 57, 53, 0.5)',
              zIndex: 2
            }}
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        </div>

        <div 
          className="nav-item" 
          onClick={() => navigate('/bootcamp')}
          style={{ 
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s', position: 'relative', height: '100%',
            color: location.pathname === '/bootcamp' ? '#E53935' : '#64748B'
          }}
        >
          {location.pathname === '/bootcamp' && (
            <motion.div 
              layoutId="nav-glow"
              style={{ position: 'absolute', width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(229, 57, 53, 0.15)', filter: 'blur(10px)' }} 
            />
          )}
          <Tent size={22} strokeWidth={location.pathname === '/bootcamp' ? 2.5 : 2} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '9px', fontWeight: location.pathname === '/bootcamp' ? 950 : 700, letterSpacing: '0.5px' }}>BOOTCAMP</span>
        </div>

        <div 
          className="nav-item" 
          onClick={() => navigate('/festival')}
          style={{ 
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s', position: 'relative', height: '100%',
            color: location.pathname === '/festival' ? '#E53935' : '#64748B'
          }}
        >
          {location.pathname === '/festival' && (
            <motion.div 
              layoutId="nav-glow"
              style={{ position: 'absolute', width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(229, 57, 53, 0.15)', filter: 'blur(10px)' }} 
            />
          )}
          <Flag size={22} strokeWidth={location.pathname === '/festival' ? 2.5 : 2} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '9px', fontWeight: location.pathname === '/festival' ? 950 : 700, letterSpacing: '0.5px' }}>FESTIVAL</span>
        </div>
      </nav>

      <DynamicAnalysisModal isOpen={showIncheonModal} onClose={() => setShowIncheonModal(false)} userCoords={userCoords} isSajuCall={isSajuCall} />
      <AnimatePresence>
        <Suspense fallback={null}>
          {showIncheon && <IncheonRoute parties={parties} onClose={() => setShowIncheon(false)} />}
        </Suspense>
      </AnimatePresence>

      <AnimatePresence>
        {showInstructor && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#fff' }}>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 1101 }}>
              <button onClick={() => setShowInstructor(false)} style={{ background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, cursor: 'pointer' }}>
                <ChevronLeft size={24} /> {t('back')}
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: 900, fontSize: '18px', color: '#1E293B', marginRight: '40px' }}>라틴에 진심</div>
            </div>
            <div style={{ paddingTop: '60px', height: '100%', overflowY: 'auto' }}>
              <InstructorSection />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstructorRegister && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#fff' }}>
            <InstructorRegister onBack={() => setShowInstructorRegister(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <Suspense fallback={null}>
          {showSaju && <SajuModal parties={parties} onClose={() => setShowSaju(false)} lang={lang} />}
        </Suspense>
      </AnimatePresence>
      <AnimatePresence>
        <Suspense fallback={null}>
          {showWeather && <WeatherModal onClose={() => setShowWeather(false)} />}
        </Suspense>
      </AnimatePresence>

      <AnimatePresence>
        {showFullCalendar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 170000 }} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', bottom: '90px', left: '10px', right: '10px', background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: 170001, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B' }}>{selectedMonth}월</span><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setSelectedMonth(m => m > 1 ? m-1 : 12)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px' }}><ChevronLeft size={18} /></button><button onClick={() => setSelectedMonth(m => m < 12 ? m+1 : 1)} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', width: '36px', height: '36px' }}><ChevronRight size={18} /></button></div></div>
                <button onClick={handleCloseModal} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E293B' }}>
                  <ChevronLeft size={28} />
                </button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', minHeight: '350px' }}>
                {!showFilterPanel && !showFilteredResults ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: d === '일' ? '#FF1744' : d === '토' ? '#FF1744' : '#999', padding: '5px 0' }}>{d}</div>)}
                    {(() => {
                      const firstDay = new Date(todayData.year, selectedMonth - 1, 1).getDay();
                      const lastDate = new Date(todayData.year, selectedMonth, 0).getDate();
                      const days = [];
                      for (let i = 0; i < firstDay; i++) days.push({ date: null });
                      for (let i = 1; i <= lastDate; i++) {
                        const fullDate = `${todayData.year}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                        const d = new Date(todayData.year, selectedMonth - 1, i);
                        days.push({ date: i, fullDate, dayName: DAYS_KOR[d.getDay()] });
                      }
                      return days.map((day, idx) => {
                        if (!day.date) return <div key={idx} />;
                        const isSelected = selectedDate === day.fullDate;
                        const themeColor = '#FF1744';
                        const todayStr = getKSTDate().dateStr;
                        return (
                          <div 
                            key={day.fullDate} 
                            onClick={() => { 
                              if (day.fullDate >= todayStr) { setSelectedDate(day.fullDate); }
                            }}
                            style={{ padding: '10px 0', borderRadius: '10px', background: isSelected ? themeColor : '#F8FAFC', color: isSelected ? '#fff' : '#1E293B', fontWeight: 800, cursor: 'pointer' }}
                          >
                            {day.date}
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <button onClick={() => { setShowFilterPanel(false); setShowFilteredResults(false); setFilterStep(1); }} style={{ background: '#F8FAFC', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#FF1744', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={16} /> 닫기</button>
                    </div>
                    
                    <div style={{ fontSize: '18px', fontWeight: 950, color: '#1E293B', marginBottom: '15px' }}>
                      {filterStep === 1 ? '어디로 가시나요?' : '어떤 장르가 꽂히세요?'}
                    </div>

                    {filterStep === 1 ? (
                      <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '15px' }}>
                        {['서울', '경기/인천', '부산', '대구', '대전', '광주', '기타'].map(r => (
                          <button key={r} onClick={() => { setFilterRegion(r); setFilterStep(2); }} style={{ flexShrink: 0, padding: '14px 24px', borderRadius: '14px', background: filterRegion === r ? '#FF1744' : '#F8FAFC', color: filterRegion === r ? '#fff' : '#64748B', fontWeight: 700, border: 'none' }}>{r}</button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {['바차타', '살사', '쥬크', '키좀바'].map(g => (
                          <button key={g} onClick={() => { setFilterGenre(g); setShowFilteredResults(true); }} style={{ padding: '24px 15px', borderRadius: '18px', background: filterGenre === g ? '#1E293B' : '#F8FAFC', color: filterGenre === g ? '#fff' : '#64748B', fontWeight: 800, fontSize: '16px', border: 'none' }}>{g}</button>
                        ))}
                      </div>
                    )}

                    {showFilteredResults && (
                      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {displayParties.filter(p => {
                          const matchesRegion = filterRegion ? (p.broadRegion === filterRegion || p.address?.includes(filterRegion)) : true;
                          const matchesGenre = filterGenre ? p[GENRE_MAP[filterGenre]?.key] > 0 : true;
                          return p.date === selectedDate && matchesRegion && matchesGenre;
                        }).length === 0 ? (
                          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>해당 조건의 파티가 없습니다 😅</div>
                        ) : (
                          displayParties.filter(p => {
                            const matchesRegion = filterRegion ? (p.broadRegion === filterRegion || p.address?.includes(filterRegion)) : true;
                            const matchesGenre = filterGenre ? p[GENRE_MAP[filterGenre]?.key] > 0 : true;
                            return p.date === selectedDate && matchesRegion && matchesGenre;
                          }).map(item => (
                            <div key={item.id} onClick={() => setSelectedPoster(item.poster_url)} style={{ background: '#F8FAFC', borderRadius: '16px', padding: '12px', display: 'flex', gap: '15px', border: '1px solid #EDF2F7', cursor: 'pointer' }}>
                              <img src={item.poster_url} style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '10px' }} alt="Poster" />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#FF1744', fontWeight: 800 }}>{item.displayBroadRegion}</div>
                                <div style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B', marginTop: '2px' }}>{item.title}</div>
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{item.displayLocationName}</div>
                                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>{item.time}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    <button onClick={handleCloseModal} style={{ width: '100%', height: '54px', borderRadius: '16px', background: '#1E293B', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none' }}>{t('confirm_complete')}</button>
                  </motion.div>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
      


      <AnimatePresence>
        {showCouponPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000002,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: '#111',
                borderRadius: '20px',
                padding: '30px',
                width: '100%',
                maxWidth: '340px',
                textAlign: 'center',
                border: '1px solid #333'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>🎉</div>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>설치 완료!</h2>
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 20px 0' }}>오늘밤빠 앱을 설치해주셔서 감사해요!</p>
              
              <div style={{ height: '1px', background: '#333', margin: '20px 0' }} />
              
              <div style={{ marginBottom: '25px' }}>
                <p style={{ color: '#fff', fontSize: '14px', margin: '0 0 5px 0', fontWeight: 'bold' }}>🎁 신규 설치 혜택</p>
                <p style={{ color: '#F59E0B', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>₩2,000 할인 쿠폰을 드려요!</p>
              </div>
              
              <p style={{ color: '#888', fontSize: '12px', marginBottom: '15px' }}>카카오 오픈채팅에서 쿠폰을 받아가세요 👇</p>
              
              <button
                onClick={() => window.open('https://open.kakao.com/o/gP43rNri', '_blank')}
                style={{
                  background: '#FEE500',
                  color: '#000',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                💬 오픈채팅 입장하기
              </button>
              
              <button
                onClick={() => setShowCouponPopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#555',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                나중에
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNoticeGuide && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: '#111827', width: '100%', maxWidth: '340px', borderRadius: '32px', padding: '32px', border: '1px solid rgba(201,168,76,0.3)', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
              
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(201,168,76,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <Navigation size={32} color="#FFD700" />
                </div>
                <h3 style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>위치 서비스 안내 📡</h3>
                <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '8px', lineHeight: '1.5' }}>더 나은 밤빠 이용을 위해<br/>위치 권한이 왜 필요한지 안내해 드립니다.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flexShrink: 0, width: '40px', height: '40px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapIcon size={20} color="#3B82F6" />
                  </div>
                  <div>
                    <div style={{ color: '#F1F5F9', fontSize: '15px', fontWeight: 800 }}>내 주변 장소 찾기</div>
                    <p style={{ color: '#64748B', fontSize: '12px', marginTop: '4px', lineHeight: '1.4' }}>현재 위치에서 가장 가까운 파티 장소를 즉시 확인하고 최적의 경로를 안내받으세요.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flexShrink: 0, width: '40px', height: '40px', background: 'rgba(249,115,22,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart size={20} color="#F97316" />
                  </div>
                  <div>
                    <div style={{ color: '#F1F5F9', fontSize: '15px', fontWeight: 800 }}>실시간 현황 기여</div>
                    <p style={{ color: '#64748B', fontSize: '12px', marginTop: '4px', lineHeight: '1.4' }}>여러분의 참여가 실시간 중계 숫자를 완성합니다. 현장의 열기를 전국에 공유해 보세요.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flexShrink: 0, width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} color="#10B981" />
                  </div>
                  <div>
                    <div style={{ color: '#F1F5F9', fontSize: '15px', fontWeight: 800 }}>철저한 보안 관리</div>
                    <p style={{ color: '#64748B', fontSize: '12px', marginTop: '4px', lineHeight: '1.4' }}>위치 정보는 집계용으로만 일시 사용되며, 개인을 식별할 수 있는 정보는 절대 저장되지 않습니다.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowNoticeGuide(false);
                  localStorage.setItem('notice_guide_shown', 'true');
                  requestLocation();
                }}
                style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #C9A84C, #FFD700)', color: '#000', fontSize: '16px', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(201,168,76,0.3)' }}
              >
                확인했습니다
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </motion.div>

    </div>
    
    {/* [B] [포스터 확대 모달 - 컨테이너 외부 최상위 배치] */}
    <AnimatePresence>
      {selectedPoster && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 2000000 }}
        >
          <PosterModal 
            src={selectedPoster} 
            onClose={() => setSelectedPoster(null)} 
          />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

export default App;
