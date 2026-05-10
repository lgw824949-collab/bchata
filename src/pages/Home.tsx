import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, MapPin, Calendar, Clock, User, Music, ChevronRight, ShieldCheck, X, Home as HomeIcon, ChevronLeft, CloudSun, Utensils, Zap, PlusCircle, Languages, Bell, Globe, Navigation, CalendarDays, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import LiveCount from '../components/LiveCount'
import { KMA_REGION_COORDS, fetchWeatherForecast, parseKmaWeather, HOME_REGION_MAP } from '../utils/kmaApi'

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];
const DAYS_EN  = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const GENRE_MAP = {
  '바차타': { key: 'b_ratio', label: 'B', label_en: 'Bachata', color: '#FF1744' },
  '살사':   { key: 's_ratio', label: 'S', label_en: 'Salsa', color: '#FF1744' },
  '쥬크':   { key: 'j_ratio', label: 'J', label_en: 'Zouk', color: '#FF1744' },
  '키좀바': { key: 'k_ratio', label: 'K', label_en: 'Kizomba', color: '#FF1744' },
};

const REGION_FILTER = {
  '서울': (p) => p.broadRegion === '서울',
  '경기/인천': (p) => p.broadRegion === '경기/인천',
  '경상도': (p) => p.broadRegion === '경상도',
  '전라도': (p) => p.broadRegion === '전라도',
  '충청도': (p) => p.broadRegion === '충청도',
  '강원/제주': (p) => p.broadRegion === '강원/제주',
  // 별칭/도시별 매핑 (필터링 충돌 방지)
  '인천': (p) => p.broadRegion === '경기/인천',
  '부산': (p) => p.broadRegion === '경상도',
  '대구': (p) => p.broadRegion === '경상도',
  '대전': (p) => p.broadRegion === '충청도',
  '광주': (p) => p.broadRegion === '전라도',
  '기타': (p) => true
};
const MAIN_REGIONS = ['서울', '경기/인천', '경상', '전라', '충청', '강원/제주'];
const REGION_MAP_EN = {
  '서울': 'Seoul', '경기/인천': 'Gyeonggi/Incheon', '경상도': 'Gyeongsang', 
  '전라도': 'Jeolla', '충청도': 'Chungcheong', '강원/제주': 'Gangwon/Jeju'
};

const TITLE_TRANSLATION = {
  '주말 모드 원': 'Weekend Mode One',
  '바차타 파인 다이닝': 'Bachata Fine Dining',
  '오늘밤빠': 'TonightBAMPPA',
  '맛집': 'Hot Spot',
  '성지': 'Holy Ground',
  '정모': 'Meetup',
  '라틴': 'Latin',
  '클럽': 'Club',
  '살사': 'Salsa',
  '바차타': 'Bachata',
  '쥬크': 'Zouk',
  '키좀바': 'Kizomba',
  '수업': 'Class',
  '번개': 'Flash Mob',
  '파티': 'Party',
  '전국': 'National',
  '서울': 'Seoul',
  '홍대': 'Hongdae',
  '강남': 'Gangnam',
  '부산': 'Busan',
  '제주': 'Jeju',
  '인천': 'Incheon',
  '경기': 'Gyeonggi'
};

const translateDynamicText = (text, isEn) => {
  if (!text || !isEn) return text;
  let translated = text;
  // Sort by length descending to avoid partial matches (e.g., '바차타' vs '바차타 파인 다이닝')
  const sortedKeys = Object.keys(TITLE_TRANSLATION).sort((a, b) => b.length - a.length);
  sortedKeys.forEach(ko => {
    const en = TITLE_TRANSLATION[ko];
    const regex = new RegExp(ko, 'g');
    translated = translated.replace(regex, en);
  });
  return translated;
};

const PosterImage = ({ src, onClick, alt = "파티 포스터" }) => {
  const imgRef = useRef();
  const onUpdate = ({ x, y, scale }) => { if (imgRef.current) imgRef.current.style.transform = make3dTransformValue({ x, y, scale }); };
  return (
    <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', borderRadius: '12px', background: '#000', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <QuickPinchZoom onUpdate={onUpdate} wheelScaleFactor={500} tapZoomFactor={2}>
        <img ref={imgRef} src={src} alt={alt} onClick={onClick} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', willChange: 'transform' }} />
      </QuickPinchZoom>
    </div>
  );
};

