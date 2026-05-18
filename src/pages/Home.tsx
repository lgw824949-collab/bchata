import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, MapPin, Calendar, Clock, User, Users, Music, ChevronRight, ShieldCheck, X, Home as HomeIcon, ChevronLeft, CloudSun, Utensils, Zap, PlusCircle, Languages, Bell, Globe, Navigation, CalendarDays, Star, Camera, MessageSquare, Tent, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import LiveCount from '../components/LiveCount'
import { KMA_REGION_COORDS, fetchWeatherForecast, parseKmaWeather, HOME_REGION_MAP } from '../utils/kmaApi'
import { supabase } from '../lib/supabase'
import { buildPartyShareCard } from '../lib/partyShareCard'
// import { getAfterPartySpotsForParty, openAfterPartyMap } from '../data/afterPartySpots'

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];
const DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const GENRE_MAP = {
  '바차타': { key: 'b_ratio', label: 'B', label_en: 'Bachata', color: '#FF1744' },
  '살사': { key: 's_ratio', label: 'S', label_en: 'Salsa', color: '#FF1744' },
  '쥬크': { key: 'j_ratio', label: 'J', label_en: 'Zouk', color: '#FF1744' },
  '키좀바': { key: 'k_ratio', label: 'K', label_en: 'Kizomba', color: '#FF1744' },
};

const SEOUL_HINT = /서울|강남|홍대|잠실|건대|신림|서초|영등포|성수|이태원|왕십리|목동|구로/;

