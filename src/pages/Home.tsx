import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, MapPin, Calendar, Clock, User, Users, Music, ChevronRight, ChevronDown, ShieldCheck, X, Home as HomeIcon, ChevronLeft, CloudSun, Utensils, Zap, PlusCircle, Languages, Bell, Globe, Navigation, CalendarDays, Star, Camera, MessageSquare, Tent, Loader2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import LiveCount from '../components/LiveCount'
import { fetchBarStatsMap, bumpBarClickCount } from '../lib/barStatsQuery'
import { KMA_REGION_COORDS, fetchWeatherForecast, parseKmaWeather, HOME_REGION_MAP } from '../utils/kmaApi'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE } from '../lib/BarLib'
import { normDate, getKSTCalendarTodayStr, isApprovedParty } from '../lib/dateNorm'
import { logSupabaseError } from '../lib/locationsQuery'
import {
  dedupeVenueList,
  normalizeVenueAddressKey,
  normalizeVenueNameKey,
} from '../lib/venueDedupe'
import VenueDetailModal from '../components/VenueDetailModal'
import BarRegisterFormModal from '../components/BarRegisterFormModal'
import HomeHeroTagline from '../components/HomeHeroTagline'
import { navigate as historyNavigate, parseAppState, pushOverlay } from '../lib/appHistory'
import { formatPartyFeeDisplay } from '../lib/partyFeeDisplay'
import PartyFeeChips from '../components/PartyFeeChips'

function navigate(path, options = {}) {
  const { replace: _replace, ...rest } = options;
  historyNavigate(path, rest);
}

function navigateHomeTab(homeTab) {
  const path = window.location.pathname;
  if (path !== '/') {
    navigate('/', { homeTab: homeTab ?? null });
    return;
  }
  navigate('/', { homeTab: homeTab ?? null, force: true });
}

function closeOverlayNav() {
  if (parseAppState(window.history.state)?.overlay) {
    window.history.back();
    return true;
  }
  return false;
}
import { Z } from '../constants/zLayers'
import { DEFAULT_AVATAR_IMAGE, DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../constants/imageAssets'
import gangturnPhoto from '../assets/gangturn_photo.png'
import ggomaeyaPhoto from '../assets/ggomaeya_photo.jpg'
import noriterPhoto from '../assets/noriter_photo.png'
import latinPhoto from '../assets/latin_photo.png'
import macondoPhoto from '../assets/macondo_photo.png'
import bonitaPhoto from '../assets/bonita_photo.png'
import buenaPhoto from '../assets/buena_photo.png'
import hongturnPhoto from '../assets/hongturn_photo.png'
import bibigoPhoto from '../assets/bibigo_photo.png'
import { PartyMusicRatioLine, SocialDateGenreFilterBar, formatPartyMusicRatio } from './Social'

const QUICK_MENU_SVG = {
  partyRegister: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <circle cx="13" cy="27" r="5" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
      <line x1="18" y1="27" x2="18" y2="6" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 6 Q28 8 26 16 Q22 13 18 13" stroke="#c9a84c" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  classRegister: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <circle cx="16" cy="12" r="6" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
      <path d="M4 30 Q4 22 16 22 Q28 22 28 30" stroke="#c9a84c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="26" y1="10" x2="32" y2="10" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="7" x2="29" y2="13" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  concierge: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <rect x="4" y="6" width="28" height="18" rx="4" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
      <path d="M12 24 L10 30 L18 24" stroke="#c9a84c" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="10" y1="13" x2="26" y2="13" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="18" x2="20" y2="18" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <rect x="4" y="6" width="28" height="26" rx="3" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
      <line x1="4" y1="14" x2="32" y2="14" stroke="#c9a84c" strokeWidth="1.5" />
      <line x1="12" y1="3" x2="12" y2="9" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="3" x2="24" y2="9" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="20" x2="13" y2="20" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="26" x2="13" y2="26" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="20" x2="26" y2="20" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="26" x2="26" y2="26" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  language: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r="13" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
      <ellipse cx="18" cy="18" rx="6" ry="13" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
      <line x1="5" y1="18" x2="31" y2="18" stroke="#c9a84c" strokeWidth="1.5" />
      <line x1="7" y1="11" x2="29" y2="11" stroke="#c9a84c" strokeWidth="1" />
      <line x1="7" y1="25" x2="29" y2="25" stroke="#c9a84c" strokeWidth="1" />
    </svg>
  ),
};

function QuickMenuIconCircle({ children }) {
  return <span className="home-quick-menu-icon-circle">{children}</span>;
}

/** 메인 홈 지역 pill 순서 (표시 개수는 DB 분류 결과) */
const HOME_REGIONS_ORDER = [
  '서울',
  '경인',
  '경상도',
  '충청도',
  '전라도',
  '강원/제주',
];

/** 추천 행사 포스터 썸네일 — index.css 96/108px 기준 1.3배 */
const HOME_FEATURED_POSTER_SCALE = 1.3;
const HOME_FEATURED_THUMB_SIZE = Math.round(96 * HOME_FEATURED_POSTER_SCALE);
const HOME_FEATURED_THUMB_SIZE_WIDE = Math.round(108 * HOME_FEATURED_POSTER_SCALE);

/** Social BAR — 위치 실패 시 전국 노출 */
const SOCIAL_BAR_REGION_ALL = '전체';

const BAR_VIEW_COUNT_DELAY_MS = 7000;
const viewedBarStorageKey = (barId) => `viewed_bar_${barId}`;
const isPersistedLocationId = (id) => {
  const s = String(id ?? '');
  return s.length > 0 && !/^bar-\d+$/i.test(s);
};
const formatBarViewCountLine = (viewCount) => `view ${Number(viewCount) || 0}명`;

/** GPS 기준 가장 가까운 지역 pill (경기 → 경인) */
const SOCIAL_BAR_GEO_REGIONS = [...HOME_REGIONS_ORDER];

/** GPS 좌표 → 지역 (좁은 서울 먼저, 넓은 경인=수도권·경기, 이후 거리) */
const SOCIAL_BAR_REGION_BOXES = [
  { name: '서울', minLat: 37.41, maxLat: 37.70, minLng: 126.76, maxLng: 127.18 },
  { name: '경인', minLat: 37.02, maxLat: 37.78, minLng: 126.28, maxLng: 127.58 },
  { name: '경상도', minLat: 34.65, maxLat: 36.55, minLng: 127.55, maxLng: 129.65 },
  { name: '전라도', minLat: 34.10, maxLat: 36.25, minLng: 125.75, maxLng: 127.55 },
  { name: '충청도', minLat: 35.60, maxLat: 37.45, minLng: 126.50, maxLng: 128.30 },
  { name: '강원/제주', minLat: 33.05, maxLat: 38.45, minLng: 125.95, maxLng: 129.50 },
];

const SOCIAL_BAR_REGION_CENTROIDS = {
  서울: { lat: 37.5665, lng: 126.978 },
  경인: { lat: 37.32, lng: 126.95 },
  경상도: { lat: 35.18, lng: 129.08 },
  충청도: { lat: 36.35, lng: 127.77 },
  전라도: { lat: 35.82, lng: 127.15 },
  '강원/제주': { lat: 37.75, lng: 128.9 },
  제주: { lat: 33.49, lng: 126.53 },
};

const socialBarHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Social BAR 서울 탭 — 우선 노출 순서 (name 기준) */
const SEOUL_SOCIAL_BAR_ORDER = [
  { match: (key) => key === '라틴' },
  { match: (key) => key.includes('보니타') || key.includes('보니따') },
  { match: (key) => key.includes('홍턴') },
  { match: (key) => key.includes('강남턴') || key === '강턴' },
  { match: (key) => key.includes('마콘도') },
];

const getSeoulSocialBarSortRank = (bar) => {
  const key = normalizeVenueNameKey(bar?.name || '');
  const priorityIdx = SEOUL_SOCIAL_BAR_ORDER.findIndex((rule) => rule.match(key));
  if (priorityIdx >= 0) return priorityIdx;
  const sortOrder = Number(bar?.sort_order);
  if (Number.isFinite(sortOrder)) return 100 + sortOrder;
  return 1000;
};

const sortSeoulSocialBars = (bars) =>
  [...bars].sort((a, b) => {
    const diff = getSeoulSocialBarSortRank(a) - getSeoulSocialBarSortRank(b);
    if (diff !== 0) return diff;
    return (a.name || '').localeCompare(b.name || '', 'ko');
  });

const pickNearestSocialBarRegion = (lat, lng) => {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;

  for (const box of SOCIAL_BAR_REGION_BOXES) {
    if (la >= box.minLat && la <= box.maxLat && ln >= box.minLng && ln <= box.maxLng) {
      return box.name;
    }
  }

  let best = null;
  let minDist = Infinity;
  SOCIAL_BAR_GEO_REGIONS.forEach((name) => {
    const c = SOCIAL_BAR_REGION_CENTROIDS[name];
    if (!c) return;
    const d = socialBarHaversineKm(la, ln, c.lat, c.lng);
    if (d < minDist) {
      minDist = d;
      best = name;
    }
  });
  return best;
};

const mapBarLibRegionToPill = (regionLabel) => {
  const r = `${regionLabel || ''}`;
  if (r.includes('서울')) return '서울';
  if (r.includes('경기') || r.includes('인천')) return '경인';
  if (r.includes('경상') || r.includes('부산') || r.includes('대구')) return '경상도';
  if (r.includes('전라') || r.includes('광주')) return '전라도';
  if (r.includes('충청') || r.includes('대전') || r.includes('세종')) return '충청도';
  if (r.includes('강원') || r.includes('제주')) return '강원/제주';
  return null;
};