const PartyCard = ({ item, onSelect }) => {
  const isTimeLive = (() => {
    const now = new Date();
    const pDate = new Date(item.date);
    
    // 1. 시작 시간 추출
    const startStr = (item.time?.split('-')[0] || '20:00').trim();
    const [sH, sM] = startStr.split(':').length === 2 ? startStr.split(':').map(Number) : [20, 0];
    const startDate = new Date(pDate);
    startDate.setHours(sH, sM, 0, 0);

    // 2. 마감 시간 추출 및 설정
    const endStr = item.time?.includes('-') ? item.time.split('-')[1].trim() : null;
    let endDate = new Date(startDate);

    if (endStr && endStr.includes(':')) {
      const [eH, eM] = endStr.split(':').map(Number);
      endDate.setHours(eH, eM + 30, 0, 0);
      // 만약 마감 시간이 다음 날 새벽이라면 날짜 보정
      if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
    } else {
      // 마감 시간 없으면 시작 + 4시간 + 30분
      endDate.setHours(startDate.getHours() + 4, startDate.getMinutes() + 30, 0, 0);
    }

    // 3. 시작 30분 전부터 체크
    const startWithBuffer = new Date(startDate.getTime() - 30 * 60 * 1000);
    return now >= startWithBuffer && now <= endDate;
  })();

  const cleanTitle = item.title?.split(' ㅣ ')[0] || '';
  const displayTime = item.time?.split('-')[0].trim() || '21:00';
  const displayFee = formatPrice(item.fee);

  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const openMap = (e) => {
    e.stopPropagation();
    const address = item.address || item.locationName;
    const query = encodeURIComponent(address);
    const url = isEn 
      ? `https://www.google.com/maps/search/?api=1&query=${query}`
      : `https://map.kakao.com/link/search/${query}`;
    window.open(url, '_blank');
  };


  return (
    <div
      onClick={() => onSelect(item.poster_url)}
      style={{ display:'flex', flexDirection:'row', alignItems:'stretch', backgroundColor:'var(--color-card)', borderRadius:'16px', overflow:'hidden', border:'1px solid var(--color-border)', cursor:'pointer', height:'150px', marginBottom:'12px', transition:'all 0.3s' }}
    >
      <div style={{ width:'120px', flexShrink:0 }}>
        <img src={item.poster_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="Poster" />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', minWidth:0, padding:'16px 20px' }}>

        <div style={{ display:'flex', alignItems:'center' }}>
          <span style={{ fontSize:'12px', fontWeight:'700', color:'#E53935', background:'#fff0f0', padding:'3px 10px', borderRadius:'8px', border:'1px solid #ffc9c9', flexShrink:0 }}>
            {(() => {
              const entries = Object.entries(GENRE_MAP).filter(([_, info]) => item[info.key] > 0)
              if (entries.length === 0) return '소셜'
              const sorted = [...entries].sort((a, b) => item[b[1].key] - item[a[1].key])
              if (sorted.length >= 2 && item[sorted[0][1].key] === item[sorted[1][1].key]) return `${sorted[0][0]} · ${sorted[1][0]}`
              return sorted[0][0]
            })()}
          </span>
          {isTimeLive && (
            <span style={{ marginLeft: '8px', background:'#E53935', color:'#fff', fontSize:'10px', fontWeight:'900', padding:'2px 6px', borderRadius:'4px', letterSpacing:'0.5px', animation:'blink 1.5s infinite', flexShrink:0 }}>LIVE</span>
          )}
        </div>

        <div style={{ fontSize:'17px', fontWeight:'900', color:'var(--color-text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.6px', lineHeight:1.3, height: '44px', marginTop: '4px' }}>
          {translateDynamicText(cleanTitle(item.title).replace(/^\[.*?\]\s*/, '').replace(/ㅣ\s*$/, '').trim(), isEn)}
        </div>

        <div style={{ display:'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'15px', color:'var(--color-text-sub)', fontWeight: 800 }}>
            <Clock size={15} />
            {displayTime}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap: 'wrap' }}>
            <span
              onClick={(e) => { e.stopPropagation(); const addr = item.address || item.locationName; const query = encodeURIComponent(addr); window.open(isEn ? `https://www.google.com/maps/search/?api=1&query=${query}` : `https://map.kakao.com/link/search/${query}`, '_blank') }}
              style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'14px', color:'var(--color-text-sub)', cursor:'pointer', fontWeight: 700 }}
            >
              <Navigation size={14} color="#E53935" fill="#E53935" style={{ flexShrink:0 }} />
              {translateDynamicText(item.locationName || item.studio_name || '장소 미지정', isEn)}
            </span>
            <span style={{ color: 'var(--color-text-sub)', opacity: 0.3 }}>•</span>
            <span style={{ fontSize:'14px', fontWeight:'900', color:'#E53935' }}>
              {displayFee}
            </span>
          </div>
        </div>

      </div>
    </div>
  );



};

