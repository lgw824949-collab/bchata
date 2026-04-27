import { useState, useEffect, useMemo, useRef } from 'react'
import { Home as HomeIcon, Users, Plus, LogOut, Heart, X, MessageSquare, RefreshCw, CloudSun, Utensils, Zap, Languages, Bell, Star, Navigation, CreditCard, Settings, Map as MapIcon, BarChart, Gift, Coffee, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, logActivity } from './lib/supabase'
import RegisterForm from './RegisterForm'
import AdminDashboard from './AdminDashboard'
import HomePage from './pages/Home'
import ClassNewsPage from './pages/ClassNews'
import PostClub from './pages/PostClub'
import Auth from './components/Auth'
import SajuModal from './components/SajuModal'
import IncheonRoute from './components/IncheonRoute'
import { BAR_DATABASE } from './lib/BarLib';
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
  'elmar': { lat: 37.4872, lon: 126.7217, name: '엘마르', region: '인천' }, 'lbt': { lat: 37.4449, lon: 126.7052, name: 'LBT', region: '인천' }, 'rassin': { lat: 37.4612, lon: 126.6782, name: '라씬 카우보이', region: '인천' },
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
  { t: "💃 인천 성지", q: "인천 최고의 성지는?", a: "당신이 계신 곳이 곧 성지입니다!" }
];