const classifyVenueLocation = (loc) => {
  const text = `${loc.address || ''}`.toLowerCase();
  const nameText = `${loc.name || ''}`.toLowerCase();
  const combined = `${text} ${nameText}`;
  let region = '기타';

  if (combined.includes('서울')) region = '서울';
  else if (combined.includes('경기') || combined.includes('인천')) region = '경인';
  else if (
    combined.includes('경상') || combined.includes('부산') || combined.includes('대구') ||
    combined.includes('울산') || combined.includes('창원') || combined.includes('포항') ||
    combined.includes('구미') || combined.includes('김천') || combined.includes('김해')
  ) region = '경상도';
  else if (
    combined.includes('전라') || combined.includes('광주') || combined.includes('전북') ||
    combined.includes('전남') || combined.includes('여수') || combined.includes('순천') ||
    combined.includes('목포')
  ) region = '전라도';
  else if (
    combined.includes('충청') || combined.includes('대전') || combined.includes('충북') ||
    combined.includes('충남') || combined.includes('세종') || combined.includes('청주') ||
    combined.includes('천안')
  ) region = '충청도';
  else if (combined.includes('강원') || combined.includes('제주') || combined.includes('춘천') || combined.includes('원주')) {
    region = '강원/제주';
  } else {
    const fromMaster = BAR_DATABASE.find((b) => normalizeVenueNameKey(b.name) === normalizeVenueNameKey(loc.name));
    const mapped = fromMaster ? mapBarLibRegionToPill(fromMaster.region) : null;
    region = mapped || '기타';
  }

  const masterMatch = BAR_DATABASE.find((b) => {
    const locName = normalizeVenueNameKey(loc.name);
    const barName = normalizeVenueNameKey(b.name);
    if (locName && barName && locName === barName) return true;
    if (locName && (b.aliases || []).some((a) => normalizeVenueNameKey(a) === locName)) return true;
    const locAddr = normalizeVenueAddressKey(loc.address);
    const barAddr = normalizeVenueAddressKey(b.address);
    return locAddr && barAddr && locAddr === barAddr;
  });
  if (masterMatch) {
    const mapped = mapBarLibRegionToPill(masterMatch.region);
    if (mapped) region = mapped;
  }

  const nameKey = normalizeVenueNameKey(loc.name);
  const isGangturn = nameKey.includes('강남턴') || nameKey === '강턴';
  const isGgomaeya = nameKey.includes('꼼애야');
  const isNoriter = nameKey.includes('놀이터');
  const isLatin = nameKey === '라틴';
  const isMacondo = nameKey.includes('마콘도');
  const isBonita = nameKey.includes('보니따');
  const isBuena = nameKey.includes('부에나') && !nameKey.includes('비스타');
  const isHongturn = nameKey.includes('홍턴');
  const isBibigo = nameKey.includes('비비고');

  let finalImg = loc.image_url;
  if (isGangturn) finalImg = gangturnPhoto;
  else if (isGgomaeya) finalImg = ggomaeyaPhoto;
  else if (isNoriter) finalImg = noriterPhoto;
  else if (isLatin) finalImg = latinPhoto;
  else if (isMacondo) finalImg = macondoPhoto;
  else if (isBonita) finalImg = bonitaPhoto;
  else if (isBuena) finalImg = buenaPhoto;
  else if (isHongturn) finalImg = hongturnPhoto;
  else if (isBibigo) finalImg = bibigoPhoto;

  return {
    ...loc,
    region,
    image_url: finalImg,
    instagram_url: isGangturn ? 'https://www.instagram.com/turn_latinclub_no.1?igsh=MW94ajh3OHZ3NDZ6bg%3D%3D' : loc.instagram_url
  };
};

const buildVenueListFromDatabase = () =>
  dedupeVenueList(
    BAR_DATABASE.map((bar, index) =>
      classifyVenueLocation({
        id: `bar-${index}`,
        name: bar.name,
        address: bar.address,
        image_url: null,
        kakao_url: null,
        instagram_url: null,
      })
    )
  );

const buildPartyShareCard = (item) => {
  const posterUrl = item?.poster_url && String(item.poster_url).trim();
  if (!posterUrl) return null;
  const title = (item.title || '').split(' ㅣ ')[0].replace(/^\[.*?\]\s*/, '').trim() || '라틴·소셜 파티';
  const loc = item.locationName || item.location_name || item.studio_name || item.venue || '';
  const fee = item.fee ?? item.price_info ?? '';
  const timeRaw = item.time?.split('-')[0]?.trim() || '';
  const line1 = [loc, fee].filter(Boolean).join(' · ');
  const line2 = timeRaw ? [timeRaw].join(' · ') : '';
  const lines = [line1, line2].filter(Boolean);
  return { src: posterUrl, title, desc: lines.join('\n'), lines, feedDesc: [item.date, loc, fee].filter(Boolean).join(' · '), partyId: item.id };
};
// import { getAfterPartySpotsForParty, openAfterPartyMap } from '../data/afterPartySpots'

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];
const DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const GENRE_MAP = {
  '바차타': { key: 'b_ratio', label: 'B', label_en: 'Bachata', color: '#FF1744' },
  '살사': { key: 's_ratio', label: 'S', label_en: 'Salsa', color: '#FF1744' },
  '쥬크': { key: 'j_ratio', label: 'J', label_en: 'Zouk', color: '#FF1744' },
  '키좀바': { key: 'k_ratio', label: 'K', label_en: 'Kizomba', color: '#FF1744' },
};

/** 소셜 파티 카드 음악 비율(b_ratio 등 → B4:S2) — src/pages/Social.tsx */
const renderPartyMusicRatioRow = (item) => (
  <PartyMusicRatioLine
    item={item}
    style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}
  />
);

const SEOUL_HINT = /서울|강남|홍대|잠실|건대|신림|서초|영등포|성수|이태원|왕십리|목동|구로/;

