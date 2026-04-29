import { useState, useEffect, useMemo, useRef } from 'react'
import { Home as HomeIcon, Users, Plus, LogOut, Heart, X, MessageSquare, RefreshCw, CloudSun, Utensils, Zap, Languages, Bell, Star, Navigation, CreditCard, Settings, Map as MapIcon, BarChart, Gift, Coffee, User, Menu, Music2, GraduationCap, Tent, Flag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, logActivity } from './lib/supabase'
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

  // --- 브라우저 뒤로가기 버튼 제어 (History API) ---
  useEffect(() => {
    const handlePopState = (e) => {
      if (selectedPoster) {
        setSelectedPoster(null);
      } else if (isMenuOpen) {
        setIsMenuOpen(false);
      } else if (e.state && e.state.date) {
        setSelectedDate(e.state.date);
      } else if (view !== 'home') {
        setView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedPoster, isMenuOpen, view]);

  useEffect(() => {
    // 날짜 이동, 뷰 전환, 모달 오픈 시마다 히스토리 기록
    window.history.pushState({ view, date: selectedDate, modal: !!selectedPoster }, '');
  }, [selectedDate, view, selectedPoster, isMenuOpen]);

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

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh', position: 'relative' }}>
      <AnimatePresence>{showSplash && <motion.div exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><motion.img src="/logo.png" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} style={{ width: '200px' }} /></motion.div>}</AnimatePresence>
      <AnimatePresence>{isAnalyzing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000000, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(30px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '60px', height: '60px', border: '4px solid #FFEBEE', borderTop: '4px solid #E53935', borderRadius: '50%', marginBottom: '20px' }} /><h2 style={{ color: '#1E293B', fontSize: '20px', fontWeight: '900' }}>실시간 지능형 분석 중...</h2></motion.div>}</AnimatePresence>

      {/* 햄버거 버튼 */}
      {!isMenuOpen && (
        <motion.button 
          drag
          dragConstraints={{ left: -450, right: 0, top: 0, bottom: 800 }}
          dragMomentum={false}
          dragElastic={0.05}
          whileDrag={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMenuOpen(true)}
          style={{ 
            position: 'absolute', top: '20px', right: '20px', zIndex: 50,
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
                { icon: <CloudSun color="#E53935" />, text: "오늘 날씨", action: () => { setIsMenuOpen(false); setTimeout(() => setShowWeather(true), 300); } },
                { icon: <Bell color="#E53935" />, text: "공지사항", action: () => { alert('준비 중') } }
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
        {view === 'home' ? <HomePage {...sharedProps} /> : 
         view === 'class' ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#1E293B' }}>
             <span style={{ fontSize: '48px', marginBottom: '20px' }}>💃</span>
             <h2 style={{ fontSize: '24px', fontWeight: 900 }}>수업/정모</h2>
             <p style={{ color: '#64748B', marginTop: '8px' }}>준비 중입니다</p>
           </div>
         ) :
         view === 'bootcamp' ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#1E293B' }}>
             <span style={{ fontSize: '48px', marginBottom: '20px' }}>🏕️</span>
             <h2 style={{ fontSize: '24px', fontWeight: 900 }}>부트캠프</h2>
             <p style={{ color: '#64748B', marginTop: '8px' }}>준비 중입니다</p>
           </div>
         ) :
         view === 'festival' ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#1E293B' }}>
             <span style={{ fontSize: '48px', marginBottom: '20px' }}>🎪</span>
             <h2 style={{ fontSize: '24px', fontWeight: 900 }}>전국페스티벌</h2>
             <p style={{ color: '#64748B', marginTop: '8px' }}>준비 중입니다</p>
           </div>
         ) :
         {
           'register': <RegisterForm onBack={() => setView('home')} onSuccess={() => { fetchParties(); setView('home'); }} />,
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
      
      {selectedPoster && (
        <div 
          style={{ position:'fixed', inset:0, zIndex:100000, backgroundColor:'#000000', overflow: 'hidden' }} 
        >
          <QuickPinchZoom 
            onUpdate={({ x, y, scale }) => {
              const img = document.getElementById('modal-poster-img');
              if (img) img.style.transform = make3dTransformValue({ x, y, scale });
            }}
          >
            <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                id="modal-poster-img"
                src={selectedPoster} 
                style={{ width:'100%', height:'100%', objectFit:'contain', display: 'block' }} 
                alt="Poster" 
              />
            </div>
          </QuickPinchZoom>
          
          {/* 확실한 닫기 버튼 */}
          <button
            onClick={() => setSelectedPoster(null)}
            style={{ 
              position:'fixed', top:'30px', left:'25px', 
              background:'rgba(0,0,0,0.7)', border:'1.5px solid rgba(255,255,255,0.5)', 
              borderRadius:'50%', width:'52px', height:'52px', 
              color:'#fff', fontSize:'28px', cursor:'pointer', 
              display:'flex', alignItems:'center', justifyContent:'center', 
              zIndex: 100005,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <nav className="bottom-nav">
        <div 
          className={`nav-item ${view === 'home' ? 'active' : ''}`} 
          onClick={() => { setView('home'); window.scrollTo(0,0); }}
        >
          <Music2 size={22} color={view === 'home' ? '#E53935' : '#94A3B8'} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '10px', fontWeight: view === 'home' ? 900 : 500, color: view === 'home' ? '#E53935' : '#94A3B8' }}>소셜파티</span>
        </div>

        <div 
          className={`nav-item ${view === 'class' ? 'active' : ''}`} 
          onClick={() => { setView('class'); window.scrollTo(0,0); }}
        >
          <GraduationCap size={22} color={view === 'class' ? '#E53935' : '#94A3B8'} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '10px', fontWeight: view === 'class' ? 900 : 500, color: view === 'class' ? '#E53935' : '#94A3B8' }}>수업/정모</span>
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
              setView('register')
            }}
          >
            <Plus size={28} strokeWidth={3} />
          </motion.button>
          <span style={{ pointerEvents: 'auto', color: '#1E293B', fontSize: '10px' }}>등록</span>
        </div>

        <div 
          className={`nav-item ${view === 'bootcamp' ? 'active' : ''}`} 
          onClick={() => { setView('bootcamp'); window.scrollTo(0,0); }}
        >
          <Tent size={22} color={view === 'bootcamp' ? '#E53935' : '#94A3B8'} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '10px', fontWeight: view === 'bootcamp' ? 900 : 500, color: view === 'bootcamp' ? '#E53935' : '#94A3B8' }}>부트캠프</span>
        </div>

        <div 
          className={`nav-item ${view === 'festival' ? 'active' : ''}`} 
          onClick={() => { setView('festival'); window.scrollTo(0,0); }}
        >
          <Flag size={22} color={view === 'festival' ? '#E53935' : '#94A3B8'} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '10px', fontWeight: view === 'festival' ? 900 : 500, color: view === 'festival' ? '#E53935' : '#94A3B8' }}>전국페스티벌</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
