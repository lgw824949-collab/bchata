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
import WeatherModal from './components/WeatherModal'
import { BAR_DATABASE } from './lib/BarLib';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';




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


  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayData.dateStr);
  const [view, setView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showIncheonModal, setShowIncheonModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [showIncheon, setShowIncheon] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showSaju, setShowSaju] = useState(false);
  const [showLatinModal, setShowLatinModal] = useState(false);

  const weatherOpenTime = useRef(0);
  const latinOpenTime = useRef(0);
  const sajuOpenTime = useRef(0);



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


  const sharedProps = {
    parties, lessons: [], loading, selectedMonth: todayData.month, setSelectedMonth: () => {}, selectedWeek: 1, setSelectedWeek: () => {}, 
    selectedDate, setSelectedDate, selectedRegion: '서울', setSelectedRegion: () => {}, 
    view, setView, setSelectedPoster, 
    fourteenDays: Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return { fullDate: formatDateToKSTString(d), date: String(d.getDate()), month: String(d.getMonth() + 1), dayName: DAYS_KOR[d.getDay()], isToday: i === 0, dayOfWeek: d.getDay() };
    }), weekData: [], allDatesInMonth: [], filteredParties: parties.filter(p => p.date === selectedDate),
    showFullCalendar: false, setShowFullCalendar: () => {}, likedIds: [], toggleLike: () => {},
    setIsMenuOpen, IncheonBanner: null, venueCounts: {}, resetToToday: () => { setView('home'); setSelectedDate(todayData.dateStr); }, formatItemDate: (d, t) => `${d} ${t}`, formatFee: (f) => f, handleRegister: () => setView('register'), logActivity: () => {}, regionalTheme: { welcomeMsg: "전국 댄서들을 위한 실시간 정보", specialBanner: false }
  };



  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh' }}>

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
                    { label: '🌤️ 전국 날씨 지도', action: () => { 
                      weatherOpenTime.current = Date.now();
                      setView('home')
                      setShowWeather(true)
                      setIsMenuOpen(false)
                    } },
                    { label: '🔮 댄스 사주', action: () => {
                      sajuOpenTime.current = Date.now();
                      setShowSaju(true)
                    } },
                    { label: '🇬🇧 라틴 영어', action: () => {
                      latinOpenTime.current = Date.now();
                      setShowLatinModal(true)
                    } },
                    { label: '📝 소셜/파티 등록하기', action: () => { setView('register') } },
                    { label: '📚 수업/정모 등록하기', action: () => { setView('post-lesson') } },
                    { label: '⚡ 부트캠프/워크샵', action: () => alert('준비 중') },
                    { label: '🔔 공지사항', action: () => alert('준비 중') },
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.action) item.action();
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

      <AnimatePresence>
        {showSaju && <SajuModal parties={parties} onClose={() => {
          if (Date.now() - sajuOpenTime.current > 500) setShowSaju(false);
        }} />}
      </AnimatePresence>

      <AnimatePresence>
        {showWeather && (
          <WeatherModal onClose={() => {
            if (Date.now() - weatherOpenTime.current > 500) setShowWeather(false);
          }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLatinModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => {
            if (Date.now() - latinOpenTime.current > 500) setShowLatinModal(false);
          }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <h2>라틴 영어 모달 렌더링 확인</h2>
              <button onClick={() => {
                if (Date.now() - latinOpenTime.current > 500) setShowLatinModal(false);
              }} style={{ marginTop: '15px', padding: '10px 20px', border: 'none', background: '#3b82f6', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>닫기</button>
            </div>
          </div>
        )}
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
            onClick={() => setSelectedPoster(null)}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              background: 'rgba(255,255,255,0.95)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              fontSize: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              zIndex: 100001
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