const REGION_FILTER = {
  '서울': (p) =>
    p.broadRegion === '서울' ||
    SEOUL_HINT.test(`${p.title || ''} ${p.address || ''} ${p.region || ''} ${p.location_name || ''} ${p.locationName || ''}`),
  '경인': (p) => p.broadRegion === '경인' || p.broadRegion === '경기/인천',
  '경상도': (p) => p.broadRegion === '경상도',
  '전라도': (p) => p.broadRegion === '전라도',
  '충청도': (p) => p.broadRegion === '충청도',
  '강원/제주': (p) => p.broadRegion === '강원/제주',
  // 별칭/도시별 매핑 (필터링 충돌 방지)
  '인천': (p) => p.broadRegion === '경인',
  '부산': (p) => p.broadRegion === '경상도',
  '대구': (p) => p.broadRegion === '경상도',
  '대전': (p) => p.broadRegion === '충청도',
  '광주': (p) => p.broadRegion === '전라도',
  '기타': (p) => true
};
const MAIN_REGIONS = ['경인', '서울', '경상', '전라', '충청', '강원/제주'];
const REGION_MAP_EN = {
  '서울': 'Seoul', '경인': 'Gyeonggi/Incheon', '경상도': 'Gyeongsang',
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

/** KST 오늘 (새벽 4시 전 = 전날, App·노출·달력 스크롤과 동일) */
const getKSTTodayStr = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const pick = (type) => parts.find((p) => p.type === type)?.value ?? '';
  let y = pick('year');
  let m = pick('month');
  let d = pick('day');
  const hour = parseInt(pick('hour'), 10);
  if (hour < 4) {
    const rolled = new Date(`${y}-${m}-${d}T12:00:00+09:00`);
    rolled.setDate(rolled.getDate() - 1);
    const kst = rolled.toLocaleString('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [rm, rd, ry] = kst.split('/');
    y = ry;
    m = rm;
    d = rd;
  }
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

/** parties 행: title 키워드로 슬롯 분류 (DB에 genre/category 없음 — RegisterForm·App select('*') 기준) */
const partyRowIsBootcamp = (row) => String(row?.title ?? '').includes('부트캠프');

const partyRowIsFestival = (row) => String(row?.title ?? '').includes('페스티벌');

const partyRowMatchesSlot = (row, slot) => {
  const isBoot = partyRowIsBootcamp(row);
  const isFest = partyRowIsFestival(row);
  if (slot === '소셜') return !isBoot && !isFest;
  if (slot === '부트캠프') return isBoot;
  if (slot === '페스티벌') return isFest;
  return false;
};

const posterUrlsFromRows = (rows) =>
  [...new Set((rows || []).map((r) => String(r?.poster_url || '').trim()).filter(Boolean))];

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

      <AnimatePresence initial={false}>
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
                <div
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
                </div>
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
  const displayFee = formatPartyFeeDisplay(item.fee, { fallback: '문의' });

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
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div style={{ position: 'relative', height: '110px', width: '100%', overflow: 'hidden' }}>
      <AnimatePresence initial={false}>
        {items.length > 0 && (
          <motion.div
            key={items[index]?.id ?? index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', width: '100%' }}
          >
            <PartyCard item={items[index]} onSelect={onSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterBar = ({ filterRegion, setFilterRegion, filterGenre, setFilterGenre }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const regions = ['경인', '서울', '경상도', '전라도', '충청도', '강원/제주'];
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
  parties, bootcamps, festivals, lessons, loading: partiesLoading, selectedMonth, setSelectedMonth, selectedWeek, setSelectedWeek,
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
  homeTab = null,
  onHomeTabChange,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const lang = isEn ? 'en' : 'ko';
  const activeTab = homeTab ?? null;
  const [regionCounts, setRegionCounts] = useState({
    seoul: 0, seoulDistricts: '',
    metro: 0, metroDistricts: '',
    national: 0, nationalDistricts: ''
  });
  const [particles, setParticles] = useState<{id: number, x: number, y: number, emoji: string}[]>([]);
  const [socialIdx, setSocialIdx] = useState(0);
  const [bootcampIdx, setBootcampIdx] = useState(0);
  const [festivalIdx, setFestivalIdx] = useState(0);
  const [activePosterSlot, setActivePosterSlot] = useState('social');

  const navigateAppPath = (path) => navigate(path);

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
    onHomeTabChange?.(tab);
    if (tab === 'social') {
      setShowPartner(false);
      navigateHomeTab('social');
    } else if (tab === 'partner') {
      setShowPartner(true);
      navigateHomeTab('partner');
    } else if (tab === null) {
      setShowPartner(false);
      if (window.location.pathname === '/') {
        navigateHomeTab(null);
      }
    }
  };

  const featuredTodayStr = useMemo(() => getKSTCalendarTodayStr(), []);

  const socialFeaturedPool = useMemo(() => (
    (parties || [])
      .filter((p) => isApprovedParty(p) && normDate(p.date) >= featuredTodayStr && p.poster_url && partyRowMatchesSlot(p, '소셜'))
      .sort((a, b) => normDate(a.date).localeCompare(normDate(b.date)))
  ), [parties, featuredTodayStr]);

  const bootcampFeaturedPool = useMemo(() => (
    (bootcamps || [])
      .filter((b) => b.poster_url && normDate(b.start_date) >= featuredTodayStr)
      .sort((a, b) => normDate(a.start_date).localeCompare(normDate(b.start_date)))
  ), [bootcamps, featuredTodayStr]);

  const festivalFeaturedPool = useMemo(() => (
    (festivals || [])
      .filter((f) => f.poster_url && normDate(f.start_date) >= featuredTodayStr)
      .sort((a, b) => normDate(a.start_date).localeCompare(normDate(b.start_date)))
  ), [festivals, featuredTodayStr]);

  useEffect(() => {
    const t1 = setInterval(() => setSocialIdx((i) => (socialFeaturedPool.length ? (i + 1) % socialFeaturedPool.length : 0)), 5000);
    const t2 = setInterval(() => setBootcampIdx((i) => (bootcampFeaturedPool.length ? (i + 1) % bootcampFeaturedPool.length : 0)), 5000);
    const t3 = setInterval(() => setFestivalIdx((i) => (festivalFeaturedPool.length ? (i + 1) % festivalFeaturedPool.length : 0)), 5000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, [socialFeaturedPool, bootcampFeaturedPool, festivalFeaturedPool]);

  useEffect(() => {
    const order = ['social', 'bootcamp', 'festival'];
    const t = setInterval(() => {
      setActivePosterSlot((prev) => order[(order.indexOf(prev) + 1) % order.length]);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // [타이틀 정제 로직]
  const cleanTitle = (title: string) => {
    if (!title) return '';
    return title
      .replace(/\[서울\]/g, '')
      .replace(/\[경인\]/g, '')
      .replace(/\[경기\/인천\]/g, '')
      .replace(/\[경상도\]/g, '')
      .replace(/\[전라도\]/g, '')
      .replace(/\[충청도\]/g, '')
      .replace(/\[강원\/제주\]/g, '')
      .replace(/오늘밤빠/g, '')
      .replace(/[|｜¦]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  /** 추천 행사 리스트 전용 — 대괄호·구분자·부수 텍스트 제거 후 본제목만 */
  const cleanFeaturedTitle = (raw: string) => {
    if (!raw) return '';
    const segment = String(raw).split(/\s*ㅣ\s*|\s*\|\s*/)[0].trim();
    return segment
      .replace(/\[[^\]]*\]/g, '')
      .replace(/오늘밤빠/g, '')
      .replace(/[|｜¦]/g, '')
      .replace(/[|｜¦·•／/\\]+$/g, '')
      .replace(/^[-–—·•\s]+|[-–—·•\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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
  const calendarTodayStr = useMemo(() => getKSTCalendarTodayStr(), []);

  // parties = App displayParties (승인·노출 필터됨). 카운터만 달력 오늘(calendarTodayStr) + normDate로 재매칭.
  useEffect(() => {
    const todayParties = (parties || []).filter(
      (p) => isApprovedParty(p) && normDate(p.date) === calendarTodayStr,
    );

    const isSeoulParty = (p) => REGION_FILTER['서울'](p);
    const isMetroParty = (p) =>
      p.broadRegion === '경인' ||
      p.broadRegion === '경기/인천' ||
      p.region === '경인' ||
      p.region === '경기/인천' ||
      p.region?.includes('경기') ||
      p.region?.includes('인천');

    const seoulParties = todayParties.filter(isSeoulParty);
    const metroParties = todayParties.filter((p) => !isSeoulParty(p) && isMetroParty(p));
    const nationalParties = todayParties.filter((p) => !isSeoulParty(p) && !isMetroParty(p));

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
  }, [parties, calendarTodayStr]);

  const openTodayPartyBucket = (tab) => {
    setSelectedDate(calendarTodayStr);
    setIsModalFilterVisible(true);
    if (tab === '서울' || tab === '경인') setSelectedRegion(tab);
    else setSelectedRegion('');
    setShowFullCalendar(true);
  };

  const openFullCalendarModal = () => {
    setSelectedDate(calendarTodayStr);
    setIsModalFilterVisible(true);
    setShowFullCalendar(true);
  };

  /** 오늘 이후 등록 파티 (포스터 URL 중복 제거) — 행사달력·날짜바·요약 건수 */
  const calendarParties = useMemo(
    () => dedupePartiesByPoster((parties || []).filter((p) => normDate(p.date) >= todayStr)),
    [parties, todayStr]
  );
  const calendarBootcamps = useMemo(() => dedupeById(bootcamps || []), [bootcamps]);
  const calendarFestivals = useMemo(() => dedupeById(festivals || []), [festivals]);

  useEffect(() => {
    if (!showFullCalendar) return;
    fetchParties({ silent: true });
    setSelectedDate((prev) => {
      const prevDay = normDate(prev);
      if (prevDay && prevDay >= calendarTodayStr) return prevDay;
      return calendarTodayStr;
    });
    setIsModalFilterVisible(true);
  }, [showFullCalendar, fetchParties, calendarTodayStr]);
  const isAfter9AM = useMemo(() => {
    const now = new Date();
    return now.getHours() >= 9;
  }, []);
  const scrollRef = useRef(null);
  const regionListRef = useRef(null);
  const barSectionRef = useRef(null);
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [selectedRegionTab, setSelectedRegionTab] = useState(null);
  /** 휴대폰 GPS로 잡은 내 지역 — Social BAR 탭·정렬 1순위 */
  const [geoRegionTab, setGeoRegionTab] = useState(null);
  /** pending: GPS 대기 | ready: 지역 확정 | denied: 실패 → 전체 */
  const [geoRegionStatus, setGeoRegionStatus] = useState('pending');
  const socialBarGeoDoneRef = useRef(false);
  const barViewTimerRef = useRef(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showBarRegisterForm, setShowBarRegisterForm] = useState(false);
  const [quickMenuMoreOpen, setQuickMenuMoreOpen] = useState(false);
  const [barStatsMap, setBarStatsMap] = useState({});


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

  const fetchLocations = async () => {
    setLocationsLoading(true);
    try {
      let rawList = [];
      if (supabase) {
        let { data, error } = await supabase
          .from('locations')
          .select('id, name, address, region_id, created_at, latitude, longitude, view_count')
          .order('name', { ascending: true });
        if (error) {
          ({ data, error } = await supabase
            .from('locations')
            .select('id, name, address, region_id, created_at, latitude, longitude, view_count'));
        }
        if (error) {
          logSupabaseError('Home.fetchLocations', error);
          throw error;
        }
        rawList = data || [];
      } else {
        console.warn('[Home.fetchLocations] supabase client 없음 — 로컬 BAR 마스터만 사용');
      }

      let classified = dedupeVenueList(rawList).map(classifyVenueLocation);

      if (classified.length === 0) {
        classified = buildVenueListFromDatabase();
      } else {
        const addressKeys = new Set(
          classified.map((b) => normalizeVenueAddressKey(b.address)).filter(Boolean)
        );
        const nameKeys = new Set(classified.map((b) => normalizeVenueNameKey(b.name)).filter(Boolean));
        const extras = [];
        BAR_DATABASE.forEach((bar, index) => {
          const addrKey = normalizeVenueAddressKey(bar.address);
          const nameKey = normalizeVenueNameKey(bar.name);
          const aliasKeys = (bar.aliases || []).map((a) => normalizeVenueNameKey(a));
          if (addrKey && addressKeys.has(addrKey)) return;
          if (nameKey && nameKeys.has(nameKey)) return;
          if (aliasKeys.some((k) => k && nameKeys.has(k))) return;
          if (addrKey) addressKeys.add(addrKey);
          if (nameKey) nameKeys.add(nameKey);
          aliasKeys.forEach((k) => { if (k) nameKeys.add(k); });
          extras.push(classifyVenueLocation({
            id: `bar-${index}`,
            name: bar.name,
            address: bar.address,
            image_url: null,
            kakao_url: null,
            instagram_url: null,
          }));
        });
        classified = dedupeVenueList([...classified, ...extras]);
      }

      classified.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
      const seoulBars = classified.filter((b) => b.region === '서울');
      if (seoulBars.length > 0) {
        const sortedSeoul = sortSeoulSocialBars(seoulBars);
        const nonSeoul = classified.filter((b) => b.region !== '서울');
        classified = [...nonSeoul, ...sortedSeoul];
      }
      setLocations(classified);
    } catch (err) {
      console.error('Supabase Error:', err);
      console.error('[Home.fetchLocations] BAR 목록 로드 실패 — 로컬 마스터 데이터로 대체:', err);
      setLocations(buildVenueListFromDatabase());
    } finally {
      setLocationsLoading(false);
    }
  };

  const scoreBarForPreview = (bar) => {
    let score = 0;
    if (bar.image_url) score += 10;
    if (bar.kakao_url) score += 1;
    if (bar.instagram_url) score += 1;
    return score;
  };

  const sortBarsByRichness = (bars) =>
    [...bars].sort((a, b) => scoreBarForPreview(b) - scoreBarForPreview(a));

  const sortBarsForSocialBarTab = (bars, regionTab, nearRegion = geoRegionTab) => {
    const list = [...bars];
    if (regionTab === SOCIAL_BAR_REGION_ALL && nearRegion) {
      list.sort((a, b) => {
        const aNear = a.region === nearRegion ? 0 : 1;
        const bNear = b.region === nearRegion ? 0 : 1;
        if (aNear !== bNear) return aNear - bNear;
        if (a.region === nearRegion && b.region === nearRegion) {
          if (nearRegion === '서울') return getSeoulSocialBarSortRank(a) - getSeoulSocialBarSortRank(b);
          return scoreBarForPreview(b) - scoreBarForPreview(a);
        }
        return (a.name || '').localeCompare(b.name || '', 'ko');
      });
      return list;
    }
    if (regionTab === '서울') return sortSeoulSocialBars(list);
    return sortBarsByRichness(list);
  };

  const barRegionCounts = useMemo(() => {
    const counts = Object.fromEntries(HOME_REGIONS_ORDER.map((r) => [r, 0]));
    locations.forEach((bar) => {
      const r = bar.region;
      if (!r) return;
      if (counts[r] !== undefined) counts[r] += 1;
      else counts[r] = (counts[r] || 0) + 1;
    });
    counts[SOCIAL_BAR_REGION_ALL] = locations.length;
    return counts;
  }, [locations]);

  const socialBarRegionTabs = useMemo(() => {
    if (locations.length === 0) return [];
    const withVenues = HOME_REGIONS_ORDER.filter((tab) =>
      locations.some((b) => b.region === tab),
    );
    if (geoRegionStatus !== 'ready' || !geoRegionTab || !withVenues.includes(geoRegionTab)) {
      return withVenues;
    }
    const rest = withVenues.filter((tab) => tab !== geoRegionTab);
    return [geoRegionTab, ...rest, SOCIAL_BAR_REGION_ALL];
  }, [locations, geoRegionTab, geoRegionStatus]);

  const openVenueDetail = (bar) => {
    setSelectedVenue(bar);
    pushOverlay('venue', {
      meta: { venueId: String(bar.id), venueName: bar.name || '' },
    });
  };

  const closeVenueDetail = () => {
    if (!closeOverlayNav()) setSelectedVenue(null);
  };

  /** BAR 카드(상세) 진입 7초 후 view_count +1 — 기기당 1회 */
  useEffect(() => {
    if (barViewTimerRef.current != null) {
      clearTimeout(barViewTimerRef.current);
      barViewTimerRef.current = null;
    }
    const bar = selectedVenue;
    if (!bar || !supabase || !isPersistedLocationId(bar.id)) return undefined;

    const barId = String(bar.id);
    const storageKey = viewedBarStorageKey(barId);
    try {
      if (localStorage.getItem(storageKey)) return undefined;
    } catch {
      return undefined;
    }

    barViewTimerRef.current = window.setTimeout(async () => {
      try {
        if (localStorage.getItem(storageKey)) return;
      } catch {
        return;
      }

      const current = Number(bar.view_count) || 0;
      const next = current + 1;
      const { error } = await supabase
        .from('locations')
        .update({ view_count: next })
        .eq('id', bar.id);

      if (error) {
        console.warn('[Home] locations.view_count update failed:', error);
        return;
      }

      try {
        localStorage.setItem(storageKey, '1');
      } catch {
        /* ignore quota / private mode */
      }

      const bumpVenue = (v) => (v && String(v.id) === barId ? { ...v, view_count: next } : v);
      setLocations((prev) => prev.map(bumpVenue));
      setSelectedVenue((prev) => bumpVenue(prev));
    }, BAR_VIEW_COUNT_DELAY_MS);

    return () => {
      if (barViewTimerRef.current != null) {
        clearTimeout(barViewTimerRef.current);
        barViewTimerRef.current = null;
      }
    };
  }, [selectedVenue?.id]);

  useEffect(() => {
    const onHistory = (event) => {
      const st = event.detail?.state ?? parseAppState(window.history.state);
      if (st?.overlay === 'venue' && st.overlayMeta?.venueId) {
        const id = st.overlayMeta.venueId;
        const bar = locations.find((b) => String(b.id) === String(id));
        if (bar) {
          setSelectedVenue(bar);
          return;
        }
        const name = st.overlayMeta.venueName;
        if (name) {
          const byName = locations.find((b) => b.name === name);
          if (byName) setSelectedVenue(byName);
          return;
        }
      }
      if (st?.overlay !== 'venue') setSelectedVenue(null);
      if (st?.overlay === 'barRegister') setShowBarRegisterForm(true);
      else if (st?.overlay !== 'barRegister') setShowBarRegisterForm(false);
    };
    window.addEventListener('bamppa-history', onHistory);
    return () => window.removeEventListener('bamppa-history', onHistory);
  }, [locations]);

  const renderBarCard = (bar) => {
    const barName = bar.name || '이름 없음';
    const viewLine = formatBarViewCountLine(bar.view_count);
    const isMyGeoRegion = geoRegionTab && bar.region === geoRegionTab;
    const barNameStyle = {
      margin: 0,
      width: '100%',
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.25,
      textAlign: 'center',
      whiteSpace: 'normal',
      wordBreak: 'keep-all',
    };
    const metaLineStyle = {
      margin: '2px 0 0',
      width: '100%',
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.25,
      textAlign: 'center',
      whiteSpace: 'normal',
      wordBreak: 'keep-all',
      overflow: 'visible',
      textOverflow: 'unset',
    };

    return (
      <motion.button
        key={bar.id}
        type="button"
        role="listitem"
        className={`home-bar-chip${isMyGeoRegion ? ' home-bar-chip--my-region' : ''}`}
        onClick={() => openVenueDetail(bar)}
        whileTap={{ scale: 0.97 }}
      >
        <span
          className={`home-bar-thumb${isMyGeoRegion ? ' home-bar-thumb--my-region' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {bar.image_url ? (
            <img
              src={bar.image_url}
              alt=""
              onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
            />
          ) : (
            <img
              src="/logo.png"
              alt=""
              style={{ width: '40%', height: '40%', objectFit: 'contain', opacity: 0.85, borderRadius: 12 }}
            />
          )}
        </span>
        <div className="home-bar-chip-text">
          <p className="home-bar-chip-name social-bar-name-label" style={barNameStyle} title={barName}>
            {barName}
          </p>
          <p className="home-bar-chip-line home-bar-chip-line--muted" style={metaLineStyle} title={viewLine}>
            {viewLine}
          </p>
        </div>
      </motion.button>
    );
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;
    const loadBarStats = async () => {
      try {
        const map = await fetchBarStatsMap(supabase);
        if (!cancelled) setBarStatsMap(map);
      } catch (err) {
        console.warn('[Home] bar stats load failed:', err);
      }
    };

    loadBarStats();

    const channel = supabase
      .channel('home-bar-live-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bar_checkins' },
        () => {
          loadBarStats();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parties' },
        () => {
          loadBarStats();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const onVenueView = (e) => {
      const venue = e.detail?.venue;
      if (venue) bumpBarClickCount(setBarStatsMap, venue, 1);
    };
    window.addEventListener('bchata-venue-view', onVenueView);
    return () => window.removeEventListener('bchata-venue-view', onVenueView);
  }, []);

  useEffect(() => {
    if (locationsLoading || locations.length === 0) return;
    if (geoRegionStatus === 'pending') return;
    if (selectedRegionTab && locations.some((b) => b.region === selectedRegionTab || selectedRegionTab === SOCIAL_BAR_REGION_ALL)) {
      return;
    }
    if (geoRegionTab && locations.some((b) => b.region === geoRegionTab)) {
      setSelectedRegionTab(geoRegionTab);
      return;
    }
    if (geoRegionStatus === 'denied') setSelectedRegionTab(SOCIAL_BAR_REGION_ALL);
  }, [locations, locationsLoading, selectedRegionTab, geoRegionTab, geoRegionStatus]);

  /** 앱(홈) 진입 시 GPS → 내 지역 탭 1순위·자동 선택 (권한 이미 허용 가정) */
  useEffect(() => {
    if (activeTab !== null) return;
    if (socialBarGeoDoneRef.current) return;

    const finishGeoTab = (tab) => {
      socialBarGeoDoneRef.current = true;
      if (tab && tab !== SOCIAL_BAR_REGION_ALL && HOME_REGIONS_ORDER.includes(tab)) {
        setGeoRegionStatus('ready');
        setGeoRegionTab(tab);
        setSelectedRegionTab(tab);
      } else {
        setGeoRegionStatus('denied');
        setGeoRegionTab(null);
        setSelectedRegionTab(SOCIAL_BAR_REGION_ALL);
      }
    };

    const runSocialBarGeolocation = () => {
      if (!navigator.geolocation) {
        finishGeoTab(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const region = pickNearestSocialBarRegion(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          if (region && SOCIAL_BAR_GEO_REGIONS.includes(region)) {
            finishGeoTab(region);
          } else {
            finishGeoTab(null);
          }
        },
        () => finishGeoTab(null),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60 * 1000 },
      );
    };

    runSocialBarGeolocation();
  }, [activeTab]);

  /** 하단 네비 탭 순서: 홈 → 파티(소셜) → 부트캠프 → 페스티벌 → 강사찾기 (마크업은 App.jsx nav) */
  useEffect(() => {
    const nav = document.querySelector('nav.bottom-nav');
    if (!nav) return;
    const items = Array.from(nav.children).filter((el) => el.nodeType === 1);
    const pick = (labels) =>
      items.find((el) => labels.some((l) => (el.textContent || '').includes(l)));
    const partyTab = pick(['소셜', 'Social', '파티', 'Party']);
    if (partyTab) {
      const labelSpan = partyTab.querySelector('span');
      if (labelSpan) {
        const en = (labelSpan.textContent || '').includes('Social') || (labelSpan.textContent || '').includes('Party');
        labelSpan.textContent = en ? 'Party' : '파티';
      }
    }
    const ordered = [
      pick(['홈', 'Home']),
      partyTab || pick(['소셜', 'Social']),
      pick(['부트캠프', 'Bootcamp']),
      pick(['페스티벌', 'Festival']),
      pick(['강사찾기', '강사', 'Instructor']),
    ].filter(Boolean);
    if (ordered.length < 5) return;
    ordered.forEach((el) => nav.appendChild(el));
  }, [isEn]);

  /** 추천 행사 스트리밍 3행: 소셜 → 부트캠프 → 페스티벌 */
  const homeFeaturedRows = useMemo(() => [
    {
      id: 'social',
      label: '소셜',
      labelEn: 'Social',
      pool: socialFeaturedPool,
      idx: socialIdx,
      fallback: '/Photo/소셜.png',
      action: () => {
        setActivePosterSlot('social');
        setActiveTab('social');
      },
    },
    {
      id: 'bootcamp',
      label: '부트캠프',
      labelEn: 'Bootcamp',
      pool: bootcampFeaturedPool,
      idx: bootcampIdx,
      fallback: '/Photo/부트캠프.png',
      action: (item) => {
        setActivePosterSlot('bootcamp');
        if (item?.id) {
          navigate('/bootcamp', {
            homeTab: null,
            overlay: 'bootcampDetail',
            overlayMeta: { bootcampId: item.id },
          });
          return;
        }
        navigate('/bootcamp', { homeTab: null });
      },
    },
    {
      id: 'festival',
      label: '페스티벌',
      labelEn: 'Festival',
      pool: festivalFeaturedPool,
      idx: festivalIdx,
      fallback: '/Photo/페스티벌.png',
      action: (item) => {
        setActivePosterSlot('festival');
        if (item?.id) {
          navigate('/festival', {
            homeTab: null,
            overlay: 'festivalDetail',
            overlayMeta: { festivalId: item.id },
          });
          return;
        }
        navigate('/festival', { homeTab: null });
      },
    },
  ], [
    socialFeaturedPool,
    bootcampFeaturedPool,
    festivalFeaturedPool,
    socialIdx,
    bootcampIdx,
    festivalIdx,
  ]);


  const isHomeGate = activeTab === null;
  const HOME_BRAND = '#D4436E';
  const HOME_GOLD = '#C9A84C';
  const HOME_BRAND_SOFT = '#FFF5F7';
  const HOME_BRAND_BORDER = '#FBCFE8';
  const HOME_TEXT = '#1E293B';
  const HOME_TEXT_MUTED = '#64748B';
  const HOME_SURFACE = '#F8FAFC';
  const HOME_BORDER = '#E2E8F0';
  const homeUi = useMemo(() => (isHomeGate ? {
    pageBg: '#0D0D0D',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    surface: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.1)',
    gold: HOME_GOLD,
    goldSoft: 'rgba(201, 168, 76, 0.14)',
    goldBorder: 'rgba(201, 168, 76, 0.4)',
    brandSoft: 'rgba(212, 67, 110, 0.18)',
    brandBorder: 'rgba(212, 67, 110, 0.45)',
    partyEmpty: {
      bg: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(255, 255, 255, 0.1)',
      label: '#94A3B8',
      count: '#A8A29E',
      unit: '#78716C',
      districts: '#78716C',
    },
    partyActive: {
      bg: 'rgba(201, 168, 76, 0.12)',
      border: 'rgba(201, 168, 76, 0.45)',
      label: '#F5E6C8',
      count: HOME_GOLD,
      unit: '#E8D5A3',
      districts: '#C9A84C',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    panelBg: '#121212',
    panelBorder: 'rgba(255, 255, 255, 0.08)',
    panelShadow: '0 10px 40px rgba(0, 0, 0, 0.38)',
    quickIcon: '#CBD5E1',
    quickRegisterIcon: HOME_GOLD,
    posterActive: HOME_GOLD,
    posterIdle: 'rgba(255, 255, 255, 0.12)',
    liveShell: 'linear-gradient(135deg, #1a1510 0%, #0a0a0a 55%, #141018 100%)',
    liveBorder: 'rgba(201, 168, 76, 0.35)',
    barSubtitle: '#E8D5A3',
    barLabel: '#FFFFFF',
  } : {
    pageBg: '#FFFFFF',
    text: HOME_TEXT,
    textMuted: HOME_TEXT_MUTED,
    surface: HOME_SURFACE,
    border: HOME_BORDER,
    gold: HOME_GOLD,
    goldSoft: 'rgba(201, 168, 76, 0.12)',
    goldBorder: 'rgba(201, 168, 76, 0.3)',
    brandSoft: HOME_BRAND_SOFT,
    brandBorder: HOME_BRAND_BORDER,
    partyEmpty: {
      bg: HOME_SURFACE, border: HOME_BORDER, label: HOME_TEXT_MUTED, count: '#94A3B8', unit: '#94A3B8', districts: '#94A3B8',
    },
    partyActive: {
      bg: 'rgba(201, 168, 76, 0.12)',
      border: 'rgba(201, 168, 76, 0.4)',
      label: '#92400E',
      count: HOME_GOLD,
      unit: '#B45309',
      districts: '#C9A84C',
    },
    divider: HOME_BORDER,
    panelBg: '#FFFFFF',
    panelBorder: '#E2E8F0',
    panelShadow: '0 6px 28px rgba(15, 23, 42, 0.06)',
    quickIcon: '#475569',
    quickRegisterIcon: HOME_GOLD,
    posterActive: HOME_BRAND,
    posterIdle: '#F0F0F0',
    liveShell: 'linear-gradient(135deg, #D4436E 0%, #C7365F 100%)',
    liveBorder: 'transparent',
    barSubtitle: HOME_TEXT_MUTED,
    barLabel: HOME_TEXT,
  }), [isHomeGate]);
  const homePartyBucketEmpty = homeUi.partyEmpty;
  const homePartyBucketActive = homeUi.partyActive;
  const homePartySectionTitleStyle = {
    color: homeUi.text, margin: '0 0 14px',
  };
  const homePartnerSectionTitleStyle = {
    color: homeUi.text, margin: '24px 0 14px',
  };
  const homeSectionSpace = 36;
  const homeBlockSpace = 28;
  const homeDepthPanelStyle = {
    background: homeUi.panelBg,
    border: `1px solid ${homeUi.panelBorder}`,
    boxShadow: homeUi.panelShadow,
  };
  const homeLuxurySectionBoxStyle = {
    border: '1px solid #c9a84c',
    boxShadow: '0 4px 20px rgba(201, 168, 76, 0.25)',
  };
  const homeSubtitleStyle = { color: homeUi.textMuted };
  const homeSectionDividerStyle = { height: 1, background: homeUi.divider, margin: '0 20px', border: 'none' };
  const homeSectionTitleStyle = { color: homeUi.text };
  const QUICK_MENU_ICON_SIZE = 22;
  const QUICK_MENU_STROKE = 1.5;
  const quickMenuIconColor = homeUi.quickIcon;
  const QUICK_MENU_PRIMARY_IDS = ['party-register', 'class-register', 'concierge', 'calendar', 'language'];

  /** 메인 노출 5종 — 커스텀 SVG 원형 아이콘 */
  const quickMenuItems = useMemo(() => [
    {
      id: 'party-register',
      menuSvg: QUICK_MENU_SVG.partyRegister,
      accentLive: true,
      label: '파티등록',
      particles: '🎉',
      action: () => handleRegister('party'),
    },
    {
      id: 'class-register',
      menuSvg: QUICK_MENU_SVG.classRegister,
      accentLive: true,
      label: '클래스등록',
      particles: '📚',
      action: () => handleRegister('class'),
    },
    {
      id: 'concierge',
      menuSvg: QUICK_MENU_SVG.concierge,
      accentLive: true,
      label: '컨시어지',
      particles: '✨',
      action: () => {
        pushOverlay('chatbot');
        window.dispatchEvent(new CustomEvent('open-chatbot'));
      },
    },
    { id: 'livepick', icon: Camera, label: '라이브픽', particles: '📸', action: () => navigate('/livepick') },
    { id: 'wishlist', icon: Heart, label: '찜하기', particles: '❤️', action: () => { pushOverlay('wishlist'); setShowWishlist(true); } },
    { id: 'chat', icon: MessageSquare, label: '채팅문의', particles: '💬', action: () => window.open('https://open.kakao.com/o/gP43rNri', '_blank') },
    { id: 'saju', icon: Star, label: '운명의좌표', particles: '🌟', action: () => { pushOverlay('barMatching'); setShowSaju(true); } },
    { id: 'restaurant', icon: Utensils, label: '맛집뒷풀이', particles: '🍽', action: () => navigate('/restaurant') },
    { id: 'weather', icon: CloudSun, label: '오늘날씨', particles: '☀️', action: () => { pushOverlay('weather'); setShowWeather(true); } },
    { id: 'route', icon: Navigation, label: '지능형경로', particles: '🧭', action: () => { pushOverlay('route'); openAnalysis(false); } },
    { id: 'calendar', menuSvg: QUICK_MENU_SVG.calendar, label: '행사달력', particles: '📅', action: openFullCalendarModal },
    {
      id: 'language',
      menuSvg: QUICK_MENU_SVG.language,
      label: isEn ? 'Language' : '다국어',
      particles: '🌐',
      action: () => {
        const next = i18n.language.startsWith('ko') ? 'en' : 'ko';
        i18n.changeLanguage(next);
      },
    },
  ], [handleRegister, openFullCalendarModal, setView, setShowWishlist, setShowSaju, setShowWeather, openAnalysis, i18n, isEn]);

  const { quickMenuPrimary, quickMenuMore } = useMemo(() => {
    const primary = QUICK_MENU_PRIMARY_IDS
      .map((id) => quickMenuItems.find((item) => item.id === id))
      .filter(Boolean);
    const primarySet = new Set(QUICK_MENU_PRIMARY_IDS);
    const more = quickMenuItems.filter((item) => !primarySet.has(item.id));
    return { quickMenuPrimary: primary, quickMenuMore: more };
  }, [quickMenuItems]);

  const renderQuickMenuItem = (item) => {
    const Icon = item.icon;
    const strokeColor = item.iconAccent ?? quickMenuIconColor;
    return (
      <motion.button
        key={item.id}
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={(e) => { triggerParticle(e, item.particles); item.action(); }}
        className={`home-quick-menu-item${item.accentLive ? ' home-quick-menu-item--accent-live' : ''}`}
      >
        {item.menuSvg ? (
          <QuickMenuIconCircle>{item.menuSvg}</QuickMenuIconCircle>
        ) : (
          <QuickMenuIconCircle>
            {Icon ? <Icon size={QUICK_MENU_ICON_SIZE} strokeWidth={QUICK_MENU_STROKE} color="#c9a84c" aria-hidden /> : null}
          </QuickMenuIconCircle>
        )}
        <span className="home-quick-menu-item-label">{item.label}</span>
      </motion.button>
    );
  };

  const renderHomeSectionHeader = (title, subtitle, trailing = null, subtitleStyle = null) => (
    <header style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 className="home-type-section-title home-ds-title" style={{ ...homeSectionTitleStyle, flex: 1, minWidth: 0 }}>{title}</h2>
        {trailing}
      </div>
      {subtitle ? (
        <p className="home-ds-subtitle" style={subtitleStyle || homeSubtitleStyle}>{subtitle}</p>
      ) : null}
    </header>
  );

  const featuredRowTitle = (row, item) => {
    if (!item) {
      return isEn ? `Explore ${row.labelEn}` : `${row.label} 행사 둘러보기`;
    }
    const raw = item.title || item.instructor || '';
    return translateDynamicText(cleanFeaturedTitle(raw), isEn);
  };

  const featuredRowDate = (row, item) => {
    if (!item) return '';
    if (row.id === 'social') return normDate(item.date) || '';
    return normDate(item.start_date) || (item.start_date || '').slice(0, 10);
  };

  const renderFeaturedStreamList = () => (
    <ul className="home-featured-stream" role="list" aria-label={isEn ? 'Featured events list' : '추천 행사 목록'}>
      {homeFeaturedRows.map((row) => {
        const pool = row.pool;
        const item = pool.length ? pool[row.idx % pool.length] : null;
        const isActive = activePosterSlot === row.id;
        const thumbSrc = item?.poster_url || row.fallback;
        const rowLabel = isEn ? row.labelEn : row.label;
        return (
          <li key={row.id} className="home-featured-stream__item" role="listitem">
            <motion.button
              type="button"
              className={`home-featured-stream__row${isActive ? ' is-active' : ''}`}
              onClick={() => row.action(item)}
              whileTap={{ scale: 0.99 }}
            >
              <motion.div
                className="home-featured-stream__thumb"
                key={`${row.id}-${item?.id || 'fallback'}`}
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
              >
                <img
                  src={thumbSrc}
                  alt=""
                  loading="lazy"
                  onError={imgFallbackHandler(row.fallback)}
                />
              </motion.div>
              <motion.div className="home-featured-stream__body">
                <span className="home-featured-stream__category">{rowLabel}</span>
                <span className="home-featured-stream__title">{featuredRowTitle(row, item)}</span>
                {featuredRowDate(row, item) ? (
                  <span className="home-featured-stream__meta">{featuredRowDate(row, item)}</span>
                ) : null}
              </motion.div>
            </motion.button>
          </li>
        );
      })}
    </ul>
  );

  const renderHomeQuickMenuInner = () => (
    <>
        {renderHomeSectionHeader(
          isEn ? 'Quick actions' : '빠른 메뉴',
          isEn ? 'Shortcuts' : '자주 쓰는 메뉴',
          quickMenuMore.length > 0 ? (
            <button
              type="button"
              className="quick-menu-more-link"
              onClick={() => setQuickMenuMoreOpen((open) => !open)}
              aria-expanded={quickMenuMoreOpen}
            >
              {quickMenuMoreOpen ? (isEn ? 'Close' : '접기') : (isEn ? 'More' : '더보기')}
              <ChevronDown
                size={12}
                strokeWidth={2}
                style={{
                  transform: quickMenuMoreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>
          ) : null,
        )}
        <div className="home-quick-menu-grid-wrap">
          <div className="home-quick-menu-grid">
            {quickMenuPrimary.map((item) => renderQuickMenuItem(item))}
          </div>
          {quickMenuMore.length > 0 && (
            <AnimatePresence initial={false}>
              {quickMenuMoreOpen && (
                <motion.div
                  key="quick-menu-more-panel"
                  className="quick-menu-more-wrap"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <motion.div className="home-quick-menu-more-scroll">
                    {quickMenuMore.map((item) => renderQuickMenuItem(item))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
    </>
  );

  const homeLiveBannerFallback = useMemo(() => {
    const todayRows = (parties || []).filter(
      (p) => isApprovedParty(p) && normDate(p.date) === calendarTodayStr,
    );
    const withPoster = todayRows.filter((p) => String(p.poster_url || p.imageUrl || '').trim());
    const pick = withPoster[0] || todayRows[0] || null;
    const total = todayRows.length;
    const seoulCount = regionCounts.seoul || 0;
    return { pick, total, seoulCount };
  }, [parties, calendarTodayStr, isEn, regionCounts]);

  const renderHomeLiveBannerFallback = () => {
    const { pick, total, seoulCount } = homeLiveBannerFallback;
    const seoulLabel = isEn ? 'Seoul' : '서울';
    const nationwideLine = isEn
      ? `Nationwide ${total} parties live`
      : `전국 ${total}개 파티 진행중`;
    const ariaLabel = `${nationwideLine} | ${seoulLabel} ${seoulCount}`;
    const handleClick = () => {
      if (pick) {
        openPartyWithAfterParty(pick);
        return;
      }
      navigate('/livepick');
    };
    return (
      <div className="home-live-banner-fallback">
        <div
          className={`live-dynamic-banner${isHomeGate ? ' live-dynamic-banner--gate' : ''}`}
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label={ariaLabel}
        >
          <div className="live-dynamic-banner__inner">
            <span className="lc-dot" />
            <span className="lc-tag">LIVE</span>
            <span className="live-dynamic-banner__sep live-dynamic-banner__sep--dot">·</span>
            <div className="live-dynamic-banner__track">
              <span className="lc-default lc-default--hot">{nationwideLine}</span>
              <div className="live-dynamic-banner__regions">
                <span className="live-dynamic-banner__sep">|</span>
                <span className="live-dynamic-banner__region">
                  {seoulLabel} <strong>{seoulCount}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHomeQuickLiveHub = () => (
    <section
      className="home-depth-panel home-quick-live-hub home-luxury-section-box"
      style={{
        ...homeDepthPanelStyle,
        ...homeLuxurySectionBoxStyle,
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 0,
        borderRadius: 16,
        padding: 16,
      }}
      aria-label={isEn ? 'Quick menu and live banner' : '빠른 메뉴 및 LIVE'}
    >
      <div className="home-quick-live-hub__quick">
        <div className="home-quick-menu-block">{renderHomeQuickMenuInner()}</div>
      </div>
      <div className="home-quick-live-hub__live">{renderHomeLiveAdRow(true)}</div>
    </section>
  );
  const renderHomeLiveAdRow = (inPanel = false) => (
    <motion.div
      className={`home-live-row${inPanel ? ' home-live-row--in-panel' : ''}`}
      style={{
        padding: inPanel ? 0 : '0 20px',
        marginBottom: inPanel ? 0 : homeSectionSpace,
        paddingTop: 0,
        marginTop: 0,
        borderTop: 'none',
        display: 'flex',
        alignItems: 'stretch',
        gap: 10,
      }}
    >
      <motion.div
        className={`live-count-premium-wrapper${isHomeGate ? ' live-count-premium-wrapper--gate' : ''}`}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 44,
          background: 'transparent',
          borderRadius: '14px',
          overflow: 'hidden',
          border: isHomeGate ? `1px solid ${homeUi.liveBorder}` : 'none',
          boxShadow: isHomeGate ? '0 4px 24px rgba(0,0,0,0.35)' : 'none',
        }}
      >
        <style>{`
            .home-live-banner-slot {
              position: relative;
              width: 100%;
              min-height: 44px;
            }
            .home-live-banner-slot:has(.live-dynamic-banner) .home-live-banner-fallback {
              display: none !important;
            }
            .home-live-banner-fallback {
              width: 100%;
            }
            /* 햄버거 버튼 */
            button[style*="z-index: 1005"] {
              width: 36px !important;
              height: 36px !important;
              padding: 0 !important;
              border-radius: 10px !important;
              box-shadow: none !important;
            }
            body.home-gate-theme button[style*="z-index: 1005"] {
              border: 1px solid rgba(201, 168, 76, 0.28) !important;
              background: rgba(0, 0, 0, 0.45) !important;
            }
            body:not(.home-gate-theme) button[style*="z-index: 1005"] {
              border: 1px solid rgba(0,0,0,0.08) !important;
              background: rgba(255,255,255,0.9) !important;
            }
            button[style*="z-index: 1005"] svg {
              width: 20px !important;
              height: 20px !important;
            }

            @keyframes liveGradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }

            /* LIVE 다이내믹 배너 — 그라데이션 + 레이아웃 */
            .live-count-premium-wrapper .live-dynamic-banner,
            .live-count-premium-wrapper .live-dynamic-banner--gate {
              width: 100% !important;
              background: linear-gradient(270deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff) !important;
              background-size: 400% 400% !important;
              animation: liveGradient 4s ease infinite !important;
              padding: 0 !important;
              border: none !important;
              border-radius: 14px !important;
            }
            .live-count-premium-wrapper .live-dynamic-banner__inner {
              height: 44px !important;
              padding: 0 clamp(10px, 3.2vw, 14px) !important;
              background: transparent !important;
              box-sizing: border-box !important;
              width: 100% !important;
              overflow: hidden !important;
              flex-wrap: nowrap !important;
              color: #ffffff !important;
            }
            .live-count-premium-wrapper .live-dynamic-banner__track {
              flex: 1 1 auto !important;
              min-width: 0 !important;
              overflow: hidden !important;
              flex-wrap: nowrap !important;
            }
            .live-count-premium-wrapper .lc-tag {
              background: transparent !important;
              color: #ffffff !important;
              font-size: 10px !important;
              font-weight: 950 !important;
              padding: 0 !important;
              border-radius: 0 !important;
              letter-spacing: 0.5px !important;
            }
            .live-count-premium-wrapper .lc-dot {
              width: 6px !important;
              height: 6px !important;
              background: #ff6b6b !important;
              border-radius: 50% !important;
              flex-shrink: 0 !important;
              margin-right: 2px !important;
              animation: lc-blink 1s infinite;
            }
            .live-count-premium-wrapper .live-dynamic-banner__sep--dot {
              color: #ffffff !important;
              font-size: 12px !important;
              font-weight: 800 !important;
              flex-shrink: 0 !important;
              margin: 0 2px !important;
            }
            .live-count-premium-wrapper .lc-name {
              color: #ffffff !important;
              font-size: 13px !important;
              font-weight: 900 !important;
              font-family: inherit !important;
              letter-spacing: -0.3px !important;
            }
            .live-count-premium-wrapper .lc-count {
              color: #ffffff !important;
              font-size: 15px !important;
              font-weight: 950 !important;
              font-family: inherit !important;
              background: rgba(255,255,255,0.15) !important;
              padding: 1px 6px !important;
              border-radius: 6px !important;
              margin-left: 4px !important;
            }
            .live-count-premium-wrapper .lc-default,
            .live-count-premium-wrapper .lc-default--hot {
              color: #ffffff !important;
              font-size: clamp(9px, 2.6vw, 12px) !important;
              font-weight: 900 !important;
              font-family: inherit !important;
              letter-spacing: -0.3px !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              flex-shrink: 1 !important;
              min-width: 0 !important;
            }
            .live-count-premium-wrapper .live-dynamic-banner__spotlight,
            .live-count-premium-wrapper .live-dynamic-banner__spotlight--solo {
              color: #ffffff !important;
              font-weight: 900 !important;
              font-size: clamp(9px, 2.6vw, 12px) !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              flex: 1 1 0% !important;
              min-width: 0 !important;
              max-width: 100% !important;
              display: block !important;
            }
            .live-count-premium-wrapper .live-dynamic-banner__inner > .live-dynamic-banner__spotlight--solo {
              flex: 1 1 0% !important;
              min-width: 0 !important;
            }
            .live-count-premium-wrapper .live-dynamic-banner__region {
              color: #ffffff !important;
              font-weight: 900 !important;
            }
            @media (max-width: 390px) {
              .live-count-premium-wrapper .live-dynamic-banner__track:has(.live-dynamic-banner__spotlight) .lc-default--hot {
                display: none !important;
              }
            }
            .live-count-premium-wrapper .live-dynamic-banner__region strong {
              color: #ffffff !important;
              font-weight: 950 !important;
            }
            .live-count-premium-wrapper .live-dynamic-banner__sep {
              color: rgba(255, 255, 255, 0.55) !important;
              font-weight: 800 !important;
            }
            .live-count-premium-wrapper--gate .lc-tag {
              background: transparent !important;
              color: #ffffff !important;
            }
            .home-party-register-outside {
              flex-shrink: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 2px;
              min-width: 54px;
              padding: 0 12px;
              border-radius: 14px;
              border: 1px solid rgba(212, 67, 110, 0.35);
              background: linear-gradient(180deg, #fff5f7 0%, #ffe4ec 100%);
              color: #D4436E;
              font-size: 12px;
              font-weight: 900;
              line-height: 1.15;
              cursor: pointer;
              box-shadow: 0 4px 14px rgba(212, 67, 110, 0.18);
            }
            .home-party-register-outside__line { display: block; }
          `}</style>
        <div className="home-live-banner-slot">
          <LiveCount
            parties={parties}
            isGate={isHomeGate}
            onPartyClick={openPartyWithAfterParty}
            onPromoClick={() => navigate('/livepick')}
          />
          {renderHomeLiveBannerFallback()}
        </div>
      </motion.div>
      {activeTab === 'social' && (
        <button
          type="button"
          className="home-party-register-outside"
          onClick={() => handleRegister('party')}
          aria-label={isEn ? 'Register party' : '파티 등록'}
        >
          <span className="home-party-register-outside__line">{isEn ? 'Party' : '파티'}</span>
          <span className="home-party-register-outside__line">{isEn ? 'Register' : '등록'}</span>
        </button>
      )}
    </motion.div>
  );

  return (
    <div
      className={`app-container${isHomeGate ? ' home-gate-active' : ''}`}
      style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: homeUi.pageBg, minHeight: '100dvh', paddingBottom: '100px', transition: 'background 0.25s ease' }}
    >

      {activeTab === 'social' && (
        <img
          src="/Photo/소셜.png"
          alt="소셜 배너"
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* 📌 [영역 A: 히어로 / 메인 게이트] */}
      <motion.div style={{ padding: '20px 16px 0', marginBottom: homeSectionSpace - 4 }}>
        {activeTab === null && (
        <motion.div className="home-hero-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <img
            src="/logo.png"
            alt="오늘밤빠 로고"
            onClick={() => {
              const now = Date.now();
              if (now - lastAdminTap < 2000) {
                const nextCount = adminTapCount + 1;
                if (nextCount >= 3) { navigate('/admin-portal'); setAdminTapCount(0); }
                else { setAdminTapCount(nextCount); }
              } else { setAdminTapCount(1); }
              setLastAdminTap(now);
            }}
            style={{
              width: '56px',
              height: '56px',
              flexShrink: 0,
              objectFit: 'contain',
              borderRadius: '14px',
              cursor: 'pointer',
              userSelect: 'none',
              boxShadow: isHomeGate ? '0 4px 16px rgba(0,0,0,0.45)' : '0 2px 10px rgba(0,0,0,0.08)',
              border: isHomeGate ? '1px solid rgba(201,168,76,0.25)' : 'none',
            }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <motion.div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h1 className="home-type-display" style={{ color: homeUi.text, fontWeight: 900, margin: 0 }}>오늘 어디서 춤추실까요?</h1>
            <HomeHeroTagline />
          </motion.div>
        </motion.div>
        )}

        {activeTab === null && (
          <div className="home-party-status-micro" role="group" aria-label={isEn ? "Today's parties" : '오늘의 파티'}>
            <span className="home-ds-body" style={{ color: homeUi.textMuted, marginRight: 2 }}>{isEn ? 'Today' : '오늘'}</span>
            {[
              { label: isEn ? 'Seoul' : '서울', count: regionCounts.seoul, tab: '서울' },
              { label: isEn ? 'Metro' : '수도권', count: regionCounts.metro, tab: '경인' },
              { label: isEn ? 'Regions' : '지방권', count: regionCounts.national, tab: null },
            ].map((r, idx) => (
              <React.Fragment key={r.label}>
                {idx > 0 ? <span className="home-party-status-micro-sep">·</span> : null}
                <button
                  type="button"
                  className="home-party-status-micro-btn"
                  style={{ color: !partiesLoading && r.count > 0 ? homePartyBucketActive.count : homeUi.textMuted }}
                  onClick={() => openTodayPartyBucket(r.tab)}
                >
                  {r.label} <strong>{partiesLoading ? '—' : r.count}</strong>
                  {!isEn && '건'}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </motion.div>

      {activeTab === null && (
        <motion.div className="home-main-stack" style={{ padding: '0 16px' }}>
          {renderHomeQuickLiveHub()}

          <motion.div className="home-section-break" aria-hidden>
            <hr className="home-section-break__line" />
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'social' && renderHomeLiveAdRow(false)}

      {/* 메인 퀵메뉴: activeTab === null → 3섹션 그리드 / 소셜 탭 → 가로 스크롤 */}
      <style>{`
        .home-featured-panel .home-featured-stream__thumb {
          width: ${HOME_FEATURED_THUMB_SIZE}px;
          height: ${HOME_FEATURED_THUMB_SIZE}px;
        }
        .home-featured-panel .home-featured-stream__thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .home-featured-panel .home-featured-stream__row {
          min-height: ${HOME_FEATURED_THUMB_SIZE}px;
        }
        @media (min-width: 480px) {
          .home-featured-panel .home-featured-stream__thumb {
            width: ${HOME_FEATURED_THUMB_SIZE_WIDE}px;
            height: ${HOME_FEATURED_THUMB_SIZE_WIDE}px;
          }
          .home-featured-panel .home-featured-stream__row {
            min-height: ${HOME_FEATURED_THUMB_SIZE_WIDE}px;
          }
        }
        @keyframes gentleSparkle {
          0% { box-shadow: 0 0 2px rgba(85, 139, 47, 0.1); filter: drop-shadow(0 0 1px rgba(85, 139, 47, 0.1)); }
          50% { box-shadow: 0 0 12px rgba(85, 139, 47, 0.45); filter: drop-shadow(0 0 4px rgba(85, 139, 47, 0.25)); }
          100% { box-shadow: 0 0 2px rgba(85, 139, 47, 0.1); filter: drop-shadow(0 0 1px rgba(85, 139, 47, 0.1)); }
        }
        .home-quick-menu-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #2a2a2a;
          border: 1px solid #c9a84c;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .home-quick-menu-icon-circle svg {
          width: 36px;
          height: 36px;
          display: block;
        }
        .home-quick-menu-item--accent-live .home-quick-menu-icon-circle svg {
          animation: home-quick-accent-pulse 2.4s ease-in-out infinite;
        }
        .home-quick-menu-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 8px;
        }
        .quick-menu-more-link {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 4px 0;
          border: none;
          background: none;
          color: #64748B;
          font-size: var(--ds-body-size);
          font-weight: var(--ds-subtitle-weight);
          cursor: pointer;
          line-height: 1.2;
        }
        .home-section-action {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 100px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          color: #334155;
          font-size: var(--ds-body-size);
          font-weight: var(--ds-subtitle-weight);
          cursor: pointer;
          line-height: 1.2;
        }
        .quick-menu-more-wrap {
          position: relative;
          margin-top: 8px;
          overflow: hidden;
        }
        .quick-menu-more-wrap::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 28px;
          height: 100%;
          pointer-events: none;
          background: linear-gradient(to right, rgba(255, 255, 255, 0), #ffffff 90%);
        }
        .quick-menu-more-scroll {
          display: flex;
          flex-wrap: nowrap;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          msOverflowStyle: none;
          padding: 2px 4px 6px;
        }
        .quick-menu-more-scroll > * {
          scroll-snap-align: start;
        }
        .quick-menu-more-scroll::-webkit-scrollbar {
          display: none;
        }
        .quick-menu-scroll {
          display: flex;
          flex-wrap: nowrap;
          gap: 14px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          msOverflowStyle: none;
          padding: 0 2px 12px;
        }
        .quick-menu-scroll > * {
          scroll-snap-align: start;
          flex-shrink: 0;
        }
        .quick-menu-scroll::-webkit-scrollbar {
          display: none;
        }
        .home-gate-active .quick-menu-more-link {
          color: #94A3B8;
        }
        .home-gate-active .home-section-action {
          border-color: rgba(201, 168, 76, 0.35);
          background: rgba(201, 168, 76, 0.1);
          color: #F5E6C8;
        }
        .home-gate-active .quick-menu-more-wrap::after {
          background: linear-gradient(to right, rgba(13, 13, 13, 0), #0d0d0d 90%);
        }
        .home-hero-brand .home-type-display {
          margin: 0 !important;
        }
        .home-hero-brand .home-type-tagline {
          margin: 0 !important;
        }
        .social-bar-name-label {
          font-weight: 900;
        }
        .home-gate-active .social-bar-name-label {
          color: #FFFFFF;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
        }
        .home-social-bar-wrap .home-bar-chip-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-top: 4px;
          text-align: center;
        }
        .home-social-bar-wrap .home-bar-chip-name {
          font-size: 11px !important;
          font-weight: 700 !important;
          line-height: 1.25 !important;
          text-align: center !important;
          white-space: normal !important;
          word-break: keep-all;
        }
        .home-social-bar-wrap .home-bar-chip-line,
        .home-social-bar-wrap .home-bar-chip-line--muted,
        .home-social-bar-wrap .home-bar-chip-line--hot {
          font-size: 11px !important;
          font-weight: 700 !important;
          text-align: center !important;
          white-space: normal !important;
          word-break: keep-all;
          overflow: visible !important;
          text-overflow: unset !important;
        }
      `}</style>
      {activeTab === null && (
        <motion.div className="home-social-bar-wrap" style={{ padding: '0 16px', marginTop: 0, marginBottom: 0 }}>
        <section
          ref={barSectionRef}
          className="home-depth-panel home-luxury-section-box"
          style={{
            ...homeDepthPanelStyle,
            ...homeLuxurySectionBoxStyle,
            marginTop: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {renderHomeSectionHeader(
            isHomeGate ? (
              <>
                <span>Social </span>
                <span style={{ color: homeUi.gold }}>BAR</span>
              </>
            ) : 'Social BAR',
            '만원의 행복공간',
            <button
              type="button"
              className="home-section-action"
              onClick={() => {
                setShowBarRegisterForm(true);
                pushOverlay('barRegister');
              }}
            >
              <Plus size={12} strokeWidth={2.5} />
              공간 등록
            </button>,
            isHomeGate ? { color: homeUi.barSubtitle, fontWeight: 600 } : null,
          )}
          <motion.div className="home-region-tabs">
            {socialBarRegionTabs.map((tab) => {
              const isSelected = selectedRegionTab === tab;
              const isMyGeoRegion = geoRegionTab && tab === geoRegionTab;

              return (
                <button
                  key={tab}
                  type="button"
                  className={`home-region-pill${isSelected ? ' is-selected' : ''}${isMyGeoRegion ? ' is-my-region' : ''}`}
                  onClick={() => setSelectedRegionTab(tab)}
                >
                  {tab}
                  <span className="home-region-pill-count" aria-label={`${barRegionCounts[tab] ?? 0}곳`}>
                    {barRegionCounts[tab] ?? 0}
                  </span>
                </button>
              );
            })}
          </motion.div>

          <motion.div className="home-social-bar-outer">
            {locationsLoading || geoRegionStatus === 'pending' ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                {geoRegionStatus === 'pending' ? '현재 위치 기준 지역을 확인하는 중...' : '전국 BAR 정보를 정렬하는 중...'}
              </div>
            ) : !selectedRegionTab ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>
                지역을 선택해 주세요.
              </div>
            ) : (
              (() => {
                const filteredBars =
                  selectedRegionTab === SOCIAL_BAR_REGION_ALL
                    ? locations
                    : locations.filter((bar) => bar.region === selectedRegionTab);

                if (filteredBars.length === 0) {
                  return (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>
                      해당 지역에 등록된 Social BAR가 없습니다.
                    </div>
                  );
                }


                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={selectedRegionTab}
                    className="home-social-bar-fade"
                  >
                    <div
                      className="home-social-bar-scroll scrollbar-hide"
                      role="list"
                      aria-label={isEn ? `Social BAR in ${selectedRegionTab}` : `${selectedRegionTab} Social BAR`}
                    >
                      <div className="home-social-bar-track">
                        {sortBarsForSocialBarTab(filteredBars, selectedRegionTab).map((bar) => renderBarCard(bar))}
                      </div>
                    </div>
                  </motion.div>
                );
              })()
            )}
          </motion.div>
        </section>
        </motion.div>
      )}

      {activeTab === null && (
        <motion.div className="home-main-stack" style={{ padding: '0 16px', marginBottom: homeSectionSpace }}>
          <motion.div className="home-section-break" aria-hidden>
            <hr className="home-section-break__line" />
          </motion.div>

          <section
            className="home-depth-panel home-featured-panel home-luxury-section-box"
            style={{
              ...homeDepthPanelStyle,
              ...homeLuxurySectionBoxStyle,
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 0,
            }}
            aria-label={isEn ? 'Featured events' : '추천 행사'}
          >
            {renderHomeSectionHeader(
              isEn ? 'Featured events' : '추천 행사',
              isEn ? 'Social · Bootcamp · Festival' : '소셜 · 부트캠프 · 페스티벌',
            )}
            {renderFeaturedStreamList()}
          </section>
        </motion.div>
      )}

        {/*
        <p style={homePartnerSectionTitleStyle}>파트너 &amp; 강사</p>
        <div
          className="quick-menu-scroll"
          style={{
            display: 'flex',
            gap: '8px',
            width: '100%',
            marginBottom: '20px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {[
            { icon: <Calendar size={32} strokeWidth={1.2} color="#D4436E" />, label: '행사달력', particles: '📅', action: () => setShowFullCalendar(true) },
            // { icon: <MapPin size={32} strokeWidth={1.2} color="#D4436E" />, label: '위치·대관', particles: '📍', action: () => setShowRentalModal(true) },
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
              <span style={quickMenuLabelStyle}>{item.label}</span>
            </motion.div>
          ))}
        </div>
        */}
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
                  navigate('/instructors');
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #C9A84C', padding: 2, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <img src={inst.photo_url || DEFAULT_AVATAR_IMAGE} onError={imgFallbackHandler(DEFAULT_AVATAR_IMAGE)} alt={inst.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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

        <SocialDateGenreFilterBar
          visible={isFilterBarVisible}
          activeGenre={activeDateGenre}
          onSelectGenre={(g) => setActiveDateGenre(g)}
        />
      </div>



      <div ref={scrollRef} style={{ width: '100%', background: 'var(--color-bg)' }}>
        <div style={{ minHeight: '101%' }}>
          {partiesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '120px' }}>{Array(6).fill(0).map((_, i) => <div key={i} style={{ height: '140px', width: '100%', background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }} />)}</div>
          ) : (
            <div style={{ width: '100%', padding: '0 0 20px 0', backgroundColor: 'var(--color-bg)' }}>
              {(() => {
                const activeBootcamps = bootcampsOnDate(calendarBootcamps, selectedDate).map(b => ({
                  ...b,
                  _itemGenre: '부트캠프',
                  date: selectedDate,
                  broadRegion: b.region?.includes('서울') ? '서울' : (b.region?.includes('경기') || b.region?.includes('인천') ? '경인' : (b.region?.includes('경상') ? '경상도' : (b.region?.includes('전라') ? '전라도' : (b.region?.includes('충청') ? '충청도' : '강원/제주')))),
                  locationName: b.venue || b.region,
                  fee: b.fee || b.price_info,
                  time: b.time || '13:00'
                }));

                const activeFestivals = festivalsOnDate(calendarFestivals, selectedDate).map(f => ({
                  ...f,
                  _itemGenre: '페스티벌',
                  date: selectedDate,
                  broadRegion: f.region?.includes('서울') ? '서울' : (f.region?.includes('경기') || f.region?.includes('인천') ? '경인' : (f.region?.includes('경상') ? '경상도' : (f.region?.includes('전라') ? '전라도' : (f.region?.includes('충청') ? '충청도' : '강원/제주')))),
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
                        "경인": "region_gyeonggi_incheon",
                        "경상도": "region_gyeongsang",
                        "전라도": "region_jeolla",
                        "충청도": "region_chungcheong",
                        "강원/제주": "region_gangwon_jeju"
                      };
                      const regions = ["경인", "서울", "경상도", "전라도", "충청도", "강원/제주"];

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

                        const isFirst = regionName === '경인';
                        const weather = regionName === '서울' && weatherMap['서울'] ? { temperature: weatherMap['서울'].temp, icon: weatherMap['서울'].icon } : null;

                        return (
                          <React.Fragment key={regionName}>
                            <section
                              ref={isFirst ? regionListRef : null}
                              style={{ marginBottom: '24px', background: 'var(--color-card)' }}
                            >
                              <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-text-main)' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', minWidth: 0 }}>
                                  <span
                                    onClick={() => {
                                      if (regionName === '서울') {
                                        const now = Date.now();
                                        if (now - lastAdminTap < 2000) {
                                          const nextCount = adminTapCount + 1;
                                          if (nextCount >= 3) {
                                            navigate('/admin-portal');
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
                                    style={{ fontSize: '15px', fontWeight: '900', cursor: regionName === '서울' ? 'pointer' : 'default', userSelect: 'none' }}
                                  >
                                    {t(regionKeys[regionName] || regionName)}
                                  </span>
                                  {weather && regionName === '서울' && (
                                    <span style={{ fontSize: '11px', color: '#C9A84C', fontWeight: '700' }}>
                                      {weather.temperature}° {weather.icon}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>
                                    · {(() => {
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
                                  style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}
                                >
                                  {t('view_all')} <ChevronRight size={13} />
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
                                        border: '1px solid #F1F5F9',
                                        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
                                        cursor: 'pointer',
                                        height: '156px',
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
                                      <div style={{ width: '110px', height: '156px', flexShrink: 0, background: '#000' }}>
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

                                        {/* 2. 파티명 */}
                                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.4px', lineHeight: 1.25, marginTop: '4px', marginBottom: '6px' }}>
                                          {cleanTitle(item.title || '').replace(/^\[.*?\]\s*/, '').replace(/ㅣ\s*$/, '').trim()}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                                          <Clock size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.time?.split('-')[0].trim() || '21:00'}
                                          </span>
                                          {isItemLive && (
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#FFB300', background: 'rgba(255,179,0,0.12)', padding: '1px 6px', borderRadius: '6px', marginLeft: 'auto' }}>
                                              {item.view_count || 0}
                                            </span>
                                          )}
                                        </div>

                                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {translateDynamicText(item.locationName, isEn)}
                                        </div>

                                        <PartyFeeChips fee={item.fee} />

                                        {item._itemGenre !== '부트캠프' && item._itemGenre !== '페스티벌'
                                          ? renderPartyMusicRatioRow(item)
                                          : null}
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

      <AnimatePresence initial={false}>
        {showFullCalendar && (
          <motion.div
            key="full-calendar-overlay"
            style={{ position: 'fixed', inset: 0, zIndex: Z.modalBackdrop }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="modernized-calendar-backdrop bchata-overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: Z.modalBackdrop }} />
            <motion.div className="modernized-calendar-modal bchata-overlay-panel bchata-overlay-sheet" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', left: '10px', right: '10px', background: 'var(--color-card)', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: Z.modal, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--color-border)', borderRadius: '2px', margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span className="cal-modal-month">{selectedMonth}월</span><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setSelectedMonth(m => m > 1 ? m - 1 : 12)} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '10px', width: '36px', height: '36px', color: 'var(--color-text-main)' }}><ChevronLeft size={18} /></button><button onClick={() => setSelectedMonth(m => m < 12 ? m + 1 : 1)} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '10px', width: '36px', height: '36px', color: 'var(--color-text-main)' }}><ChevronRight size={18} /></button></div></div>
                <button onClick={handleCloseModal} style={{ background: 'var(--color-border)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)' }}>
                  <ChevronLeft size={28} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', minHeight: '350px' }}>
                {/* 달력 상단 범례 */}
                <div className="cal-modal-legend" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
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
                  {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="cal-weekday-label" style={{ color: d === '일' || d === '토' ? '#FF6B7A' : 'var(--color-text-sub)' }}>{d}</div>)}
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

                    const isPast = day.fullDate < todayStr;
                    const isSunday = day.dayName === '일';
                    const isSaturday = day.dayName === '토';
                    return (
                      <div
                        key={day.fullDate}
                        className={`cal-day-cell${isSelected ? ' is-selected' : ''}${isPast ? ' is-past' : ''}${isSunday ? ' is-sunday' : ''}${isSaturday ? ' is-saturday' : ''}`}
                        onClick={() => {
                          if (isPast) return;
                          if (selectedDate === day.fullDate) {
                            setIsModalFilterVisible(v => !v);
                          } else {
                            setSelectedDate(day.fullDate);
                            setActiveDateGenre('전체');
                            setIsModalFilterVisible(true);
                            setIsFilterBarVisible(true);
                          }
                        }}
                      >
                        <span style={{ lineHeight: 1 }}>{day.date}</span>
                        <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '4px', height: '4px', alignItems: 'center', justifyContent: 'center' }}>
                          {hasParty && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#E53935', boxShadow: isSelected ? '0 0 0 0.5px #fff' : 'none' }} />}
                          {hasBootcamp && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#2563EB', boxShadow: isSelected ? '0 0 0 0.5px #fff' : 'none' }} />}
                          {hasFestival && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#9333EA', boxShadow: isSelected ? '0 0 0 0.5px #fff' : 'none' }} />}
                        </div>
                        {dayTotalCount > 0 && (
                          <span className="cal-day-event-badge" aria-label={isEn ? `${dayTotalCount} events` : `행사 ${dayTotalCount}건`}>
                            {dayTotalCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              </div>

              {/* 달력 하단: 선택일 파티·부트캠프·페스티벌 통계 */}
              {selectedDate && (() => {
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
                      if (r.includes('경기') || r.includes('인천')) return '경인';
                      if (r.includes('경상') || r.includes('부산') || r.includes('대구') || r.includes('울산')) return '경상도';
                      if (r.includes('전라') || r.includes('광주')) return '전라도';
                      if (r.includes('충청') || r.includes('대전') || r.includes('세종')) return '충청도';
                      return '강원/제주';
                    };
                    [...selParties, ...selBootcamps, ...selFestivals].forEach(item => {
                      const r = getRegionName(item);
                      regionCounts[r] = (regionCounts[r] || 0) + 1;
                    });
                    const orderRegions = ['경인', '서울', '경상도', '전라도', '충청도', '강원/제주'];
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

                    const dateLabel = selectedDate.slice(5).replace('-', '/');
                    return (
                      <motion.div
                        key={selectedDate}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          flexShrink: 0,
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--color-border)',
                        }}
                      >
                        <p className="cal-summary-heading">
                          {dateLabel} {isEn ? 'summary' : '행사 요약'}
                        </p>
                        <motion.div className="cal-event-summary-box">
                          {/* 1. 이벤트 수 */}
                          <div className="cal-event-summary-row cal-event-summary-counts">
                            <span style={{ color: '#FF6B7A' }}>📅</span>
                            <span>파티 {partyCount}건 / 부트캠프 {bootcampCount}건 / 페스티벌 {festivalCount}건</span>
                          </div>

                          {/* 2. 지역별 */}
                          {availableRegions.length > 0 && (
                            <div className="cal-event-summary-row">
                              {availableRegions.map((r, idx) => (
                                <React.Fragment key={r}>
                                  <span className="cal-event-summary-label">{r} <span className="cal-event-summary-num">{regionCounts[r]}</span>건</span>
                                  {idx < availableRegions.length - 1 && <span className="cal-event-summary-sep">·</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          )}

                          {/* 3. 장르별 */}
                          {availableGenres.length > 0 && (
                            <div className="cal-event-summary-row">
                              {availableGenres.map((g, idx) => (
                                <React.Fragment key={g}>
                                  <span className="cal-event-summary-label">{g} <span className="cal-event-summary-num">{genreCounts[g]}</span>건</span>
                                  {idx < availableGenres.length - 1 && <span className="cal-event-summary-sep">·</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    );
              })()}

              <div style={{ flexShrink: 0, marginTop: '12px' }}>
                <button onClick={handleCloseModal} style={{ width: '100%', height: '50px', borderRadius: '16px', background: '#1E293B', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>확인 완료</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showGridModal && (
          <motion.div
            key="grid-modal-overlay"
            style={{ position: 'fixed', inset: 0, zIndex: Z.modalBackdrop }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="bchata-overlay-backdrop"
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: Z.modalBackdrop }}
            />
            <motion.div
              className="bchata-overlay-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--color-bg)',
                zIndex: Z.modal,
                display: 'flex',
                flexDirection: 'column',
                height: '100dvh',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
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
                        '서울': 'region_seoul', '경인': 'region_gyeonggi_incheon',
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
                              {(() => {
                                const ratioLine = formatPartyMusicRatio(item);
                                return ratioLine ? (
                                  <span style={{ background: '#FF1744', color: 'white', padding: '1px 4px', borderRadius: '3px', fontSize: '8px', fontWeight: 950 }}>
                                    {ratioLine}
                                  </span>
                                ) : null;
                              })()}
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
          </motion.div>
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

      `}</style>

      {/* afterPartySheet UI removed */}

      <BarRegisterFormModal
        open={showBarRegisterForm}
        onClose={() => {
          if (!closeOverlayNav()) setShowBarRegisterForm(false);
        }}
        onSuccess={() => fetchLocations()}
      />

      {selectedVenue && (
        <VenueDetailModal
          venue={selectedVenue}
          parties={parties}
          lessons={lessons || []}
          onClose={closeVenueDetail}
          onVenueUpdated={(updated) => setSelectedVenue(updated)}
          onOpenPoster={(item) => {
            const p = posterSharePayload(item);
            if (p) handleOpenModal(setSelectedPoster, p);
          }}
        />
      )}
    </div>
  )
}

export default HomePage
