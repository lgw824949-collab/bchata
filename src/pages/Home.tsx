import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Heart, MapPin, Calendar, Clock, User, Users, Music, Music2, ChevronRight, ChevronDown, ShieldCheck, X, Home as HomeIcon, ChevronLeft, CloudSun, Utensils, Zap, PlusCircle, Languages, Bell, Globe, Navigation, CalendarDays, Star, Camera, MessageSquare, Tent, Loader2, Plus, GraduationCap, Flag, Building2, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import { fetchBarStatsMap, bumpBarClickCount } from '../lib/barStatsQuery'
import { KMA_REGION_COORDS, fetchWeatherForecast, parseKmaWeather, HOME_REGION_MAP } from '../utils/kmaApi'
import { supabase } from '../lib/supabase'
import { BAR_DATABASE, findBarByName, findBarByAddress } from '../lib/BarLib'
import { normDate, getKSTCalendarTodayStr, isApprovedParty } from '../lib/dateNorm'
import { resolvePartyVenueName } from '../lib/partiesQuery'
import { logSupabaseError } from '../lib/locationsQuery'
import { hasOptionalLocationColumns, mergeVenueWithLocalExtras } from '../lib/venueLocalExtras'
import { applyStoredExtrasToVenueList, fetchLocationExtrasMap } from '../lib/locationExtrasQuery'
import {
  dedupeVenueList,
  normalizeVenueAddressKey,
  normalizeVenueNameKey,
} from '../lib/venueDedupe'
import AppPageHeader from '../components/AppPageHeader'
import { HomeDarkGate } from '../components/home'
import { useHomeDarkGateProps } from '../hooks/useHomeDarkGateProps'
import VenueDetailModal from '../components/VenueDetailModal'
import BarRegisterFormModal from '../components/BarRegisterFormModal'
import { navigate as historyNavigate, navigateHomeTab, parseAppState, pushOverlay, readNavigationState } from '../lib/appHistory'
import { formatPartyFeeDisplay, PARTY_FEE_CARD_FONT_SIZE } from '../lib/partyFeeDisplay'
import { formatPartyTitleDisplay } from '../lib/partyTitleDisplay'
import PartyCard from '../components/PartyCard'
import PostLesson from './PostLesson'
import { Z } from '../constants/zLayers'
import { DEFAULT_AVATAR_IMAGE, DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../constants/imageAssets'
import { applyBarVenuePhotosToList, resolveBarVenuePhoto } from '../lib/barVenuePhotos'
import {
  PartyMusicRatioLine,
  SocialPartyRegionFilterBar,
  PARTY_LIST_REGION_ORDER,
  formatPartyMusicRatio,
} from './Social'

function navigate(path: string, options: Record<string, unknown> = {}) {
  historyNavigate(path, options);
}

function closeOverlayNav() {
  if (parseAppState(window.history.state)?.overlay) {
    window.history.back();
    return true;
  }
  return false;
}

const QUICK_MENU_SVG = {
  partyRegister: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <circle cx="13" cy="27" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="18" y1="27" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 6 Q28 8 26 16 Q22 13 18 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  classRegister: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M4 30 Q4 22 16 22 Q28 22 28 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="26" y1="10" x2="32" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="7" x2="29" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  barVenueClassRegister: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <rect x="6" y="10" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M6 16 H30" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="20" width="8" height="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="18" y1="6" x2="18" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  concierge: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <rect x="4" y="6" width="28" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M12 24 L10 30 L18 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="10" y1="13" x2="26" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <rect x="4" y="6" width="28" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="4" y1="14" x2="32" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="3" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="3" x2="24" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="20" x2="13" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="26" x2="13" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="26" x2="26" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  language: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r="13" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <ellipse cx="18" cy="18" rx="6" ry="13" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="5" y1="18" x2="31" y2="18" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="11" x2="29" y2="11" stroke="currentColor" strokeWidth="1" />
      <line x1="7" y1="25" x2="29" y2="25" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
};

function QuickMenuIconCircle({ children }) {
  return <span className="home-quick-menu-icon-circle">{children}</span>;
}

/** 홈 퀵메뉴 — 클릭 유도형 카피 (ko / en) */
const HOME_GATE_MENU_COPY = {
  todayParty: { ko: '오늘소셜', en: 'Social' },
  manwonSpace: { ko: 'BAR', en: 'BAR' },
  myNightPlan: { ko: '플랜', en: 'Plan' },
  bootcampDive: { ko: '부트캠프', en: 'Bootcamp' },
  festivalLive: { ko: '페스티벌', en: 'Festival' },
  partyLive: { ko: '파티', en: 'Party' },
  partyPost: { ko: '소셜등록', en: 'Social' },
  barVenueClass: { ko: 'BAR 수업', en: 'BAR class' },
  instructorRegister: { ko: '강사 등록', en: 'Instructor' },
  conciergePick: { ko: '추천', en: 'Picks' },
  livepickShow: { ko: '라이브픽', en: 'Live pick' },
  wishlistView: { ko: '찜하기', en: 'Saved' },
  kakaoChat: { ko: '채팅 문의', en: 'Chat' },
  destinyMatch: { ko: '파트너 찾기', en: 'Partner' },
  destinyCoords: { ko: '운명의 좌표', en: 'Fortune' },
  afterpartyFood: { ko: '맛집', en: 'Food' },
  weatherGo: { ko: '오늘 날씨', en: 'Weather' },
  smartRoute: { ko: '길찾기', en: 'Route' },
  languageSwitch: { ko: '언어', en: 'Language' },
};

/** 메인 홈 게이트 — 상단 노출 5개 (하단 네비 연동) */
const HOME_GATE_MAIN_MENU_IDS = ['today-party', 'bootcamp', 'festival', 'festival-party', 'instructors'];


/** source.unsplash.com 은 종료됨 — images.unsplash.com CDN (bachata 검색 결과 고정) */
const HOME_GATE_PHOTO_CARD_SIZE = { width: 160, height: 210 };

const buildHomeGateMenuPhotoUrl = (photoPath) =>
  `https://images.unsplash.com/${photoPath}?w=${HOME_GATE_PHOTO_CARD_SIZE.width}&h=${HOME_GATE_PHOTO_CARD_SIZE.height}&fit=crop&q=80&auto=format`;

const HOME_GATE_MAIN_MENU_PHOTO_URLS = {
  'today-party':
    'https://live.staticflickr.com/200/31495988665_e64fc2a593_b.jpg',
  bootcamp: buildHomeGateMenuPhotoUrl('photo-1682760631807-71067eeea033'),
  festival: buildHomeGateMenuPhotoUrl('photo-1530103862676-de8c9debad1d'),
  'festival-party': '/home-gate-party.jpg',
  instructors: buildHomeGateMenuPhotoUrl('photo-1494790108377-be9c29b29330'),
};

/** 메인 더보기 — Lucide 아이콘 통일 (king menu 전용) */
const HOME_KING_MENU_ICONS = {
  'party-register': Music2,
  'bar-venue-class-register': Building2,
  'instructor-register': UserPlus,
  'partner-find': Users,
  saju: Star,
  restaurant: Utensils,
  weather: CloudSun,
  route: Navigation,
  language: Languages,
};

/** 더보기 메뉴 노출 순서 — 등록 2종 맨 앞 */
const HOME_GATE_KING_MENU_ORDER = [
  'party-register',
  'bar-venue-class-register',
  'instructor-register',
  // 'concierge', // 하단 네비 이동 — 더보기 비노출
  // 'livepick',
  // 'wishlist',
  // 'chat',
  'partner-find',
  'saju',
  'restaurant',
  'weather',
  'route',
  'language',
];

const homeGateMenuLabel = (key, isEn) => (isEn ? HOME_GATE_MENU_COPY[key].en : HOME_GATE_MENU_COPY[key].ko);

/** 페스티벌 화면 event_type — 메인 뱃지·포스터 배너 라벨 공통 */
const FESTIVAL_EVENT_TYPE_META = [
  { id: 'festival', emoji: '🎪', labelKo: '페스티벌', labelEn: 'Festival' },
  { id: 'mt', emoji: '🏕️', labelKo: 'MT', labelEn: 'MT' },
  { id: 'party', emoji: '🎉', labelKo: '파티', labelEn: 'Party' },
];

const FESTIVAL_TAB_SESSION_KEY = 'bchata_festival_tab';

/** 메인 홈 지역 pill 순서 (표시 개수는 DB 분류 결과) */
const HOME_REGIONS_ORDER = [
  '서울',
  '경인',
  '경상도',
  '충청도',
  '전라도',
  '강원/제주',
];

/** Social BAR — 위치 실패 시 전국 노출 */
const SOCIAL_BAR_REGION_ALL = '전체';

/** 홈 Social BAR — 2장 + 3번째 peek 이후 스크롤로 더 보기 */
const SOCIAL_BAR_PEEK_VISIBLE = 3;

/** 메인 홈 — 오늘 지역 대표 포스터 슬라이드 (빠른 메뉴 위) */
const HOME_POSTER_BANNER_MS = 4000;

const HOME_GATE_HOT_INSTRUCTORS_LIMIT = 5;
const HOME_GATE_INSTRUCTOR_POOL_LIMIT = 24;

/** 메인 첫 페인트 이후·유휴 시 실행 (모바일 초기 로딩 부담 완화) */
const runWhenIdle = (fn, timeoutMs = 2500) => {
  if (typeof window === 'undefined') return { kind: 'none' };
  if (typeof window.requestIdleCallback === 'function') {
    return { kind: 'idle', id: window.requestIdleCallback(fn, { timeout: timeoutMs }) };
  }
  return { kind: 'timeout', id: window.setTimeout(fn, 400) };
};

const cancelWhenIdle = (handle) => {
  if (!handle || handle.kind === 'none' || typeof window === 'undefined') return;
  if (handle.kind === 'idle') window.cancelIdleCallback(handle.id);
  else window.clearTimeout(handle.id);
};

/** LIVE 배너 — 5초마다 업체 묶음만 순환 (요약은 항상 고정) */
const LIVE_BANNER_SLIDE_MS = 5000;

const BAR_VIEW_COUNT_DELAY_MS = 7000;
const viewedBarStorageKey = (barId) => `viewed_bar_${barId}`;
const isPersistedLocationId = (id) => {
  const s = String(id ?? '');
  return s.length > 0 && !/^bar-\d+$/i.test(s);
};
const BAR_AUTO_CHECKIN_DONE_KEY = 'bchata_bar_auto_checkin_done';
const BAR_VISITOR_ID_KEY = 'bchata_visitor_id';
const BAR_CHECKIN_RADIUS_M = 150;
const LIVEPICK_UPLOAD_AT_KEY = 'bchata_livepick_uploaded_at';

const readLivePickUploadAt = () => {
  try {
    return localStorage.getItem(LIVEPICK_UPLOAD_AT_KEY) || '';
  } catch {
    return '';
  }
};

const isLivePickUploadedToday = (uploadedAtIso) => {
  if (!uploadedAtIso) return false;
  const uploaded = new Date(uploadedAtIso);
  if (Number.isNaN(uploaded.getTime())) return false;
  return normDate(uploaded.toISOString()) === getKSTCalendarTodayStr();
};

const getOrCreateVisitorId = () => {
  try {
    const existing = sessionStorage.getItem(BAR_VISITOR_ID_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `anon_${Math.random().toString(36).slice(2, 14)}`;
    sessionStorage.setItem(BAR_VISITOR_ID_KEY, id);
    return id;
  } catch {
    return null;
  }
};

const findBarWithinRadiusM = (bars, userLat, userLon, radiusM) => {
  let nearest = null;
  let minDist = Infinity;
  for (const bar of bars) {
    if (!isPersistedLocationId(bar.id)) continue;
    const lat = Number(bar.latitude);
    const lon = Number(bar.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const distM = socialBarHaversineKm(userLat, userLon, lat, lon) * 1000;
    if (distM <= radiusM && distM < minDist) {
      minDist = distM;
      nearest = bar;
    }
  }
  return nearest;
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
  { match: (key) => key.includes('하바나') || key.includes('havana') },
  { match: (key) => key.includes('마콘도') },
];

/** 서울 탭 — 우선 노출에서 제외(뒤로) */
const SEOUL_SOCIAL_BAR_DEMOTE = [
  { match: (key) => key === '강턴' || key.includes('강남턴') },
];

const getSeoulSocialBarSortRank = (bar) => {
  const key = normalizeVenueNameKey(bar?.name || '');
  if (SEOUL_SOCIAL_BAR_DEMOTE.some((rule) => rule.match(key))) return 9000;
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

/** 경인 탭 — 우선 노출 순서 */
const GYEONGIN_SOCIAL_BAR_ORDER = [
  { match: (key) => key.includes('엘마르') || key.includes('elmar') || key === '엘마' },
  { match: (key) => key.includes('카디즈') || key.includes('cadiz') },
];

const getGyeonginSocialBarSortRank = (bar) => {
  const key = normalizeVenueNameKey(bar?.name || '');
  const priorityIdx = GYEONGIN_SOCIAL_BAR_ORDER.findIndex((rule) => rule.match(key));
  if (priorityIdx >= 0) return priorityIdx;
  const sortOrder = Number(bar?.sort_order);
  if (Number.isFinite(sortOrder)) return 100 + sortOrder;
  return 1000;
};

const sortGyeonginSocialBars = (bars) =>
  [...bars].sort((a, b) => {
    const diff = getGyeonginSocialBarSortRank(a) - getGyeonginSocialBarSortRank(b);
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

  return {
    ...loc,
    region,
    image_url: resolveBarVenuePhoto(loc.name, loc.image_url),
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
  const title = formatPartyTitleDisplay(item.title) || '라틴·소셜 파티';
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

/** 전체보기 포스터 그리드 — 날짜별 섹션 */
const groupPosterPartiesByDate = (list) => {
  const map = new Map();
  for (const p of list) {
    const key = normDate(p?.date) || '__unknown__';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return Array.from(map.entries()).sort(([a], [b]) => {
    if (a === '__unknown__') return 1;
    if (b === '__unknown__') return -1;
    return a.localeCompare(b);
  });
};

const formatGridDateSectionLabel = (dateKey, isEn, todayStr) => {
  if (dateKey === '__unknown__') return isEn ? 'Date TBD' : '날짜 미정';
  const d = new Date(`${dateKey}T12:00:00`);
  const base = `${d.getMonth() + 1}/${d.getDate()} (${isEn ? DAYS_EN[d.getDay()] : DAYS_KOR[d.getDay()]})`;
  if (dateKey === todayStr) return isEn ? `Today · ${base}` : `오늘 · ${base}`;
  return base;
};

const GENRE_MAP = {
  '바차타': { key: 'b_ratio', label: 'B', label_en: 'Bachata', color: '#FF1744' },
  '살사': { key: 's_ratio', label: 'S', label_en: 'Salsa', color: '#FF1744' },
  '쥬크': { key: 'j_ratio', label: 'J', label_en: 'Zouk', color: '#FF1744' },
  '키좀바': { key: 'k_ratio', label: 'K', label_en: 'Kizomba', color: '#FF1744' },
};

/** 소셜 파티 카드 음악 비율(b_ratio 등 → B4:S2) — src/pages/Social.tsx */
const renderPartyMusicRatioRow = (item) => <PartyMusicRatioLine item={item} />;

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

const inferPartyBroadRegionFromRow = (row) => {
  if (row?.broadRegion) return row.broadRegion;
  const title = String(row?.title || '');
  const address = String(row?.address || '');
  const locName = String(row?.locations?.name || row?.location_name || '');
  const combined = `${title} ${address} ${locName}`;
  if (title.includes('[서울]') || SEOUL_HINT.test(combined)) return '서울';
  if (
    title.includes('[경인]') ||
    title.includes('[경기/인천]') ||
    /경기|인천/.test(combined)
  ) {
    return '경인';
  }
  if (title.includes('[경상') || /부산|대구|울산|경상|경남|경북/.test(combined)) return '경상도';
  if (title.includes('[전라') || /광주|전라|전남|전북/.test(combined)) return '전라도';
  if (title.includes('[충청') || /대전|충청|충남|충북|세종/.test(combined)) return '충청도';
  if (title.includes('[강원') || /강원|제주/.test(combined)) return '강원/제주';
  return '';
};

const enrichPosterBannerPartyRow = (row) => ({
  ...row,
  broadRegion: inferPartyBroadRegionFromRow(row),
  location_name: row?.locations?.name || row?.location_name || row?.locationName || '',
});

const isHomePosterBannerSeoul = (p) => REGION_FILTER['서울'](p);

const isHomePosterBannerMetro = (p) =>
  !isHomePosterBannerSeoul(p) &&
  (REGION_FILTER['경인'](p) ||
    p.broadRegion === '경기/인천' ||
    p.region === '경인' ||
    p.region === '경기/인천' ||
    (p.region && (String(p.region).includes('경기') || String(p.region).includes('인천'))));

const isHomePosterBannerLocal = (p) => !isHomePosterBannerSeoul(p) && !isHomePosterBannerMetro(p);

/** 서울·경인·지방권 각 최신 포스터 1장 (created_at 내림차순) */
const pickHomePosterBannerSlides = (rows) => {
  const enriched = (rows || [])
    .filter((p) => isApprovedParty(p) && String(p.poster_url || '').trim())
    .map(enrichPosterBannerPartyRow)
    .sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
    );

  const pickFor = (predicate) => enriched.find(predicate) || null;
  const seoul = pickFor(isHomePosterBannerSeoul);
  const gyeongin = pickFor(isHomePosterBannerMetro);
  const local = pickFor(isHomePosterBannerLocal);

  const slides = [];
  if (seoul) {
    slides.push({
      id: 'seoul',
      kind: 'party',
      regionLabelKo: '서울',
      regionLabelEn: 'Seoul',
      party: seoul,
    });
  }
  if (gyeongin) {
    slides.push({
      id: 'gyeongin',
      kind: 'party',
      regionLabelKo: '경인',
      regionLabelEn: 'Gyeonggi/Incheon',
      party: gyeongin,
    });
  }
  if (local) {
    slides.push({
      id: 'local',
      kind: 'party',
      regionLabelKo: '지방권',
      regionLabelEn: 'Regions',
      party: local,
    });
  }
  return slides;
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

/** 승인 · poster_url · 소셜만 — 특정 달력일 */
const filterPosterPartiesForDate = (list, dateStr) =>
  dedupePartiesByPoster(
    (list || []).filter(
      (p) =>
        isApprovedParty(p)
        && normDate(p.date) === dateStr
        && String(p.poster_url || '').trim()
        && partyRowMatchesSlot(p, '소셜'),
    ),
  );

/** 오늘(KST 달력일) · 승인 · poster_url 등록 파티 — 동일 포스터 URL은 1건 · 오늘소셜(부트캠프·페스티벌 제외) */
const filterTodayPosterParties = (list, todayStr) => filterPosterPartiesForDate(list, todayStr);

const POSTER_CLICK_COUNT_DELAY_MS = 3000;
const partyClickCountInFlight = new Set();

const partyClickStorageKey = (partyId) => `clicked_party_${partyId}`;

/** 포스터 클릭 — 세션당 1회, 3초 후 parties.click_count +1 */
const schedulePartyClickCountIncrement = (partyId) => {
  if (partyId == null || partyId === '') return;
  const key = partyClickStorageKey(partyId);
  try {
    if (sessionStorage.getItem(key)) return;
  } catch {
    return;
  }
  const idKey = String(partyId);
  if (partyClickCountInFlight.has(idKey)) return;
  partyClickCountInFlight.add(idKey);

  window.setTimeout(async () => {
    partyClickCountInFlight.delete(idKey);
    try {
      if (sessionStorage.getItem(key)) return;
      const { data, error: fetchErr } = await supabase
        .from('parties')
        .select('click_count')
        .eq('id', partyId)
        .maybeSingle();
      if (fetchErr) return;
      const currentClicks = Number(data?.click_count) || 0;
      const { error: updateErr } = await supabase
        .from('parties')
        .update({ click_count: currentClicks + 1 })
        .eq('id', partyId);
      if (!updateErr) sessionStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
  }, POSTER_CLICK_COUNT_DELAY_MS);
};

/** LIVE 배너 — BAR 마스터·location_id 기준 업체명만 (파티 제목 미사용) */
const inferLiveBannerBarFromPartyHints = (party) => {
  const hay = `${party?.title || ''} ${party?.address || ''} ${party?.locationName || ''} ${party?.location_name || ''}`;
  const hayCompact = hay.replace(/\s/g, '').toLowerCase();
  let best = '';
  let bestLen = 0;
  for (const bar of BAR_DATABASE) {
    const keys = [bar.name, ...(bar.aliases || [])];
    for (const key of keys) {
      const k = key.replace(/\s/g, '').toLowerCase();
      if (k.length < 2 || !hayCompact.includes(k)) continue;
      if (k.length > bestLen) {
        best = bar.name;
        bestLen = k.length;
      }
    }
  }
  return best;
};

const liveBannerVenueLabel = (party) => {
  const resolved = resolvePartyVenueName(party);
  const titleClean = formatPartyTitleDisplay(party?.title || '');
  const haystack = `${resolved} ${titleClean} ${party?.address || ''} ${party?.locationName || ''} ${party?.location_name || ''}`;

  const fromHaystack = findBarByName(haystack);
  if (fromHaystack?.name) return fromHaystack.name;

  if (resolved && resolved !== '장소 미정') {
    const canonical = findBarByName(resolved);
    return canonical?.name || resolved;
  }

  const fromTitle = findBarByName(party?.title);
  if (fromTitle?.name) return fromTitle.name;

  const fromAddress = findBarByAddress(party?.address || '');
  if (fromAddress?.name) return fromAddress.name;

  return inferLiveBannerBarFromPartyHints(party);
};

const LIVE_BANNER_REGION_ORDER = [
  { id: 'seoul', labelKo: '서울', labelEn: 'Seoul', match: isHomePosterBannerSeoul },
  { id: 'metro', labelKo: '수도권', labelEn: 'Metro', match: isHomePosterBannerMetro },
  { id: 'local', labelKo: '지방', labelEn: 'Local', match: isHomePosterBannerLocal },
];

const countTodayPosterPartiesByRegion = (todayParties) => {
  const counts = { seoul: 0, metro: 0, local: 0 };
  for (const party of todayParties) {
    if (isHomePosterBannerSeoul(party)) counts.seoul += 1;
    else if (isHomePosterBannerMetro(party)) counts.metro += 1;
    else counts.local += 1;
  }
  return counts;
};

const compactLiveBannerVenueName = (name) =>
  String(name || '').replace(/\s/g, '').toLowerCase();

/** LIVE 업체 줄 — 소셜 BAR 통계 전용(파티 업체명으로 쓰지 않음) */
const LIVE_BANNER_SKIP_VENUE_NAMES = new Set(['라틴', '카디즈']);

const liveBannerCanonicalBarKey = (name) => {
  const bar = findBarByName(name);
  if (bar?.name) return compactLiveBannerVenueName(bar.name);

  const compact = compactLiveBannerVenueName(name);
  if (!compact) return '';

  let best = '';
  for (const row of BAR_DATABASE) {
    const keys = [row.name, ...(row.aliases || [])];
    for (const key of keys) {
      const token = compactLiveBannerVenueName(key);
      if (token.length < 2) continue;
      if (compact.includes(token) && token.length > best.length) {
        best = compactLiveBannerVenueName(row.name);
      }
    }
  }
  return best || compact;
};

/** LIVE 배너 — 동일 BAR가 다른 문자열로 두 번 나오지 않게 (아임살사 vs 안산 상록수역 아임살사) */
const liveBannerVenuesOverlap = (nameA, nameB) => {
  const keyA = liveBannerCanonicalBarKey(nameA);
  const keyB = liveBannerCanonicalBarKey(nameB);
  if (keyA && keyB && keyA === keyB) return true;

  const barA = findBarByName(nameA);
  const barB = findBarByName(nameB);
  if (barA?.name && barB?.name && barA.name === barB.name) return true;

  const a = compactLiveBannerVenueName(barA?.name || nameA);
  const b = compactLiveBannerVenueName(barB?.name || nameB);
  if (!a || !b) return a === b;
  if (a === b) return true;
  const minLen = 3;
  if (a.length >= minLen && b.length >= minLen) {
    return a.includes(b) || b.includes(a);
  }
  return false;
};

const pickLiveBannerVenueDisplayName = (nameA, nameB) => {
  const barA = findBarByName(nameA);
  const barB = findBarByName(nameB);
  if (barA?.name && barB?.name && barA.name === barB.name) return barA.name;
  if (barA?.name) return barA.name;
  if (barB?.name) return barB.name;

  const a = compactLiveBannerVenueName(nameA);
  const b = compactLiveBannerVenueName(nameB);
  if (a.includes(b) && b.length >= 3) return nameB.length <= nameA.length ? nameB : nameA;
  if (b.includes(a) && a.length >= 3) return nameA.length <= nameB.length ? nameA : nameB;
  return nameA.length <= nameB.length ? nameA : nameB;
};

const dedupeLiveBannerVenues = (venues) => {
  const merged = [];
  for (const venue of venues) {
    const idx = merged.findIndex((v) => {
      const locA = venue.party?.location_id;
      const locB = v.party?.location_id;
      if (locA != null && locB != null && String(locA) === String(locB)) return true;
      return liveBannerVenuesOverlap(v.name, venue.name);
    });
    if (idx < 0) {
      merged.push({ ...venue });
      continue;
    }
    const prev = merged[idx];
    const name = pickLiveBannerVenueDisplayName(prev.name, venue.name);
    const displayName = findBarByName(name)?.name || name;
    const clicks = Math.max(prev.clicks, venue.clicks);
    const keep = venue.clicks >= prev.clicks ? venue : prev;
    merged[idx] = {
      ...keep,
      name: displayName,
      clicks,
      text: clicks > 0 ? `${displayName} ${clicks}` : displayName,
    };
  }
  return merged;
};

/** 메뉴 뱃지 — 동일 업체 포스터는 1건 */
const dedupeTodayPosterPartiesByVenue = (parties) => {
  const venueRows = [];
  const unnamed = [];
  for (const party of (parties || []).map(enrichPosterBannerPartyRow)) {
    const name = liveBannerVenueLabel(party);
    if (!name) {
      unnamed.push(party);
      continue;
    }
    venueRows.push({
      id: String(party.id),
      name,
      clicks: 0,
      party,
      text: '',
    });
  }
  const named = dedupeLiveBannerVenues(venueRows).map((v) => v.party).filter(Boolean);
  return [...named, ...dedupeById(unnamed)];
};

const buildSocialBannerRegionParts = (partyList, isEn) =>
  LIVE_BANNER_REGION_ORDER.map(({ id, labelKo, labelEn }) => {
    const n = countTodayPosterPartiesByRegion(partyList)[id] || 0;
    if (!n) return null;
    return { id, label: isEn ? labelEn : labelKo, count: n };
  }).filter(Boolean);

/** 메인 배너 — 오늘소셜 전국 합계 + 건수 있는 지역만 */
const buildTodaySocialBannerModel = ({ sourceRows, todayStr, isEn = false }) => {
  const todayParties = filterPosterPartiesForDate(sourceRows, todayStr)
    .map(enrichPosterBannerPartyRow);

  return {
    total: todayParties.length,
    regionParts: buildSocialBannerRegionParts(todayParties, isEn),
    emptyText: isEn ? 'No social events today' : '오늘 등록된 소셜이 없어요',
  };
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

/** 메인 게이트 뱃지 — 종료 전 부트캠프·페스티벌 (진행 중·예정) */
const countActiveHomeGateEventRows = (rows, todayStr) =>
  dedupeById(rows || []).filter((row) => {
    const end = normDate(row.end_date || row.start_date);
    if (end && end < todayStr) return false;
    const start = normDate(row.start_date);
    if (!start) return true;
    if (start >= todayStr) return true;
    return Boolean(end && end >= todayStr);
  }).length;

const countActiveHomeGateEventRowsByType = (rows, todayStr, eventType) =>
  countActiveHomeGateEventRows(
    (rows || []).filter((row) => (row.event_type || 'festival') === eventType),
    todayStr,
  );

const buildFestivalEventTypeCounts = (rows, todayStr) => {
  const counts = {};
  for (const meta of FESTIVAL_EVENT_TYPE_META) {
    counts[meta.id] = countActiveHomeGateEventRowsByType(rows, todayStr, meta.id);
  }
  return counts;
};

/** 메인 게이트 카드 — 종료 전·승인·포스터 있는 행사 */
const filterActiveGateEventPosters = (rows, todayStr, eventTypes = null) =>
  dedupeById(rows || []).filter((row) => {
    if (row.status && row.status !== 'active') return false;
    if (eventTypes && !eventTypes.includes(row.event_type || 'festival')) return false;
    if (!String(row.poster_url || '').trim()) return false;
    const end = normDate(row.end_date || row.start_date);
    if (end && end < todayStr) return false;
    return true;
  });

/** 메인 게이트 카드 — 최초 등록 포스터 1장 고정 (로테이션 없음) */
const pickFirstGateMenuPhotoUrl = (rows, getUrl, getSortKey, fallback) => {
  const sorted = [...(rows || [])]
    .filter((row) => String(getUrl(row) || '').trim())
    .sort((a, b) => {
      const ta = new Date(getSortKey(a) || 0).getTime();
      const tb = new Date(getSortKey(b) || 0).getTime();
      return ta - tb;
    });
  const url = sorted[0] ? String(getUrl(sorted[0])).trim() : '';
  return url || fallback;
};

/** 강사 소개 — 순위 없이 일자 기준 셔플 (팔로워 경쟁 유발 방지) */
const shuffleInstructorsByDay = (rows, daySeed = '') => {
  const arr = [...rows];
  let seed = 0;
  for (let i = 0; i < daySeed.length; i += 1) {
    seed = ((seed << 5) - seed + daySeed.charCodeAt(i)) | 0;
  }
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const pickLatestPosterBannerRow = (rows) =>
  (rows || [])
    .filter((r) => String(r.poster_url || '').trim())
    .sort(
      (a, b) =>
        new Date(b.created_at || b.start_date || 0).getTime()
        - new Date(a.created_at || a.start_date || 0).getTime(),
    )[0] || null;

/** 종료 전 부트캠프·페스티벌 포스터 (오늘 진행 중 우선, 없으면 가장 가까운 예정) */
const pickFeaturedPosterBannerRow = (rows, todayStr, kind = 'any', eventType = null) => {
  let scopedRows = rows || [];
  if (eventType) {
    scopedRows = scopedRows.filter((r) => (r.event_type || 'festival') === eventType);
  }
  const withPoster = scopedRows.filter((r) => String(r.poster_url || '').trim());
  const notEnded = withPoster.filter((r) => {
    const end = normDate(r.end_date || r.start_date);
    return !end || end >= todayStr;
  });
  const isToday = (r) => (
    kind === 'festival'
      ? festivalsOnDate([r], todayStr).length > 0
      : bootcampsOnDate([r], todayStr).length > 0
  );
  const todayActive = notEnded.filter(isToday);
  const upcoming = notEnded
    .filter((r) => normDate(r.start_date) >= todayStr)
    .sort((a, b) => normDate(a.start_date).localeCompare(normDate(b.start_date)));
  const pool = todayActive.length
    ? todayActive
    : upcoming.length
      ? upcoming
      : notEnded;
  return pickLatestPosterBannerRow(pool);
};

/** 지역 파티 + 부트캠프·페스티벌·MT·파티 포스터 (행사 유형별 최대 1장) */
const buildHomePosterBannerSlides = (partyRows, bootcampRows, festivalRows, todayStr) => {
  const partySlides = pickHomePosterBannerSlides(partyRows);
  const bootcamp = pickFeaturedPosterBannerRow(bootcampRows, todayStr, 'bootcamp');
  const prefix = [];

  if (bootcamp) {
    prefix.push({
      id: 'bootcamp',
      kind: 'bootcamp',
      regionLabelKo: '부트캠프',
      regionLabelEn: 'Bootcamp',
      bootcamp,
    });
  }

  for (const meta of FESTIVAL_EVENT_TYPE_META) {
    const featured = pickFeaturedPosterBannerRow(festivalRows, todayStr, 'festival', meta.id);
    if (!featured) continue;
    prefix.push({
      id: `festival-${meta.id}`,
      kind: 'festival',
      eventType: meta.id,
      regionLabelKo: `${meta.emoji} ${meta.labelKo}`,
      regionLabelEn: `${meta.emoji} ${meta.labelEn}`,
      festival: featured,
    });
  }

  return [...prefix, ...partySlides];
};

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
        border: '1px solid rgba(255, 23, 68, 0.1)',
        boxShadow: '0 12px 40px rgba(255, 23, 68, 0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <motion.div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <motion.div>
          <motion.div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Star size={16} color="#FF1744" fill="#FF1744" />
            <span style={{ fontSize: 16, fontWeight: 900, color: '#F5E6C8', letterSpacing: '-0.3px' }}>
              {isEn ? 'Now Showing' : '지금 노출 중'}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#1a1a1a',
                background: 'linear-gradient(135deg, #FF1744, #FFF3C4)',
                padding: '3px 8px',
                borderRadius: 8,
              }}
            >
              LIVE 2
            </span>
          </motion.div>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(0, 0, 0, 0.5)', fontWeight: 600, lineHeight: 1.45 }}>
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
            border: '1px solid rgba(255, 23, 68, 0.1)',
            background: 'rgba(255, 23, 68, 0.1)',
            color: '#FF1744',
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
            const title = formatPartyTitleDisplay(item.title || '');
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
                      color: '#FF1744',
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
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#fff',
                      lineHeight: 1.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
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
        <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 10, color: 'rgba(0, 0, 0, 0.5)', fontWeight: 600 }}>
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

const HomeRollingPartyCard = ({ item, onSelect }) => {
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
      <div className="bchata-poster-frame" style={{ width: '100px', flexShrink: 0, alignSelf: 'stretch' }}>
        <img src={item.poster_url} className="bchata-poster-fit" alt="Poster" />
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

        <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--color-text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.6px', lineHeight: 1.3, marginTop: '4px' }}>
          {translateDynamicText(formatPartyTitleDisplay(item.title), isEn)}
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
            <span style={{ fontSize: PARTY_FEE_CARD_FONT_SIZE, fontWeight: '900', color: '#E53935', whiteSpace: 'nowrap' }}>
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
  const badgeColor = levelColors[item.level] || 'rgba(0, 0, 0, 0.5)';
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
      <div className="bchata-poster-frame" style={{ width: '160px', height: '200px', position: 'relative', flexShrink: 0 }}>
        {item.poster_url ? (
          <img src={item.poster_url} className="bchata-poster-fit" alt="Poster" />
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
      <div className="bchata-poster-frame" style={{ width: '80px', height: '100%', flexShrink: 0 }}>
        <img src={item.poster_url} className="bchata-poster-fit" alt="Bootcamp" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 15px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#7C3AED' }}>BOOTCAMP · {item.genre}</span>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(0, 0, 0, 0.5)' }}>{item.level}</span>
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#000000', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.instructor}</h3>
        <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(0, 0, 0, 0.5)' }}>
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
      <div className="bchata-poster-frame" style={{ width: '80px', height: '100%', flexShrink: 0 }}>
        <img src={item.poster_url} className="bchata-poster-fit" alt="Festival" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 15px', minWidth: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#F97316', marginBottom: '2px' }}>FESTIVAL · {item.genre}</div>
        <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#000000', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
        <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(0, 0, 0, 0.5)' }}>
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
            <HomeRollingPartyCard item={items[index]} onSelect={onSelect} />
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
        <div style={{ color: 'rgba(0, 0, 0, 0.5)' }}><MapPin size={16} /></div>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="filter-scroll">
          {regions.map(r => (
            <button key={r}
              onClick={() => {
                const newVal = filterRegion === r ? '' : r;
                console.log('지역 선택:', newVal);
                setFilterRegion(newVal);
              }}
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', border: filterRegion === r ? '1px solid rgba(255, 23, 68, 0.1)' : '1px solid transparent', background: filterRegion === r ? 'rgba(255, 23, 68, 0.1)' : 'var(--color-border)', color: filterRegion === r ? '#FF1744' : 'var(--color-text-sub)', transition: 'all 0.2s' }}
            >
              {isEn ? REGION_MAP_EN[r] : r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: 'rgba(0, 0, 0, 0.5)' }}><Music size={16} /></div>
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="filter-scroll">
          {genres.map(g => (
            <button key={g}
              onClick={() => {
                const newVal = filterGenre === g ? '' : g;
                console.log('장르 선택:', newVal);
                setFilterGenre(newVal);
              }}
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', background: filterGenre === g ? '#FF1744' : '#F1F5F9', color: filterGenre === g ? '#fff' : 'rgba(0, 0, 0, 0.5)', transition: 'all 0.2s' }}
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
  const navigateAppPath = (path) => navigate(path);

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

  const posterSharePayload = (item: any) => buildPartyShareCard(item);

  const openPartyWithAfterParty = (item) => {
    const p = posterSharePayload(item);
    if (!p) return;
    const partyId = item?.id ?? p?.id;
    if (partyId != null) schedulePartyClickCountIncrement(partyId);
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

  const registerAdminPortalTap = () => {
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
  };
  const [isModalFilterVisible, setIsModalFilterVisible] = useState(false);
  const [partyListRegionFilter, setPartyListRegionFilter] = useState('');
  const stickyHeaderRef = useRef(null);

  useEffect(() => {
    setPartyListRegionFilter('');
  }, [selectedDate]);

  const todayStr = useMemo(() => getKSTTodayStr(), []);
  const calendarTodayStr = useMemo(() => getKSTCalendarTodayStr(), []);

  // parties = App displayParties (승인·노출 필터됨). 카운터는 달력 오늘 + poster_url 기준(동일 URL 1건).
  const todayPosterParties = useMemo(
    () => filterTodayPosterParties(parties, calendarTodayStr),
    [parties, calendarTodayStr],
  );

  const todayPosterPartiesForCount = useMemo(
    () => dedupeTodayPosterPartiesByVenue(todayPosterParties),
    [todayPosterParties],
  );

  useEffect(() => {
    const todayParties = todayPosterPartiesForCount;

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
  }, [todayPosterPartiesForCount]);

  /** 메인 게이트 메뉴 — 오늘 포스터·행사·강사 건수 뱃지 */
  const todayPosterMenuCount = todayPosterPartiesForCount.length;

  const bootcampMenuCount = useMemo(
    () => countActiveHomeGateEventRows(bootcamps, calendarTodayStr),
    [bootcamps, calendarTodayStr],
  );

  const festivalEventTypeCounts = useMemo(
    () => buildFestivalEventTypeCounts(festivals, calendarTodayStr),
    [festivals, calendarTodayStr],
  );

  const festivalMenuCount = useMemo(
    () => countActiveHomeGateEventRowsByType(festivals, calendarTodayStr, 'festival')
      + countActiveHomeGateEventRowsByType(festivals, calendarTodayStr, 'mt'),
    [festivals, calendarTodayStr],
  );

  const partyMenuCount = useMemo(
    () => countActiveHomeGateEventRowsByType(festivals, calendarTodayStr, 'party'),
    [festivals, calendarTodayStr],
  );

  /** 파티 카드 — 최초 업로드 포스터 고정 (칼리9주년) */
  const partyMenuPhotoUrl = HOME_GATE_MAIN_MENU_PHOTO_URLS['festival-party'];

  const todayPartyMenuPhotoUrl = useMemo(
    () => pickFirstGateMenuPhotoUrl(
      todayPosterPartiesForCount,
      (row) => row.poster_url,
      (row) => row.created_at || row.date,
      HOME_GATE_MAIN_MENU_PHOTO_URLS['today-party'],
    ),
    [todayPosterPartiesForCount],
  );

  const bootcampMenuPhotoUrl = useMemo(
    () => pickFirstGateMenuPhotoUrl(
      filterActiveGateEventPosters(bootcamps, calendarTodayStr),
      (row) => row.poster_url,
      (row) => row.created_at || row.start_date,
      HOME_GATE_MAIN_MENU_PHOTO_URLS.bootcamp,
    ),
    [bootcamps, calendarTodayStr],
  );

  const festivalMenuPhotoUrl = useMemo(
    () => pickFirstGateMenuPhotoUrl(
      filterActiveGateEventPosters(festivals, calendarTodayStr, ['festival', 'mt']),
      (row) => row.poster_url,
      (row) => row.created_at || row.start_date,
      HOME_GATE_MAIN_MENU_PHOTO_URLS.festival,
    ),
    [festivals, calendarTodayStr],
  );

  const openTodayPartyBucket = (tab) => {
    setSelectedDate(calendarTodayStr);
    setIsModalFilterVisible(true);
    if (tab === '서울' || tab === '경인') setSelectedRegion(tab);
    else setSelectedRegion('');
    setShowFullCalendar(true);
  };

  const openFullCalendarModal = useCallback(() => {
    setSelectedDate(calendarTodayStr);
    setIsModalFilterVisible(true);
    setShowFullCalendar(true);
  }, [calendarTodayStr, setShowFullCalendar]);

  /** 오늘 이후 등록 파티 (포스터 URL 중복 제거) — 오늘소셜: 부트캠프·페스티벌 제외 */
  const calendarParties = useMemo(
    () =>
      dedupePartiesByPoster(
        (parties || []).filter(
          (p) => normDate(p.date) >= todayStr && partyRowMatchesSlot(p, '소셜'),
        ),
      ),
    [parties, todayStr],
  );
  const calendarBootcamps = useMemo(() => [], []);
  const calendarFestivals = useMemo(() => [], []);

  useEffect(() => {
    if (!showFullCalendar) return;
    fetchParties({ silent: true });
    setSelectedDate((prev) => {
      const prevDay = normDate(prev);
      if (prevDay && prevDay >= calendarTodayStr) return prevDay;
      return calendarTodayStr;
    });
    setIsModalFilterVisible(true);
  }, [showFullCalendar, calendarTodayStr]);
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
  const [hotInstructors, setHotInstructors] = useState([]);
  const [hotInstructorsLoading, setHotInstructorsLoading] = useState(true);
  const [firstInstructorPhotoUrl, setFirstInstructorPhotoUrl] = useState(
    HOME_GATE_MAIN_MENU_PHOTO_URLS.instructors,
  );
  const [activeInstructorMenuCount, setActiveInstructorMenuCount] = useState(0);

  const instructorMenuPhotoUrl = firstInstructorPhotoUrl;

  const getHomeGateMenuBadgeCount = useCallback((itemId) => {
    switch (itemId) {
      case 'today-party':
        return todayPosterMenuCount;
      case 'bootcamp':
        return bootcampMenuCount;
      case 'festival':
        return festivalMenuCount;
      case 'festival-party':
        return partyMenuCount;
      case 'instructors':
        return activeInstructorMenuCount;
      default:
        return 0;
    }
  }, [
    todayPosterMenuCount,
    bootcampMenuCount,
    festivalMenuCount,
    partyMenuCount,
    activeInstructorMenuCount,
  ]);

  const homeGateMenuBadgeAriaLabel = useCallback((itemId, label, count) => {
    if (count <= 0) return label;
    if (itemId === 'today-party') {
      return isEn ? `${label} · ${count} posters today` : `${label} · 오늘 포스터 ${count}건`;
    }
    if (itemId === 'bootcamp') {
      return isEn ? `${label} · ${count} active bootcamps` : `${label} · 진행·예정 부트캠프 ${count}건`;
    }
    if (itemId === 'festival') {
      const parts = FESTIVAL_EVENT_TYPE_META
        .filter((meta) => meta.id !== 'party')
        .map((meta) => ({ ...meta, count: festivalEventTypeCounts[meta.id] || 0 }))
        .filter((part) => part.count > 0);
      if (parts.length === 0) {
        return isEn ? `${label} · ${count} active events` : `${label} · 진행·예정 페스티벌·MT ${count}건`;
      }
      const breakdown = parts
        .map((part) => (isEn ? `${part.emoji} ${part.labelEn} ${part.count}` : `${part.emoji} ${part.labelKo} ${part.count}`))
        .join(' · ');
      return isEn
        ? `${label} · ${count} active events (${breakdown})`
        : `${label} · 진행·예정 ${count}건 (${breakdown})`;
    }
    if (itemId === 'festival-party') {
      return isEn ? `🎉 Party · ${count} active parties` : `🎉 파티 · 진행·예정 ${count}건`;
    }
    if (itemId === 'instructors') {
      return isEn ? `${label} · ${count} instructors` : `${label} · 활동 강사 ${count}명`;
    }
    return label;
  }, [isEn, festivalEventTypeCounts]);
  const [selectedRegionTab, setSelectedRegionTab] = useState(null);
  /** 휴대폰 GPS로 잡은 내 지역 — Social BAR 탭·정렬 1순위 */
  const [geoRegionTab, setGeoRegionTab] = useState(null);
  /** pending: GPS 대기 | ready: 지역 확정 | denied: 실패 → 전체 */
  const [geoRegionStatus, setGeoRegionStatus] = useState('pending');
  const socialBarGeoDoneRef = useRef(false);
  const barAutoCheckinAttemptedRef = useRef(false);
  const barViewTimerRef = useRef(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueLessonPostVenue, setVenueLessonPostVenue] = useState(null);
  const [showVenueLessonPick, setShowVenueLessonPick] = useState(false);
  const [showBarRegisterForm, setShowBarRegisterForm] = useState(false);
  const [quickMenuMoreOpen, setQuickMenuMoreOpen] = useState(false);
  const [kingMenuOpen, setKingMenuOpen] = useState(false);
  const [livePickUploadAt, setLivePickUploadAt] = useState(() => readLivePickUploadAt());
  const [barStatsMap, setBarStatsMap] = useState({});
  useEffect(() => {
    const syncLivePickUpload = () => setLivePickUploadAt(readLivePickUploadAt());
    window.addEventListener('storage', syncLivePickUpload);
    window.addEventListener('bchata-livepick-uploaded', syncLivePickUpload);
    return () => {
      window.removeEventListener('storage', syncLivePickUpload);
      window.removeEventListener('bchata-livepick-uploaded', syncLivePickUpload);
    };
  }, []);

  const hasLivePickUploadToday = useMemo(
    () => isLivePickUploadedToday(livePickUploadAt),
    [livePickUploadAt],
  );

  // [사용자 요청] 15초 롤링 — shuffleOffset 미사용, 캐러셀 스크롤 중 리렌더 방지
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setShuffleOffset(prev => prev + 1);
  //   }, 15000);
  //   return () => clearInterval(interval);
  // }, []);

  useEffect(() => {
    let cancelled = false;
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
      if (!cancelled) setWeatherMap(weatherResults);
    };
    const handle = runWhenIdle(() => { loadRegionalWeather(); }, 5000);
    return () => {
      cancelled = true;
      cancelWhenIdle(handle);
    };
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
        const baseCols = 'id, name, address, region_id, created_at, latitude, longitude, view_count';
        const withOptional = await hasOptionalLocationColumns(supabase);
        const selectCols = withOptional
          ? `${baseCols}, description, kakao_url, instagram_url, image_url`
          : baseCols;
        let { data, error } = await supabase
          .from('locations')
          .select(selectCols)
          .order('name', { ascending: true });
        if (error) {
          ({ data, error } = await supabase
            .from('locations')
            .select(baseCols));
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
      const gyeonginBars = classified.filter((b) => b.region === '경인');
      if (gyeonginBars.length > 0) {
        const sortedGyeongin = sortGyeonginSocialBars(gyeonginBars);
        const nonGyeongin = classified.filter((b) => b.region !== '경인');
        classified = [...nonGyeongin, ...sortedGyeongin];
      }
      let extrasMap = { byId: {}, byName: {} };
      if (supabase) {
        try {
          extrasMap = await fetchLocationExtrasMap(supabase);
        } catch (err) {
          console.warn('[Home.fetchLocations] location_extras:', err);
        }
      }
      setLocations(applyBarVenuePhotosToList(applyStoredExtrasToVenueList(classified, extrasMap)));
    } catch (err) {
      console.error('Supabase Error:', err);
      console.error('[Home.fetchLocations] BAR 목록 로드 실패 — 로컬 마스터 데이터로 대체:', err);
      let extrasMap = { byId: {}, byName: {} };
      if (supabase) {
        try {
          extrasMap = await fetchLocationExtrasMap(supabase);
        } catch {
          /* ignore */
        }
      }
      setLocations(applyBarVenuePhotosToList(applyStoredExtrasToVenueList(buildVenueListFromDatabase(), extrasMap)));
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
          if (nearRegion === '경인') return getGyeonginSocialBarSortRank(a) - getGyeonginSocialBarSortRank(b);
          return scoreBarForPreview(b) - scoreBarForPreview(a);
        }
        return (a.name || '').localeCompare(b.name || '', 'ko');
      });
      return list;
    }
    if (regionTab === '서울') return sortSeoulSocialBars(list);
    if (regionTab === '경인') return sortGyeonginSocialBars(list);
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

  const syncVenueAcrossHome = (updated) => {
    if (!updated) return;
    setSelectedVenue(updated);
    setLocations((prev) =>
      prev.map((b) => {
        const sameId = String(b.id) === String(updated.id);
        const sameName =
          normalizeVenueNameKey(b.name) &&
          normalizeVenueNameKey(b.name) === normalizeVenueNameKey(updated.name);
        return sameId || sameName ? mergeVenueWithLocalExtras({ ...b, ...updated }) : b;
      }),
    );
  };

  const openVenueDetail = (bar) => {
    const merged = mergeVenueWithLocalExtras(bar);
    setSelectedVenue(merged);
    pushOverlay('venue', {
      meta: { venueId: String(merged.id), venueName: merged.name || '' },
    });
  };

  const filterTodayPartiesByPill = useCallback((parties, pillId) => {
    if (pillId === 'seoul') return parties.filter(isHomePosterBannerSeoul);
    if (pillId === 'metro') return parties.filter(isHomePosterBannerMetro);
    if (pillId === 'national') return parties.filter(isHomePosterBannerLocal);
    return parties;
  }, []);

  const { gateProps: homeDarkGateProps } = useHomeDarkGateProps({
    isEn,
    translateDynamicText,
    todayPosterPartiesForCount,
    regionCounts,
    wishlistParties,
    hotInstructors,
    hotInstructorsLoading,
    socialBarRegionTabs,
    selectedRegionTab,
    setSelectedRegionTab,
    barRegionCounts,
    geoRegionTab,
    locations,
    locationsLoading,
    geoRegionStatus,
    socialBarRegionAll: SOCIAL_BAR_REGION_ALL,
    sortBarsForSocialBarTab,
    openPartyWithAfterParty,
    toggleWishlistParty,
    openVenueDetail,
    registerAdminPortalTap,
    filterTodayPartiesByPill,
  });

  const closeVenueDetail = () => {
    if (!closeOverlayNav()) setSelectedVenue(null);
  };

  const openVenueLessonRegister = useCallback((venueRow) => {
    const merged = mergeVenueWithLocalExtras(venueRow);
    setVenueLessonPostVenue(merged);
    pushOverlay('venueLessonPost', {
      meta: {
        venueId: merged?.id ? String(merged.id) : null,
        venueName: merged?.name || merged?.studio_name || null,
      },
    });
  }, []);

  const closeVenueLessonPost = useCallback(() => {
    if (!closeOverlayNav()) setVenueLessonPostVenue(null);
    window.dispatchEvent(new CustomEvent('bchata-lessons-refresh'));
  }, []);

  const closeVenueLessonPick = useCallback(() => {
    if (!closeOverlayNav()) setShowVenueLessonPick(false);
  }, []);

  const openBarVenueLessonPick = useCallback(() => {
    if (!locations.length) {
      alert(isEn ? 'No BAR listed yet. Try again after Social BAR loads.' : '등록된 BAR가 없습니다. Social BAR 목록이 로드된 뒤 다시 시도해 주세요.');
      return;
    }
    setShowVenueLessonPick(true);
    pushOverlay('venueLessonPick');
  }, [locations.length, isEn]);

  const pickBarForVenueLesson = useCallback(
    (bar) => {
      const merged = mergeVenueWithLocalExtras(bar);
      setShowVenueLessonPick(false);
      setVenueLessonPostVenue(merged);
      pushOverlay('venueLessonPost', {
        meta: {
          venueId: merged?.id ? String(merged.id) : null,
          venueName: merged?.name || merged?.studio_name || null,
        },
      });
    },
    [],
  );

  useEffect(() => {
    const onOpenBarLessonRegister = () => openBarVenueLessonPick();
    window.addEventListener('open-bar-lesson-register', onOpenBarLessonRegister);
    return () => window.removeEventListener('open-bar-lesson-register', onOpenBarLessonRegister);
  }, [openBarVenueLessonPick]);

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

  const syncOverlaysFromHistory = (rawState) => {
    const st = parseAppState(rawState) ?? readNavigationState(rawState);
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
    if (st?.overlay === 'venueLessonPick') setShowVenueLessonPick(true);
    else if (st?.overlay !== 'venueLessonPick') setShowVenueLessonPick(false);
    if (st?.overlay === 'venueLessonPost') {
      const id = st.overlayMeta?.venueId;
      const name = st.overlayMeta?.venueName;
      const bar = id
        ? locations.find((b) => String(b.id) === String(id))
        : (name ? locations.find((b) => b.name === name) : null);
      setVenueLessonPostVenue(bar ? mergeVenueWithLocalExtras(bar) : null);
    } else if (st?.overlay !== 'venueLessonPost') {
      setVenueLessonPostVenue(null);
    }
  };

  useEffect(() => {
    syncOverlaysFromHistory(window.history.state);
    const onHistory = (event) => syncOverlaysFromHistory(event.detail?.state ?? window.history.state);
    window.addEventListener('bamppa-history', onHistory);
    return () => window.removeEventListener('bamppa-history', onHistory);
  }, [locations]);

  const renderBarCard = (bar) => {
    const barName = bar.name || '이름 없음';
    const isMyGeoRegion = geoRegionTab && bar.region === geoRegionTab;
    const chipPhoto = resolveBarVenuePhoto(bar.name, bar.image_url);

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
        >
          {chipPhoto ? (
            <img
              src={chipPhoto}
              alt=""
              onError={imgFallbackHandler('/logo.png')}
            />
          ) : (
            <img
              src="/logo.png"
              alt=""
              className="home-bar-thumb-fallback"
            />
          )}
        </span>
        <motion.div className="home-bar-chip-text">
          <p className="home-bar-chip-name social-bar-name-label" title={barName}>
            {barName}
          </p>
        </motion.div>
      </motion.button>
    );
  };

  useEffect(() => {
    const handle = runWhenIdle(() => { fetchLocations(); }, 2000);
    return () => cancelWhenIdle(handle);
  }, []);

  useEffect(() => {
    if (activeTab !== null || !supabase) {
      setHotInstructorsLoading(false);
      return undefined;
    }

    let cancelled = false;
    const loadInstructors = async () => {
      setHotInstructorsLoading(true);
      try {
        const [countRes, firstPhotoRes, poolRes] = await Promise.all([
          supabase
            .from('instructors')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active'),
          supabase
            .from('instructors')
            .select('photo_url')
            .eq('status', 'active')
            .not('photo_url', 'is', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('instructors')
            .select('id, name, genre, photo_url, created_at')
            .eq('status', 'active')
            .not('photo_url', 'is', null)
            .order('created_at', { ascending: true })
            .limit(HOME_GATE_INSTRUCTOR_POOL_LIMIT),
        ]);

        if (!cancelled) {
          const withPhoto = poolRes.error ? [] : (poolRes.data || []);
          const firstPhoto = firstPhotoRes.data?.photo_url || HOME_GATE_MAIN_MENU_PHOTO_URLS.instructors;
          setFirstInstructorPhotoUrl(firstPhoto);
          setHotInstructors(
            shuffleInstructorsByDay(withPhoto, calendarTodayStr).slice(0, HOME_GATE_HOT_INSTRUCTORS_LIMIT),
          );
          setActiveInstructorMenuCount(countRes.error ? 0 : (countRes.count || 0));
        }
      } catch {
        if (!cancelled) {
          setHotInstructors([]);
          setFirstInstructorPhotoUrl(HOME_GATE_MAIN_MENU_PHOTO_URLS.instructors);
          setActiveInstructorMenuCount(0);
        }
      } finally {
        if (!cancelled) setHotInstructorsLoading(false);
      }
    };

    const handle = runWhenIdle(() => { loadInstructors(); }, 1500);
    return () => {
      cancelled = true;
      cancelWhenIdle(handle);
    };
  }, [activeTab, calendarTodayStr]);

  /** 앱 첫 진입 시 GPS 기준 150m 이내 locations BAR 자동 체크인 (세션 1회) */
  useEffect(() => {
    if (locationsLoading || !supabase) return;
    if (barAutoCheckinAttemptedRef.current) return;

    try {
      if (sessionStorage.getItem(BAR_AUTO_CHECKIN_DONE_KEY)) return;
    } catch {
      return;
    }

    barAutoCheckinAttemptedRef.current = true;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          if (sessionStorage.getItem(BAR_AUTO_CHECKIN_DONE_KEY)) return;
        } catch {
          return;
        }

        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        const nearest = findBarWithinRadiusM(locations, userLat, userLon, BAR_CHECKIN_RADIUS_M);
        if (!nearest) return;

        const visitorId = getOrCreateVisitorId();
        if (!visitorId) return;

        const barLat = Number(nearest.latitude);
        const barLon = Number(nearest.longitude);
        if (!Number.isFinite(barLat) || !Number.isFinite(barLon)) return;

        const { error } = await supabase.from('bar_checkins').insert([
          {
            bar_name: nearest.name || '',
            region: nearest.region || '',
            visitor_id: visitorId,
            checked_in_at: new Date().toISOString(),
            lat: barLat,
            lon: barLon,
          },
        ]);

        if (!error) {
          try {
            sessionStorage.setItem(BAR_AUTO_CHECKIN_DONE_KEY, '1');
          } catch {
            /* ignore */
          }
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, [locationsLoading, locations]);

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;
    let channel = null;
    const loadBarStats = async () => {
      try {
        const map = await fetchBarStatsMap(supabase);
        if (!cancelled) setBarStatsMap(map);
      } catch (err) {
        console.warn('[Home] bar stats load failed:', err);
      }
    };

    const handle = runWhenIdle(() => {
      if (cancelled) return;
      loadBarStats();
      channel = supabase
        .channel('home-bar-stats')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bar_checkins' },
          loadBarStats,
        )
        .subscribe();
    }, 3000);

    return () => {
      cancelled = true;
      cancelWhenIdle(handle);
      if (channel) supabase.removeChannel(channel);
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
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
      );
    };

    const handle = runWhenIdle(runSocialBarGeolocation, 2500);
    return () => cancelWhenIdle(handle);
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

  const isHomeGate = activeTab === null;
  const isHomeGateDark = isHomeGate;

  useEffect(() => {
    if (!isHomeGate) return undefined;

    const root = document.documentElement;
    const body = document.body;
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    if (isHomeGateDark) {
      root.classList.add('home-gate-theme', 'app-dark-surface');
      body.classList.add('home-gate-theme', 'app-dark-surface');
      if (themeMeta) themeMeta.setAttribute('content', '#0B0B0B');
    } else {
      root.classList.remove('home-gate-theme', 'app-dark-surface');
      body.classList.remove('home-gate-theme', 'app-dark-surface');
      if (themeMeta) themeMeta.setAttribute('content', '#ffffff');
    }

    return () => {
      root.classList.remove('home-gate-theme', 'app-dark-surface');
      body.classList.remove('home-gate-theme', 'app-dark-surface');
    };
  }, [isHomeGate, isHomeGateDark]);

  /** 메인 홈 — 가로 캐러셀 위에서도 세로 휠·트랙패드가 페이지 스크롤 되도록 */
  useEffect(() => {
    if (!isHomeGate) return undefined;

    const horizontalBandSelector = [
      '.home-hot-instructors-scroll',
      '.home-social-bar-scroll',
      '.home-social-bar-scroll--peek',
      '.home-quick-menu-scroll--gate-all',
      '.home-quick-menu-scroll',
      '.home-quick-menu-more-scroll',
      '.home-region-tabs',
    ].join(',');

    const onWheel = (e) => {
      const band = e.target instanceof Element ? e.target.closest(horizontalBandSelector) : null;
      if (!band) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

      const maxScrollLeft = band.scrollWidth - band.clientWidth;
      if (maxScrollLeft <= 1) {
        const root = document.scrollingElement || document.documentElement;
        if (root) root.scrollTop += e.deltaY;
        e.preventDefault();
        return;
      }

      const root = document.scrollingElement || document.documentElement;
      if (!root) return;

      root.scrollTop += e.deltaY;
      e.preventDefault();
    };

    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, [isHomeGate]);

  const HOME_BRAND = '#E53935';
  const HOME_GOLD = '#E53935';
  const HOME_GOLD_SOFT = '#E53935';
  const HOME_GOLD_MUTED = 'rgba(30, 41, 59, 0.55)';
  const HOME_GOLD_BORDER = 'rgba(229, 57, 53, 0.2)';
  const HOME_GOLD_BORDER_SOFT = 'rgba(229, 57, 53, 0.2)';
  const HOME_BRAND_SOFT = 'rgba(229, 57, 53, 0.12)';
  const HOME_BRAND_BORDER = 'rgba(229, 57, 53, 0.2)';
  const HOME_TEXT = '#1E293B';
  const HOME_TEXT_MUTED = 'rgba(30, 41, 59, 0.55)';
  const HOME_SURFACE = '#FFFFFF';
  const HOME_BORDER = '#EDEAE3';
  const HOME_PAGE_BG = isHomeGateDark ? '#0B0B0B' : '#F5F6F8';
  const HOME_CARD_BORDER = '0.5px solid #EDEAE3';
  const homeUi = useMemo(() => (isHomeGateDark ? {
    pageBg: '#0D0D0D',
    text: '#FFFFFF',
    textMuted: '#FFFFFF',
    surface: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.1)',
    gold: HOME_GOLD,
    goldSoft: 'rgba(255, 23, 68, 0.1)',
    goldBorder: HOME_GOLD_BORDER,
    brandSoft: 'rgba(255, 23, 68, 0.1)',
    brandBorder: 'rgba(255, 23, 68, 0.1)',
    partyEmpty: {
      bg: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(255, 255, 255, 0.1)',
      label: '#FFFFFF',
      count: '#FFFFFF',
      unit: '#FFFFFF',
      districts: '#FFFFFF',
    },
    partyActive: {
      bg: 'rgba(255, 23, 68, 0.1)',
      border: HOME_GOLD_BORDER,
      label: '#FFFFFF',
      count: '#FFFFFF',
      unit: '#FFFFFF',
      districts: '#FFFFFF',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    panelBg: '#121212',
    panelBorder: 'rgba(255, 255, 255, 0.08)',
    panelShadow: '0 10px 40px rgba(0, 0, 0, 0.38)',
    quickIcon: '#FFFFFF',
    quickRegisterIcon: '#FFFFFF',
    posterActive: '#FFFFFF',
    posterIdle: 'rgba(255, 255, 255, 0.12)',
    liveShell: 'linear-gradient(135deg, #1a1510 0%, #0a0a0a 55%, #141018 100%)',
    liveBorder: HOME_GOLD_BORDER,
    barSubtitle: '#FFFFFF',
    barLabel: '#FFFFFF',
  } : {
    pageBg: HOME_PAGE_BG,
    text: HOME_TEXT,
    textMuted: HOME_TEXT_MUTED,
    surface: HOME_SURFACE,
    border: HOME_BORDER,
    gold: HOME_GOLD,
    goldSoft: HOME_BRAND_SOFT,
    goldBorder: HOME_GOLD_BORDER_SOFT,
    brandSoft: HOME_BRAND_SOFT,
    brandBorder: HOME_BRAND_BORDER,
    partyEmpty: {
      bg: HOME_SURFACE, border: HOME_BORDER, label: HOME_TEXT_MUTED, count: HOME_TEXT_MUTED, unit: HOME_TEXT_MUTED, districts: HOME_TEXT_MUTED,
    },
    partyActive: {
      bg: HOME_BRAND_SOFT,
      border: HOME_GOLD_BORDER_SOFT,
      label: HOME_TEXT,
      count: HOME_GOLD,
      unit: HOME_GOLD,
      districts: HOME_GOLD_SOFT,
    },
    divider: HOME_BORDER,
    panelBg: HOME_SURFACE,
    panelBorder: HOME_CARD_BORDER,
    panelShadow: 'none',
    quickIcon: HOME_TEXT_MUTED,
    quickRegisterIcon: HOME_BRAND,
    posterActive: HOME_BRAND,
    posterIdle: '#F1F5F9',
    liveShell: HOME_SURFACE,
    liveBorder: HOME_CARD_BORDER,
    barSubtitle: HOME_TEXT_MUTED,
    barLabel: HOME_TEXT,
  }), [isHomeGateDark]);
  const homePartyBucketEmpty = homeUi.partyEmpty;
  const homePartyBucketActive = homeUi.partyActive;
  const homePartySectionTitleStyle = {
    color: homeUi.text, margin: '0 0 14px',
  };
  const homePartnerSectionTitleStyle = {
    color: homeUi.text, margin: '24px 0 14px',
  };
  const homeSectionSpace = isHomeGate ? 32 : 36;
  const homeBlockSpace = isHomeGate ? 22 : 28;
  const homeGateStackGap = 24;
  const homeDepthPanelStyle = {
    background: homeUi.panelBg,
    border: isHomeGateDark ? `1px solid ${homeUi.panelBorder}` : HOME_CARD_BORDER,
    boxShadow: isHomeGateDark ? homeUi.panelShadow : 'none',
    borderRadius: isHomeGate ? 10 : undefined,
  };
  const homeLuxurySectionBoxStyle = isHomeGateDark ? {
    border: `1px solid ${HOME_GOLD_BORDER}`,
    boxShadow: '0 4px 22px rgba(229, 57, 53, 0.12)',
  } : {
    border: HOME_CARD_BORDER,
    boxShadow: 'none',
    borderRadius: 10,
  };
  const homeSubtitleStyle = { color: homeUi.textMuted };
  const homeSectionDividerStyle = { height: 1, background: homeUi.divider, margin: '0 20px', border: 'none' };
  const homeSectionTitleStyle = { color: homeUi.text };
  const QUICK_MENU_ICON_SIZE = 22;
  const QUICK_MENU_STROKE = 1.5;
  const quickMenuIconColor = homeUi.quickIcon;
  const QUICK_MENU_PRIMARY_IDS = ['party-register', 'bar-venue-class-register', 'instructor-register', 'concierge', 'calendar', 'language'];

  /** 홈 게이트 더보기 — 메인 4종 제외 */
  const HOME_GATE_KING_EXCLUDE_IDS = ['calendar', ...HOME_GATE_MAIN_MENU_IDS];

  const homeGateMainMenuItems = useMemo(() => [
    {
      id: 'today-party',
      icon: Music2,
      photoUrl: todayPartyMenuPhotoUrl,
      label: homeGateMenuLabel('todayParty', isEn),
      action: () => {
        navigateHomeTab('social');
        setActiveTab('social');
      },
    },
    {
      id: 'bootcamp',
      icon: Tent,
      photoUrl: bootcampMenuPhotoUrl,
      label: homeGateMenuLabel('bootcampDive', isEn),
      action: () => navigate('/bootcamp', { homeTab: null }),
    },
    {
      id: 'festival',
      icon: Flag,
      photoUrl: festivalMenuPhotoUrl,
      label: homeGateMenuLabel('festivalLive', isEn),
      action: () => navigate('/festival', { homeTab: null }),
    },
    {
      id: 'festival-party',
      icon: Music2,
      photoUrl: partyMenuPhotoUrl,
      label: homeGateMenuLabel('partyLive', isEn),
      labelEmoji: '🎉',
      action: () => {
        try {
          sessionStorage.setItem(FESTIVAL_TAB_SESSION_KEY, 'party');
        } catch {
          /* ignore */
        }
        navigate('/festival', { homeTab: null });
      },
    },
    {
      id: 'instructors',
      icon: GraduationCap,
      photoUrl: instructorMenuPhotoUrl,
      label: isEn ? 'Instructors' : '강사찾기',
      action: () => {
        localStorage.setItem('instructor_target_genre', '전체');
        navigate('/instructors', { homeTab: null, instructorId: null, instructorTab: null });
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('apply-instructor-filter'));
        }, 300);
      },
    },
  ], [
    isEn,
    todayPartyMenuPhotoUrl,
    bootcampMenuPhotoUrl,
    festivalMenuPhotoUrl,
    partyMenuPhotoUrl,
    instructorMenuPhotoUrl,
  ]);

  /** 메인 노출 5종 — 커스텀 SVG 원형 아이콘 */
  const quickMenuItems = useMemo(() => [
    {
      id: 'party-register',
      menuSvg: QUICK_MENU_SVG.partyRegister,
      registerKind: 'party',
      label: homeGateMenuLabel('partyPost', isEn),
      particles: '🎉',
      action: () => handleRegister('party'),
    },
    {
      id: 'bar-venue-class-register',
      menuSvg: QUICK_MENU_SVG.barVenueClassRegister,
      registerKind: 'bar-venue',
      label: homeGateMenuLabel('barVenueClass', isEn),
      particles: '🏢',
      action: openBarVenueLessonPick,
    },
    {
      id: 'instructor-register',
      menuSvg: QUICK_MENU_SVG.classRegister,
      registerKind: 'instructor',
      label: homeGateMenuLabel('instructorRegister', isEn),
      particles: '🕺',
      action: () => window.dispatchEvent(new CustomEvent('open-class-register')),
    },
    {
      id: 'concierge',
      menuSvg: QUICK_MENU_SVG.concierge,
      label: homeGateMenuLabel('conciergePick', isEn),
      particles: '✨',
      action: () => {
        pushOverlay('chatbot');
        window.dispatchEvent(new CustomEvent('open-chatbot'));
      },
    },
    { id: 'livepick', icon: Camera, label: homeGateMenuLabel('livepickShow', isEn), particles: '📸', action: () => navigate('/livepick') },
    { id: 'wishlist', icon: Heart, label: homeGateMenuLabel('wishlistView', isEn), particles: '❤️', action: () => pushOverlay('wishlist') },
    { id: 'chat', icon: MessageSquare, label: homeGateMenuLabel('kakaoChat', isEn), particles: '💬', action: () => window.open('https://open.kakao.com/o/gP43rNri', '_blank') },
    {
      id: 'partner-find',
      icon: Users,
      label: homeGateMenuLabel('destinyMatch', isEn),
      particles: '💑',
      action: () => {
        setShowPartner(true);
        navigateHomeTab('partner');
        onHomeTabChange?.('partner');
      },
    },
    {
      id: 'saju',
      icon: Star,
      label: homeGateMenuLabel('destinyCoords', isEn),
      particles: '🌟',
      action: () => {
        pushOverlay('barMatching');
        setShowSaju(true);
      },
    },
    { id: 'restaurant', icon: Utensils, label: homeGateMenuLabel('afterpartyFood', isEn), particles: '🍽', action: () => navigate('/restaurant') },
    { id: 'weather', icon: CloudSun, label: homeGateMenuLabel('weatherGo', isEn), particles: '☀️', action: () => pushOverlay('weather') },
    { id: 'route', icon: Navigation, label: homeGateMenuLabel('smartRoute', isEn), particles: '🧭', action: () => openAnalysis(false) },
    { id: 'calendar', menuSvg: QUICK_MENU_SVG.calendar, label: homeGateMenuLabel('myNightPlan', isEn), particles: '📅', action: openFullCalendarModal },
    {
      id: 'language',
      menuSvg: QUICK_MENU_SVG.language,
      label: homeGateMenuLabel('languageSwitch', isEn),
      particles: '🌐',
      action: () => {
        const next = i18n.language.startsWith('ko') ? 'en' : 'ko';
        i18n.changeLanguage(next);
      },
    },
  ], [handleRegister, openBarVenueLessonPick, openFullCalendarModal, setView, setShowWishlist, setShowSaju, setShowWeather, setShowPartner, openAnalysis, onHomeTabChange, i18n, isEn]);

  const homeGateKingMenuItems = useMemo(() => {
    const pool = quickMenuItems.filter((item) => !HOME_GATE_KING_EXCLUDE_IDS.includes(item.id));
    const byId = new Map(pool.map((item) => [item.id, item]));
    return HOME_GATE_KING_MENU_ORDER
      .map((id) => byId.get(id))
      .filter(Boolean);
  }, [quickMenuItems]);

  const { quickMenuPrimary, quickMenuMore } = useMemo(() => {
    const primary = QUICK_MENU_PRIMARY_IDS
      .map((id) => quickMenuItems.find((item) => item.id === id))
      .filter(Boolean);
    const primarySet = new Set(QUICK_MENU_PRIMARY_IDS);
    const more = quickMenuItems.filter((item) => !primarySet.has(item.id));
    return { quickMenuPrimary: primary, quickMenuMore: more };
  }, [quickMenuItems]);

  const renderGateMainMenuItem = (item) => {
    const menuBadgeCount = getHomeGateMenuBadgeCount(item.id);
    const badgeCountLabel = menuBadgeCount > 99 ? '99+' : String(menuBadgeCount);
    const ariaLabel = homeGateMenuBadgeAriaLabel(item.id, item.label, menuBadgeCount);
    const displayPhotoUrl = item.photoUrl || HOME_GATE_MAIN_MENU_PHOTO_URLS[item.id];

    return (
      <div
        key={item.id}
        className="home-gate-photo-menu-card-shell"
        role="listitem"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setKingMenuOpen(false);
            item.action();
          }}
          className="home-gate-photo-menu-card"
          aria-label={ariaLabel}
        >
          <span className="home-gate-photo-menu-card__media" aria-hidden>
            <img
              src={displayPhotoUrl}
              alt=""
              className="home-gate-photo-menu-card__img"
              loading={item.id === 'festival-party' || item.id === 'today-party' ? 'eager' : 'lazy'}
              fetchPriority={item.id === 'festival-party' ? 'high' : 'auto'}
              decoding="async"
              onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
            />
            <span className="home-gate-photo-menu-card__overlay" />
          </span>
          {menuBadgeCount > 0 ? (
            <span
              className="home-gate-photo-menu-card__badge home-gate-photo-menu-card__badge--tr"
              aria-hidden
            >
              {badgeCountLabel}
            </span>
          ) : null}
          {item.labelEmoji ? (
            <span className="home-gate-photo-menu-card__emoji-chip" aria-hidden>
              {item.labelEmoji}
            </span>
          ) : null}
          <span className="home-gate-photo-menu-card__label">
            {item.label}
          </span>
        </motion.button>
      </div>
    );
  };

  const renderQuickMenuItem = (item, gateSwipe = false, kingMenu = false) => {
    const KingIcon = kingMenu ? HOME_KING_MENU_ICONS[item.id] : null;
    const Icon = KingIcon || item.icon;
    const quickMenuIconSize = kingMenu ? 22 : QUICK_MENU_ICON_SIZE;
    const quickMenuStroke = kingMenu ? 1.75 : QUICK_MENU_STROKE;
    const registerMod =
      item.registerKind === 'party' || item.registerKind === 'bar-venue'
        ? ' home-quick-menu-item--register-party'
        : item.registerKind === 'instructor'
          ? ' home-quick-menu-item--register-class'
          : '';
    const liveUploadMod = item.id === 'livepick' && hasLivePickUploadToday
      ? ' home-quick-menu-item--live-uploaded'
      : '';
    const todayPartyBadgeCount = item.id === 'today-party' ? todayPosterMenuCount : 0;
    const badgeCountLabel = todayPartyBadgeCount > 99 ? '99+' : String(todayPartyBadgeCount);
    const ariaLabel = item.id === 'today-party' && todayPartyBadgeCount > 0
      ? `${item.label} · 오늘 소셜 포스터 ${todayPartyBadgeCount}건`
      : item.id === 'livepick' && hasLivePickUploadToday
        ? `${item.label} · 오늘 업로드함`
        : item.label;
    return (
      <motion.button
        key={item.id}
        type="button"
        onClick={() => item.action()}
        className={`home-quick-menu-item${registerMod}${liveUploadMod}${gateSwipe ? ' home-quick-menu-item--gate-swipe' : ''}`}
        aria-label={ariaLabel}
      >
        <span className="home-quick-menu-icon-wrap">
          {kingMenu && KingIcon ? (
            <QuickMenuIconCircle>
              <KingIcon size={quickMenuIconSize} strokeWidth={quickMenuStroke} color="currentColor" aria-hidden />
            </QuickMenuIconCircle>
          ) : item.menuSvg ? (
            <QuickMenuIconCircle>{item.menuSvg}</QuickMenuIconCircle>
          ) : (
            <QuickMenuIconCircle>
              {Icon ? <Icon size={quickMenuIconSize} strokeWidth={quickMenuStroke} color="currentColor" aria-hidden /> : null}
            </QuickMenuIconCircle>
          )}
          {todayPartyBadgeCount > 0 ? (
            <span className="home-quick-menu-count-badge" aria-hidden>{badgeCountLabel}</span>
          ) : null}
          {item.id === 'livepick' && hasLivePickUploadToday ? (
            <span className="home-quick-menu-live-badge" aria-hidden>ON</span>
          ) : null}
        </span>
        <span className="home-quick-menu-item-label">{item.label}</span>
      </motion.button>
    );
  };

  const renderHomeGateSectionTitle = (title, extraClass = '') => (
    <h2 className={`home-gate-section-title${extraClass ? ` ${extraClass}` : ''}`}>
      <span className="home-gate-section-title__point" aria-hidden />
      <span className="home-gate-section-title__text">{title}</span>
    </h2>
  );

  const renderHomeSectionHeader = (title, subtitle, trailing = null, subtitleStyle = null) => (
    <header style={{ marginBottom: 14 }}>
      <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {isHomeGate ? (
          <motion.div style={{ flex: 1, minWidth: 0 }}>
            {renderHomeGateSectionTitle(title, 'home-type-section-title home-ds-title')}
          </motion.div>
        ) : (
          <h2 className="home-type-section-title home-ds-title" style={{ ...homeSectionTitleStyle, flex: 1, minWidth: 0 }}>{title}</h2>
        )}
        {trailing}
      </motion.div>
      {subtitle ? (
        <p className="home-ds-subtitle" style={subtitleStyle || homeSubtitleStyle}>{subtitle}</p>
      ) : null}
    </header>
  );

  const renderHomeQuickMenuInner = () => {
    if (isHomeGate) {
      return (
        <div className="home-gate-menu">
          <div
            className="home-gate-photo-menu-scroll"
            role="list"
            aria-label={isEn ? 'Main menu' : '메인 메뉴'}
          >
            {homeGateMainMenuItems.map((item) => renderGateMainMenuItem(item))}
          </div>
          <div className="home-gate-menu__divider" aria-hidden />
          <div className="home-gate-king-menu">
            <div className="home-gate-king-menu__toolbar">
              <button
                type="button"
                className="home-gate-king-menu__toggle"
                onClick={() => setKingMenuOpen((open) => !open)}
                aria-expanded={kingMenuOpen}
                aria-label={kingMenuOpen ? (isEn ? 'Close more' : '더보기 닫기') : (isEn ? 'Show more' : '더보기')}
              >
                <Plus
                  size={18}
                  strokeWidth={2.5}
                  style={{
                    transition: 'transform 0.25s ease',
                    transform: kingMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                />
                <span>{kingMenuOpen ? (isEn ? 'Close' : '접기') : (isEn ? 'More' : '더보기')}</span>
              </button>
            </div>
            <AnimatePresence initial={false}>
              {kingMenuOpen && (
                <motion.div
                  key="home-gate-king-panel"
                  className="home-gate-king-menu__panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="home-quick-menu-grid home-gate-king-menu__grid">
                    {homeGateKingMenuItems.map((item) => renderQuickMenuItem({
                      ...item,
                      action: () => {
                        setKingMenuOpen(false);
                        item.action();
                      },
                    }, false, true))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      );
    }

    return (
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
  };

  const homeTodaySocialBannerModel = useMemo(
    () => buildTodaySocialBannerModel({
      sourceRows: parties,
      todayStr: calendarTodayStr,
      isEn,
    }),
    [parties, calendarTodayStr, isEn],
  );

  const renderHomeTodaySocialBanner = () => {
    const { total, regionParts, emptyText } = homeTodaySocialBannerModel;
    const hasToday = total > 0;

    return (
      <div className={`home-today-social-banner${isHomeGate ? ' home-today-social-banner--gate' : ''}`}>
        <button
          type="button"
          className="home-today-social-banner__card home-today-social-banner__card--summary-only"
          onClick={() => navigateHomeTab('social')}
          aria-label={
            hasToday
              ? (isEn
                ? `Today social nationwide ${total}`
                : `오늘소셜 전국 ${total}건`)
              : emptyText
          }
        >
          <span className="home-today-social-banner__badge home-today-social-banner__badge--today">
            {isEn ? 'Today' : '오늘'}
          </span>
          <span className="home-today-social-banner__inline">
            <span className="home-today-social-banner__label">
              {isEn ? 'Social' : '오늘소셜'}
            </span>
            {hasToday ? (
              <>
                <span className="home-today-social-banner__sep" aria-hidden>·</span>
                <span className="home-today-social-banner__nation">
                  {isEn ? 'Nationwide' : '전국'} <strong>{total}</strong>
                </span>
                {regionParts.map((part) => (
                  <React.Fragment key={part.id}>
                    <span className="home-today-social-banner__sep" aria-hidden>·</span>
                    <span className="home-today-social-banner__region">
                      {part.label} <strong>{part.count}</strong>
                    </span>
                  </React.Fragment>
                ))}
              </>
            ) : (
              <span className="home-today-social-banner__empty-inline">{emptyText}</span>
            )}
          </span>
        </button>
      </div>
    );
  };

  const renderHomeMainLiveSlot = () => (
    <div className="home-main-live-slot home-main-live-slot--gate">
      {renderHomeLiveAdRow(true)}
    </div>
  );

  const renderHomeMainQuickMenuSection = () => (
    <section
      className={`home-quick-menu-standalone home-quick-menu-standalone--gate${isHomeGate ? ' home-gate-section-box' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 0,
        ...(isHomeGate
          ? {}
          : {
              padding: 0,
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
            }),
      }}
      aria-label={isHomeGate ? (isEn ? 'Main menu' : '메인 메뉴') : (isEn ? 'Quick menu' : '빠른 메뉴')}
    >
      <div className="home-quick-menu-block">{renderHomeQuickMenuInner()}</div>
    </section>
  );

  const renderHomeSocialBarSection = () => {
    if (activeTab !== null) return null;

    return (
      <motion.div
        className="home-social-bar-wrap"
        style={{ padding: 0, marginTop: 0, marginBottom: 0 }}
      >
        <section
          ref={barSectionRef}
          className={`home-depth-panel home-luxury-section-box home-social-bar-panel${isHomeGate ? ' home-social-bar-panel--gate home-gate-section-box' : ''}`}
          style={{
            ...(isHomeGate
              ? { marginTop: 0, display: 'flex', flexDirection: 'column' }
              : {
                  ...homeDepthPanelStyle,
                  ...(isHomeGateDark ? {} : homeLuxurySectionBoxStyle),
                  marginTop: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }),
          }}
        >
          {renderHomeSectionHeader(
            isEn ? 'Social BAR' : 'Social BAR',
            null,
            <button
              type="button"
              className="home-section-action"
              onClick={() => {
                setShowBarRegisterForm(true);
                pushOverlay('barRegister');
              }}
            >
              <Plus size={12} strokeWidth={2.5} />
              {isEn ? 'Add' : '신규등록'}
            </button>,
            isHomeGateDark ? { color: homeUi.barSubtitle, fontWeight: 600 } : null,
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
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(0, 0, 0, 0.5)', fontWeight: 700 }}>
                {geoRegionStatus === 'pending' ? '현재 위치 기준 지역을 확인하는 중...' : '전국 BAR 정보를 정렬하는 중...'}
              </div>
            ) : !selectedRegionTab ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(0, 0, 0, 0.5)', fontSize: '13px', fontWeight: 600 }}>
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
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(0, 0, 0, 0.5)', fontSize: '13px', fontWeight: 600 }}>
                      {isEn ? 'No spots in this area yet.' : '이 지역 장소가 아직 없어요.'}
                    </div>
                  );
                }

                const regionBars = sortBarsForSocialBarTab(filteredBars, selectedRegionTab);
                const hasMoreBars = regionBars.length > SOCIAL_BAR_PEEK_VISIBLE;
                const barListLabel = isEn
                  ? `${selectedRegionTab} · ${regionBars.length} spot${regionBars.length === 1 ? '' : 's'}`
                  : `${selectedRegionTab} · ${regionBars.length}곳`;

                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={selectedRegionTab}
                    className="home-social-bar-fade"
                  >
                    <p
                      className="home-social-bar-region-hint"
                      style={{ margin: '0 0 12px', padding: '0 2px', color: homeUi.barSubtitle, fontSize: 12, fontWeight: 700 }}
                    >
                      {barListLabel}
                    </p>
                    <div
                      className={`home-social-bar-scroll scrollbar-hide${
                        isHomeGate
                          ? ` home-social-bar-scroll--peek${hasMoreBars ? ' home-social-bar-scroll--peek-more' : ''}`
                          : ''
                      }`}
                      role="list"
                      aria-label={isEn ? `Social BAR in ${selectedRegionTab}` : `${selectedRegionTab} Social BAR`}
                    >
                      <div className={`home-social-bar-track${isHomeGate ? ' home-social-bar-track--peek' : ''}`}>
                        {regionBars.map((bar) => renderBarCard(bar))}
                      </div>
                    </div>
                  </motion.div>
                );
              })()
            )}
          </motion.div>
        </section>
      </motion.div>
    );
  };

  const formatHotInstructorGenre = (genre) => {
    if (Array.isArray(genre)) return genre.filter(Boolean).join(' · ');
    return String(genre || '').trim();
  };

  const renderHomeHotInstructorsSection = () => {
    if (activeTab !== null) return null;
    if (!hotInstructorsLoading && hotInstructors.length === 0) return null;

    const skeletonItems = [0, 1, 2];

    return (
      <section
        className={`home-hot-instructors-wrap${isHomeGate ? ' home-gate-section-box' : ''}`}
        aria-label={isEn ? 'Active instructors' : '활동 강사'}
      >
        {renderHomeGateSectionTitle(isEn ? 'Instructors' : '강사 한눈에', 'home-hot-instructors-title')}
        <div className="home-hot-instructors-scroll scrollbar-hide">
          <div className="home-hot-instructors-track">
            {hotInstructorsLoading
              ? skeletonItems.map((i) => (
                  <div
                    key={`hot-instructor-skeleton-${i}`}
                    className="home-hot-instructor-card home-hot-instructor-card--skeleton"
                    aria-hidden
                  />
                ))
              : hotInstructors.map((inst) => {
                  const genreLabel = formatHotInstructorGenre(inst.genre);
                  return (
                    <motion.button
                      key={inst.id}
                      type="button"
                      className="home-hot-instructor-card"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/instructors')}
                    >
                      <div className="home-hot-instructor-card__media">
                        <img
                          src={inst.photo_url || DEFAULT_AVATAR_IMAGE}
                          alt={inst.name || ''}
                          loading="lazy"
                          decoding="async"
                          onError={imgFallbackHandler(DEFAULT_AVATAR_IMAGE)}
                        />
                      </div>
                      <div className="home-hot-instructor-card__meta">
                        <span className="home-hot-instructor-card__name">{inst.name}</span>
                        {genreLabel ? (
                          <span className="home-hot-instructor-card__genre">{genreLabel}</span>
                        ) : null}
                      </div>
                    </motion.button>
                  );
                })}
          </div>
        </div>
      </section>
    );
  };

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
          minHeight: isHomeGate ? 44 : 48,
          background: 'transparent',
          borderRadius: '14px',
          overflow: 'hidden',
          border: isHomeGateDark ? '1px solid rgba(255, 23, 68, 0.1)' : 'none',
          boxShadow: isHomeGateDark ? '0 6px 24px rgba(0, 0, 0, 0.38)' : 'none',
        }}
      >
        <style>{`
            .home-live-banner-slot {
              position: relative;
              width: 100%;
              min-height: 48px;
            }
            .home-live-banner-fallback {
              width: 100%;
            }
            .home-live-banner-slide-text {
              animation: home-live-banner-slide-in 0.45s ease-out;
            }
            @keyframes home-live-banner-slide-in {
              from { opacity: 0; transform: translateX(8px); }
              to { opacity: 1; transform: translateX(0); }
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
              border: 1px solid rgba(0, 0, 0, 0.08) !important;
              background: rgba(255, 255, 255, 0.9) !important;
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

            /* 메인 홈 LIVE — 흰/검/빨 (히어로 톤) */
            .home-gate-shell .home-main-live-slot--gate {
              width: 100%;
            }
            .home-gate-shell .home-live-banner-fallback--gate {
              width: 100%;
            }
            .home-gate-shell .home-live-banner-fallback--gate .live-dynamic-banner__inner,
            .home-gate-shell .live-count-premium-wrapper--gate .live-dynamic-banner__inner {
              min-height: 44px !important;
              height: auto !important;
              padding: 10px 14px !important;
              gap: 8px !important;
              align-items: center !important;
              box-sizing: border-box !important;
            }
            @media (max-width: 390px) {
              .home-gate-shell .home-live-banner-fallback--gate .live-dynamic-banner__inner,
              .home-gate-shell .live-count-premium-wrapper--gate .live-dynamic-banner__inner {
                padding: 9px 12px !important;
              }
            }

            /* 메인 홈 LIVE — 다크·골드 (레거시 home-gate-active) */
            .app-container:not(.home-gate-active) .live-count-premium-wrapper:not(.live-count-premium-wrapper--gate) .live-dynamic-banner {
              width: 100% !important;
              background: linear-gradient(270deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff) !important;
              background-size: 400% 400% !important;
              animation: liveGradient 4s ease infinite !important;
              padding: 0 !important;
              border: none !important;
              border-radius: 14px !important;
            }
            .live-count-premium-wrapper:not(.live-count-premium-wrapper--gate) .live-dynamic-banner__inner {
              min-height: 48px !important;
              height: 48px !important;
              padding: 0 clamp(12px, 3.5vw, 16px) !important;
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
            .live-count-premium-wrapper:not(.live-count-premium-wrapper--gate) .lc-tag {
              background: transparent !important;
              color: #ffffff !important;
              font-size: 10px !important;
              font-weight: 950 !important;
              padding: 0 !important;
              border-radius: 0 !important;
              letter-spacing: 0.5px !important;
            }
            .home-gate-shell .live-count-premium-wrapper--gate .lc-tag,
            .home-gate-shell .home-live-banner-fallback--gate .lc-tag {
              display: inline-flex !important;
              align-items: center !important;
              flex-shrink: 0 !important;
              background: #E53935 !important;
              color: #FFFFFF !important;
              border: none !important;
              border-radius: 6px !important;
              padding: 3px 8px !important;
              font-size: 10px !important;
              font-weight: 800 !important;
              letter-spacing: 0.06em !important;
              line-height: 1.2 !important;
            }
            .live-count-premium-wrapper:not(.live-count-premium-wrapper--gate) .lc-dot {
              width: 6px !important;
              height: 6px !important;
              background: #ff6b6b !important;
              border-radius: 50% !important;
              flex-shrink: 0 !important;
              margin-right: 2px !important;
              animation: lc-blink 1s infinite;
            }
            .home-gate-shell .live-count-premium-wrapper--gate .lc-dot,
            .home-gate-shell .home-live-banner-fallback--gate .lc-dot {
              width: 6px !important;
              height: 6px !important;
              background: #E53935 !important;
              box-shadow: none !important;
              flex-shrink: 0 !important;
            }
            .live-count-premium-wrapper:not(.live-count-premium-wrapper--gate) .live-dynamic-banner__sep--dot {
              color: #ffffff !important;
              font-size: 12px !important;
              font-weight: 800 !important;
              flex-shrink: 0 !important;
              margin: 0 2px !important;
            }
            .home-gate-shell .live-count-premium-wrapper--gate .live-dynamic-banner__sep--dot,
            .home-gate-shell .home-live-banner-fallback--gate .live-dynamic-banner__sep--dot {
              color: #94A3B8 !important;
            }
            .home-gate-shell .live-count-premium-wrapper--gate .live-dynamic-banner__spotlight,
            .home-gate-shell .live-count-premium-wrapper--gate .live-dynamic-banner__spotlight--solo,
            .home-gate-shell .home-live-banner-fallback--gate .live-dynamic-banner__spotlight,
            .home-gate-shell .home-live-banner-fallback--gate .live-dynamic-banner__spotlight--solo {
              color: #0F172A !important;
              font-weight: 800 !important;
              text-shadow: none !important;
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
            .app-container:not(.home-gate-active) .live-count-premium-wrapper:not(.live-count-premium-wrapper--gate) .live-dynamic-banner__spotlight,
            .app-container:not(.home-gate-active) .live-count-premium-wrapper:not(.live-count-premium-wrapper--gate) .live-dynamic-banner__spotlight--solo {
              color: #ffffff !important;
              font-weight: 900 !important;
              font-size: clamp(12px, 3.6vw, 15px) !important;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25) !important;
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
              .home-gate-active .live-count-premium-wrapper--gate .live-dynamic-banner__inner {
                padding: 0 12px !important;
              }
              .home-gate-active .live-count-premium-wrapper--gate .live-dynamic-banner__spotlight--solo {
                font-size: 11px !important;
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
              border: 1px solid rgba(255, 23, 68, 0.1);
              background: linear-gradient(180deg, #FFFFFF 0%, rgba(255, 23, 68, 0.1) 100%);
              color: #FF1744;
              font-size: 12px;
              font-weight: 900;
              line-height: 1.15;
              cursor: pointer;
              box-shadow: 0 4px 14px rgba(255, 23, 68, 0.1);
            }
            .home-party-register-outside__line { display: block; }
          `}</style>
        <div className="home-live-banner-slot">
          {renderHomeTodaySocialBanner()}
        </div>
      </motion.div>
      {activeTab === 'social' && (
        <button
          type="button"
          className="home-party-register-outside"
          onClick={() => handleRegister('party')}
          aria-label={isEn ? 'Register social' : '소셜등록'}
        >
          <span className="home-party-register-outside__line">{isEn ? 'Social' : '소셜'}</span>
          <span className="home-party-register-outside__line">{isEn ? 'Register' : '등록'}</span>
        </button>
      )}
    </motion.div>
  );

  return (
    <div
      className={`app-container${isHomeGate ? ' home-gate-shell' : ''}${isHomeGateDark ? ' home-gate-active' : ''}${activeTab === 'social' ? ' social-tab-active' : ''}`}
      style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: isHomeGate ? HOME_PAGE_BG : homeUi.pageBg, minHeight: '100dvh', paddingBottom: '100px', transition: 'background 0.25s ease' }}
    >

      {activeTab === 'social' && (
        <img
          src="/Photo/소셜.png"
          alt="소셜 배너"
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* 📌 [영역 A: 히어로 / 메인 게이트] — 다크: HomeDarkGate / 라이트: 기존 스택 */}
      {activeTab === null && !isHomeGateDark && (
        <AppPageHeader variant="light" sticky className={isHomeGate ? 'home-hero-zone' : undefined}>
          <div className="home-hero-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
            <h1
              className="home-type-display home-hero-title"
              role="button"
              tabIndex={0}
              onClick={registerAdminPortalTap}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  registerAdminPortalTap();
                }
              }}
              style={{
                color: '#E53935',
                fontSize: '28px',
                fontWeight: 900,
                margin: 0,
                lineHeight: 1.1,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              오늘밤빠
            </h1>
            <p
              className="home-type-tagline home-type-tagline-sub home-hero-tagline"
              style={{ color: '#191F28', fontSize: '13px', fontWeight: 500, margin: '2px 0 0', lineHeight: 1.35 }}
            >
              켜고, 찾고, 가면 끝
            </p>
          </div>
        </AppPageHeader>
      )}

      {activeTab === null && (
        <motion.div
          className="home-main-stack"
          style={{
            padding: isHomeGateDark ? '0 16px' : '0 16px',
            gap: isHomeGate ? homeGateStackGap : undefined,
          }}
        >
          {isHomeGateDark ? (
            <HomeDarkGate {...homeDarkGateProps} />
          ) : (
            <>
              {renderHomeMainLiveSlot()}
              {renderHomeMainQuickMenuSection()}
              {renderHomeHotInstructorsSection()}
              {renderHomeSocialBarSection()}
            </>
          )}
        </motion.div>
      )}

      {activeTab === 'social' && renderHomeLiveAdRow(false)}

      {/* 메인 퀵메뉴: activeTab === null → 3섹션 그리드 / 소셜 탭 → 가로 스크롤 */}
      <style>{`
        .home-gate-shell {
          --home-page-bg: ${isHomeGateDark ? '#0B0B0B' : '#F5F6F8'};
          --home-text-primary: ${isHomeGateDark ? '#FFFFFF' : '#191F28'};
          --home-text-secondary: ${isHomeGateDark ? '#B8B8B8' : '#191F28'};
          --home-text-tertiary: ${isHomeGateDark ? 'rgba(255,255,255,0.45)' : '#4B5563'};
          --home-card-border: ${isHomeGateDark ? '#2A2A2A' : '#E8EBED'};
          --home-fade-rgb: ${isHomeGateDark ? '11, 11, 11' : '245, 246, 248'};
          background-color: ${isHomeGateDark ? '#0B0B0B' : '#F5F6F8'} !important;
        }
        .home-gate-shell .home-main-stack {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .home-gate-shell .home-section-break {
          padding: 28px 0 32px;
        }
        .home-gate-menu {
          padding: 6px 0 10px;
        }
        .home-gate-photo-menu-scroll {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          align-items: start;
          gap: clamp(5px, 1.6vw, 8px);
          width: 100%;
          box-sizing: border-box;
          overflow: visible;
          margin: 0;
          padding: 10px 0 6px;
        }
        .home-gate-photo-menu-card-shell {
          position: relative;
          min-width: 0;
          width: 100%;
        }
        .home-gate-photo-menu-card {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 4 / 5;
          height: auto;
          min-height: 0;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          overflow: visible;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.15s ease;
        }
        .home-gate-photo-menu-card:active {
          opacity: 0.88;
        }
        .home-gate-photo-menu-card:active .home-gate-photo-menu-card__media {
          opacity: 0.88;
        }
        .home-gate-photo-menu-card__media {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          overflow: hidden;
          background: #1E293B;
        }
        .home-gate-photo-menu-card__img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .home-gate-photo-menu-card__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
          pointer-events: none;
        }
        .home-gate-photo-menu-card__label {
          position: absolute;
          left: 0;
          right: 0;
          bottom: clamp(5px, 1.6vw, 7px);
          z-index: 2;
          color: #FFFFFF;
          font-size: clamp(9px, 2.6vw, 11px);
          font-weight: 700;
          line-height: 1.2;
          text-align: center;
          padding: 0 3px;
          word-break: keep-all;
        }
        .home-gate-photo-menu-card__badge {
          position: absolute;
          top: -7px;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: clamp(17px, 4.8vw, 20px);
          height: clamp(17px, 4.8vw, 20px);
          padding: 0 4px;
          border-radius: 999px;
          background: #ff3040;
          border: 2px solid #F5F6F8;
          color: #fff;
          font-size: clamp(9px, 2.5vw, 11px);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
          box-sizing: border-box;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
          pointer-events: none;
        }
        .home-gate-photo-menu-card__badge--tr {
          right: -2px;
          left: auto;
        }
        .home-gate-photo-menu-card__emoji-chip {
          position: absolute;
          top: 4px;
          left: 4px;
          z-index: 4;
          font-size: clamp(10px, 2.8vw, 12px);
          line-height: 1;
          pointer-events: none;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
        }
        .home-quick-menu-standalone--gate.home-gate-section-box {
          overflow: visible;
        }
        .home-gate-shell:not(.home-gate-active) .home-gate-menu__divider {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(15, 23, 42, 0.12) 20%,
            rgba(15, 23, 42, 0.12) 80%,
            transparent 100%
          );
        }
        .home-gate-shell:not(.home-gate-active) .home-gate-king-menu__toggle {
          border: 1px solid var(--home-card-border, #E8EBED);
          background: #FFFFFF;
          color: #191F28;
        }
        .home-gate-shell:not(.home-gate-active) .home-gate-king-menu__toggle[aria-expanded="true"] {
          color: #191F28;
          border-color: var(--home-card-border, #E8EBED);
          background: #F5F6F8;
        }
        .home-gate-shell:not(.home-gate-active) .home-gate-king-menu__grid .home-quick-menu-item-label {
          color: #191F28 !important;
          font-weight: 600;
        }
        .home-gate-shell:not(.home-gate-active) .home-gate-king-menu__grid .home-quick-menu-icon-circle {
          width: 50px;
          height: 50px;
          background: #FFFFFF;
          border: 1px solid var(--home-card-border, #E8EBED);
          color: #191F28;
        }
        .home-gate-shell:not(.home-gate-active) .home-gate-king-menu__grid .home-quick-menu-item--register-party .home-quick-menu-icon-circle,
        .home-gate-shell:not(.home-gate-active) .home-gate-king-menu__grid .home-quick-menu-item--register-class .home-quick-menu-icon-circle {
          width: 50px;
          height: 50px;
          background: #FFFFFF;
          border: 1px solid var(--home-card-border, #E8EBED);
          color: #191F28;
        }
        .home-gate-shell:not(.home-gate-active) .home-gate-king-menu__grid .home-quick-menu-item--register-party .home-quick-menu-item-label,
        .home-gate-shell:not(.home-gate-active) .home-gate-king-menu__grid .home-quick-menu-item--register-class .home-quick-menu-item-label {
          color: #191F28 !important;
          font-weight: 600;
        }
        .home-gate-shell:not(.home-gate-active) .home-hot-instructors-title {
          color: #191F28 !important;
        }
        .home-gate-section-title {
          display: flex;
          align-items: center;
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--home-text-primary, #333D4B);
          letter-spacing: -0.03em;
        }
        .home-gate-section-title__point {
          width: 2px;
          height: 14px;
          background: #E53935;
          border-radius: 1px;
          margin-right: 8px;
          display: inline-block;
          flex-shrink: 0;
        }
        .home-gate-section-title__text {
          min-width: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--home-text-primary, #333D4B);
        }
        .home-hot-instructors-wrap .home-gate-section-title {
          margin-bottom: 12px;
        }
        .home-gate-shell:not(.home-gate-active) .home-social-bar-scroll--peek-more::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 28px;
          height: calc(100% - 10px);
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.92));
        }
        .home-gate-main-menu-item__badge {
          position: absolute;
          top: -6px;
          right: -12px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 999px;
          background: #E8281E;
          border: 2px solid #FFFFFF;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          box-shadow: none;
          pointer-events: none;
        }
        .home-gate-menu__divider {
          height: 1px;
          margin: 24px 8px 20px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.14) 20%,
            rgba(255, 255, 255, 0.14) 80%,
            transparent 100%
          );
        }
        .home-gate-king-menu__grid .home-quick-menu-item {
          padding: 10px 4px 16px;
          min-height: 88px;
          gap: 6px;
        }
        .home-gate-king-menu__grid .home-quick-menu-item-label {
          white-space: nowrap;
          line-height: 1.3;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.92);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .home-gate-king-menu__grid .home-quick-menu-icon-circle {
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.82);
        }
        .home-gate-king-menu__grid .home-quick-menu-icon-circle svg {
          width: 28px;
          height: 28px;
        }
        .home-gate-king-menu__grid .home-quick-menu-item--register-party .home-quick-menu-icon-circle,
        .home-gate-king-menu__grid .home-quick-menu-item--register-class .home-quick-menu-icon-circle {
          width: 54px;
          height: 54px;
        }
        .home-gate-king-menu__toolbar {
          display: flex;
          justify-content: center;
          margin: 4px 0 16px;
        }
        .home-gate-king-menu__toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.72);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .home-gate-king-menu__toggle[aria-expanded="true"] {
          color: #FF1744;
          border-color: rgba(255, 23, 68, 0.1);
          background: rgba(255, 23, 68, 0.1);
        }
        .home-gate-king-menu__grid {
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px 8px;
          margin-top: 0;
          margin-bottom: 12px;
          padding: 4px 4px 10px;
        }
        @keyframes gentleSparkle {
          0% { box-shadow: 0 0 2px rgba(85, 139, 47, 0.1); filter: drop-shadow(0 0 1px rgba(85, 139, 47, 0.1)); }
          50% { box-shadow: 0 0 12px rgba(85, 139, 47, 0.45); filter: drop-shadow(0 0 4px rgba(85, 139, 47, 0.25)); }
          100% { box-shadow: 0 0 2px rgba(85, 139, 47, 0.1); filter: drop-shadow(0 0 1px rgba(85, 139, 47, 0.1)); }
        }
        .home-quick-menu-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 23, 68, 0.1);
          color: #FF1744;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .home-quick-menu-icon-circle svg {
          width: 26px;
          height: 26px;
          display: block;
        }
        .home-quick-menu-item--register-party .home-quick-menu-icon-circle {
          width: 52px;
          height: 52px;
          background: rgba(255, 23, 68, 0.1);
          border: 1.5px solid rgba(255, 23, 68, 0.1);
          color: #FF1744;
        }
        .home-quick-menu-item--register-party .home-quick-menu-item-label {
          color: #FF1744;
          font-weight: 800;
        }
        .home-quick-menu-item--register-class .home-quick-menu-icon-circle {
          width: 52px;
          height: 52px;
          background: rgba(0, 0, 0, 0.08);
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          color: #000000;
        }
        .home-quick-menu-item--register-class .home-quick-menu-item-label {
          color: rgba(0, 0, 0, 0.5);
          font-weight: 800;
        }
        .home-gate-active .home-quick-menu-icon-circle {
          color: #ffffff;
        }
        .home-gate-active .home-quick-menu-item--register-party .home-quick-menu-icon-circle,
        .home-gate-active .home-quick-menu-item--register-class .home-quick-menu-icon-circle {
          color: #ffffff;
        }
        .home-gate-active .home-quick-menu-item--register-party .home-quick-menu-icon-circle {
          background: rgba(255, 23, 68, 0.1);
        }
        .home-gate-active .home-quick-menu-item--register-party .home-quick-menu-item-label,
        .home-gate-active .home-quick-menu-item--register-class .home-quick-menu-item-label,
        .home-gate-active .home-quick-menu-item-label {
          color: #ffffff !important;
        }
        .home-gate-active .home-quick-menu-item--register-class .home-quick-menu-icon-circle {
          background: rgba(0, 0, 0, 0.08);
        }
        .app-container:not(.home-gate-active) .home-quick-menu-icon-circle {
          background: #FFFFFF;
          border-color: rgba(0, 0, 0, 0.08);
          color: rgba(0, 0, 0, 0.5);
        }
        .app-container:not(.home-gate-active) .home-quick-menu-item--register-party .home-quick-menu-icon-circle {
          background: rgba(229, 57, 53, 0.08);
          border-color: rgba(229, 57, 53, 0.2);
          color: #E53935;
        }
        .app-container:not(.home-gate-active) .home-quick-menu-item--register-party .home-quick-menu-item-label {
          color: #E53935;
        }
        .app-container:not(.home-gate-active) .home-quick-menu-item--register-class .home-quick-menu-icon-circle {
          background: rgba(30, 41, 59, 0.06);
          border-color: rgba(30, 41, 59, 0.12);
          color: #1E293B;
        }
        .app-container:not(.home-gate-active) .home-quick-menu-item--register-class .home-quick-menu-item-label {
          color: #1E293B;
        }
        .home-quick-menu-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 6px 4px;
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
          color: rgba(0, 0, 0, 0.5);
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
          border: 1px solid var(--home-card-border, #E8EBED);
          background: #FFFFFF;
          color: #191F28;
          font-size: var(--ds-body-size);
          font-weight: 600;
          cursor: pointer;
          line-height: 1.2;
        }
        .home-gate-shell .home-region-pill.is-selected {
          background: rgba(229, 57, 53, 0.08);
          border-color: rgba(229, 57, 53, 0.25);
          color: #E53935;
        }
        .home-gate-shell .home-region-pill.is-selected .home-region-pill-count {
          color: #E53935;
        }
        .home-gate-shell .home-section-break__line {
          border: none;
          height: 1px;
          margin: 0;
          background: var(--home-card-border, #E8EBED);
        }
        .home-gate-shell .quick-menu-more-link {
          color: #191F28;
        }
        .home-gate-shell .quick-menu-more-wrap::after {
          background: linear-gradient(to right, rgba(245, 246, 248, 0), #F5F6F8 90%);
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
          scroll-snap-type: none;
          touch-action: pan-y pan-x;
          overscroll-behavior-y: auto;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          msOverflowStyle: none;
          padding: 2px 4px 6px;
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
          scroll-snap-type: none;
          touch-action: pan-y pan-x;
          overscroll-behavior-y: auto;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          msOverflowStyle: none;
          padding: 0 2px 12px;
        }
        .quick-menu-scroll > * {
          flex-shrink: 0;
        }
        .quick-menu-scroll::-webkit-scrollbar {
          display: none;
        }
        .home-quick-menu-grid-wrap--swipe {
          position: relative;
        }
        .home-quick-menu-grid-wrap--swipe::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 28px;
          height: 100%;
          pointer-events: none;
          background: linear-gradient(to right, rgba(var(--home-fade-rgb, 13, 13, 13), 0), var(--home-page-bg, #0d0d0d) 88%);
        }
        .home-quick-menu-scroll--gate-all {
          display: flex;
          flex-wrap: nowrap;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: none;
          touch-action: pan-y pan-x;
          overscroll-behavior-y: auto;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          msOverflowStyle: none;
          padding: 2px 20px 4px 2px;
        }
        .home-quick-menu-scroll--gate-all > .home-quick-menu-item {
          flex: 0 0 calc((100% - 30px) / 4.22);
          width: calc((100% - 30px) / 4.22);
          min-width: 68px;
          max-width: 88px;
        }
        .home-quick-menu-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .home-quick-menu-count-badge {
          position: absolute;
          top: -5px;
          right: -10px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #ff3040;
          border: 2px solid var(--home-page-bg, #0d0d0d);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
          box-sizing: border-box;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
          pointer-events: none;
        }
        .home-quick-menu-live-badge {
          position: absolute;
          top: -2px;
          right: -8px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          background: linear-gradient(135deg, #E53935, #FF7043);
          border: 1.5px solid var(--home-page-bg, #0d0d0d);
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          line-height: 16px;
          text-align: center;
          letter-spacing: -0.02em;
          box-shadow: 0 0 10px rgba(229, 57, 53, 0.55);
        }
        .home-quick-menu-item--live-uploaded .home-quick-menu-icon-circle svg {
          animation: home-quick-accent-pulse 2.4s ease-in-out infinite;
        }
        .home-quick-menu-scroll--gate-all::-webkit-scrollbar {
          display: none;
        }
        .home-quick-menu-item--gate-swipe {
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 2px 0 0;
          border: none;
          background: none;
        }
        .home-gate-active .home-quick-menu-standalone {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .home-gate-active .home-quick-menu-scroll--gate-all .home-quick-menu-icon-circle {
          width: 46px;
          height: 46px;
          min-width: 46px;
          min-height: 46px;
          padding: 0;
          border-radius: 50%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff !important;
          border: 1.5px solid rgba(255, 255, 255, 0.92) !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
          color: #000000 !important;
        }
        .home-gate-active .home-quick-menu-scroll--gate-all .home-quick-menu-icon-circle svg {
          width: 26px;
          height: 26px;
          color: #000000 !important;
        }
        .home-gate-active .home-quick-menu-scroll--gate-all .home-quick-menu-item--register-party .home-quick-menu-icon-circle {
          background: rgba(255, 23, 68, 0.1) !important;
          border: 1.5px solid rgba(255, 23, 68, 0.1) !important;
          color: #FF1744 !important;
        }
        .home-gate-active .home-quick-menu-scroll--gate-all .home-quick-menu-item--register-party .home-quick-menu-icon-circle svg {
          color: #FF1744 !important;
        }
        .home-gate-active .home-quick-menu-scroll--gate-all .home-quick-menu-item--register-class .home-quick-menu-icon-circle {
          background: rgba(0, 0, 0, 0.08) !important;
          border: 1.5px solid rgba(0, 0, 0, 0.08) !important;
          color: #000000 !important;
        }
        .home-gate-active .home-quick-menu-scroll--gate-all .home-quick-menu-item--register-class .home-quick-menu-icon-circle svg {
          color: rgba(0, 0, 0, 0.5) !important;
        }
        .home-gate-active .home-quick-menu-scroll--gate-all .home-quick-menu-item-label {
          color: #ffffff !important;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.02em;
          max-width: 100%;
          white-space: nowrap;
        }
        .home-gate-active .home-quick-menu-scroll--gate-all .home-quick-menu-item--register-party .home-quick-menu-item-label,
        .home-gate-active .home-quick-menu-scroll--gate-all .home-quick-menu-item--register-class .home-quick-menu-item-label {
          color: #ffffff !important;
          font-weight: 800;
        }
        .home-gate-active .quick-menu-more-link {
          color: #ffffff;
        }
        .home-gate-active .home-section-action {
          border-color: rgba(255, 23, 68, 0.1);
          background: rgba(255, 23, 68, 0.1);
          color: #ffffff;
        }
        .home-gate-active .home-social-bar-wrap .home-bar-thumb {
          box-shadow: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .home-gate-active .home-social-bar-wrap .home-bar-thumb--my-region {
          box-shadow: 0 0 0 1px rgba(255, 23, 68, 0.1);
          border-color: rgba(255, 23, 68, 0.1);
        }
        .home-gate-active .home-social-bar-wrap .home-bar-chip--my-region .home-bar-chip-name,
        .home-gate-active .home-social-bar-wrap .home-bar-chip--my-region .social-bar-name-label {
          color: #ffffff;
        }
        .home-gate-active .home-social-bar-wrap .home-bar-view-line {
          color: #ffffff;
        }
        .home-gate-active .quick-menu-more-wrap::after {
          background: linear-gradient(to right, rgba(var(--home-fade-rgb, 13, 13, 13), 0), var(--home-page-bg, #0d0d0d) 90%);
        }
        .home-gate-shell .home-hero-zone {
          background: #F5F6F8;
        }
        .home-gate-shell .home-hero-brand .home-hero-title {
          color: #E53935 !important;
          font-size: 32px !important;
          font-weight: 900 !important;
        }
        .home-gate-shell .home-hero-brand .home-hero-tagline {
          color: #191F28 !important;
          font-size: 14px !important;
          font-weight: 500 !important;
        }
        .home-gate-shell .home-hero-brand .home-type-display {
          color: #E53935 !important;
        }
        .home-hero-brand .home-type-display {
          margin: 0 !important;
        }
        .home-hero-brand .home-type-tagline {
          margin: 4px 0 0 !important;
        }
        .social-bar-name-label {
          font-weight: 900;
        }
        .home-gate-active .social-bar-name-label {
          color: #FFFFFF;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
        }
        .home-social-bar-wrap .home-social-bar-track,
        .home-social-bar-wrap .home-social-bar-track--peek {
          display: inline-flex;
          flex-wrap: nowrap;
          align-items: flex-start;
          gap: 12px;
          width: max-content;
          min-width: 100%;
          padding: 0 2px 2px;
        }
        .home-social-bar-wrap .home-bar-chip {
          flex: 0 0 auto !important;
          width: 80px !important;
          min-width: 80px !important;
          max-width: 80px !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0;
          margin: 0;
          border: none;
          background: none;
          box-sizing: border-box;
        }
        .home-social-bar-wrap .home-bar-thumb {
          width: 72px !important;
          height: 72px !important;
          aspect-ratio: auto !important;
          border-radius: 50% !important;
          overflow: hidden;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .home-social-bar-wrap .home-bar-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          border-radius: 50%;
          display: block;
        }
        .home-social-bar-wrap .home-bar-thumb-fallback {
          width: 40%;
          height: 40%;
          object-fit: contain;
          opacity: 0.85;
        }
        .home-social-bar-wrap .home-bar-chip-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-top: 0;
          text-align: center;
          gap: 4px;
        }
        .home-social-bar-wrap .home-bar-chip-name,
        .home-social-bar-wrap .social-bar-name-label {
          margin: 6px 0 0 !important;
          width: 100%;
          font-size: 12px !important;
          font-weight: 700 !important;
          line-height: 1.25 !important;
          text-align: center !important;
          color: #191F28 !important;
          text-shadow: none !important;
          white-space: normal !important;
          word-break: keep-all;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: unset !important;
        }
        .home-social-bar-wrap .home-bar-region-badge {
          display: inline-block;
          max-width: 100%;
          margin: 0;
          padding: 2px 8px;
          border-radius: 20px;
          background: #F1F5F9;
          color: rgba(30, 41, 59, 0.55);
          font-size: 10px;
          font-weight: 600;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .home-social-bar-wrap .home-bar-chip--my-region .home-bar-chip-name,
        .home-social-bar-wrap .home-bar-chip--my-region .social-bar-name-label {
          color: #191F28 !important;
        }
        .home-gate-shell .home-social-bar-wrap .home-bar-view-line {
          color: #4B5563 !important;
        }
        .home-social-bar-wrap .home-bar-thumb--my-region {
          box-shadow: 0 0 0 2px #E53935;
        }
        @keyframes home-hot-instructor-skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.75; }
        }
        .home-gate-shell .home-quick-menu-standalone--gate.home-gate-section-box {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .home-gate-shell .home-social-bar-panel--gate {
          padding: 16px 14px 18px !important;
          border-radius: 14px !important;
          border: 1px solid var(--home-card-border, #E8EBED) !important;
          background: #FFFFFF !important;
          box-shadow: none !important;
        }
        .home-gate-active .home-social-bar-panel--gate {
          border: 0.5px solid #EDEAE3 !important;
          box-shadow: none !important;
        }
        .home-gate-shell .home-social-bar-panel--gate .home-type-section-title.home-gate-section-title {
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #1E293B !important;
        }
        .home-gate-shell .home-region-tabs {
          margin-bottom: 4px;
        }
        .home-gate-shell .home-social-bar-scroll--peek {
          overflow-x: auto;
          padding: 2px 12px 10px;
          scroll-snap-type: none;
          scroll-padding-inline: 12px;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y pan-x;
          overscroll-behavior-y: auto;
          overscroll-behavior-x: contain;
        }
        .home-gate-shell .home-social-bar-scroll--peek-more {
          position: relative;
        }
        .home-gate-active .home-social-bar-scroll--peek-more::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 28px;
          height: calc(100% - 10px);
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(var(--home-fade-rgb, 13, 13, 13), 0.92));
        }
        .home-gate-shell .home-social-bar-track--peek {
          display: inline-flex;
          flex-wrap: nowrap;
          gap: 12px;
          width: max-content;
          min-width: 100%;
          padding: 0 2px 2px;
        }
        .home-gate-shell .home-main-stack .home-hot-instructors-wrap {
          padding: 0;
          margin: 0;
        }
        .home-hot-instructors-wrap {
          background: var(--home-page-bg, #F5F6F8);
          padding: 16px 16px 0;
          margin: 0;
        }
        .home-hot-instructors-divider {
          display: block;
          width: 100%;
          height: 0;
          margin: 20px 0 0;
          padding: 0;
          border: none;
          border-top: 1px solid var(--home-card-border, #E8EBED);
        }
        .home-gate-active .home-hot-instructors-divider {
          border-top-color: rgba(255, 255, 255, 0.12);
        }
        .home-gate-active .home-hot-instructors-title {
          color: #ffffff !important;
        }
        .home-hot-instructors-title {
          margin: 0 0 12px;
        }
        .home-hot-instructors-scroll {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: none;
          scroll-padding-inline: 16px;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y pan-x;
          overscroll-behavior-y: auto;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 0 0 4px;
        }
        .home-hot-instructors-scroll::-webkit-scrollbar {
          display: none;
        }
        .home-hot-instructors-track {
          display: inline-flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: stretch;
          gap: 10px;
          width: max-content;
          min-width: 100%;
          padding: 0 2px 2px;
          vertical-align: top;
        }
        .home-hot-instructor-card {
          position: relative;
          flex: 0 0 auto;
          width: 140px;
          min-width: 140px;
          max-width: 140px;
          height: 180px;
          display: block;
          border: 1px solid var(--home-card-border, #E8EBED);
          border-radius: 12px;
          background: #FFFFFF;
          overflow: hidden;
          padding: 0;
          cursor: pointer;
          text-align: left;
          box-shadow: none;
        }
        .home-hot-instructor-card--skeleton {
          animation: home-hot-instructor-skeleton-pulse 1.2s ease-in-out infinite;
          pointer-events: none;
          background: #F1F5F9;
        }
        .home-hot-instructor-card__media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: #111111;
        }
        .home-hot-instructor-card__media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          display: block;
        }
        .home-hot-instructor-card__meta {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          height: 50px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          background: rgba(0, 0, 0, 0.85);
          box-sizing: border-box;
        }
        .home-hot-instructor-card__name {
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .home-hot-instructor-card__genre {
          color: rgba(255, 255, 255, 0.7);
          font-size: 11px;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

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
            { icon: <Calendar size={32} strokeWidth={1.2} color="#FF1744" />, label: '행사달력', particles: '📅', action: () => setShowFullCalendar(true) },
            // { icon: <MapPin size={32} strokeWidth={1.2} color="#FF1744" />, label: '위치·대관', particles: '📍', action: () => setShowRentalModal(true) },
            { icon: <Users size={32} strokeWidth={1.2} color="#FF1744" />, label: '파트너', particles: '💑', action: () => setActiveTab('partner') },
            { icon: <Users size={32} strokeWidth={1.2} color="#FF1744" />, label: '강사찾기', particles: '🕺', action: () => { localStorage.setItem('instructor_target_genre', '전체'); navigate('/instructors'); setTimeout(() => { window.dispatchEvent(new CustomEvent('apply-instructor-filter')); }, 300); } },
            { textIcon: '1:1', label: '채팅문의', particles: '💬', action: () => window.open('https://open.kakao.com/o/gP43rNri', '_blank') },
            { icon: <MessageSquare size={32} strokeWidth={1.2} color="#FF1744" />, label: '컨시어지', particles: '✨', action: () => window.dispatchEvent(new CustomEvent('open-chatbot')) },
            { icon: <Star size={32} strokeWidth={1.2} color="#FF1744" />, label: '운명의좌표', particles: '🌟', action: () => setShowSaju(true) },
            { icon: <Heart size={32} strokeWidth={1.2} color="#FF1744" />, label: '찜하기', particles: '❤️', action: () => pushOverlay('wishlist') },
            { icon: <Utensils size={32} strokeWidth={1.2} color="#FF1744" />, label: '맛집뒷풀이', particles: '🍽', action: () => navigate('/restaurant') },
            { icon: <Camera size={32} strokeWidth={1.2} color="#FF1744" />, label: '라이브픽', particles: '📸', action: () => navigate('/livepick') },
            { icon: <CloudSun size={32} strokeWidth={1.2} color="#FF1744" />, label: '오늘날씨', particles: '☀️', action: () => pushOverlay('weather') },
            { icon: <Navigation size={32} strokeWidth={1.2} color="#FF1744" />, label: '지능형경로', particles: '🧭', action: () => pushOverlay('route') },
          ].map((item, idx) => (
            <motion.div key={`partner-${idx}`} whileTap={{ scale: 0.92 }} onClick={(e) => { triggerParticle(e, item.particles); item.action(); }} style={{ ...quickMenuFloatStyle, position: 'relative', width: 'calc(22% - 6px)', minWidth: 'calc(22% - 6px)', flexShrink: 0, scrollSnapAlign: 'start' }}>
              {item.textIcon ? (
                <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px', fontSize: 18, fontWeight: 900, color: '#FF1744', letterSpacing: '-0.8px' }}>{item.textIcon}</motion.div>
              ) : (
                <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px' }}>{item.icon}</motion.div>
              )}
              <span style={quickMenuLabelStyle}>{item.label}</span>
            </motion.div>
          ))}
        </div>
        */}
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
            <span style={{ fontSize: 13, fontWeight: 800, color: '#000000' }}>내 강사</span>
            <button
              type="button"
              onClick={() => setMyInstructorsOpen((open) => !open)}
              style={{
                padding: '5px 10px', borderRadius: 8,
                border: myInstructorsOpen ? '1px solid #FF1744' : '1px solid #E2E8F0',
                background: myInstructorsOpen ? 'rgba(255, 23, 68, 0.1)' : '#fff',
                color: myInstructorsOpen ? '#FF1744' : 'rgba(0, 0, 0, 0.5)',
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
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #FF1744', padding: 2, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <img src={inst.photo_url || DEFAULT_AVATAR_IMAGE} onError={imgFallbackHandler(DEFAULT_AVATAR_IMAGE)} alt={inst.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0, 0, 0, 0.5)', maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
      <div ref={stickyHeaderRef} className="social-date-bar">
        <div className="social-date-bar__track date-stream-bar">
          {fourteenDays.map((item) => {
            const isSelected = selectedDate === item.fullDate;
            const isToday = item.isToday;
            const isHoliday = item.dayOfWeek === 0 || (item.month === '5' && item.date === '5');
            const isSaturday = item.dayOfWeek === 6;
            const dayPartyCount = partiesOnDate(calendarParties, item.fullDate).length;
            const hasEvent = dayPartyCount > 0;

            return (
              <button
                key={item.fullDate}
                type="button"
                className={`social-date-bar__day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}${isHoliday || isSaturday ? ' is-weekend' : ''}`}
                onClick={() => setSelectedDate(item.fullDate)}
                aria-label={isEn ? `${item.fullDate}${hasEvent ? `, ${dayPartyCount} social` : ''}` : `${item.fullDate}${hasEvent ? `, 소셜 ${dayPartyCount}건` : ''}`}
              >
                <span className="social-date-bar__weekday">{item.dayName}</span>
                <span className="social-date-bar__num">{item.date}</span>
                {isToday && !isSelected ? (
                  <span className="social-date-bar__today-pill">{isEn ? 'Today' : '오늘'}</span>
                ) : null}
                {hasEvent ? <span className="social-date-bar__dot" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </div>



      <div ref={scrollRef} className="social-tab-content">
        <div style={{ minHeight: '101%' }}>
          {partiesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '120px' }}>{Array(6).fill(0).map((_, i) => <div key={i} style={{ height: '140px', width: '100%', background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }} />)}</div>
          ) : (
            <div style={{ width: '100%', padding: '0 0 20px 0', backgroundColor: 'var(--color-bg)' }}>
              {(() => {
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

                const unifiedDayEvents = [...activeParties];

                const globalParties = (parties || [])
                  .filter((p) => partyRowMatchesSlot(p, '소셜'))
                  .map(p => ({
                    ...p,
                    locationName: p.location_name || p.locations?.name || p.region,
                    _table: 'parties',
                  }));

                const allGlobalEvents = globalParties
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
                                <span style={{ color: '#000000' }}>PICK</span>
                              </h2>
                              {/* <span style={{ fontSize: '18px' }}>🔥</span> */}
                            </div>
                            <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.5)', fontWeight: 600 }}>지금 가장 핫한 파티</span>
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
                              cursor: 'pointer', color: '#000000',
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
                                onClick={() => openPartyWithAfterParty(item)} 
                                className="bchata-poster-frame party-carousel-card"
                                style={{ 
                                  width: '140px', 
                                  height: '210px', 
                                  flexShrink: 0, 
                                  borderRadius: '16px', 
                                  overflow: 'hidden', 
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)', 
                                  position: 'relative', 
                                  cursor: 'pointer',
                                  ...partyCardZoomBaseStyle,
                                }}
                              >
                                <img src={item.poster_url} className="bchata-poster-fit" alt="Pick" />
                                
                                {/* NEW 뱃지 표시
                                <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, background: '#E53935', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                  NEW
                                </div>
                                */}

                                {/* 하단 그라데이션 오버레이 (검정) */}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 10px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'white' }}>
                                  <div style={{ fontSize: '11px', color: '#FFEB3B', fontWeight: 950, marginBottom: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{translateDynamicText(item.locationName, isEn)}</div>
                                  <div style={{ fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{translateDynamicText(formatPartyTitleDisplay(item.title), isEn)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* [지역 리스트 — 파티 있는 지역만 · 필터 연동] */}
                    {(() => {
                      const regionKeys = {
                        서울: 'region_seoul',
                        경인: 'region_gyeonggi_incheon',
                        경상도: 'region_gyeongsang',
                        전라도: 'region_jeolla',
                        충청도: 'region_chungcheong',
                        '강원/제주': 'region_gangwon_jeju',
                      };

                      const buildRollingParties = (regionName) => {
                        const regionParties = unifiedDayEvents
                          .filter((p) => REGION_FILTER[regionName](p))
                          .sort(
                            (a, b) =>
                              new Date(b.created_at || 0).getTime() -
                              new Date(a.created_at || 0).getTime(),
                          );
                        return dedupePartiesByPoster(
                          regionParties.filter((p) => p.poster_url && String(p.poster_url).trim()),
                        );
                      };

                      const partyRegionsForDay = PARTY_LIST_REGION_ORDER.map((regionName) => ({
                        name: regionName,
                        rollingParties: buildRollingParties(regionName),
                      })).filter((r) => r.rollingParties.length > 0);

                      const safePartyRegionFilter =
                        partyListRegionFilter &&
                        partyRegionsForDay.some((r) => r.name === partyListRegionFilter)
                          ? partyListRegionFilter
                          : '';

                      const displayPartyRegions = safePartyRegionFilter
                        ? partyRegionsForDay.filter((r) => r.name === safePartyRegionFilter)
                        : partyRegionsForDay;

                      if (!partyRegionsForDay.length) {
                        return (
                          <div
                            style={{
                              margin: '8px 16px 24px',
                              padding: '40px 20px',
                              borderRadius: '16px',
                              textAlign: 'center',
                              color: 'var(--color-text-sub)',
                              fontSize: '13px',
                              fontWeight: 700,
                              border: '1px dashed #E2E8F0',
                              background: 'var(--color-card)',
                            }}
                          >
                            {isEn
                              ? 'No parties on this date yet.'
                              : '이 날짜에 등록된 파티가 없습니다.'}
                          </div>
                        );
                      }

                      return (
                        <>
                          <SocialPartyRegionFilterBar
                            regions={partyRegionsForDay.map((r) => ({
                              name: r.name,
                              count: r.rollingParties.length,
                            }))}
                            activeRegion={safePartyRegionFilter}
                            onSelectRegion={setPartyListRegionFilter}
                            regionLabel={(name) => t(regionKeys[name] || name)}
                            isEn={isEn}
                          />
                          {displayPartyRegions.map((regionBlock, idx) => {
                        const { name: regionName, rollingParties } = regionBlock;

                        const isFirst = idx === 0;
                        const weather = regionName === '서울' && weatherMap['서울'] ? { temperature: weatherMap['서울'].temp, icon: weatherMap['서울'].icon } : null;

                        const dateChip = (() => {
                          const d = new Date(selectedDate);
                          return `${d.getMonth() + 1}/${d.getDate()} (${isEn ? DAYS_EN[d.getDay()] : DAYS_KOR[d.getDay()]})`;
                        })();

                        return (
                          <React.Fragment key={regionName}>
                            <section
                              ref={isFirst ? regionListRef : null}
                              className="social-region-block"
                            >
                              <div className="social-region-block__head">
                                <div className="social-region-block__title-wrap">
                                  <span className="social-region-block__title">
                                    {t(regionKeys[regionName] || regionName)}
                                  </span>
                                  <span className="social-region-block__date">{dateChip}</span>
                                  {weather && regionName === '서울' ? (
                                    <span className="social-region-block__weather">
                                      {weather.temperature}° {weather.icon}
                                    </span>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  className="social-region-block__more"
                                  onClick={() => {
                                    setGridRegion(regionName);
                                    handleOpenModal(setShowGridModal, true);
                                  }}
                                >
                                  {t('view_all')} <ChevronRight size={14} />
                                </button>
                              </div>

                              <div className="social-region-block__list">
                                {rollingParties.map((item) => (
                                  <PartyCard
                                    key={item.id}
                                    item={item}
                                    variant="stack"
                                    onSelect={openPartyWithAfterParty}
                                    wishlistParties={wishlistParties}
                                    onToggleWishlist={toggleWishlistParty}
                                  />
                                ))}
                              </div>
                            </section>
                          </React.Fragment>
                        );
                      })}
                        </>
                      );
                    })()}

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
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#E53935' }} /> 소셜
                  </div>
                </div>
                <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
                  {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="cal-weekday-label" style={{ color: d === '일' || d === '토' ? '#FF6B7A' : 'var(--color-text-sub)' }}>{d}</div>)}
                  {allDatesInMonth.map((day) => {
                    if (!day.date) return <div key={Math.random()} />;
                    const isWeekend = day.dayName === '금' || day.dayName === '토';
                    const isSelected = selectedDate === day.fullDate;

                    const dayPartyList = partiesOnDate(calendarParties, day.fullDate);
                    const hasParty = dayPartyList.length > 0;
                    const dayTotalCount = dayPartyList.length;

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
                            setIsModalFilterVisible(true);
                          }
                        }}
                      >
                        <span style={{ lineHeight: 1 }}>{day.date}</span>
                        <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '4px', height: '4px', alignItems: 'center', justifyContent: 'center' }}>
                          {hasParty && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#E53935', boxShadow: isSelected ? '0 0 0 0.5px #fff' : 'none' }} />}
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

                    const partyCount = selParties.length;

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
                    selParties.forEach(item => {
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
                            <span>소셜 {partyCount}건</span>
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
                <button onClick={handleCloseModal} style={{ width: '100%', height: '50px', borderRadius: '16px', background: '#000000', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>확인 완료</button>
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
                      { icon: <CloudSun size={32} color="#1976D2" />, label: '오늘날씨', action: () => pushOverlay('weather') },
                      { icon: <Heart size={32} color="#7B1FA2" />, label: '찜하기', action: () => pushOverlay('wishlist') },
                      { icon: <Navigation size={32} color="#303F9F" />, label: '지능형경로', /* badge: 'LIVE', */ action: () => openAnalysis(false) },
                      { icon: <Star size={32} color="#F9A825" />, label: '운명의좌표', action: () => pushOverlay('barMatching') },
                      { icon: <MapPin size={32} color="#0097A7" />, label: '주변주차', action: () => navigate('/parking') },
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
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#000000', textAlign: 'center', wordBreak: 'keep-all' }}>
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
                  <div style={{ paddingBottom: '8px' }}>
                    {(() => {
                      const regionalPosterParties = (parties || [])
                        .filter((p) => p.poster_url && String(p.poster_url).trim() !== '')
                        .filter((p) => {
                          const filterFn = REGION_FILTER[gridRegion];
                          return filterFn ? filterFn(p) : true;
                        })
                        .sort((a, b) => new Date(normDate(a.date)).getTime() - new Date(normDate(b.date)).getTime());

                      const byDate = groupPosterPartiesByDate(regionalPosterParties);

                      return byDate.map(([dateKey, dayParties]) => (
                        <section key={dateKey} style={{ marginBottom: '20px' }}>
                          <div
                            style={{
                              position: 'sticky',
                              top: 0,
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 16px 10px',
                              background: 'var(--color-bg)',
                              borderBottom: '1px solid var(--color-border)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dateKey === todayStr ? '#E53935' : 'rgba(0, 0, 0, 0.5)', flexShrink: 0 }} />
                              <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                                {formatGridDateSectionLabel(dateKey, isEn, todayStr)}
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#E53935' }}>
                              {dayParties.length}{isEn ? '' : '건'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                            {dayParties.map((item) => (
                              <div
                                className="party-carousel-card"
                                {...partyCardZoomHandlers}
                                key={item.id}
                                onClick={() => openPartyWithAfterParty(item)}
                                className="bchata-poster-frame"
                                style={{ aspectRatio: '2 / 3', overflow: 'hidden', background: '#111', position: 'relative', ...partyCardZoomBaseStyle }}
                              >
                                <img
                                  src={item.poster_url}
                                  alt="Poster"
                                  className="bchata-poster-fit"
                                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                                />
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
                            ))}
                          </div>
                        </section>
                      ));
                    })()}
                  </div>
                )}
                {gridRegion !== 'more' && (() => {
                  const hasPosters = (parties || []).some(p => p.poster_url && REGION_FILTER[gridRegion]?.(p));
                  return !hasPosters && (
                    <div style={{ padding: '100px 0', textAlign: 'center', color: 'rgba(0, 0, 0, 0.5)', fontWeight: '700' }}>해당 지역에 등록된 포스터가 없습니다.</div>
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
          onVenueUpdated={syncVenueAcrossHome}
          onRegisterVenueLesson={openVenueLessonRegister}
          onOpenPoster={(item) => {
            const p = posterSharePayload(item);
            if (p) handleOpenModal(setSelectedPoster, p);
          }}
        />
      )}

      <AnimatePresence>
        {showVenueLessonPick ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? 'Choose BAR for class registration' : '수업 등록할 BAR 선택'}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: Z.modal,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: 16,
              boxSizing: 'border-box',
            }}
            onClick={closeVenueLessonPick}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 24 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 440,
                maxHeight: 'min(70vh, 480px)',
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E5DFD6',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  padding: '16px 18px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #EDEAE3',
                }}
              >
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#1E293B' }}>
                  {isEn ? 'BAR class registration' : 'BAR 수업 등록'}
                </h2>
                <button
                  type="button"
                  onClick={closeVenueLessonPick}
                  aria-label={isEn ? 'Close' : '닫기'}
                  style={{ border: 'none', background: 'none', padding: 4, cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={22} />
                </button>
              </div>
              <p style={{ margin: 0, padding: '10px 18px 8px', fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                {isEn ? 'Select the BAR to register a class for.' : '수업을 등록할 BAR를 선택하세요.'}
              </p>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 12px 16px' }}>
                {[...locations]
                  .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'))
                  .map((bar) => (
                    <button
                      key={bar.id || bar.name}
                      type="button"
                      onClick={() => pickBarForVenueLesson(bar)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 14px',
                        marginBottom: 8,
                        borderRadius: 12,
                        border: '1px solid #EDEAE3',
                        background: '#FFFDF9',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{bar.name}</span>
                      {bar.region ? (
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{bar.region}</span>
                      ) : null}
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {venueLessonPostVenue ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: Z.modal,
            background: '#fff',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <PostLesson
            initialVenue={venueLessonPostVenue}
            onBack={closeVenueLessonPost}
          />
        </div>
      ) : null}
    </div>
  )
}

export default HomePage