const DynamicAnalysisModal = ({ isOpen, onClose, userCoords, isSajuCall }) => {
  const [targetDest, setTargetDest] = useState(null);
  const [tracker, setTracker] = useState({ distance: '0.0', duration: '0' });
  const [amguho, setAmguho] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const findTarget = async (lat, lon) => {
      const kakaoApiKey = import.meta.env.VITE_KAKAO_API_KEY;
      const incheonBars = BAR_DATABASE.filter(b => b.region === '인천광역시' || b.address?.includes('인천'));
      
      try {
        const barsWithCoords = await Promise.all(incheonBars.map(async (bar) => {
          const res = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(bar.address)}`, {
            headers: { Authorization: `KakaoAK ${kakaoApiKey}` }
          });
          const data = await res.json();
          if (data.documents?.length > 0) {
            return { ...bar, lat: parseFloat(data.documents[0].y), lon: parseFloat(data.documents[0].x) };
          }
          return null;
        }));

        const targets = barsWithCoords.filter(b => b !== null);
        let nearest = null; let minDist = Infinity;
        
        targets.forEach(venue => {
          const dist = calculateDistance(lat, lon, venue.lat, venue.lon);
          if (dist < minDist) { minDist = dist; nearest = { ...venue, region: '인천' }; }
        });

        if (nearest) {
          setTargetDest(nearest);
          const d = calculateDistance(lat, lon, nearest.lat, nearest.lon);
          setTracker({ distance: d.toFixed(1), duration: Math.ceil(d * 7) + 2 });
        } else {
          // 폴백: VENUE_COORDS 내에서 찾기
          let fallbackNearest = null; let fallbackMinDist = Infinity;
          Object.values(VENUE_COORDS).forEach(venue => {
            const dist = calculateDistance(lat, lon, venue.lat, venue.lon);
            if (dist < fallbackMinDist) { fallbackMinDist = dist; fallbackNearest = venue; }
          });
          setTargetDest(fallbackNearest);
          if (fallbackNearest) {
            const d = calculateDistance(lat, lon, fallbackNearest.lat, fallbackNearest.lon);
            setTracker({ distance: d.toFixed(1), duration: Math.ceil(d * 7) + 2 });
          }
        }
      } catch (err) {
        console.error("Kakao API Error:", err);
      }
    };
    if (userCoords) findTarget(userCoords.lat, userCoords.lon);
    else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => findTarget(pos.coords.latitude, pos.coords.longitude),
        err => {
          console.error("GPS Current Position Error:", err);
          // 에러 발생 시 엘마르(인천 성지)를 기본값으로 사용
          findTarget(37.4872, 126.7217);
          if (err.code === err.PERMISSION_DENIED) {
            alert("위치 권한이 거부되었습니다. 성지(엘마르) 기준으로 탐색합니다.");
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [isOpen, userCoords]);

  if (!isOpen || !targetDest) return null;
  const isIncheon = targetDest.region === '인천' && isSajuCall;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000000, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', background: isIncheon ? '#0f172a' : '#fff', borderRadius: '35px', padding: '40px 30px', boxShadow: '0 50px 100px rgba(0,0,0,0.7)', color: isIncheon ? '#fff' : '#000' }}>
        {!amguho ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}><div style={{ background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: '50px', fontSize: '11px', fontWeight: '900' }}>REALTIME GPS</div><X size={24} onClick={onClose} style={{ cursor: 'pointer' }} /></div>
            <h2 style={{ fontSize: '26px', fontWeight: '1000', marginBottom: '30px' }}>{isIncheon ? '성지 상륙 분석' : '최단 경로 최적화'} 🛰️<br/><span style={{ color: '#3b82f6' }}>{targetDest.name}</span></h2>
            <div style={{ padding: '30px', background: 'rgba(128,128,128,0.1)', borderRadius: '30px', display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={{ flex: 1 }}><p style={{ opacity: 0.5, fontSize: '12px' }}>실제 거리</p><p style={{ fontSize: '26px', fontWeight: '1000', color: '#3b82f6' }}>{tracker.distance}km</p></div>
              <div style={{ flex: 1 }}><p style={{ opacity: 0.5, fontSize: '12px' }}>예상 소요</p><p style={{ fontSize: '26px', fontWeight: '1000' }}>{tracker.duration}분</p></div>
            </div>
            <button onClick={() => isIncheon ? setAmguho(naturalIncheonDB[0]) : onClose()} style={{ width: '100%', padding: '22px', borderRadius: '25px', background: '#111', color: '#fff', border: 'none', fontSize: '18px', fontWeight: '1000' }}>{isIncheon ? '암구호 수신하기' : '확인 완료'}</button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: '22px', fontWeight: '1000', marginBottom: '30px' }}>성지 암구호</h3><div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '30px', borderRadius: '30px', border: '2px solid #3b82f6', marginBottom: '30px' }}><p style={{ color: '#60a5fa' }}>Q: {amguho.q}</p><p style={{ fontSize: '20px', fontWeight: '1000', marginTop: '10px' }}>A: {amguho.a}</p></div><button onClick={onClose} style={{ width: '100%', padding: '20px', borderRadius: '20px', background: '#fff', color: '#0f172a', fontWeight: '1000' }}>작전 시작</button></div>
        )}
      </motion.div>
    </motion.div>
  );
};

const IncheonPremiumBanner = ({ onClick }) => (
  <div style={{ padding: '0 16px', margin: '15px 0' }}>
    <div onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(25px)', borderRadius: '24px', padding: '16px 20px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 15px 40px rgba(0,0,0,0.4)', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ background: '#3b82f6', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '50px', marginBottom: '8px', display: 'inline-block' }}>NATIONWIDE LIVE</div>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0' }}>지능형 경로 최적화 서비스 🛰️</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', margin: 0 }}>현재 위치 기반 최단 거리 성지 탐색 중 →</p>
        </div>
        <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '18px', color: '#60a5fa' }}><Navigation size={20} /></div>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showIncheonModal, setShowIncheonModal] = useState(false);
  const [isSajuCall, setIsSajuCall] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [showIncheon, setShowIncheon] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showSaju, setShowSaju] = useState(false);
  const [showLatinModal, setShowLatinModal] = useState(false);

  useEffect(() => { setTimeout(() => setShowSplash(false), 2000); }, []);

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
    setIsMenuOpen, IncheonBanner: () => <IncheonPremiumBanner onClick={() => openAnalysis(false)} />, venueCounts: {}, resetToToday: () => { setView('home'); setSelectedDate(todayData.dateStr); }, formatItemDate: (d, t) => `${d} ${t}`, formatFee: (f) => f, handleRegister: () => setView('register'), logActivity: () => {}, regionalTheme: { welcomeMsg: "전국 댄서들을 위한 실시간 정보", specialBanner: true }
  };



  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh' }}>
      <AnimatePresence>{showSplash && <motion.div exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><motion.img src="/logo.png" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} style={{ width: '200px' }} /></motion.div>}</AnimatePresence>
      <AnimatePresence>{isAnalyzing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(30px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '60px', height: '60px', border: '4px solid rgba(59,130,246,0.2)', borderTop: '4px solid #3b82f6', borderRadius: '50%', marginBottom: '20px' }} /><h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '900' }}>실시간 지능형 분석 중...</h2></motion.div>}</AnimatePresence>

      <main>
        {view === 'home' || view === 'likes' ? <HomePage {...sharedProps} /> : 
         view === 'social' ? <ClassNewsPage {...sharedProps} /> : 
         view === 'register' ? <RegisterForm onBack={() => setView('home')} onSuccess={() => { fetchParties(); setView('home'); }} /> : 
         view === 'post-lesson' ? <PostClub onBack={() => setView('social')} /> :
         <AdminDashboard onBack={() => setView('home')} />}
      </main>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2147483646, backdropFilter: 'blur(5px)' }} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} style={{ position: 'fixed', top: 0, left: 0, width: '300px', height: '100vh', background: '#fff', zIndex: 2147483647, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '30px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><img src="/logo.png" style={{ height: '28px' }} /><X size={24} onClick={() => setIsMenuOpen(false)} style={{ cursor: 'pointer' }} /></div>
              
              <div style={{ flex: 1, padding: '25px 20px' }}>
                <p style={{ fontSize: '12px', color: '#999', fontWeight: '800', marginBottom: '20px', letterSpacing: '1px' }}>PREMIUM SERVICES</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: '📍 인천 경로 안내', action: () => setShowIncheon(true) },
                    { label: '🌤️ 전국 날씨 지도', action: () => setShowWeather(true) },
                    { label: '🔮 댄스 사주', action: () => setShowSaju(true) },
                    { label: '🇬🇧 라틴 영어', action: () => setShowLatinModal(true) },
                    { label: '📝 소셜/파티 등록하기', action: () => { setView('register') } },
                    { label: '📚 수업/정모 등록하기', action: () => { setView('post-lesson') } },
                    { label: '⚡ 부트캠프/워크샵', action: () => alert('준비 중') },
                    { label: '🔔 공지사항', action: () => alert('준비 중') },
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsMenuOpen(false);
                        item.action();
                      }}
                      style={{ 
                        padding: '18px 20px', 
                        background: '#f8fafc', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        border: '1px solid #f1f5f9'
                      }}
                    >
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#334155' }}>{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '20px', background: '#f9fafb', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ width: '100%', height: '120px', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                  <img src="https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=400" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Promo" />
                </div>
                <div style={{ padding: '15px 0', fontSize: '10px', color: '#bbb', textAlign: 'center' }}>
                  <p>© 2026 BAMPPA Intelligence Center. All rights reserved.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DynamicAnalysisModal isOpen={showIncheonModal} onClose={() => setShowIncheonModal(false)} userCoords={userCoords} isSajuCall={isSajuCall} />
      <AnimatePresence>
        {showIncheon && <IncheonRoute parties={parties} onClose={() => setShowIncheon(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSaju && <SajuModal parties={parties} onClose={() => setShowSaju(false)} />}
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
          <HomeIcon size={24} color={view === 'home' ? '#111827' : '#9CA3AF'} strokeWidth={view === 'home' ? 3 : 2} />
          <span>소셜/파티</span>
        </div>

        <div 
          className={`nav-item ${view === 'likes' ? 'active' : ''}`} 
          onClick={() => { setView('likes'); window.scrollTo(0,0); }}
        >
          <Heart size={24} color={view === 'likes' ? '#FF4B4B' : '#9CA3AF'} strokeWidth={view === 'likes' ? 3 : 2} fill={view === 'likes' ? '#FF4B4B' : 'none'} />
          <span>찜</span>
        </div>



        <div 
          className={`nav-item ${view === 'social' ? 'active' : ''}`} 
          onClick={() => { setView('social'); window.scrollTo(0,0); }}
        >
          <Users size={24} color={view === 'social' ? '#FF8C00' : '#9CA3AF'} strokeWidth={view === 'social' ? 3 : 2} />
          <span>수업/정보</span>
        </div>

        <div 
          className={`nav-item`} 
          onClick={() => { window.open('https://open.kakao.com/o/gP43rNri', '_blank'); }}
        >
          <MessageSquare size={24} color="#9CA3AF" strokeWidth={2} />
          <span>실시간톡</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