const ClassCard = ({ item, onSelect }) => {
  const levelColors = {
    '입문': '#2ECC71',
    '초급': '#3B82F6',
    '중급': '#F59E0B',
    '상급': '#EF4444',
    '고급': '#EF4444'
  };
  const badgeColor = levelColors[item.level] || '#64748B';
  const weekText = item.week_type?.includes('주차') 
    ? item.week_type.replace('주차', '주 과정') 
    : (item.week_type || '상시 운영');

  return (
    <div 
      onClick={() => onSelect(item.poster_url)}
      style={{ 
        width: '160px',
        minWidth: '160px',
        flexShrink: 0,
        background: 'var(--color-card)', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        scrollSnapAlign: 'start',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.3s'
      }}
    >
      {/* 포스터 영역 (160x200) */}
      <div style={{ width: '160px', height: '200px', background: '#1a1a2e', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {item.poster_url ? (
          <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="Poster" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-sub)', fontSize: '12px', fontWeight: 800 }}>
            No Poster
          </div>
        )}
        
        {/* 레벨 배지 */}
        <div style={{ 
          position: 'absolute', top: '8px', left: '8px',
          background: badgeColor, color: '#fff', 
          fontSize: '10px', fontWeight: '800', 
          padding: '2px 7px', borderRadius: '4px',
          zIndex: 10
        }}>
          {item.level || '입문'}
        </div>
      </div>

      {/* 정보 영역 */}
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#FF3B30' }}>{item.genre}</span>
          <Navigation size={11} color="#FF3B30" fill="#FF3B30" />
        </div>
        
        <h3 style={{ 
          fontSize: '13px', fontWeight: '900', color: 'var(--color-text-main)', 
          margin: '0 0 6px', height: '36px', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', lineHeight: '1.4'
        }}>{item.title}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ 
            fontSize: '11px', color: 'var(--color-text-sub)', fontWeight: '700',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
          }}>
            {item.studio_name}
          </div>
          
          <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', fontWeight: '700' }}>
            {item.day_of_week} · {item.start_time?.slice(0,5)}
          </div>
          
          <div style={{ color: '#2ECC71', fontWeight: '800', fontSize: '11px', marginTop: '2px' }}>
            {(() => {
              const d = new Date(item.start_date);
              return `${d.getMonth() + 1}/${d.getDate()} · ${weekText}`;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

const BootcampCard = ({ item, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(item.poster_url)}
      style={{ 
        display: 'flex', 
        backgroundColor: '#FFFFFF', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        border: '1px solid #F1F5F9', 
        cursor: 'pointer', 
        height: '110px', 
        marginBottom: '12px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ width: '80px', height: '100%', flexShrink: 0 }}>
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Bootcamp" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 15px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#7C3AED' }}>BOOTCAMP · {item.genre}</span>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8' }}>{item.level}</span>
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#1E293B', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.instructor}</h3>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B' }}>
          📍 {item.venue || item.region} | 💰 {item.fee}
        </div>
      </div>
    </div>
  );
};

const FestivalCard = ({ item, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(item.poster_url)}
      style={{ 
        display: 'flex', 
        backgroundColor: '#FFFFFF', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        border: '1px solid #F1F5F9', 
        cursor: 'pointer', 
        height: '110px', 
        marginBottom: '12px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ width: '80px', height: '100%', flexShrink: 0 }}>
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Festival" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 15px', minWidth: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#F97316', marginBottom: '2px' }}>FESTIVAL · {item.genre}</div>
        <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#1E293B', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B' }}>
          📍 {item.location} | 💰 ₩{item.price?.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

const RollingContainer = ({ items, onSelect }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => { if (items.length <= 1) return; const timer = setInterval(() => { setIndex((prev) => (prev + 1) % items.length); }, 3000); return () => clearInterval(timer); }, [items.length]);
  return (
    <div style={{ position: 'relative', height: '110px', width: '100%', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.div key={items[index].id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} style={{ position: 'absolute', width: '100%' }}>
          <PartyCard item={items[index]} onSelect={onSelect} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const FilterBar = ({ filterRegion, setFilterRegion, filterGenre, setFilterGenre }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const regions = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];
  const genres = Object.keys(GENRE_MAP);
  return (
    <div style={{ padding: '0 15px 12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#94A3B8' }}><MapPin size={16} /></div>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="filter-scroll">
          {regions.map(r => (
            <button key={r} 
              onClick={() => {
                const newVal = filterRegion === r ? '' : r;
                console.log('지역 선택:', newVal);
                setFilterRegion(newVal);
              }} 
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', background: filterRegion === r ? '#FF1744' : 'var(--color-border)', color: filterRegion === r ? '#fff' : 'var(--color-text-sub)', transition: 'all 0.2s' }}
            >
              {isEn ? REGION_MAP_EN[r] : r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#94A3B8' }}><Music size={16} /></div>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="filter-scroll">
          {genres.map(g => (
            <button key={g} 
              onClick={() => {
                const newVal = filterGenre === g ? '' : g;
                console.log('장르 선택:', newVal);
                setFilterGenre(newVal);
              }} 
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', background: filterGenre === g ? '#FF1744' : '#F1F5F9', color: filterGenre === g ? '#fff' : '#64748B', transition: 'all 0.2s' }}
            >
              {isEn ? GENRE_MAP[g].label_en : g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ 
  parties, bootcamps, festivals, lessons, loading, selectedMonth, setSelectedMonth, selectedWeek, setSelectedWeek, 
  selectedDate, setSelectedDate, selectedRegion, setSelectedRegion, isExpanded, setIsExpanded,
  view, setView, setSelectedPoster, fetchParties, formatItemDate, formatFee, filteredParties, weekData,
  resetToToday, showFullCalendar, setShowFullCalendar, likedIds, toggleLike, logActivity, handleRegister, fourteenDays,
  showFilterPanel, setShowFilterPanel, filterRegion, setFilterRegion, filterGenre, setFilterGenre,
  showFilteredResults, setShowFilteredResults, isMenuOpen, setIsMenuOpen, showWeather, setShowWeather,
  showLatinModal, setShowLatinModal, setShowSaju, latinCat, setLatinCat, selPatternId, setSelPatternId, regionalTheme, recordTraffic, IncheonBanner, venueCounts, openAnalysis,
  showGridModal, setShowGridModal, gridRegion, setGridRegion, filterStep, setFilterStep,
  handleOpenModal, handleCloseModal
}) => {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const isEn = i18n.language.startsWith('en');

  // [타이틀 정제 로직]
  const cleanTitle = (title: string) => {
    if (!title) return '';
    return title
      .replace(/\[서울\]/g, '')
      .replace(/\[경기\/인천\]/g, '')
      .replace(/\[경상도\]/g, '')
      .replace(/\[전라도\]/g, '')
      .replace(/\[충청도\]/g, '')
      .replace(/\[강원\/제주\]/g, '')
      .replace(/오늘밤빠/g, '')
      .replace(/\|/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // [가격 정제 로직]
  const formatPrice = (priceStr: string) => {
    if (!priceStr) return '2만';
    if (priceStr.includes('무료') || priceStr === '0') return '무료';
    const num = parseInt(String(priceStr).replace(/[^0-9]/g, ''));
    if (isNaN(num)) return String(priceStr).replace('원', '');
    if (num === 0) return '무료';
    if (num < 1000) return `${num}`; // 1000원 미만은 숫자만 (거의 없음)
    const manValue = num / 10000;
    if (num % 10000 === 0) return `${manValue}만`;
    return `${manValue.toFixed(1).replace('.0', '')}만`;
  };

  const [isPaused, setIsPaused] = useState(false);

  const [classGenre, setClassGenre] = useState('전체');
  const [classLevel, setClassLevel] = useState('전체');
  const [weatherMap, setWeatherMap] = useState({});
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const isAfter9AM = useMemo(() => {
    const now = new Date();
    return now.getHours() >= 9;
  }, []);
  const scrollRef = useRef(null);
  const regionListRef = useRef(null);
  const [shuffleOffset, setShuffleOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShuffleOffset(prev => prev + 1);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadRegionalWeather = async () => {
      const weatherResults = {};
      await Promise.all(Object.entries(HOME_REGION_MAP).map(async ([homeName, kmaName]) => {
        const coords = KMA_REGION_COORDS[kmaName];
        if (coords) {
          const data = await fetchWeatherForecast(coords.nx, coords.ny);
          if (data) {
            const parsed = parseKmaWeather(data.sky, data.pty);
            weatherResults[homeName] = { icon: parsed.icon, temp: data.t1h };
          }
        }
      }));
      setWeatherMap(weatherResults);
    };
    loadRegionalWeather();
  }, []);

  const carouselParties = useMemo(() => {
    const all = parties || [];
    return [...all].filter(p => p.poster_url).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [parties]);


  const allDatesInMonth = useMemo(() => {
    const year = 2026;
    const month = selectedMonth;
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push({ date: '', fullDate: '', dayName: '', isCurrentMonth: false });
    for (let d = 1; d <= lastDate; d++) {
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, d);
      const dayNames = ['일','월','화','수','목','금','토'];
      days.push({ date: d, fullDate, dayName: dayNames[dateObj.getDay()], isCurrentMonth: true });
    }
    return days;
  }, [selectedMonth]);

  useEffect(() => {
    const setVh = () => { document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`); };
    window.addEventListener('resize', setVh);
    setVh();
    return () => window.removeEventListener('resize', setVh);
  }, []);

  return (
    <div className="app-container" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: '80px', transition: 'background-color 0.3s' }}>
      
      {/* 📌 [영역 A: 브랜드 헤더 - 최종 확정] */}
      <div style={{ padding: '40px 24px 24px' }}>
        <p style={{ fontSize: '11px', color: '#E53935', letterSpacing: '0.3em', fontWeight: 300, margin: '0 0 16px' }}>SOCIAL CULTURE EXPERIENCE</p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', margin: '0 0 8px', fontWeight: 300, letterSpacing: '0.05em' }}>
          {lang === 'ko' ? '오늘 밤, 어디선가 파티가 시작되고 있어요' : 'Tonight, a party is starting somewhere'}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-text-main)', margin: 0, letterSpacing: '-1.5px', lineHeight: 1.3 }}>
              {lang === 'ko' ? '전국 어디서든' : 'Anywhere in Korea'}
            </p>
            <p style={{ fontSize: '32px', fontWeight: 900, color: '#E53935', margin: '0 0 12px', letterSpacing: '-1.5px', lineHeight: 1.3 }}>
              {lang === 'ko' ? '만원이면 충분해요' : '10,000 won is enough'}
            </p>
            <div style={{ borderLeft: '3px solid #E53935', paddingLeft: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', margin: 0, fontWeight: 300, lineHeight: 1.8 }}>
                {lang === 'ko' ? '바차타 · 살사 · 소셜' : 'Bachata · Salsa · Social'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', margin: 0, fontWeight: 300, lineHeight: 1.8 }}>
                {lang === 'ko' ? '도심 속 전율의 밤' : 'A thrilling night in the city'}
              </p>
            </div>
          </div>
          <img
            src="/logo.png"
            alt="오늘밤빠 로고"
            style={{ width: '90px', height: '90px', objectFit: 'contain', borderRadius: '16px', flexShrink: 0, marginLeft: '12px' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      </div>

      <div style={{ padding: '12px 10px 8px' }}>
        <div style={{ height: '36px', background: '#0f172a', borderRadius: '18px', display: 'flex', alignItems: 'center', overflow: 'hidden', padding: '0 8px 0 16px' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <LiveCount />
          </div>
          {/* 🌐 언어 토글 (LIVE 바 우측으로 이동) */}
          <button
            onClick={() => {
              const newLang = lang === 'ko' ? 'en' : 'ko';
              setLang(newLang);
              i18n.changeLanguage(newLang);
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2px', 
              background: 'rgba(255,255,255,0.08)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              borderRadius: '20px', 
              padding: '2px', 
              cursor: 'pointer', 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: '9px', 
              fontWeight: 900,
              marginLeft: '10px',
              flexShrink: 0
            }}
          >
            <span style={{ color: lang === 'ko' ? '#FF1744' : 'inherit', padding: '2px 7px', borderRadius: '10px', background: lang === 'ko' ? '#fff' : 'transparent' }}>KO</span>
            <span style={{ color: lang === 'en' ? '#FF1744' : 'inherit', padding: '2px 7px', borderRadius: '10px', background: lang === 'en' ? '#fff' : 'transparent' }}>EN</span>
          </button>
        </div>
      </div>

      {/* 📌 [영역 B: 날짜 선택바 - 상단 고정(Sticky)] */}
      <div style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: '0 10px', transition: 'all 0.3s' }}>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '8px', padding: '6px 0', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="date-stream-bar">
          {fourteenDays.map((item) => {
            const isSelected = selectedDate === item.fullDate;
            const isHoliday = item.dayOfWeek === 0 || (item.month === '5' && item.date === '5');
            const isSaturday = item.dayOfWeek === 6;
            const dayColor = isSelected ? '#fff' : (isHoliday ? '#FF1744' : (isSaturday ? '#FF1744' : '#94A3B8'));
            const labelColor = isSelected ? '#FF1744' : (isHoliday ? '#FF1744' : (isSaturday ? '#FF1744' : '#94A3B8'));
            return (
              <div key={item.fullDate} 
                onClick={() => {
                  console.log('클릭한 날짜:', item.fullDate);
                  setSelectedDate(item.fullDate); 
                  if (regionListRef.current) {
                    regionListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '13.5%', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '10px', fontWeight: '700', color: labelColor, marginBottom: '2px' }}>{item.dayName}</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#FF1744' : 'transparent', border: item.isToday && !isSelected ? '1px solid #FF1744' : 'none' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? '#fff' : dayColor }}>{item.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={scrollRef} style={{ width: '100%', background: 'var(--color-bg)' }}>
        <div style={{ minHeight: '101%' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '120px' }}>{Array(6).fill(0).map((_, i) => <div key={i} style={{ height: '140px', width: '100%', background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }} />)}</div>
          ) : (
            <div style={{ width: '100%', padding: '0 0 20px 0', backgroundColor: 'var(--color-bg)' }}>
              {(() => {
                // 포스터가 있는 모든 파티 추출 (최신순 정렬)
                const allPosterParties = (parties || [])
                  .filter(p => p.poster_url && p.poster_url.trim() !== '')
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                // 수도권 / 지방권 분리 (최대 5개씩 제한 - 선택과 집중!)
                const metroHot = allPosterParties.filter(p => 
                  p.broadRegion === '서울' || p.broadRegion === '경기/인천'
                ).slice(0, 5);

                const provincialHot = allPosterParties.filter(p => 
                  p.broadRegion !== '서울' && p.broadRegion !== '경기/인천'
                ).slice(0, 5);

                return (
                  <>
                    {/* [1] HOT PICK 5 - 수도권 (상위 5개 큐레이션) */}
                    {metroHot.length > 0 && (
                      <div style={{ margin: '0 0 15px', padding: '10px 0 20px', background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '950', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#FF1744' }}>HOT</span> PICK 5 <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>[수도권]</span>
                            </h2>
                          </div>
                          
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenModal(setShowSaju, true)}
                            style={{ background: 'var(--color-border)', border: 'none', borderRadius: '12px', padding: '8px 12px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', color: '#FF1744', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Star size={14} fill="#FF1744" color="#FF1744" />
                            {t('saju')}
                          </motion.button>
                        </div>
                        <div style={{ width: '100%', overflow: 'hidden', padding: '10px 0' }}>
                          <div className="hot-pick-track">
                            {/* 무한 루프를 위해 데이터를 두 번 렌더링 */}
                            {[...metroHot, ...metroHot].map((item, idx) => (
                              <div key={`${item.id}-${idx}`} onClick={() => handleOpenModal(setSelectedPoster, item.poster_url)} style={{ width: '140px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', position: 'relative' }}>
                                <img src={item.poster_url} style={{ width: '100%', height: '190px', objectFit: 'cover' }} alt="Pick" />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'white' }}>
                                  <div style={{ fontSize: '10px', color: '#FFEB3B', fontWeight: 900, marginBottom: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{translateDynamicText(item.locationName, isEn)}</div>
                                  <div style={{ fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{translateDynamicText(item.title, isEn)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {IncheonBanner && <IncheonBanner />}

                    {/* [지역 리스트 처리 루프] */}
                    {(() => {
                      const regionKeys = {
                        "서울": "region_seoul",
                        "경기/인천": "region_gyeonggi_incheon",
                        "경상도": "region_gyeongsang",
                        "전라도": "region_jeolla",
                        "충청도": "region_chungcheong",
                        "강원/제주": "region_gangwon_jeju"
                      };
                      const regions = ["서울", "경기/인천", "경상도", "전라도", "충청도", "강원/제주"];
                      
                      return regions.map((regionName, idx) => {
                        const regionParties = (parties || [])
                          .filter(p => p.date === selectedDate)
                          .filter(p => REGION_FILTER[regionName](p))
                          .filter(p => {
                            if (filterGenre && GENRE_MAP[filterGenre]) {
                              if (!(p[GENRE_MAP[filterGenre].key] > 0)) return false;
                            }
                            return true;
                          });

                        const isFirst = regionName === '서울';
                        const maxCount = regionName === '서울' ? 3 : 2;

                        return (
                          <React.Fragment key={regionName}>
                            <section 
                              ref={isFirst ? regionListRef : null}
                              style={{ marginBottom: '15px', background: 'var(--color-card)' }}
                            >
                              <div style={{ fontSize: '18px', fontWeight: '900', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '15px', color: 'var(--color-text-main)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF1744' }} />
                                  {t(regionKeys[regionName] || regionName)}
                                  <span style={{ fontSize: '14px', color: '#E53935', fontWeight: '900', marginLeft: '5px' }}>
                                    {(() => {
                                      const d = new Date(selectedDate);
                                      return `${d.getMonth() + 1}/${d.getDate()} (${isEn ? DAYS_EN[d.getDay()] : DAYS_KOR[d.getDay()]})`;
                                    })()}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => {
                                    setGridRegion(regionName);
                                    handleOpenModal(setShowGridModal, true);
                                  }}
                                  style={{ fontSize: '12px', fontWeight: '700', color: '#FF1744', background: 'rgba(255,23,68,0.05)', border: 'none', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                >
                                  {t('view_all')} <ChevronRight size={14} />
                                </button>
                              </div>

                                <div style={{ 
                                  display: 'flex', 
                                  overflowX: 'auto', 
                                  gap: '20px', 
                                  padding: '10px 20px 40px',
                                  msOverflowStyle: 'none',
                                  scrollbarWidth: 'none',
                                  WebkitOverflowScrolling: 'touch'
                                }}>
                                  {regionParties.length === 0 ? (
                                    <div style={{ flexShrink: 0, width: '100%', padding: '50px', background: 'var(--color-bg)', borderRadius: '24px', textAlign: 'center', color: 'var(--color-text-sub)', fontSize: '13px', fontWeight: '900', border: '1px dashed #E2E8F0' }}>{t('no_parties')}</div>
                                  ) : regionParties.map(item => (
                                    <div 
                                      key={item.id} 
                                      onClick={() => handleOpenModal(setSelectedPoster, item.poster_url)} 
                                      style={{ 
                                        width: '320px', 
                                        flexShrink: 0, 
                                        borderRadius: '16px', 
                                        overflow: 'hidden', 
                                        display: 'flex',
                                        background: 'var(--color-card)',
                                        border: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        height: '150px',
                                        transition: 'all 0.3s'
                                      }}
                                    >
                                      <div style={{ width: '120px', flexShrink: 0 }}>
                                        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
                                      </div>
                                      <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#E53935', background: '#fff0f0', padding: '3px 10px', borderRadius: '8px', border: '1px solid #ffc9c9', flexShrink: 0 }}>
                                            {(() => {
                                              const entries = Object.entries(GENRE_MAP).filter(([_, info]) => item[info.key] > 0)
                                              if (entries.length === 0) return '소셜'
                                              const sorted = [...entries].sort((a, b) => item[b[1].key] - item[a[1].key])
                                              if (sorted.length >= 2 && item[sorted[0][1].key] === item[sorted[1][1].key]) return `${sorted[0][0]} · ${sorted[1][0]}`
                                              return sorted[0][0]
                                            })()}
                                          </span>
                                        </div>
                                        
                                        <div style={{ fontSize: '17px', fontWeight: '900', color: 'var(--color-text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.6px', lineHeight: 1.3, height: '44px', marginTop: '4px' }}>
                                          {cleanTitle(item.title).replace(/^\[.*?\]\s*/, '').replace(/ㅣ\s*$/, '').trim()}
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', color: 'var(--color-text-sub)', fontWeight: 800 }}>
                                            <Clock size={15} />
                                            {item.time?.split('-')[0].trim() || '21:00'}
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--color-text-sub)', fontWeight: 700 }}>
                                              <Navigation size={14} color="#E53935" fill="#E53935" />
                                              {translateDynamicText(item.locationName, isEn)}
                                            </div>
                                            <span style={{ color: 'var(--color-text-sub)', opacity: 0.3 }}>•</span>
                                            <span style={{ fontSize: '14px', fontWeight: '900', color: '#E53935' }}>
                                              {formatPrice(item.fee)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>



                            </section>

                            {/* 경기/인천 섹션 다음에 지방권 HOT PICK 배치 + 여백 확보 */}
                            {regionName === '경기/인천' && provincialHot.length > 0 && (
                              <div style={{ margin: '40px 0 15px', padding: '10px 0 20px', background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ padding: '0 20px 15px' }}>
                                  <h2 style={{ fontSize: '18px', fontWeight: '950', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#FF1744' }}>HOT</span> PICK 5 <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>[지방권]</span>
                                  </h2>
                                </div>
                                <div style={{ width: '100%', overflow: 'hidden', padding: '10px 0' }}>
                                  <div className="hot-pick-track">
                                    {[...provincialHot, ...provincialHot].map((item, idx) => (
                                      <div key={`${item.id}-${idx}`} onClick={() => handleOpenModal(setSelectedPoster, item.poster_url)} style={{ width: '140px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', position: 'relative' }}>
                                        <img src={item.poster_url} style={{ width: '100%', height: '190px', objectFit: 'cover' }} alt="Pick" />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'white' }}>
                                          <div style={{ fontSize: '10px', color: '#FFEB3B', fontWeight: 900, marginBottom: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{translateDynamicText(item.locationName, isEn)}</div>
                                          <div style={{ fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{translateDynamicText(item.title, isEn)}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* 추후 광고 구좌를 위한 하단 여백 */}
                                <div style={{ height: '20px' }}></div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </>
                );
              })()}


            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFullCalendar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 170000 }} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', bottom: '90px', left: '10px', right: '10px', background: 'var(--color-card)', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: 170001, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--color-border)', borderRadius: '2px', margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ fontSize: '24px', fontWeight: 950, color: 'var(--color-text-main)' }}>{selectedMonth}월</span><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setSelectedMonth(m => m > 1 ? m-1 : 12)} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '10px', width: '36px', height: '36px', color: 'var(--color-text-main)' }}><ChevronLeft size={18} /></button><button onClick={() => setSelectedMonth(m => m < 12 ? m+1 : 1)} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '10px', width: '36px', height: '36px', color: 'var(--color-text-main)' }}><ChevronRight size={18} /></button></div></div>
                <button onClick={handleCloseModal} style={{ background: 'var(--color-border)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)' }}>
                  <ChevronLeft size={28} />
                </button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', minHeight: '350px' }}>
                {!showFilterPanel && !showFilteredResults ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: d === '일' ? '#FF1744' : d === '토' ? '#FF1744' : '#999', padding: '5px 0' }}>{d}</div>)}
                    {allDatesInMonth.map((day) => {
                      if (!day.date) return <div key={Math.random()} />;
                      const isWeekend = day.dayName === '금' || day.dayName === '토';
                      const isSelected = selectedDate === day.fullDate;
                      return (
                        <div 
                          key={day.fullDate} 
                          onClick={() => { 
                            if (day.fullDate < todayStr) return;
                            setSelectedDate(day.fullDate); 
                            // 모든 날짜 클릭 시 3단계 필터 필터 플로우 활성화
                            handleOpenModal(setShowFilterPanel, true);
                            setFilterStep(1);
                          }} 
                          style={{ height: '46px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#fff' : (day.dayName === '일' ? '#FF1744' : (isWeekend ? '#FF1744' : 'var(--color-text-main)')), backgroundColor: isSelected ? '#FF1744' : 'transparent', borderRadius: '14px', cursor: day.fullDate < todayStr ? 'default' : 'pointer', opacity: day.fullDate < todayStr ? 0.3 : 1 }}
                        >
                          {day.date}
                        </div>
                      );
                    })}
                  </div>
                ) : showFilterPanel && !showFilteredResults ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    {filterStep === 1 ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                          <button onClick={() => { setShowFullCalendar(false); setShowFilterPanel(false); setShowFilteredResults(false); setFilterStep(1); }} style={{ background: 'var(--color-bg)', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#FF1744', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={16} /> 닫기</button>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 950, color: 'var(--color-text-main)', marginBottom: '15px' }}>{t('filter_where')}</div>
                        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '15px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                          {['서울', '경기/인천', '부산', '대구', '대전', '광주', '기타'].map(r => (
                            <button key={r} onClick={() => { setFilterRegion(r); handleOpenModal(setFilterStep, 2); }} style={{ flexShrink: 0, padding: '14px 24px', borderRadius: '14px', background: filterRegion === r ? '#FF1744' : 'var(--color-bg)', color: filterRegion === r ? '#fff' : 'var(--color-text-sub)', fontWeight: 700, border: 'none', transition: 'all 0.2s' }}>{r}</button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                          <button onClick={handleCloseModal} style={{ background: 'var(--color-bg)', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-sub)', display: 'flex', alignItems: 'center', gap: '4px' }}><ChevronLeft size={16} /> 지역 다시 선택</button>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 950, color: 'var(--color-text-main)', marginBottom: '15px' }}>{t('filter_genre')}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {['바차타', '살사', '쥬크', '키좀바'].map(g => (
                            <button key={g} onClick={() => { setFilterGenre(g); handleOpenModal(setShowFilteredResults, true); }} style={{ padding: '24px 15px', borderRadius: '18px', background: filterGenre === g ? 'var(--color-text-main)' : 'var(--color-bg)', color: filterGenre === g ? 'var(--color-bg)' : 'var(--color-text-sub)', fontWeight: 800, fontSize: '16px', border: 'none' }}>{g}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <button onClick={handleCloseModal} style={{ background: '#F8FAFC', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><ChevronLeft size={16} /> 장르 다시 선택</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                      {(() => {
                        console.log('filteredParties:', filteredParties?.length)
                        console.log('filterRegion:', filterRegion)
                        console.log('filterGenre:', filterGenre)
                        const filtered = filteredParties.filter(p => {
                          // 지역 필터 적용
                          const filterFn = REGION_FILTER[filterRegion];
                          if (filterRegion && filterFn) {
                            if (!filterFn(p)) return false;
                          }

                          // 장르 필터 적용
                          if (filterGenre && GENRE_MAP[filterGenre]) {
                            if (!(p[GENRE_MAP[filterGenre].key] > 0)) return false;
                          }
                          return true;
                        });



                        return filtered.length === 0 ? (
                          <div style={{ gridColumn: 'span 2', padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>해당 조건의 파티가 없습니다 😅</div>
                        ) : (
                          filtered.map(party => {
                            const cleanTitle = party.title?.split(' ㅣ ')[0] || '';
                            const addr = party.address || '';
                            let displayRegion = '전국';
                            if (addr.includes('서울')) displayRegion = '서울';
                            else if (addr.includes('경기')) displayRegion = '경기';
                            else if (addr.includes('인천')) displayRegion = '인천';
                            else if (addr.includes('부산')) displayRegion = '부산';
                            else if (addr.includes('대구')) displayRegion = '대구';
                            else if (addr.includes('대전')) displayRegion = '대전';
                            else if (addr.includes('광주')) displayRegion = '광주';

                            return (
                              <div key={party.id} onClick={() => handleOpenModal(setSelectedPoster, party.poster_url)} style={{ aspectRatio: '1 / 1.4', borderRadius: '12px', overflow: 'hidden', position: 'relative', background: 'var(--color-border)', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <img src={party.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
                                {(() => {
                                  const now = new Date();
                                  const pDate = new Date(party.date);
                                  
                                  const startStr = (party.time?.split('-')[0] || '20:00').trim();
                                  const [sH, sM] = startStr.split(':').length === 2 ? startStr.split(':').map(Number) : [20, 0];
                                  const startDate = new Date(pDate);
                                  startDate.setHours(sH, sM, 0, 0);

                                  const endStr = party.time?.includes('-') ? party.time.split('-')[1].trim() : null;
                                  let endDate = new Date(startDate);

                                  if (endStr && endStr.includes(':')) {
                                    const [eH, eM] = endStr.split(':').map(Number);
                                    endDate.setHours(eH, eM + 30, 0, 0);
                                    if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
                                  } else {
                                    endDate.setHours(startDate.getHours() + 4, startDate.getMinutes() + 30, 0, 0);
                                  }

                                  const startWithBuffer = new Date(startDate.getTime() - 30 * 60 * 1000);
                                  const isLive = now >= startWithBuffer && now <= endDate;

                                  if (isLive) {
                                    return (
                                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#FF1744', color: 'white', fontSize: '9px', fontWeight: '950', padding: '2px 5px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 10 }}>
                                        <span style={{ width: '5px', height: '5px', background: 'white', borderRadius: '50%', display: 'inline-block' }}></span>
                                        LIVE
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                 <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--color-nav-bg)', color: 'var(--color-text-main)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>{displayRegion}</div>
                                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  {Object.entries(GENRE_MAP).map(([name, info]) => (
                                    party[info.key] > 0 && <span key={name} style={{ background: `${info.color}F2`, color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 950 }}>{info.label}{party[info.key]}</span>
                                  ))}
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'white' }}>
                                  <div style={{ fontSize: '11px', color: '#FFEB3B', fontWeight: 950, marginBottom: '3px' }}>{translateDynamicText(party.locationName, isEn)}</div>
                                  <div style={{ fontSize: '13px', fontWeight: 950, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '5px' }}>{translateDynamicText(cleanTitle, isEn)}</div>
                                  <div style={{ fontSize: '9px', fontWeight: 900, color: '#fff', display: 'flex', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>{(() => { const d = new Date(party.date); return `${d.getMonth() + 1}/${d.getDate()}(${isEn ? DAYS_EN[d.getDay()] : DAYS_KOR[d.getDay()]})`; })()}</span>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>{party.time?.split('-')[0].trim() || '21:00'}</span>
                                    <span style={{ color: '#94A3B8', fontWeight: 950, fontSize: '11px' }}>{(() => { if (!party.fee) return '1.2만'; const f = String(party.fee); if (f.includes('만')) return isEn ? f.replace('만', '0k').replace('원', '') : f.replace('원', ''); const num = parseInt(f.replace(/[^0-9]/g, '')); if (isNaN(num)) return f; return isEn ? (num/10000).toFixed(1).replace('.0', '') + '0k' : (num/10000).toFixed(1).replace('.0', '') + '만'; })()}</span>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                                      {Object.entries(GENRE_MAP).filter(([_, info]) => party[info.key] > 0).map(([_, info]) => `${info.label}${party[info.key]}`).join('')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        );
                      })()}
                    </div>
                    <button onClick={handleCloseModal} style={{ width: '100%', height: '54px', borderRadius: '16px', background: '#1E293B', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none' }}>확인 완료</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGridModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={handleCloseModal} 
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 180000 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               style={{ 
                 position: 'fixed', 
                 inset: 0, 
                 background: 'var(--color-bg)', 
                 zIndex: 180001, 
                display: 'flex', 
                flexDirection: 'column',
                height: '100dvh',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
              }}
            >
              {/* 상단 바 */}
              <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button 
                    onClick={handleCloseModal}
                    style={{ background: 'var(--color-border)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)' }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div style={{ color: 'var(--color-text-main)', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF1744' }} />
                    {(() => {
                      const regionKeys = {
                        '서울': 'region_seoul', '경기/인천': 'region_gyeonggi_incheon',
                        '경상도': 'region_gyeongsang', '전라도': 'region_jeolla',
                        '충청도': 'region_chungcheong', '강원/제주': 'region_gangwon_jeju'
                      };
                      return t(regionKeys[gridRegion] || gridRegion);
                    })()} {isEn ? 'All Posters' : '전체 포스터'}
                  </div>
                </div>
              </div>

              {/* 그리드 본문 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '2px', background: 'var(--color-bg)' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '2px' 
                }}>
                  {(() => {
                    // 해당 지역의 모든 포스터 파티 (날짜 상관없이)
                    const regionalPosterParties = (parties || [])
                      .filter(p => p.poster_url && p.poster_url.trim() !== '')
                      .filter(p => {
                        const filterFn = REGION_FILTER[gridRegion];
                        return filterFn ? filterFn(p) : true;
                      })
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // 가까운 날짜순

                    return regionalPosterParties.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          handleOpenModal(setSelectedPoster, item.poster_url);
                        }}
                         style={{ aspectRatio: '1 / 1.4', overflow: 'hidden', background: 'var(--color-card)', position: 'relative' }}
                      >
                        <img 
                          src={item.poster_url} 
                          alt="Poster" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: '-webkit-optimize-contrast' }} 
                        />
                        {/* 고밀도 정보 오버레이 (음악/시간만!) */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: '#fff', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                            <span style={{ background: '#FF1744', color: 'white', padding: '1px 4px', borderRadius: '3px', fontSize: '8px', fontWeight: 950 }}>
                              {Object.entries(GENRE_MAP).filter(([_, info]) => item[info.key] > 0).map(([_, info]) => `${info.label}${item[info.key]}`).join(' ')}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '3px', fontSize: '8px', fontWeight: 950 }}>
                              {item.time?.split('-')[0].trim() || '21:00'}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#FFEB3B' }}>
                            {translateDynamicText(item.locationName, isEn)}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                {(() => {
                  const hasPosters = (parties || []).some(p => p.poster_url && REGION_FILTER[gridRegion]?.(p));
                  return !hasPosters && (
                    <div style={{ padding: '100px 0', textAlign: 'center', color: '#64748B', fontWeight: '700' }}>해당 지역에 등록된 포스터가 없습니다.</div>
                  );
                })()}
                {/* 하단 여백 */}
                <div style={{ height: '100px' }}></div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HomePage