const REGION_FILTER = {
  '서울': (p) =>
    p.broadRegion === '서울' ||
    SEOUL_HINT.test(`${p.title || ''} ${p.address || ''} ${p.region || ''} ${p.location_name || ''} ${p.locationName || ''}`),
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
const MAIN_REGIONS = ['경기/인천', '서울', '경상', '전라', '충청', '강원/제주'];
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

/** 파티 카드 줌인 (호버·터치) */
const partyCardZoomBaseStyle = { transition: 'transform 0.25s ease', transform: 'scale(1) translateY(0)' };
const setPartyCardZoomIn = (e) => { e.currentTarget.style.transform = 'scale(1.05) translateY(-4px)'; };
const setPartyCardZoomOut = (e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; };
const partyCardZoomHandlers = {
  onMouseEnter: setPartyCardZoomIn,
  onMouseLeave: setPartyCardZoomOut,
  onTouchStart: setPartyCardZoomIn,
  onTouchEnd: setPartyCardZoomOut,
};
/** 캐러셀 카드: 터치 줌 제외 (가로 스크롤과 충돌 방지) */
const partyCardZoomDesktopOnly = {
  onMouseEnter: setPartyCardZoomIn,
  onMouseLeave: setPartyCardZoomOut,
};

/** 행사달력: 날짜 문자열 통일 (YYYY-MM-DD) */
const normDate = (d) => (d ? String(d).slice(0, 10) : '');

/** KST 오늘 (새벽 4시 전 = 전날, App과 동일) */
const getKSTTodayStr = () => {
  const now = new Date();
  if (now.getHours() < 4) now.setDate(now.getDate() - 1);
  const kst = now.toLocaleString('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [m, d, y] = kst.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

/** 같은 날·같은 포스터 URL은 1건 (신규 포스터 URL이면 +1) */
const dedupePartiesByPoster = (list) => {
  const seen = new Set();
  const out = [];
  for (const p of list || []) {
    const date = normDate(p.date);
    if (!date) continue;
    const poster = String(p.poster_url || '').trim();
    const key = poster ? `${date}|poster:${poster}` : `${date}|id:${p.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...p, date });
  }
  return out;
};

const dedupeById = (list) => {
  const seen = new Set();
  return (list || []).filter((item) => {
    if (item?.id == null) return true;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const partiesOnDate = (list, fullDate) =>
  (list || []).filter((p) => normDate(p.date) === fullDate);

const bootcampsOnDate = (list, fullDate) =>
  dedupeById(list || []).filter((b) => {
    if (b.start_date && b.end_date) return fullDate >= normDate(b.start_date) && fullDate <= normDate(b.end_date);
    return normDate(b.start_date) === fullDate;
  });

const festivalsOnDate = (list, fullDate) =>
  dedupeById(list || []).filter((f) => {
    if (f.start_date && f.end_date) return fullDate >= normDate(f.start_date) && fullDate <= normDate(f.end_date);
    return normDate(f.start_date) === fullDate;
  });

// 지금 노출 중 — App.jsx LiveExposureStrip 사용, 구 구현 보관 (if false)
if (false) {
const EXPOSURE_ROTATE_MS = 4 * 60 * 1000;

const locationKey = (item) =>
  String(item?.location_name || item?.locationName || item?.studio_name || item?.venue || item?.id || '')
    .trim()
    .toLowerCase();

const exposureScore = (item, todayStr) => {
  let score = (item?.click_count || 0) * 3;
  if (normDate(item?.date) === todayStr) score += 400;
  const t = item?.time?.split('-')[0]?.trim() || '21:00';
  const [h] = t.split(':').map(Number);
  if (!Number.isNaN(h) && h >= 18) score += 80;
  score += new Date(item?.created_at || 0).getTime() / 1e12;
  return score;
};

/** 공정 로테이션: 장소 중복 없이 2장 (풀 부족 시 1장) */
const pickExposurePair = (pool, rotationIndex, todayStr) => {
  if (!pool?.length) return [];
  const sorted = [...pool].sort((a, b) => exposureScore(b, todayStr) - exposureScore(a, todayStr));
  const n = sorted.length;
  if (n === 1) return [sorted[0]];
  const start = (rotationIndex * 2) % n;
  const picked = [];
  const usedLoc = new Set();
  for (let i = 0; i < n * 2 && picked.length < 2; i++) {
    const item = sorted[(start + i) % n];
    const loc = locationKey(item);
    if (picked.some((p) => p.id === item.id)) continue;
    if (picked.length === 1 && loc && usedLoc.has(loc)) continue;
    picked.push(item);
    if (loc) usedLoc.add(loc);
  }
  return picked;
};

/** 선택한 날짜 · 하단 2칸 실시간 로테이션 노출 */
const LiveExposureStrip = ({ pool, selectedDate, todayStr, onSelect, cleanTitle, translateDynamicText, isEn }) => {
  const [rotationIndex, setRotationIndex] = useState(0);

  useEffect(() => {
    setRotationIndex(0);
  }, [selectedDate, pool.length]);

  useEffect(() => {
    if (pool.length < 2) return undefined;
    const timer = setInterval(() => setRotationIndex((v) => v + 1), EXPOSURE_ROTATE_MS);
    return () => clearInterval(timer);
  }, [pool.length, selectedDate]);

  const featured = useMemo(() => {
    const picked = pickExposurePair(pool, rotationIndex, todayStr);
    if (picked.length) return picked;
    return pool.length ? [pool[0]] : [];
  }, [pool, rotationIndex, todayStr]);

  if (!pool.length) return null;

  return (
    <section
      style={{
        margin: '8px 16px 88px',
        padding: '18px 16px 20px',
        borderRadius: '24px',
        background: 'linear-gradient(165deg, #141414 0%, #0a0a0a 55%, #1a1510 100%)',
        border: '1px solid rgba(201, 168, 76, 0.45)',
        boxShadow: '0 12px 40px rgba(201, 168, 76, 0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <motion.div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <motion.div>
          <motion.div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Star size={16} color="#C9A84C" fill="#C9A84C" />
            <span style={{ fontSize: 16, fontWeight: 900, color: '#F5E6C8', letterSpacing: '-0.3px' }}>
              {isEn ? 'Now Showing' : '지금 노출 중'}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#1a1a1a',
                background: 'linear-gradient(135deg, #C9A84C, #FFF3C4)',
                padding: '3px 8px',
                borderRadius: 8,
              }}
            >
              LIVE 2
            </span>
          </motion.div>
          <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', fontWeight: 600, lineHeight: 1.45 }}>
            {isEn
              ? 'Two spots rotate every 4 min · one venue at a time'
              : '4분마다 2곳 교체 · 같은 장소 동시 노출 없음'}
          </p>
        </motion.div>
        <button
          type="button"
          onClick={() => window.open('https://open.kakao.com/o/gP43rNri', '_blank')}
          style={{
            flexShrink: 0,
            padding: '8px 12px',
            borderRadius: 12,
            border: '1px solid rgba(201,168,76,0.35)',
            background: 'rgba(201,168,76,0.08)',
            color: '#C9A84C',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {isEn ? 'Exposure' : '노출 문의'}
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${rotationIndex}-${featured.map((f) => f.id).join('-')}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{ display: 'grid', gridTemplateColumns: featured.length > 1 ? '1fr 1fr' : '1fr', gap: 12 }}
        >
          {featured.map((item) => {
            const title = cleanTitle(item.title || '')
              .replace(/^\[.*?\]\s*/, '')
              .replace(/ㅣ\s*$/, '')
              .trim();
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                style={{
                  padding: 0,
                  border: 'none',
                  borderRadius: 12,
                  overflow: 'visible',
                  cursor: 'pointer',
                  background: 'transparent',
                  boxShadow: 'none',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <motion.div
                  style={{
                    width: '100%',
                    minHeight: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#111',
                    padding: '10px 8px',
                    boxSizing: 'border-box',
                    borderRadius: 12,
                  }}
                >
                  <img
                    src={item.poster_url}
                    alt=""
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 280,
                      objectFit: 'contain',
                      objectPosition: 'center top',
                      display: 'block',
                    }}
                  />
                </motion.div>
                <div style={{ padding: '8px 4px 0' }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#C9A84C',
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {translateDynamicText(item.locationName || item.location_name, isEn)}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: '#fff',
                      lineHeight: 1.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {translateDynamicText(title, isEn)}
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {pool.length > 2 ? (
        <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 10, color: '#64748B', fontWeight: 600 }}>
          {isEn
            ? `${pool.length} parties today · fair rotation`
            : `오늘 ${pool.length}개 파티 · 공정 순환 노출`}
        </p>
      ) : null}
    </section>
  );
};
}

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
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // 오늘 날짜가 아니면 LIVE 아님
    if (item.date !== todayStr) return false;

    // 1. 시작 시간 추출
    const startStr = (item.time?.split('-')[0] || '20:00').trim();
    const [sH, sM] = startStr.split(':').length === 2 ? startStr.split(':').map(Number) : [20, 0];
    const startDate = new Date();
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
    <motion.div
      className="party-carousel-card"
      {...partyCardZoomHandlers}
      onClick={() => onSelect(item)}
      style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', backgroundColor: 'var(--color-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', cursor: 'pointer', height: '150px', marginBottom: '12px', ...partyCardZoomBaseStyle }}
    >
      <div style={{ width: '100px', flexShrink: 0 }}>
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, padding: '16px 20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#E53935', background: '#fff0f0', padding: '3px 10px', borderRadius: '8px', border: '1px solid #ffc9c9', flexShrink: 0 }}>
            {(() => {
              const entries = Object.entries(GENRE_MAP).filter(([_, info]) => item[info.key] > 0)
              if (entries.length === 0) return '소셜'
              const sorted = [...entries].sort((a, b) => item[b[1].key] - item[a[1].key])
              if (sorted.length >= 2 && item[sorted[0][1].key] === item[sorted[1][1].key]) return `${sorted[0][0]} · ${sorted[1][0]}`
              return sorted[0][0]
            })()}
          </span>
          {isTimeLive && (
            <span style={{ background: '#E53935', color: '#fff', fontSize: '10px', fontWeight: '950', padding: '2px 6px', borderRadius: '4px', animation: 'blink 1.5s infinite', boxShadow: '0 0 8px rgba(229, 57, 53, 0.5)' }}>LIVE</span>
          )}
        </div>

        <div style={{ fontSize: '17px', fontWeight: '900', color: 'var(--color-text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.6px', lineHeight: 1.3, height: '44px', marginTop: '4px' }}>
          {translateDynamicText(cleanTitle(item.title).replace(/^\[.*?\]\s*/, '').replace(/ㅣ\s*$/, '').trim(), isEn)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', color: 'var(--color-text-sub)', fontWeight: 800 }}>
              <Clock size={15} />
              {displayTime}
            </span>
            {isTimeLive && (
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#FFB300', background: 'rgba(255,179,0,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                {item.view_count || 0}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              onClick={(e) => { e.stopPropagation(); const addr = item.address || item.locationName; const query = encodeURIComponent(addr); window.open(isEn ? `https://www.google.com/maps/search/?api=1&query=${query}` : `https://map.kakao.com/link/search/${query}`, '_blank') }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--color-text-sub)', cursor: 'pointer', fontWeight: 700 }}
            >
              <Navigation size={14} color="#E53935" fill="#E53935" style={{ flexShrink: 0 }} />
              {translateDynamicText(item.locationName || item.studio_name || '장소 미지정', isEn)}
            </span>
            <span style={{ color: 'var(--color-text-sub)', opacity: 0.3 }}>•</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#E53935' }}>
              {displayFee}
            </span>
          </div>
        </div>

      </div>
    </motion.div>
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
      className="party-carousel-card"
      {...partyCardZoomHandlers}
      onClick={() => onSelect(item)}
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
        // scrollSnapAlign: 'start',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...partyCardZoomBaseStyle,
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
            {item.day_of_week} · {item.start_time?.slice(0, 5)}
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
    <motion.div
      className="party-carousel-card"
      {...partyCardZoomHandlers}
      onClick={() => onSelect(item)}
      style={{
        display: 'flex',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #F1F5F9',
        cursor: 'pointer',
        height: '110px',
        marginBottom: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        ...partyCardZoomBaseStyle,
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
    </motion.div>
  );
};

const FestivalCard = ({ item, onSelect }) => {
  return (
    <div
      className="party-carousel-card"
      {...partyCardZoomHandlers}
      onClick={() => onSelect(item)}
      style={{
        display: 'flex',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #F1F5F9',
        cursor: 'pointer',
        height: '110px',
        marginBottom: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        ...partyCardZoomBaseStyle,
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
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [items.length]);

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
  const regions = ['경기/인천', '서울', '경상도', '전라도', '충청도', '강원/제주'];
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
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', border: filterRegion === r ? '1px solid rgba(201, 168, 76, 0.55)' : '1px solid transparent', background: filterRegion === r ? 'rgba(201, 168, 76, 0.12)' : 'var(--color-border)', color: filterRegion === r ? '#9A7B2E' : 'var(--color-text-sub)', transition: 'all 0.2s' }}
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
  showLatinModal, setShowLatinModal, setShowSaju, setShowWishlist, latinCat, setLatinCat, selPatternId, setSelPatternId, regionalTheme, recordTraffic, IncheonBanner, venueCounts, openAnalysis,
  showGridModal, setShowGridModal, gridRegion, setGridRegion, filterStep, setFilterStep,
  handleOpenModal, handleCloseModal,
  isDark, setIsDark, followedInstructors, likedLivePicks, setShowRentalModal, setShowPartner,
  LiveExposureStrip,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const lang = isEn ? 'en' : 'ko';
  const [activeTab, setActiveTabState] = useState(null);
  const [regionCounts, setRegionCounts] = useState({
    seoul: 0, seoulDistricts: '',
    metro: 0, metroDistricts: '',
    national: 0, nationalDistricts: ''
  });
  const [particles, setParticles] = useState<{id: number, x: number, y: number, emoji: string}[]>([]);

  const triggerParticle = (e: React.MouseEvent, emoji: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newParticles = Array.from({length: 6}, (_, i) => ({
      id: Date.now() + i,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      emoji,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id))), 800);
  };

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (tab === 'social') {
      setView('home');
      setShowPartner(false);
    } else if (tab === 'partner') {
      setShowPartner(true);
    }
  };

  useEffect(() => {
    const onHomeActiveTab = (e) => setActiveTab(e.detail ?? null);
    window.addEventListener('home-active-tab', onHomeActiveTab);
    return () => window.removeEventListener('home-active-tab', onHomeActiveTab);
  }, []);

  // [사용자 요청] 지역 포스터 리스트 자동 스크롤 비활성화 (좌측 고정 및 수동 스크롤만 허용)
  useEffect(() => {
    // 자동 스크롤 로직 제거됨
  }, []);

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

  const posterSharePayload = (item: any) => buildPartyShareCard(item);

  const openPartyWithAfterParty = (item) => {
    const p = posterSharePayload(item);
    if (!p) return;
    handleOpenModal(setSelectedPoster, p);
  };

  const [isPaused, setIsPaused] = useState(false);
  const [myInstructorsOpen, setMyInstructorsOpen] = useState(false);

  // [사용자 요청] 파티 카드 찜하기 상태 및 토글 핸들러
  const [wishlistParties, setWishlistParties] = useState(() => {
    try {
      const str = localStorage.getItem('wishlist_parties') || localStorage.getItem('liked_ids') || '[]';
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const toggleWishlistParty = (e: React.MouseEvent, partyObj: any) => {
    e.stopPropagation(); // 카드 클릭 시 열리는 포스터 상세 모달 이벤트 차단
    if (!partyObj || !partyObj.id) return;

    setWishlistParties(prev => {
      const isAlreadyWishlisted = prev.some(item => {
        if (typeof item === 'object' && item !== null) return item.id === partyObj.id;
        return item === partyObj.id;
      });

      let nextList;
      if (isAlreadyWishlisted) {
        nextList = prev.filter(item => {
          if (typeof item === 'object' && item !== null) return item.id !== partyObj.id;
          return item !== partyObj.id;
        });
      } else {
        nextList = [...prev, partyObj];
      }

      try {
        localStorage.setItem('wishlist_parties', JSON.stringify(nextList));
        if (localStorage.getItem('liked_ids')) localStorage.setItem('liked_ids', JSON.stringify(nextList));
        if (localStorage.getItem('liked_parties')) localStorage.setItem('liked_parties', JSON.stringify(nextList));
      } catch (err) {}

      return nextList;
    });
  };

  const [classGenre, setClassGenre] = useState('전체');
  const [classLevel, setClassLevel] = useState('전체');
  const [weatherMap, setWeatherMap] = useState({});
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [lastAdminTap, setLastAdminTap] = useState(0);
  const [activeDateGenre, setActiveDateGenre] = useState('전체');
  const [isFilterBarVisible, setIsFilterBarVisible] = useState(false);
  const [isModalFilterVisible, setIsModalFilterVisible] = useState(false);
  const stickyHeaderRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (stickyHeaderRef.current && !stickyHeaderRef.current.contains(e.target)) {
        setIsFilterBarVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const todayStr = useMemo(() => getKSTTodayStr(), []);

  useEffect(() => {
    if (!parties || parties.length === 0) return;
    const today = getKSTTodayStr();
    const todayParties = parties.filter((p) => p.date === today && p.status === 'approved');

    const seoulParties = todayParties.filter((p) => p.broadRegion === '서울' || p.region?.includes('서울'));
    const metroParties = todayParties.filter((p) => p.broadRegion === '경기/인천' || p.region?.includes('경기') || p.region?.includes('인천'));
    const nationalParties = todayParties.filter((p) =>
      !p.broadRegion?.includes('서울') &&
      !p.region?.includes('서울') &&
      !p.region?.includes('경기') &&
      !p.region?.includes('인천')
    );

    const partyDistrictLabel = (p) => {
      const r = (p.region || '').trim();
      if (r) return r;
      const b = (p.broadRegion || '').trim();
      if (b) return b;
      const v = (p.locationName || p.venue || '').trim();
      return v;
    };

    const getTopDistricts = (list) => {
      const counts = {};
      list.forEach((p) => {
        const label = partyDistrictLabel(p);
        if (label) counts[label] = (counts[label] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name]) => name)
        .join(' · ');
    };

    setRegionCounts({
      seoul: seoulParties.length,
      seoulDistricts: getTopDistricts(seoulParties),
      metro: metroParties.length,
      metroDistricts: getTopDistricts(metroParties),
      national: nationalParties.length,
      nationalDistricts: getTopDistricts(nationalParties),
    });
  }, [parties]);

  /** 오늘 이후 등록 파티 (포스터 URL 중복 제거) — 행사달력·날짜바·요약 건수 */
  const calendarParties = useMemo(
    () => dedupePartiesByPoster((parties || []).filter((p) => normDate(p.date) >= todayStr)),
    [parties, todayStr]
  );
  const calendarBootcamps = useMemo(() => dedupeById(bootcamps || []), [bootcamps]);
  const calendarFestivals = useMemo(() => dedupeById(festivals || []), [festivals]);

  useEffect(() => {
    if (showFullCalendar) fetchParties();
  }, [showFullCalendar, fetchParties]);
  const isAfter9AM = useMemo(() => {
    const now = new Date();
    return now.getHours() >= 9;
  }, []);
  const scrollRef = useRef(null);
  const regionListRef = useRef(null);
  const [shuffleOffset, setShuffleOffset] = useState(0);

  // [사용자 요청] 15초 롤링 — shuffleOffset 미사용, 캐러셀 스크롤 중 리렌더 방지
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setShuffleOffset(prev => prev + 1);
  //   }, 15000);
  //   return () => clearInterval(interval);
  // }, []);

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
    return [...all].filter(p => p.poster_url).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [parties]);


  const allDatesInMonth = useMemo(() => {
    const year = parseInt(todayStr.slice(0, 4), 10);
    const month = selectedMonth;
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push({ date: '', fullDate: '', dayName: '', isCurrentMonth: false });
    for (let d = 1; d <= lastDate; d++) {
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, d);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      days.push({ date: d, fullDate, dayName: dayNames[dateObj.getDay()], isCurrentMonth: true });
    }
    return days;
  }, [selectedMonth, todayStr]);

  useEffect(() => {
    const setVh = () => { document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`); };
    window.addEventListener('resize', setVh);
    setVh();
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const quickMenuSectionTitleStyle = { fontSize: '14px', color: '#888', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px' };
  const quickMenuFloatStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '8px 6px 6px', cursor: 'pointer', width: '100%', height: '90px' };
  const quickMenuIconWrapStyle = { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' };
  const quickMenuLabelStyle = { color: '#1E293B', fontWeight: 600, fontSize: '11px', marginTop: '4px', textAlign: 'center', lineHeight: 1.25, whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' };

  return (
    <div className="app-container" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: '80px', transition: 'background-color 0.3s' }}>

      {activeTab === 'social' && (
        <img
          src="/Photo/소셜.png"
          alt="소셜 배너"
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* 📌 [영역 A: 히어로 / 메인 게이트] */}
      <div style={{ padding: '16px 20px 8px', marginBottom: '12px' }}>
        {activeTab === null && (
        <div style={{ marginBottom: '12px' }}>
          <img
            src="/logo.png"
            alt="오늘밤빠 로고"
            onClick={() => {
              const now = Date.now();
              if (now - lastAdminTap < 2000) {
                const nextCount = adminTapCount + 1;
                if (nextCount >= 3) { setView('admin-portal'); setAdminTapCount(0); }
                else { setAdminTapCount(nextCount); }
              } else { setAdminTapCount(1); }
              setLastAdminTap(now);
            }}
            style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '12px', cursor: 'pointer', userSelect: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
        )}

        {activeTab === null && (
        <>
        <h1 style={{ fontSize: '28px', fontWeight: 950, color: 'var(--color-text-main)', margin: '0 0 6px', letterSpacing: '-0.8px', lineHeight: 1.2 }}>오늘 어디서 춤출래?</h1>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-sub)', margin: '0 0 14px', letterSpacing: '-0.2px' }}>켜고, 찾고, 가면 끝!</p>
        </>
        )}

        {activeTab === null && (
        <>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-sub)', margin: '0 0 10px' }}>
          오늘 전국{' '}
          <span style={{ color: 'var(--color-text-main)', fontWeight: 900, fontSize: '15px' }}>
            {regionCounts.seoul + regionCounts.metro + regionCounts.national}
          </span>
          건
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: '서울', count: regionCounts.seoul, filter: '서울' },
            { label: '수도권', count: regionCounts.metro, filter: '경기/인천' },
            { label: '전국', count: regionCounts.national, filter: '' },
          ].map((r) => {
            const isSelected = filterRegion === r.filter;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => {
                  setActiveTab('social');
                  setFilterRegion(filterRegion === r.filter ? '' : r.filter);
                  setIsFilterBarVisible(true);
                  window.setTimeout(() => stickyHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '10px 8px',
                  borderRadius: '12px',
                  border: isSelected ? '1.5px solid rgba(201, 168, 76, 0.7)' : '1px solid var(--color-border)',
                  background: isSelected ? 'rgba(201, 168, 76, 0.1)' : 'var(--color-card)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', width: '100%', textAlign: 'center' }}>{r.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-text-main)', lineHeight: 1, width: '100%', textAlign: 'center' }}>
                  {r.count}<span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginLeft: '2px' }}>건</span>
                </div>
              </button>
            );
          })}
        </div>
        </>
        )}
      </div>

      {/* 🔴 [LIVE 바 임팩트 영역 개편] */}
      <div style={{ padding: '4px 20px 12px', marginBottom: '24px' }}>
        {/* LiveCount를 감싸는 세련된 임팩트 컨테이너 및 전역 스타일 주입 */}
        <div className="live-count-premium-wrapper" style={{ 
          // background: '#0F172A', 
          background: '#F8FAFC',
          borderRadius: '14px', 
          overflow: 'hidden', 
          // boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
          // border: '1px solid rgba(255, 255, 255, 0.05)'
          border: '1px solid #E2E8F0'
        }}>
          <style>{`
            /* 햄버거 버튼 세련되게 축소 및 그림자 제거 (절대 규칙 완벽 준수 전역 오버라이드) */
            button[style*="z-index: 1005"] {
              width: 36px !important;
              height: 36px !important;
              padding: 0 !important;
              border-radius: 10px !important;
              box-shadow: none !important;
              border: 1px solid rgba(0,0,0,0.08) !important;
              background: rgba(255,255,255,0.9) !important;
            }
            button[style*="z-index: 1005"] svg {
              width: 20px !important;
              height: 20px !important;
            }

            /* LIVE 바 내부 요소 강제 레이아웃/스타일 최적화 */
            .live-count-premium-wrapper > div {
              height: 42px !important;
              padding: 0 14px !important;
              background: transparent !important;
              box-sizing: border-box !important;
              width: 100% !important;
            }
            .live-count-premium-wrapper .lc-tag {
              background: #E53935 !important;
              font-size: 10px !important;
              font-weight: 950 !important;
              padding: 2px 6px !important;
              border-radius: 4px !important;
              letter-spacing: 0.5px !important;
            }
            .live-count-premium-wrapper .lc-dot {
              margin-left: -2px !important;
              margin-right: 4px !important;
            }
            .live-count-premium-wrapper .lc-name {
              /* color: #F8FAFC !important; */
              color: #334155 !important;
              font-size: 13px !important;
              font-weight: 800 !important;
              font-family: inherit !important;
              letter-spacing: -0.3px !important;
            }
            .live-count-premium-wrapper .lc-count {
              color: #FF5252 !important;
              font-size: 15px !important;
              font-weight: 900 !important;
              font-family: inherit !important;
              background: rgba(229,57,53,0.15) !important;
              padding: 1px 6px !important;
              border-radius: 6px !important;
              margin-left: 4px !important;
            }
            .live-count-premium-wrapper .lc-default {
              /* color: #E2E8F0 !important; */
              color: #64748B !important;
              font-size: 12px !important;
              font-weight: 700 !important;
              font-family: inherit !important;
              letter-spacing: -0.3px !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            .live-count-premium-wrapper .lc-lang {
              margin-left: auto !important;
              display: flex !important;
              align-items: center !important;
              /* background: rgba(255,255,255,0.06) !important; */
              background: rgba(15, 23, 42, 0.06) !important;
              padding: 2px 4px !important;
              border-radius: 6px !important;
              gap: 2px !important;
            }
            .live-count-premium-wrapper .lc-lang-btn {
              padding: 2px 6px !important;
              font-size: 9px !important;
              font-weight: 800 !important;
              border-radius: 4px !important;
              color: #94A3B8 !important;
              transition: all 0.2s !important;
            }
            .live-count-premium-wrapper .lc-lang-btn.on {
              background: #E53935 !important;
              color: #FFFFFF !important;
            }
            .live-count-premium-wrapper .lc-lang span {
              display: none !important; /* 구분선 제거하고 깔끔한 버튼 그룹 형태 */
            }
          `}</style>
          <LiveCount />
        </div>
      </div>


      {/* 메인 퀵메뉴: activeTab === null → 3섹션 그리드 / 소셜 탭 → 가로 스크롤 */}
      <style>{`
        @keyframes gentleSparkle {
          0% { box-shadow: 0 0 2px rgba(85, 139, 47, 0.1); filter: drop-shadow(0 0 1px rgba(85, 139, 47, 0.1)); }
          50% { box-shadow: 0 0 12px rgba(85, 139, 47, 0.45); filter: drop-shadow(0 0 4px rgba(85, 139, 47, 0.25)); }
          100% { box-shadow: 0 0 2px rgba(85, 139, 47, 0.1); filter: drop-shadow(0 0 1px rgba(85, 139, 47, 0.1)); }
        }
      `}</style>
      {activeTab === null && (
      <div id="quickmenu-section" style={{ padding: '8px 12px 12px', marginBottom: '24px' }}>
        {/* 파티 & 이벤트 포스터 3분할 */}
        <p style={{ fontSize: '14px', color: '#888', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px', marginTop: 0 }}>파티 & 이벤트</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { src: '/Photo/소셜.png', label: '소셜', action: () => { window.history.pushState({}, '', '#social'); setActiveTab('social'); } },
            { src: '/Photo/부트캠프.png', label: '부트캠프', action: () => { window.history.pushState({}, '', '#bootcamp'); setView('bootcamp'); } },
            { src: '/Photo/페스티벌.png', label: '페스티벌', action: () => { window.history.pushState({}, '', '#festival'); setView('festival'); } },
          ].map((item, idx) => (
            <div key={idx} onClick={item.action} style={{ flex: 1, borderRadius: '12px', border: '2px solid #E53935', overflow: 'hidden', cursor: 'pointer', position: 'relative', aspectRatio: '9/16' }}>
              <img src={item.src} alt={item.label} onError={(e) => { e.currentTarget.style.background = '#1a1a1a'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '16px 8px 8px', textAlign: 'center' }}>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 800 }}>{item.label}</span>
              </div>
            </div>
          ))}
        </div>
        <motion.div
          className="quick-menu-scroll"
          style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '16px', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
        {[
          { icon: <Music size={32} strokeWidth={1.2} color="#E53935" />, label: '소셜', particles: '🎵', action: () => { window.history.pushState({}, '', '#social'); setActiveTab('social'); } },
          { icon: <Tent size={32} strokeWidth={1.2} color="#E53935" />, label: '부트캠프', particles: '⛺', action: () => { window.history.pushState({}, '', '#bootcamp'); setView('bootcamp'); } },
          { icon: <Star size={32} strokeWidth={1.2} color="#E53935" />, label: '페스티벌', particles: '⭐', action: () => { window.history.pushState({}, '', '#festival'); setView('festival'); } },
          { icon: <Calendar size={32} strokeWidth={1.2} color="#E53935" />, label: '행사달력', particles: '📅', action: () => setShowFullCalendar(true) },
          { icon: <MapPin size={32} strokeWidth={1.2} color="#E53935" />, label: '위치·대관', particles: '📍', action: () => setShowRentalModal(true) },
        ].map((item, idx) => (
          <motion.div key={`party-extra-${idx}`} whileTap={{ scale: 0.92 }} onClick={(e) => { triggerParticle(e, item.particles); item.action(); }} style={{ ...quickMenuFloatStyle, position: 'relative', width: 'calc(22% - 6px)', minWidth: 'calc(22% - 6px)', flexShrink: 0, scrollSnapAlign: 'start' }}>
            <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px' }}>{item.icon}</motion.div>
            <span style={{ ...quickMenuLabelStyle, fontSize: '11px' }}>{item.label}</span>
          </motion.div>
        ))}
        </motion.div>

        {/* 파트너 & 강사 */}
        <p style={{ ...quickMenuSectionTitleStyle }}>파트너 & 강사</p>
        <div
          className="quick-menu-scroll"
          style={{
            display: 'flex',
            gap: '8px',
            width: '100%',
            marginBottom: '16px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {[
            { icon: <Users size={32} strokeWidth={1.2} color="#C9A84C" />, label: '파트너', particles: '💑', action: () => { window.history.pushState({}, '', '#partner'); setActiveTab('partner'); } },
            { icon: <Users size={32} strokeWidth={1.2} color="#C9A84C" />, label: '강사찾기', particles: '🕺', action: () => { localStorage.setItem('instructor_target_genre', '전체'); setView('instructors'); window.history.pushState({}, '', '/instructors'); window.dispatchEvent(new PopStateEvent('popstate')); setTimeout(() => { window.dispatchEvent(new CustomEvent('apply-instructor-filter')); }, 300); } },
            { textIcon: '1:1', label: '채팅문의', particles: '💬', action: () => window.open('https://open.kakao.com/o/gP43rNri', '_blank') },
            { icon: <MessageSquare size={32} strokeWidth={1.2} color="#C9A84C" />, label: '컨시어지', particles: '✨', action: () => window.dispatchEvent(new CustomEvent('open-chatbot')) },
            { icon: <Star size={32} strokeWidth={1.2} color="#C9A84C" />, label: '운명의좌표', particles: '🌟', action: () => { window.history.pushState({}, '', '#saju'); setShowSaju(true); } },
            { icon: <Heart size={32} strokeWidth={1.2} color="#C9A84C" />, label: '찜하기', particles: '❤️', action: () => { window.history.pushState({}, '', '#wishlist'); setShowWishlist(true); } },
            { icon: <Utensils size={32} strokeWidth={1.2} color="#C9A84C" />, label: '맛집뒷풀이', particles: '🍽', action: () => { window.history.pushState({}, '', '#restaurant'); setView('restaurant'); } },
            { icon: <Camera size={32} strokeWidth={1.2} color="#C9A84C" />, label: '라이브픽', particles: '📸', action: () => { window.history.pushState({}, '', '#community'); setView('community'); } },
            { icon: <CloudSun size={32} strokeWidth={1.2} color="#C9A84C" />, label: '오늘날씨', particles: '☀️', action: () => { window.history.pushState({}, '', '#weather'); setShowWeather(true); } },
            { icon: <Navigation size={32} strokeWidth={1.2} color="#C9A84C" />, label: '지능형경로', particles: '🧭', action: () => { window.history.pushState({}, '', '#route'); openAnalysis(false); } },
          ].map((item, idx) => (
            <motion.div key={`partner-${idx}`} whileTap={{ scale: 0.92 }} onClick={(e) => { triggerParticle(e, item.particles); item.action(); }} style={{ ...quickMenuFloatStyle, position: 'relative', width: 'calc(22% - 6px)', minWidth: 'calc(22% - 6px)', flexShrink: 0, scrollSnapAlign: 'start' }}>
              {item.textIcon ? (
                <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px', fontSize: 18, fontWeight: 900, color: '#C9A84C', letterSpacing: '-0.8px' }}>{item.textIcon}</motion.div>
              ) : (
                <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px' }}>{item.icon}</motion.div>
              )}
              <span style={{ ...quickMenuLabelStyle, fontSize: '11px' }}>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
      )}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            animate={{ opacity: 0, y: -60, x: (Math.random() - 0.5) * 80, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ position: 'fixed', left: p.x, top: p.y, fontSize: '20px', pointerEvents: 'none', zIndex: 9999 }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 기존 메인 가로 스크롤 퀵메뉴 — 3섹션 그리드로 대체
      <div className="quick-menu-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '8px 12px 12px', marginBottom: '24px', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
        ...
      </div>
      */}

      {activeTab === 'social' && (
      <>
      {/* 내 강사 섹션 — 메인 바탕화면 정리로 비활성
      {followedInstructors?.length > 0 && (
        <div style={{ padding: '0 12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>내 강사</span>
            <button
              type="button"
              onClick={() => setMyInstructorsOpen((open) => !open)}
              style={{
                padding: '5px 10px', borderRadius: 8,
                border: myInstructorsOpen ? '1px solid #C9A84C' : '1px solid #E2E8F0',
                background: myInstructorsOpen ? 'rgba(201,168,76,0.12)' : '#fff',
                color: myInstructorsOpen ? '#B8860B' : '#64748B',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {myInstructorsOpen ? '닫기' : '전체 보기'}
            </button>
          </div>
          {myInstructorsOpen && (
          <motion.div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 2 }}>
            {followedInstructors.map((inst) => (
              <motion.div
                key={inst.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  localStorage.setItem('selected_instructor_id', inst.id);
                  setView('instructors');
                  window.history.pushState({}, '', '/instructors');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #C9A84C', padding: 2, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <img src={inst.photo_url || 'https://via.placeholder.com/100'} alt={inst.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(inst.name || '').split(' ')[0]}
                </span>
              </motion.div>
            ))}
          </motion.div>
          )}
        </div>
      )}
      */}

      {/* 📌 [영역 B: 날짜 선택바 - 상단 고정(Sticky)] */}
      <div ref={stickyHeaderRef} style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: '4px 0 0', transition: 'all 0.3s' }}>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '8px', padding: '6px 10px 4px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="date-stream-bar">
          {fourteenDays.map((item) => {
            const isSelected = selectedDate === item.fullDate;
            const isHoliday = item.dayOfWeek === 0 || (item.month === '5' && item.date === '5');
            const isSaturday = item.dayOfWeek === 6;
            const dayColor = isSelected ? '#fff' : (isHoliday ? '#FF1744' : (isSaturday ? '#FF1744' : '#94A3B8'));
            const labelColor = isSelected ? '#FF1744' : (isHoliday ? '#FF1744' : (isSaturday ? '#FF1744' : '#94A3B8'));
            
            // 페스티벌, 부트캠프, 파티 존재 여부 확인
            const dayPartyCount = partiesOnDate(calendarParties, item.fullDate).length;
            const dayBootCount = bootcampsOnDate(calendarBootcamps, item.fullDate).length;
            const dayFestCount = festivalsOnDate(calendarFestivals, item.fullDate).length;
            const hasEvent = dayPartyCount + dayBootCount + dayFestCount > 0;

            return (
              <div key={item.fullDate}
                onClick={() => {
                  console.log('클릭한 날짜:', item.fullDate);
                  if (selectedDate === item.fullDate) {
                    setIsFilterBarVisible(v => !v);
                  } else {
                    setSelectedDate(item.fullDate);
                    setActiveDateGenre('전체');
                    setIsFilterBarVisible(true);
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '13.5%', cursor: 'pointer', position: 'relative', paddingBottom: '6px' }}
              >
                <span style={{ fontSize: '10px', fontWeight: '700', color: labelColor, marginBottom: '2px' }}>{item.dayName}</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#FF1744' : 'transparent', border: item.isToday && !isSelected ? '1px solid #FF1744' : 'none' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? '#fff' : dayColor }}>{item.date}</span>
                </div>
                {/* 단순화된 빨간 점 하나만 표시 */}
                <div style={{ height: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 0 }}>
                  {hasEvent && (
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E53935' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택된 날짜의 장르 필터 바 */}
        <AnimatePresence>
          {isFilterBarVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden', borderTop: '1px solid var(--color-border)' }}
            >
              <div
                style={{ display: 'flex', overflowX: 'auto', gap: '6px', padding: '8px 10px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {['전체', '바차타', '살사', '쥬크', '키좀바', '부트캠프', '페스티벌'].map(g => {
                  const isActive = activeDateGenre === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setActiveDateGenre(g)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: isActive ? 900 : 600,
                        backgroundColor: isActive ? '#E53935' : '#fff',
                        color: isActive ? '#fff' : '#64748B',
                        border: `1px solid ${isActive ? '#E53935' : '#E2E8F0'}`,
                        cursor: 'pointer',
                        flexShrink: 0,
                        boxShadow: isActive ? '0 2px 6px rgba(229,57,53,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>



      <div ref={scrollRef} style={{ width: '100%', background: 'var(--color-bg)' }}>
        <div style={{ minHeight: '101%' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '120px' }}>{Array(6).fill(0).map((_, i) => <div key={i} style={{ height: '140px', width: '100%', background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }} />)}</div>
          ) : (
            <div style={{ width: '100%', padding: '0 0 20px 0', backgroundColor: 'var(--color-bg)' }}>
              {(() => {
                const activeBootcamps = bootcampsOnDate(calendarBootcamps, selectedDate).map(b => ({
                  ...b,
                  _itemGenre: '부트캠프',
                  date: selectedDate,
                  broadRegion: b.region?.includes('서울') ? '서울' : (b.region?.includes('경기') || b.region?.includes('인천') ? '경기/인천' : (b.region?.includes('경상') ? '경상도' : (b.region?.includes('전라') ? '전라도' : (b.region?.includes('충청') ? '충청도' : '강원/제주')))),
                  locationName: b.venue || b.region,
                  fee: b.fee || b.price_info,
                  time: b.time || '13:00'
                }));

                const activeFestivals = festivalsOnDate(calendarFestivals, selectedDate).map(f => ({
                  ...f,
                  _itemGenre: '페스티벌',
                  date: selectedDate,
                  broadRegion: f.region?.includes('서울') ? '서울' : (f.region?.includes('경기') || f.region?.includes('인천') ? '경기/인천' : (f.region?.includes('경상') ? '경상도' : (f.region?.includes('전라') ? '전라도' : (f.region?.includes('충청') ? '충청도' : '강원/제주')))),
                  locationName: f.venue || f.region,
                  fee: f.price_info || f.fee,
                  time: f.time || '12:00'
                }));

                const activeParties = partiesOnDate(calendarParties, selectedDate).map(p => {
                  let genre = '소셜';
                  const b = p.b_ratio ?? 0;
                  const s = p.s_ratio ?? 0;
                  const j = p.j_ratio ?? 0;
                  const k = p.k_ratio ?? 0;
                  const m = Math.max(b, s, j, k);
                  if (m > 0) {
                    if (m === b) genre = '바차타';
                    else if (m === s) genre = '살사';
                    else if (m === j) genre = '쥬크';
                    else if (m === k) genre = '키좀바';
                  }
                  return {
                    ...p,
                    _itemGenre: genre
                  };
                });

                // 통합된 해당 날짜의 모든 이벤트
                const unifiedDayEvents = [...activeParties, ...activeBootcamps, ...activeFestivals].filter(item => {
                  if (activeDateGenre === '전체') return true;
                  return item._itemGenre === activeDateGenre;
                });

                // 전국 포스터 있는 모든 이벤트 추출 (날짜/장르 필터 무관)
                const globalBootcamps = (bootcamps || []).map(b => ({
                  ...b,
                  locationName: b.venue || b.region,
                  _table: 'bootcamps'
                }));
                const globalFestivals = (festivals || []).map(f => ({
                  ...f,
                  locationName: f.venue || f.region,
                  _table: 'festivals'
                }));
                const globalParties = (parties || []).map(p => ({
                  ...p,
                  locationName: p.location_name || p.locations?.name || p.region,
                  _table: 'parties'
                }));

                const allGlobalEvents = [...globalParties, ...globalBootcamps, ...globalFestivals]
                  .filter(p => p.poster_url && p.poster_url.trim() !== '');

                // 중복된 포스터 URL 무조건 제거
                const uniqueGlobalEvents: typeof allGlobalEvents = [];
                const seenGlobalPosters = new Set<string>();
                for (const item of allGlobalEvents) {
                  if (!seenGlobalPosters.has(item.poster_url)) {
                    seenGlobalPosters.add(item.poster_url);
                    uniqueGlobalEvents.push(item);
                  }
                }

                // created_at 기준 최신 8개 정렬
                const newest8GlobalEvents = uniqueGlobalEvents
                  .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                  .slice(0, 8);

                return (
                  <>
                    {/* HOT PICK 비활성 — 날짜 → 지역 카드만 */}
                    {false && newest8GlobalEvents.length > 0 && (
                      <div style={{ margin: '0 0 24px', padding: '15px 0 20px', background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)', overflow: 'hidden' }}>
                        <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <h2 style={{ fontSize: '20px', fontWeight: '950', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ color: '#E53935' }}>HOT</span>
                                <span style={{ color: '#1E293B' }}>PICK</span>
                              </h2>
                              {/* <span style={{ fontSize: '18px' }}>🔥</span> */}
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>지금 가장 핫한 파티</span>
                          </div>
                          {/* 컨시어지 버튼 */}
                          <style>{`
                            @keyframes dot-blink {
                              0%, 100% { opacity: 1; }
                              50% { opacity: 0.2; }
                            }
                            .concierge-dot { animation: dot-blink 1.5s ease-in-out infinite; }
                          `}</style>
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot'))}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '8px 14px', borderRadius: 20,
                              background: '#F8FAFC', border: '1px solid #E2E8F0',
                              cursor: 'pointer', color: '#334155',
                              fontSize: 12, fontWeight: 700,
                            }}
                          >
                            <span className="concierge-dot" style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: '#E53935', display: 'inline-block', flexShrink: 0
                            }} />
                            Concierge
                          </button>
                        </div>
                        <style>{`
                          .hot-pick-track-premium {
                            display: flex;
                            width: max-content;
                            gap: 12px;
                            padding: 4px 20px 12px;
                            animation: hotPickMarqueePremium 35s linear infinite;
                          }
                          .hot-pick-track-premium:hover {
                            animation-play-state: paused;
                          }
                          @keyframes hotPickMarqueePremium {
                            0% { transform: translate3d(0, 0, 0); }
                            100% { transform: translate3d(calc(-50% - 6px), 0, 0); }
                          }
                        `}</style>
                        <div style={{ width: '100%', overflow: 'hidden' }}>
                          <div className="hot-pick-track-premium">
                            {[...newest8GlobalEvents, ...newest8GlobalEvents].map((item, idx) => (
                              <div
                                className="party-carousel-card"
                                {...partyCardZoomHandlers}
                                key={`${item.id}-${idx}`} 
                                onClick={async () => {
                                  openPartyWithAfterParty(item);
                                  if (item.id && item._table) {
                                    try {
                                      const currentClicks = item.click_count || 0;
                                      await supabase.from(item._table).update({ click_count: currentClicks + 1 }).eq('id', item.id);
                                    } catch (err) {}
                                  }
                                }} 
                                style={{ 
                                  width: '140px', 
                                  height: '210px', 
                                  flexShrink: 0, 
                                  borderRadius: '16px', 
                                  overflow: 'hidden', 
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)', 
                                  position: 'relative', 
                                  background: '#000', 
                                  cursor: 'pointer',
                                  ...partyCardZoomBaseStyle,
                                }}
                              >
                                <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Pick" />
                                
                                {/* NEW 뱃지 표시
                                <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, background: '#E53935', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                  NEW
                                </div>
                                */}

                                {/* 하단 그라데이션 오버레이 (검정) */}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 10px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'white' }}>
                                  <div style={{ fontSize: '11px', color: '#FFEB3B', fontWeight: 950, marginBottom: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{translateDynamicText(item.locationName, isEn)}</div>
                                  <div style={{ fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{translateDynamicText(item.title, isEn)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

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
                      const regions = ["경기/인천", "서울", "경상도", "전라도", "충청도", "강원/제주"];

                      return regions.map((regionName, idx) => {
                        const regionParties = unifiedDayEvents
                          .filter(p => REGION_FILTER[regionName](p))
                          .filter(p => {
                            if (filterGenre && GENRE_MAP[filterGenre]) {
                              if (!(p[GENRE_MAP[filterGenre].key] > 0)) return false;
                            }
                            return true;
                          })
                          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

                        const rollingParties = dedupePartiesByPoster(
                          regionParties.filter((p) => p.poster_url && String(p.poster_url).trim())
                        );

                        const isFirst = regionName === '경기/인천';
                        const weather = regionName === '서울' && weatherMap['서울'] ? { temperature: weatherMap['서울'].temp, icon: weatherMap['서울'].icon } : null;

                        return (
                          <React.Fragment key={regionName}>
                            <section
                              ref={isFirst ? regionListRef : null}
                              style={{ marginBottom: '24px', background: 'var(--color-card)' }}
                            >
                              <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-text-main)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span
                                    onClick={() => {
                                      if (regionName === '서울') {
                                        const now = Date.now();
                                        if (now - lastAdminTap < 2000) {
                                          const nextCount = adminTapCount + 1;
                                          if (nextCount >= 3) {
                                            setView('admin-portal');
                                            setAdminTapCount(0);
                                          } else {
                                            setAdminTapCount(nextCount);
                                          }
                                        } else {
                                          setAdminTapCount(1);
                                        }
                                        setLastAdminTap(now);
                                      }
                                    }}
                                    style={{ fontSize: '15px', fontWeight: '800', cursor: regionName === '서울' ? 'pointer' : 'default', userSelect: 'none', padding: '2px 4px' }}
                                  >
                                    {t(regionKeys[regionName] || regionName)}
                                  </span>
                                  {weather && regionName === '서울' && (
                                    <span style={{ fontSize: '12px', color: '#C9A84C', fontWeight: '600', marginLeft: '4px' }}>
                                      {weather.temperature}° {weather.icon}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', marginLeft: '4px' }}>
                                    {(() => {
                                      const d = new Date(selectedDate);
                                      return `${d.getMonth() + 1}/${d.getDate()} (${isEn ? DAYS_EN[d.getDay()] : DAYS_KOR[d.getDay()]})`;
                                    })()}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGridRegion(regionName);
                                    handleOpenModal(setShowGridModal, true);
                                  }}
                                  style={{ fontSize: '12px', fontWeight: '700', color: '#E53935', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                >
                                  {t('view_all')} <ChevronRight size={14} />
                                </button>
                              </div>

                              <div
                                className="region-scroll-container"
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  overflowX: 'auto',
                                  overflowY: 'hidden',
                                  gap: '12px',
                                  paddingTop: '10px',
                                  paddingRight: '16px',
                                  paddingBottom: '40px',
                                  paddingLeft: '16px',
                                  msOverflowStyle: 'none',
                                  scrollbarWidth: 'none',
                                  WebkitOverflowScrolling: 'touch',
                                  scrollSnapType: 'x mandatory',
                                  scrollPaddingLeft: '16px',
                                  scrollPaddingRight: '16px',
                                  // overscrollBehaviorX: 'contain',
                                  // scrollBehavior: 'smooth',
                                }}
                              >
                                {rollingParties.length === 0 ? (
                                  <div style={{ flexShrink: 0, width: '100%', padding: '50px', background: 'var(--color-bg)', borderRadius: '24px', textAlign: 'center', color: 'var(--color-text-sub)', fontSize: '13px', fontWeight: '900', border: '1px dashed #E2E8F0' }}>{t('no_parties')}</div>
                                ) : rollingParties.map(item => {
                                  const now = new Date();
                                  let isItemLive = false;
                                  if (normDate(item.date) === todayStr) {
                                    const startStr = (item.time?.split('-')[0] || '20:00').trim();
                                    const [sH, sM] = startStr.split(':').length === 2 ? startStr.split(':').map(Number) : [20, 0];
                                    const startDate = new Date();
                                    startDate.setHours(sH, sM, 0, 0);
                                    const endStr = item.time?.includes('-') ? item.time.split('-')[1].trim() : null;
                                    let endDate = new Date(startDate);
                                    if (endStr && endStr.includes(':')) {
                                      const [eH, eM] = endStr.split(':').map(Number);
                                      endDate.setHours(eH, eM + 30, 0, 0);
                                      if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
                                    } else {
                                      endDate.setHours(startDate.getHours() + 4, startDate.getMinutes() + 30, 0, 0);
                                    }
                                    const startWithBuffer = new Date(startDate.getTime() - 30 * 60 * 1000);
                                    isItemLive = now >= startWithBuffer && now <= endDate;
                                  }
                                  return (
                                    <div
                                      className="party-carousel-card region-carousel-card"
                                      {...partyCardZoomDesktopOnly}
                                      key={item.id}
                                      onClick={() => openPartyWithAfterParty(item)}
                                      style={{
                                        width: 'min(340px, calc(100vw - 56px))',
                                        flexShrink: 0,
                                        scrollSnapAlign: 'start',
                                        scrollSnapStop: 'always',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'stretch',
                                        background: 'var(--color-card)',
                                        border: '1px solid #FFE4E4',
                                        boxShadow: '0 4px 16px rgba(229, 57, 53, 0.08)',
                                        cursor: 'pointer',
                                        height: '150px',
                                        position: 'relative',
                                        boxSizing: 'border-box',
                                      }}
                                    >
                                      {/* 파티 카드 우측 상단 찜하기 하트 버튼 */}
                                      <button
                                        type="button"
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onClick={(e) => toggleWishlistParty(e, item)}
                                        style={{
                                          position: 'absolute',
                                          top: '10px',
                                          right: '10px',
                                          background: 'rgba(255, 255, 255, 0.85)',
                                          backdropFilter: 'blur(4px)',
                                          border: 'none',
                                          borderRadius: '50%',
                                          width: '28px',
                                          height: '28px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          zIndex: 10,
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}
                                      >
                                        {(() => {
                                          const isWish = wishlistParties.some(w => {
                                            if (typeof w === 'object' && w !== null) return w.id === item.id;
                                            return w === item.id;
                                          });
                                          return <Heart size={15} color={isWish ? '#FF4081' : '#FFCDD2'} fill={isWish ? '#FF4081' : '#FFCDD2'} />;
                                        })()}
                                      </button>

                                      {/* 포스터 이미지: 왼쪽 고정, 크기 110px x 150px */}
                                      <div style={{ width: '110px', height: '150px', flexShrink: 0, background: '#000' }}>
                                        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
                                      </div>

                                      {/* 오른쪽 정보 영역: 여성 감각으로 세련되게 정렬 */}
                                      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, boxSizing: 'border-box' }}>
                                        
                                        {/* 1. 장르 뱃지 (파스텔 핑크 + 딥 로즈) */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#D81B60', background: '#FFF0F5', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>
                                            {(() => {
                                              if (item._itemGenre && item._itemGenre !== '소셜') return item._itemGenre;
                                              const entries = Object.entries(GENRE_MAP).filter(([_, info]) => item[info.key] > 0)
                                              if (entries.length === 0) return '소셜'
                                              const sorted = [...entries].sort((a, b) => item[b[1].key] - item[a[1].key])
                                              if (sorted.length >= 2 && item[sorted[0][1].key] === item[sorted[1][1].key]) return `${sorted[0][0]} · ${sorted[1][0]}`
                                              return sorted[0][0]
                                            })()}
                                          </span>
                                          {isItemLive && (
                                            <span style={{ background: '#E53935', color: '#fff', fontSize: '9px', fontWeight: '950', padding: '2px 5px', borderRadius: '4px', animation: 'blink 1.5s infinite' }}>LIVE</span>
                                          )}
                                        </div>

                                        {/* 2. 파티명 (굵게, 크게, 아래 여백 6px) */}
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.5px', lineHeight: 1.2, marginTop: '2px', marginBottom: '6px' }}>
                                          {cleanTitle(item.title || '').replace(/^\[.*?\]\s*/, '').replace(/ㅣ\s*$/, '').trim()}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        {/* 3. 시간 아이콘 + 시간 (간격 4px) */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', color: '#1E293B', fontWeight: '500' }}>
                                          <Clock size={14} color="#1E293B" style={{ flexShrink: 0 }} />
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.time?.split('-')[0].trim() || '21:00'}
                                          </span>
                                          {isItemLive && (
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#FFB300', background: 'rgba(255,179,0,0.1)', padding: '1px 6px', borderRadius: '8px', marginLeft: 'auto' }}>
                                              {item.view_count || 0}
                                            </span>
                                          )}
                                        </div>

                                        {/* 4. 장소 아이콘 + 장소명 · 가격 및 지도 텍스트 링크 (간격 4px) */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#E53935', fontWeight: 'bold', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>
                                            <MapPin size={13} color="#E53935" style={{ flexShrink: 0 }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {translateDynamicText(item.locationName, isEn)}
                                            </span>
                                            <span style={{ opacity: 0.4, margin: '0 2px' }}>·</span>
                                            <span style={{ color: '#E53935', fontWeight: '900', flexShrink: 0 }}>
                                              {formatPrice(item.fee)}
                                            </span>
                                          </div>

                                          {/* 카카오맵 · 구글맵 텍스트 링크 (작고 조용하게 10px, 연한 회색) */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>
                                            <span
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const locQuery = encodeURIComponent(item.locationName || item.venue || '');
                                                window.open(`https://map.kakao.com/link/search/${locQuery}`);
                                              }}
                                              style={{ color: '#94A3B8', cursor: 'pointer', padding: '2px 0' }}
                                            >
                                              카카오맵
                                            </span>
                                            <span style={{ color: '#E2E8F0', fontSize: '9px' }}>·</span>
                                            <span
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const locQuery = encodeURIComponent(item.locationName || item.venue || '');
                                                window.open(`https://www.google.com/maps/search/${locQuery}`);
                                              }}
                                              style={{ color: '#94A3B8', cursor: 'pointer', padding: '2px 0' }}
                                            >
                                              구글맵
                                            </span>
                                          </div>
                                        </div>
                                        </div>

                                      </div>
                                    </div>
                                  )
                                })}
                              </div>



                            </section>

                            {/* 지방권 HOT PICK 별도 트랙은 최상단 통합 운영으로 삭제됨 */}
                          </React.Fragment>
                        );
                      });
                    })()}

                    <LiveExposureStrip
                      pool={dedupePartiesByPoster(
                        unifiedDayEvents.filter(
                          (p) => p.poster_url && String(p.poster_url).trim()
                        )
                      )}
                      selectedDate={selectedDate}
                      todayStr={todayStr}
                      onSelect={openPartyWithAfterParty}
                      cleanTitle={cleanTitle}
                      translateDynamicText={translateDynamicText}
                      isEn={isEn}
                    />
                  </>
                );
              })()}


            </div>
          )}
        </div>
      </div>
      </>
      )}

      <AnimatePresence>
        {showFullCalendar && (
          <>
            <motion.div className="modernized-calendar-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 170000 }} />
            <motion.div className="modernized-calendar-modal" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', bottom: '90px', left: '10px', right: '10px', background: 'var(--color-card)', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: 170001, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--color-border)', borderRadius: '2px', margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ fontSize: '24px', fontWeight: 950, color: 'var(--color-text-main)' }}>{selectedMonth}월</span><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setSelectedMonth(m => m > 1 ? m - 1 : 12)} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '10px', width: '36px', height: '36px', color: 'var(--color-text-main)' }}><ChevronLeft size={18} /></button><button onClick={() => setSelectedMonth(m => m < 12 ? m + 1 : 1)} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '10px', width: '36px', height: '36px', color: 'var(--color-text-main)' }}><ChevronRight size={18} /></button></div></div>
                <button onClick={handleCloseModal} style={{ background: 'var(--color-border)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)' }}>
                  <ChevronLeft size={28} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', minHeight: '350px' }}>
                {/* 달력 상단 범례 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-sub)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#E53935' }} /> 파티
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563EB' }} /> 부트캠프
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#9333EA' }} /> 페스티벌
                  </div>
                </div>
                <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
                  {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: d === '일' ? '#FF1744' : d === '토' ? '#FF1744' : '#999', padding: '5px 0' }}>{d}</div>)}
                  {allDatesInMonth.map((day) => {
                    if (!day.date) return <div key={Math.random()} />;
                    const isWeekend = day.dayName === '금' || day.dayName === '토';
                    const isSelected = selectedDate === day.fullDate;

                    const dayPartyList = partiesOnDate(calendarParties, day.fullDate);
                    const dayBootList = bootcampsOnDate(calendarBootcamps, day.fullDate);
                    const dayFestList = festivalsOnDate(calendarFestivals, day.fullDate);
                    const hasParty = dayPartyList.length > 0;
                    const hasBootcamp = dayBootList.length > 0;
                    const hasFestival = dayFestList.length > 0;
                    const dayTotalCount = dayPartyList.length + dayBootList.length + dayFestList.length;

                    return (
                      <div
                        key={day.fullDate}
                        onClick={() => {
                          if (day.fullDate < todayStr) return;
                          if (selectedDate === day.fullDate) {
                            setIsModalFilterVisible(v => !v);
                          } else {
                            setSelectedDate(day.fullDate);
                            setActiveDateGenre('전체');
                            setIsModalFilterVisible(true);
                            setIsFilterBarVisible(true);
                          }
                        }}
                        style={{ height: '46px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: '15px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#fff' : (day.dayName === '일' ? '#FF1744' : (isWeekend ? '#FF1744' : 'var(--color-text-main)')), backgroundColor: isSelected ? '#FF1744' : 'transparent', borderRadius: '14px', cursor: day.fullDate < todayStr ? 'default' : 'pointer', opacity: day.fullDate < todayStr ? 0.3 : 1 }}
                      >
                        <span style={{ lineHeight: 1 }}>{day.date}</span>
                        <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '4px', height: '4px', alignItems: 'center', justifyContent: 'center' }}>
                          {hasParty && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#E53935', boxShadow: isSelected ? '0 0 0 0.5px #fff' : 'none' }} />}
                          {hasBootcamp && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#2563EB', boxShadow: isSelected ? '0 0 0 0.5px #fff' : 'none' }} />}
                          {hasFestival && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#9333EA', boxShadow: isSelected ? '0 0 0 0.5px #fff' : 'none' }} />}
                        </div>
                        {dayTotalCount > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '2px',
                            right: '4px',
                            fontSize: '9px',
                            fontWeight: 900,
                            color: isSelected ? '#fff' : '#E53935',
                          }}>
                            {dayTotalCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </motion.div>

                {/* 달력 아래 장르 필터 바 및 요약 정보 */}
                <AnimatePresence>
                  {isModalFilterVisible && (() => {
                    const selParties = partiesOnDate(calendarParties, selectedDate);
                    const selBootcamps = bootcampsOnDate(calendarBootcamps, selectedDate);
                    const selFestivals = festivalsOnDate(calendarFestivals, selectedDate);

                    // 1. 이벤트 수
                    const partyCount = selParties.length;
                    const bootcampCount = selBootcamps.length;
                    const festivalCount = selFestivals.length;

                    // 2. 지역별 카운트 (통합된 모든 이벤트 대상)
                    const regionCounts = {};
                    const getRegionName = (item) => {
                      if (item.broadRegion) return item.broadRegion;
                      const r = item.region || item.address || item.locationName || item.venue || '';
                      if (r.includes('서울')) return '서울';
                      if (r.includes('경기') || r.includes('인천')) return '경기/인천';
                      if (r.includes('경상') || r.includes('부산') || r.includes('대구') || r.includes('울산')) return '경상도';
                      if (r.includes('전라') || r.includes('광주')) return '전라도';
                      if (r.includes('충청') || r.includes('대전') || r.includes('세종')) return '충청도';
                      return '강원/제주';
                    };
                    [...selParties, ...selBootcamps, ...selFestivals].forEach(item => {
                      const r = getRegionName(item);
                      regionCounts[r] = (regionCounts[r] || 0) + 1;
                    });
                    const orderRegions = ['경기/인천', '서울', '경상도', '전라도', '충청도', '강원/제주'];
                    const availableRegions = orderRegions.filter(r => regionCounts[r] > 0);

                    // 3. 장르별 카운트 (파티 대상)
                    const genreCounts = { '바차타': 0, '살사': 0, '쥬크': 0, '키좀바': 0 };
                    selParties.forEach(p => {
                      let g = '소셜';
                      const b = p.b_ratio ?? 0;
                      const s = p.s_ratio ?? 0;
                      const j = p.j_ratio ?? 0;
                      const k = p.k_ratio ?? 0;
                      const m = Math.max(b, s, j, k);
                      if (m > 0) {
                        if (m === b) g = '바차타';
                        else if (m === s) g = '살사';
                        else if (m === j) g = '쥬크';
                        else if (m === k) g = '키좀바';
                      }
                      if (genreCounts[g] !== undefined) {
                        genreCounts[g]++;
                      }
                    });
                    const orderGenres = ['바차타', '살사', '쥬크', '키좀바'];
                    const availableGenres = orderGenres.filter(g => genreCounts[g] > 0);

                    return (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}
                      >
                        {/* 요약 정보 카드 */}
                        <div style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '16px',
                          padding: '12px 16px',
                          marginBottom: '12px',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#334155'
                        }}>
                          {/* 1. 이벤트 수 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                            <span style={{ color: '#E53935' }}>📅</span>
                            <span>파티 {partyCount}건 / 부트캠프 {bootcampCount}건 / 페스티벌 {festivalCount}건</span>
                          </div>

                          {/* 2. 지역별 */}
                          {availableRegions.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontWeight: 600, marginTop: '2px' }}>
                              {availableRegions.map((r, idx) => (
                                <React.Fragment key={r}>
                                  <span style={{ color: '#1E293B' }}>{r} <span style={{ color: '#E53935', fontWeight: 800 }}>{regionCounts[r]}</span>건</span>
                                  {idx < availableRegions.length - 1 && <span style={{ color: '#CBD5E1' }}>·</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          )}

                          {/* 3. 장르별 */}
                          {availableGenres.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontWeight: 600, marginTop: '2px' }}>
                              {availableGenres.map((g, idx) => (
                                <React.Fragment key={g}>
                                  <span style={{ color: '#1E293B' }}>{g} <span style={{ color: '#E53935', fontWeight: 800 }}>{genreCounts[g]}</span>건</span>
                                  {idx < availableGenres.length - 1 && <span style={{ color: '#CBD5E1' }}>·</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                <div style={{ marginTop: '24px' }}>
                  <button onClick={handleCloseModal} style={{ width: '100%', height: '50px', borderRadius: '16px', background: '#1E293B', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>확인 완료</button>
                </div>
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
                      if (gridRegion === 'more') return '더보기';
                      const regionKeys = {
                        '서울': 'region_seoul', '경기/인천': 'region_gyeonggi_incheon',
                        '경상도': 'region_gyeongsang', '전라도': 'region_jeolla',
                        '충청도': 'region_chungcheong', '강원/제주': 'region_gangwon_jeju'
                      };
                      return t(regionKeys[gridRegion] || gridRegion);
                    })()} {gridRegion !== 'more' && (isEn ? 'All Posters' : '전체 포스터')}
                  </div>
                </div>
              </div>

              {/* 그리드 본문 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '2px', background: 'var(--color-bg)' }}>
                {gridRegion === 'more' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '20px' }}>
                    {[
                      { icon: <CloudSun size={32} color="#1976D2" />, label: '오늘날씨', action: () => setShowWeather(true) },
                      { icon: <Heart size={32} color="#7B1FA2" />, label: '찜하기', action: () => setShowWishlist(true) },
                      { icon: <Navigation size={32} color="#303F9F" />, label: '지능형경로', /* badge: 'LIVE', */ action: () => openAnalysis(false) },
                      { icon: <Star size={32} color="#F9A825" />, label: '운명의좌표', action: () => setShowSaju(true) },
                      { icon: <MapPin size={32} color="#0097A7" />, label: '주변주차', action: () => setView('parking') },
                    ].map((item, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div style={{
                          borderRadius: '16px', padding: '2px',
                          background: 'linear-gradient(135deg, #CBD5E1, #E2E8F0, #CBD5E1)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.04)'
                        }}>
                          <motion.div
                            whileTap={{ scale: 0.92 }}
                            onClick={() => { setShowGridModal(false); setTimeout(() => { item.action(); }, 300); }}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              gap: '10px', cursor: 'pointer', borderRadius: '14px',
                              padding: '20px 10px', background: '#fff'
                            }}
                          >
                            {item.icon}
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', textAlign: 'center', wordBreak: 'keep-all' }}>
                              {item.label}
                            </span>
                          </motion.div>
                        </div>
                        {item.badge && (
                          <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#E53935', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px', zIndex: 1 }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
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
                          className="party-carousel-card"
                          {...partyCardZoomHandlers}
                          key={item.id}
                          onClick={() => openPartyWithAfterParty(item)}
                          style={{ aspectRatio: '1 / 1.4', overflow: 'hidden', background: 'var(--color-card)', position: 'relative', ...partyCardZoomBaseStyle }}
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
                )}
                {gridRegion !== 'more' && (() => {
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
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .filter-scroll::-webkit-scrollbar { display: none; }
        .region-scroll-container {
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 16px;
          scroll-padding-right: 16px;
          /* overscroll-behavior-x: contain; */
          /* touch-action: pan-x pan-y; */
        }
        .region-scroll-container::-webkit-scrollbar { display: none; }
        .region-scroll-container .region-carousel-card {
          scroll-snap-align: start;
          scroll-snap-stop: always;
          /* touch-action: manipulation; */
        }
        @media (hover: hover) {
          .region-scroll-container .region-carousel-card {
            transition: transform 0.25s ease;
          }
        }
        /* .party-carousel-card:hover/active — JS onMouseEnter·onTouchStart 로 줌 처리 */
        /*
        .party-carousel-card {
          transform-origin: center center;
          will-change: transform;
        }
        .party-carousel-card:hover,
        .party-carousel-card:active {
          transform: scale(1.05) translateY(-4px);
          z-index: 5;
          position: relative;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2) !important;
        }
        .hot-pick-track-premium .party-carousel-card:hover,
        .hot-pick-track-premium .party-carousel-card:active {
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.32) !important;
        }
        .region-scroll-container .party-carousel-card:hover,
        .region-scroll-container .party-carousel-card:active {
          box-shadow: 0 12px 28px rgba(229, 57, 53, 0.25) !important;
        }
        */
        .date-stream-bar::-webkit-scrollbar { display: none; }
        .quick-menu-scroll::-webkit-scrollbar { display: none; }
        .hot-pick-track { display: flex; animation: hotPickScroll 40s linear infinite; }
        @keyframes hotPickScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* 외부 중복 렌더링된 구형 달력 모달 완벽 차단 */
        div[style*="170001"]:not(.modernized-calendar-modal) {
          display: none !important;
        }
        div[style*="170000"]:not(.modernized-calendar-backdrop) {
          display: none !important;
        }
      `}</style>

      {/* afterPartySheet UI removed */}
    </div>
  )
}

export default HomePage
