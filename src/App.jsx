import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react'
import { Home as HomeIcon, Users, LogOut, Heart, X, MessageSquare, RefreshCw, CloudSun, Utensils, Zap, Languages, Bell, Star, Navigation, CreditCard, Settings, Map as MapIcon, BarChart, BarChart2, Gift, Coffee, User, Menu, Music2, Tent, Flag, Download, Globe, ShieldCheck, Calendar, CalendarDays, Camera, ChevronLeft, ChevronRight, Loader2, Search, Share2, Copy, TrendingUp, GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion'
import { logActivity, runSupabaseQuery, supabase } from './lib/supabase'
import { KAKAO_BRAND, SHARE_BUILD, sharePartyToKakao } from './lib/kakaoShare'
import { buildPartyShareUrl } from './lib/shareLinks'
import { buildPartyShareCard } from './lib/partyShareCard'
import { formatPartyTitleDisplay } from './lib/partyTitleDisplay'
import { getUserCoords, isGeoDenied, readCachedCoords, syncGeoPermissionState } from './lib/geoCache'
import {
  BAMPPA_HISTORY,
  buildAppState,
  navigate as historyNavigate,
  navigateHomeTab,
  parseAppState,
  pathToView,
  persistNavSession,
  pushOverlay,
  readNavigationState,
  readPersistedNavState,
  readUrlNavPatch,
  instructorProfilePath,
  restoreNavigationOnLoad,
  installNavSessionPersistence,
} from './lib/appHistory'
import { registerExitToast } from './lib/mobileExitGuard'
import { Z } from './constants/zLayers'
import { DEFAULT_AVATAR_IMAGE, imgFallbackHandler } from './constants/imageAssets'
import { normDate, getKSTCalendarTodayStr } from './lib/dateNorm'
import { LOCATIONS_SELECT, logSupabaseError } from './lib/locationsQuery'
import { PARTIES_SELECT, logPartiesFetchError } from './lib/partiesQuery'
import { readVipInstructorSession, verifyActiveInstructorMember } from './lib/instructorAuth'
import { purgePastPartyPostersAndRows } from './lib/partyPosterCleanup'
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom'
import PartyWishlistHeart from './components/PartyWishlistHeart'
import { usePartyWishlist } from './hooks/usePartyWishlist'
import { BAR_DATABASE, findBarByName } from './data/barDatabase'
import i18nCore from './i18n'
import HomePage from './pages/Home'
import Instructors from './pages/Instructors'
import Bootcamp from './pages/Bootcamp'
import Festival from './pages/Festival'
import PartnerModal from './components/PartnerModal'
import WishlistModal from './components/WishlistModal'
import RentalModal from './components/RentalModal'
import ClassRegisterModal from './components/ClassRegisterModal'
import LessonRegisterChoiceModal from './components/LessonRegisterChoiceModal'
import ChatBot from './components/ChatBot'

const RegisterForm = lazy(() => import('./RegisterForm'))
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const Community = lazy(() => import('./pages/Community'))
const InstructorRegister = lazy(() => import('./components/InstructorRegister'))
const PostClub = lazy(() => import('./pages/PostClub'))
const Parking = lazy(() => import('./pages/Parking'))
const Restaurant = lazy(() => import('./pages/Restaurant'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const SajuModal = lazy(() => import('./components/SajuModal'))
const IncheonRoute = lazy(() => import('./components/IncheonRoute'))
const WeatherModal = lazy(() => import('./components/WeatherModal'))

function navigate(path, options = {}) {
  historyNavigate(path, options)
}

function goBack() {
  window.history.back()
}

function closeOverlay() {
  if (parseAppState(window.history.state)?.overlay) {
    goBack()
    return true
  }
  return false
}

// 로딩 스피너 컴포넌트
const LoadingFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '16px' }}>
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
      <Loader2 size={40} color="#FF1744" />
    </motion.div>
    <p style={{ color: '#94A3B8', fontSize: '14px', fontWeight: 600 }}>잠시만 기다려주세요...</p>
  </div>
);

const ADMIN_SHELL_VIEWS = new Set(['admin', 'admin-portal']);

/** App.jsx 전용 — appHistory PATH_TO_VIEW 미등록 경로 */
const LEGAL_PATH_VIEWS = {
  '/terms': 'terms',
  '/privacy': 'privacy',
};

function viewForPath(path, st) {
  return LEGAL_PATH_VIEWS[path] ?? st?.view ?? pathToView(path);
}

function isAdminShellActive(view, pathname) {
  return (
    ADMIN_SHELL_VIEWS.has(view) ||
    pathname === '/admin' ||
    pathname === '/admin-portal'
  );
}

// --- [CUSTOM ROUTING ENGINE] ---
const useLocation = () => {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const syncPath = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', syncPath);
    window.addEventListener('bamppa-navigate', syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('bamppa-navigate', syncPath);
    };
  }, []);
  return { pathname };
};

const GENRE_MAP = {
  '바차타': { key: 'b_ratio', label: 'B', color: '#059669' },
  '살사':   { key: 's_ratio', label: 'S', color: '#DC2626' },
  '쥬크':   { key: 'j_ratio', label: 'J', color: '#F59E0B' },
  '키좀바': { key: 'k_ratio', label: 'K', color: '#7C3AED' },
};


// [번역 비용 최적화를 위한 정적 맵핑]
const REGION_MAP_EN = {
  '전국': 'Nationwide',
  '서울': 'Seoul', '경인': 'Gyeonggi/Incheon', '경상도': 'Gyeongsang', 
  '전라도': 'Jeolla', '충청도': 'Chungcheong', '강원/제주': 'Gangwon/Jeju'
};

const CITY_MAP_EN = {
  '서울': 'Seoul', '인천': 'Incheon', '대구': 'Daegu', '부산': 'Busan', '광주': 'Gwangju', 
  '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong', '수원': 'Suwon', '성남': 'Seongnam',
  '의정부': 'Uijeongbu', '안산': 'Ansan', '고양': 'Goyang', '용인': 'Yongin', '부천': 'Bucheon'
};

// [포스터 줌 전용 컴포넌트 - 전역 분리]
const PosterModal = ({ src, onClose, shareTitle, shareDesc, shareLines, shareFeedDesc, partyId }) => {
  const imgRef = useRef();

  const resolvedTitle = shareTitle?.trim() || '오늘밤빠 — 전국 라틴·소셜 파티';
  const cardLines = Array.isArray(shareLines) && shareLines.length > 0
    ? shareLines
    : (shareDesc?.trim() ? shareDesc.split('\n').filter(Boolean) : []);
  const resolvedDesc = cardLines.length > 0
    ? cardLines.join('\n')
    : (shareDesc?.trim() || '전국 플로어 정보는 앱에서 한눈에!');
  const linkUrl = buildPartyShareUrl(partyId);

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

  const absoluteImageUrl = (() => {
    if (!src) return '';
    if (/^https?:\/\//i.test(src)) return src;
    return `${window.location.origin}${src.startsWith('/') ? '' : '/'}${src}`;
  })();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
    } catch (e) {
      window.prompt('링크를 복사하세요:', linkUrl);
    }
  };

  const handleNativeShare = async () => {
    const sharePayload = {
      title: resolvedTitle,
      text: `${resolvedDesc}\n${linkUrl}`,
      url: linkUrl,
    };
    try {
      if (navigator.share) {
        if (navigator.canShare && absoluteImageUrl) {
          try {
            const res = await fetch(src);
            const blob = await res.blob();
            const ext = blob.type?.includes('png') ? 'png' : 'jpg';
            const file = new File([blob], `poster.${ext}`, { type: blob.type || 'image/jpeg' });
            const withFile = { ...sharePayload, files: [file] };
            if (navigator.canShare(withFile)) {
              await navigator.share(withFile);
              return;
            }
          } catch (_) { /* fall through */ }
        }
        await navigator.share(sharePayload);
      } else {
        await handleCopyLink();
      }
    } catch (err) {
      if (err?.name !== 'AbortError') console.error(err);
    }
  };

  const handleKakaoShare = async () => {
    await sharePartyToKakao({
      title: resolvedTitle,
      description: shareFeedDesc || cardLines.join(' · ') || resolvedDesc,
      posterUrl: absoluteImageUrl,
      linkUrl,
      partyId,
    });
  };

  const btnRound = {
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <motion.div style={{ 
      position:'fixed', 
      inset:0, 
      zIndex: Z.modalBackdrop, 
      backgroundColor:'#000', 
      display:'flex',
      flexDirection:'column',
      height: '100dvh',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <header style={{
        flexShrink: 0,
        height: 'calc(50px + env(safe-area-inset-top))',
        boxSizing: 'border-box',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: '12px',
        paddingRight: '12px',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: Z.modal,
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="뒤로가기"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={24} />
        </button>
        {/* 헤더 중앙: 오늘밤빠 · 우측 공유/복사 — 카카오 버튼으로 교체, 구 레이아웃 주석 보관
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#C9A84C', fontSize: '16px', fontWeight: 900, pointerEvents: 'none' }}>오늘밤빠</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button type="button" onClick={handleNativeShare} title="공유" style={btnRound}><Share2 size={18} /></button>
          <button type="button" onClick={handleCopyLink} title="홈 링크 복사" style={btnRound}><Copy size={18} /></button>
        </div>
        */}
        <button
          type="button"
          onClick={handleKakaoShare}
          title="카카오로 공유하기"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#FEE500',
            color: '#3E2723',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            maxWidth: 'calc(100% - 100px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          💬 카카오로 공유하기
        </button>
      </header>

      {/* 닫기 버튼 — 헤더로 이동, 구 레이아웃 주석 보관
      <button onClick={onClose} style={{ position:'absolute', top:'calc(40px + env(safe-area-inset-top))', left:'20px', ... }}><ChevronLeft size={32} /></button>
      */}

      {/* 줌 컨테이너 (헤더 아래 전체 영역) */}
      <div style={{ 
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <QuickPinchZoom 
          onUpdate={onUpdate} 
          wheelScaleFactor={500} 
          tapZoomFactor={2}
          containerProps={{
            style: {
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              objectPosition: 'center center',
              display: 'block',
              willChange: 'transform',
              userSelect: 'none',
              pointerEvents: 'none'
            }} 
          />
        </QuickPinchZoom>
      </div>

      {cardLines.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
            background: '#0a0a0a',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
            {resolvedTitle}
          </div>
          {cardLines.map((line) => (
            <div key={line} style={{ fontSize: '14px', fontWeight: 700, color: '#CBD5E1', lineHeight: 1.45, marginTop: '2px' }}>
              {line}
            </div>
          ))}
        </div>
      )}
      
      {/* 하단: 공유 · 카카오 · 링크복사 · 저장 (A안) — 상단 우측으로 이동, 구 레이아웃 주석 보관
      <div style={{
        position: 'absolute',
        bottom: 'calc(28px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100002,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '96vw',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <button type="button" onClick={handleNativeShare} title="공유" style={btnRound}>
          <Share2 size={20} />
        </button>
        <button
          type="button"
          onClick={handleKakaoShare}
          title="카톡으로 공유 (오늘밤빠)"
          style={{
            ...btnRound,
            background: '#FEE500',
            color: '#3C1E1E',
            border: '1px solid rgba(60,30,30,0.25)',
            fontSize: '11px',
            fontWeight: 900,
            width: 'auto',
            minWidth: '48px',
            padding: '0 12px',
            borderRadius: '24px',
          }}
        >
          {KAKAO_BRAND}
        </button>
        <button type="button" onClick={handleCopyLink} title="홈 링크 복사" style={btnRound}>
          <Copy size={20} />
        </button>
        <button type="button" onClick={handleSave} title="이미지 저장" style={btnRound}>
          <Download size={22} />
        </button>
      </div>
      */}
      {/* 상단 우측: 공유 · 카카오 · 복사 · 저장 — 헤더로 이동, 구 레이아웃 주석 보관
      <motion.div style={{
        position: 'absolute',
        top: 'calc(40px + env(safe-area-inset-top))',
        right: '20px',
        zIndex: Z.modal,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: 'calc(100vw - 100px)',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}>
        <button type="button" onClick={handleNativeShare} title="공유" style={btnRound}>
          <Share2 size={20} />
        </button>
        <button
          type="button"
          onClick={handleKakaoShare}
          title="카톡으로 공유 (오늘밤빠)"
          style={{
            ...btnRound,
            fontSize: '11px',
            fontWeight: 900,
            width: 'auto',
            minWidth: '48px',
            padding: '0 12px',
            borderRadius: '24px',
          }}
        >
          {KAKAO_BRAND}
        </button>
        <button type="button" onClick={handleCopyLink} title="홈 링크 복사" style={btnRound}>
          <Copy size={20} />
        </button>
        <button type="button" onClick={handleSave} title="이미지 저장" style={btnRound}>
          <Download size={22} />
        </button>
      </motion.div>
      */}
      <span style={{ position: 'absolute', bottom: 'calc(8px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,0.35)', zIndex: 100002 }}>{SHARE_BUILD}</span>
    </motion.div>
  );
};

const EXPOSURE_ROTATE_MS = 4 * 60 * 1000;
const normDateExposure = (d) => (d ? String(d).slice(0, 10) : '');
const locationKeyExposure = (item) =>
  String(item?.location_name || item?.locationName || item?.studio_name || item?.venue || item?.id || '')
    .trim()
    .toLowerCase();
const exposureScore = (item, todayStr) => {
  let score = (item?.click_count || 0) * 3;
  if (normDateExposure(item?.date) === todayStr) score += 400;
  const t = item?.time?.split('-')[0]?.trim() || '21:00';
  const [h] = t.split(':').map(Number);
  if (!Number.isNaN(h) && h >= 18) score += 80;
  score += new Date(item?.created_at || 0).getTime() / 1e12;
  return score;
};
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
    const loc = locationKeyExposure(item);
    if (picked.some((p) => p.id === item.id)) continue;
    if (picked.length === 1 && loc && usedLoc.has(loc)) continue;
    picked.push(item);
    if (loc) usedLoc.add(loc);
  }
  return picked;
};

/** 선택한 날짜 · 2칸 파티 미리보기 (오늘 밤, 어디서 춤 출래요?) */
const LiveExposureStrip = ({
  pool,
  selectedDate,
  todayStr,
  onSelect,
  cleanTitle,
  translateDynamicText,
  isEn,
  wishlistParties: wishlistPartiesProp,
  onToggleWishlist: onToggleWishlistProp,
}) => {
  const fallbackWishlist = usePartyWishlist(pool);
  const wishlistParties = wishlistPartiesProp ?? fallbackWishlist.wishlistParties;
  const onToggleWishlist = onToggleWishlistProp ?? fallbackWishlist.toggleWishlistParty;
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
        padding: '16px 16px 18px',
        borderRadius: '20px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
      }}
    >
      {/* [OLD] 노출 프레임: Star, LIVE 2, 4분 교체 안내, 노출 문의 버튼 */}
      <h2
        style={{
          margin: '0 0 14px',
          fontSize: 17,
          fontWeight: 800,
          color: '#1E293B',
          letterSpacing: '-0.4px',
          lineHeight: 1.35,
        }}
      >
        {isEn ? 'Where will you dance tonight?' : '오늘 밤, 어디서 춤 출래요?'}
      </h2>

      <AnimatePresence initial={false}>
        <motion.div
          key={`${rotationIndex}-${featured.map((f) => f.id).join('-')}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
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
                  borderRadius: 0,
                  overflow: 'visible',
                  cursor: 'pointer',
                  background: 'transparent',
                  boxShadow: 'none',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  width: '100%',
                  minWidth: 0,
                }}
              >
                <motion.div
                  style={{
                    width: '100%',
                    aspectRatio: '3 / 4',
                    flexShrink: 0,
                    overflow: 'hidden',
                    background: '#111',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    boxSizing: 'border-box',
                    position: 'relative',
                  }}
                >
                  <PartyWishlistHeart
                    party={item}
                    wishlistParties={wishlistParties}
                    onToggle={onToggleWishlist}
                  />
                  <img
                    src={item.poster_url}
                    alt=""
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top center',
                      display: 'block',
                    }}
                  />
                </motion.div>
                <div style={{ width: '100%', padding: '8px 0 0', boxSizing: 'border-box' }}>
                  <motion.div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#64748B',
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {translateDynamicText(item.locationName || item.location_name, isEn)}
                  </motion.div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#1E293B',
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
        <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
          {isEn ? `${pool.length} parties today` : `오늘 ${pool.length}곳`}
        </p>
      ) : null}
    </section>
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
    const coords = userCoords || { lat: 37.4979, lng: 127.0276 };
    findTarget(coords.lat, coords.lon || coords.lng);
  }, [isOpen, userCoords]);

  if (!isOpen) return null;
  const currentTargetDest = targetDest || { region: '서울', name: '강남역 성지' };
  const isIncheon = currentTargetDest.region === '인천' && isSajuCall;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: Z.modalBackdrop, 
        backgroundColor: '#FFFFFF', 
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
          background: '#FFFFFF', 
          padding: 'calc(20px + env(safe-area-inset-top)) 24px calc(40px + env(safe-area-inset-bottom))', 
          color: '#1E293B',
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
            
            <h2 style={{ fontSize: '28px', fontWeight: '1000', marginBottom: '30px', color: '#1E293B', lineHeight: '1.3' }}>
              {isIncheon ? '성지 상륙 분석' : '최단 경로 최적화'} 🛰️<br/>
              <span style={{ color: '#FF1744' }}>{currentTargetDest.name}</span>
            </h2>

            <div style={{ padding: '30px', background: '#F8FAFC', borderRadius: '30px', display: 'flex', gap: '20px', marginBottom: '40px', border: '1px solid #E2E8F0' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#64748B', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>실제 거리</p>
                <p style={{ fontSize: '28px', fontWeight: '1000', color: '#FF1744' }}>{tracker.distance}km</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#64748B', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>예상 소요</p>
                <p style={{ fontSize: '28px', fontWeight: '1000', color: '#1E293B' }}>{tracker.duration}분</p>
              </div>
            </div>

            <div style={{ marginBottom: '40px', flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: '800', color: '#64748B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={16} fill="#64748B" /> 주변 성지 추천
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
                      background: idx === 0 ? '#FEF2F2' : '#F8FAFC', 
                      borderRadius: '20px', 
                      border: idx === 0 ? '1px solid #FF1744' : '1px solid #E2E8F0',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: idx === 0 ? '#FF1744' : '#1E293B' }}>{venue.name}</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>{venue.address}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: idx === 0 ? '#FF1744' : '#94A3B8' }}>{venue.dist.toFixed(1)}km</span>
                      <ChevronRight size={18} color={idx === 0 ? '#FF1744' : '#CBD5E1'} />
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

const BROAD_REGIONS = { '서울': '서울', '인천': '경인', '경기': '경인', '부산': '경상도', '대구': '경상도', '광주': '전라도', '대전': '충청도', '충남': '충청도', '충북': '충청도', '전남': '전라도', '전북': '전라도', '경남': '경상도', '경북': '경상도', '강원': '강원/제주', '제주': '강원/제주' };
const SHORT_CITY_NAMES = { '인천': '인천', '서울': '서울', '경기': '경기', '부산': '부산', '대구': '대구', '광주': '광주', '대전': '대전' };
const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

const formatDateToKSTString = (date) => {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const SplashScreen = () => {
  const [phase, setPhase] = useState('rotate');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 800);
    const exitTimer = setTimeout(() => setPhase('exit'), 1300);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  const exitDuration = 1.7;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'exit' ? 0 : 1 }}
      transition={{ duration: phase === 'exit' ? exitDuration : 0, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modalBackdrop,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <motion.img
        src="/logo.png"
        alt="BAMPPA"
        initial={{ rotate: 0, scale: 1, opacity: 1 }}
        animate={
          phase === 'rotate'
            ? { rotate: 360, scale: 1, opacity: 1 }
            : phase === 'hold'
              ? { rotate: 360, scale: 1, opacity: 1 }
              : { rotate: 360, scale: 1.8, opacity: 0 }
        }
        transition={
          phase === 'rotate'
            ? { duration: 0.8, ease: 'easeInOut' }
            : phase === 'exit'
              ? { duration: exitDuration, ease: 'easeIn' }
              : { duration: 0 }
        }
        style={{ width: '200px', objectFit: 'contain' }}
      />
      {/* 이전 stage 1/2 — 보관
        {false && stage === 1 ? (
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
      */}
    </motion.div>
  );
};

function App() {
  const { t, i18n } = useTranslation('translation', { i18n: i18nCore });
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

  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !localStorage.getItem('splash_shown');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      localStorage.setItem('splash_shown', 'true');
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showSplash]);

  const [parties, setParties] = useState([]);
  const [bootcamps, setBootcamps] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [instructorsCache, setInstructorsCache] = useState([]);
  const instructorsPrefetchRef = useRef(false);
  const [followedInstructors, setFollowedInstructors] = useState([]);
  const [displayParties, setDisplayParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayData.dateStr);
  const location = useLocation();
  const [view, setView] = useState(() => {
    const { state } = restoreNavigationOnLoad();
    const path = window.location.pathname;
    return viewForPath(path, state);
  });

  useEffect(() => {
    const onRegisterParty = location.pathname === '/register-party' || view === 'register-party'
    if (onRegisterParty) {
      document.body.classList.add('party-register-open')
    } else {
      document.body.classList.remove('party-register-open')
    }
    return () => document.body.classList.remove('party-register-open')
  }, [location.pathname, view])

  const [registerType, setRegisterType] = useState('party');

  const [showIncheonModal, setShowIncheonModal] = useState(false);
  const [isSajuCall, setIsSajuCall] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userCoords, setUserCoords] = useState(() => {
    const c = readCachedCoords(24 * 60 * 60 * 1000);
    return c ? { lat: c.lat, lon: c.lng } : null;
  });
  const [selectedPoster, setSelectedPoster] = useState(null);
  /** 포스터 상세 보기 모드 — true면 홈 달력 UI 비렌더 */
  const [isDetailView, setIsDetailView] = useState(false);
  const fullCalendarBeforeDetailRef = useRef(false);
  const [modalScale, setModalScale] = useState(1);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showIncheon, setShowIncheon] = useState(false);
  const [showNoticeGuide, setShowNoticeGuide] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showSaju, setShowSaju] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [homeActiveTab, setHomeActiveTab] = useState(() => {
    const { state } = restoreNavigationOnLoad();
    return window.location.pathname === '/' ? (state?.homeTab ?? null) : null;
  });

  useEffect(() => {
    const onHomeActiveTab = (e) => setHomeActiveTab(e.detail ?? null);
    window.addEventListener('home-active-tab', onHomeActiveTab);
    return () => window.removeEventListener('home-active-tab', onHomeActiveTab);
  }, []);

  const isHomeGateNav =
    location.pathname === '/' &&
    view === 'home' &&
    homeActiveTab === null &&
    !showPartner
  const isSocialLightNav = (location.pathname === '/' && view === 'home' && homeActiveTab !== null) || showPartner
  const isAdminShell = isAdminShellActive(view, location.pathname)
  const isDarkAppSurface =
    isAdminShell ||
    isHomeGateNav ||
    ['/bootcamp', '/festival', '/instructors', '/livepick', '/community'].some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
    )
  useEffect(() => {
    document.body.classList.add('bottom-nav-social-light')
    document.documentElement.classList.toggle('home-gate-theme', isHomeGateNav)
    document.body.classList.toggle('home-gate-theme', isHomeGateNav)
    document.documentElement.classList.toggle('app-dark-surface', isDarkAppSurface)
    document.body.classList.toggle('app-dark-surface', isDarkAppSurface)
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      if (isDarkAppSurface) themeMeta.setAttribute('content', '#0D0D0D')
      else if (isSocialLightNav) themeMeta.setAttribute('content', '#ffffff')
      else themeMeta.setAttribute('content', '#FF1744')
    }
    return () => {
      document.body.classList.remove('bottom-nav-social-light')
      document.documentElement.classList.remove('home-gate-theme')
      document.body.classList.remove('home-gate-theme')
      document.documentElement.classList.remove('app-dark-surface')
      document.body.classList.remove('app-dark-surface')
    }
  }, [isSocialLightNav, isHomeGateNav, isDarkAppSurface])

  const [showClassRegister, setShowClassRegister] = useState(false);
  const [showLessonRegisterChoice, setShowLessonRegisterChoice] = useState(false);
  // const [showStudentManager, setShowStudentManager] = useState(false);
  // const [showRevenueStats, setShowRevenueStats] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showFilteredResults, setShowFilteredResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showVipLogin, setShowVipLogin] = useState(false);
  const [showVipMenu, setShowVipMenu] = useState(false);
  const [showLuxuryUpsellModal, setShowLuxuryUpsellModal] = useState(false);
  const [vipPendingClassRegister, setVipPendingClassRegister] = useState(false);
  const [vipLoggedIn, setVipLoggedIn] = useState(false);
  const [vipLoginId, setVipLoginId] = useState('');
  const [vipLoginPw, setVipLoginPw] = useState('');
  const [vipLoginLoading, setVipLoginLoading] = useState(false);
  const [vipAuthMode, setVipAuthMode] = useState('login');
  const [vipRecoverEmail, setVipRecoverEmail] = useState('');
  const [vipRecoveredPassword, setVipRecoveredPassword] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(todayData.month);
  const [showGridModal, setShowGridModal] = useState(false);
  const [gridRegion, setGridRegion] = useState('');
  const [filterStep, setFilterStep] = useState(1);
  const [showRoute, setShowRoute] = useState(false);
  const [showPlaceInquiry, setShowPlaceInquiry] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [exitToast, setExitToast] = useState(null);
  const [chatbotOverlay, setChatbotOverlay] = useState(false);
  const navSnapshotRef = useRef(readNavigationState());
  const historyReadyRef = useRef(false);
  const navBootstrappedRef = useRef(false);
  const lastPosterCleanupDayRef = useRef('');

  const applyHistoryState = (rawState) => {
    const path = window.location.pathname;
    const urlPatch = readUrlNavPatch(path);
    const persisted = readPersistedNavState();
    const parsed = parseAppState(rawState) ?? parseAppState(window.history.state) ?? persisted;
    const st = parsed
      ? {
          ...parsed,
          homeTab: parsed.homeTab ?? urlPatch.homeTab ?? null,
          instructorId: parsed.instructorId ?? urlPatch.instructorId ?? null,
          instructorTab: parsed.instructorTab ?? urlPatch.instructorTab ?? null,
        }
      : null;
    const nextView = viewForPath(path, st);

    if (isAdminShellActive(nextView, path)) {
      setView(nextView);
      setHomeActiveTab(null);
      setShowPartner(false);
      setShowWishlist(false);
      setShowSaju(false);
      setShowWeather(false);
      setShowRoute(false);
      setShowPlaceInquiry(false);
      setShowRentalModal(false);
      setShowFullCalendar(false);
      setShowIncheonModal(false);
      setShowFilterPanel(false);
      setShowFilteredResults(false);
      setShowGridModal(false);
      setShowClassRegister(false);
      setShowIncheon(false);
      setSelectedPoster(null);
      setIsDetailView(false);
      fullCalendarBeforeDetailRef.current = false;
      setShowVipLogin(false);
      setShowVipMenu(false);
      setIsMenuOpen(false);
      window.dispatchEvent(new CustomEvent('bamppa-history', { detail: { state: st } }));
      return;
    }

    setView(nextView);

    if (path === '/') {
      const tab = st?.homeTab ?? null;
      setHomeActiveTab(tab);
      setShowPartner(tab === 'partner');
      window.dispatchEvent(new CustomEvent('home-active-tab', { detail: tab }));
    } else {
      setHomeActiveTab(null);
      setShowPartner(false);
    }

    const overlay = st?.overlay;
    setShowWishlist(overlay === 'wishlist');
    setShowSaju(overlay === 'barMatching' || overlay === 'saju');
    setShowWeather(overlay === 'weather');
    setShowRoute(overlay === 'route');
    setShowPlaceInquiry(overlay === 'placeInquiry');
    setShowRentalModal(overlay === 'rental');
    setShowFullCalendar(overlay === 'fullCalendar');
    setShowIncheonModal(overlay === 'incheon');
    setShowFilterPanel(overlay === 'filterPanel');
    setShowFilteredResults(overlay === 'filteredResults');
    setShowGridModal(overlay === 'gridModal');
    setShowClassRegister(overlay === 'classRegister');
    const posterDetailActive = overlay === 'partyPoster';
    setIsDetailView(posterDetailActive);
    if (posterDetailActive) {
      setShowFullCalendar(false);
    } else {
      setSelectedPoster(null);
      fullCalendarBeforeDetailRef.current = false;
    }
    if (overlay === 'partner' && path === '/') {
      setShowPartner(true);
      setHomeActiveTab('partner');
    }
    setChatbotOverlay(overlay === 'chatbot');
    window.dispatchEvent(new CustomEvent('bamppa-history', { detail: { state: st } }));
    persistNavSession();
  };

  const closeModalWithHistory = (setter) => () => {
    if (!closeOverlay()) setter(false);
  };

  useEffect(() => {
    if (!navBootstrappedRef.current) return;
    applyHistoryState(window.history.state);
    navSnapshotRef.current = readNavigationState();
  }, [location.pathname]);

  useEffect(() => {
    registerExitToast((message) => {
      setExitToast(message);
      window.setTimeout(() => setExitToast(null), 2200);
    });
  }, []);

  useEffect(() => {
    if (!chatbotOverlay) return undefined;
    window.dispatchEvent(new CustomEvent('open-chatbot'));
    return undefined;
  }, [chatbotOverlay]);

  useEffect(() => {
    const onOpenChatbot = () => {
      const st = readNavigationState();
      if (st?.overlay !== 'chatbot') {
        pushOverlay('chatbot');
      }
    };
    const onCloseChatbot = () => {
      if (readNavigationState()?.overlay === 'chatbot') {
        goBack();
      }
    };
    window.addEventListener('open-chatbot', onOpenChatbot);
    window.addEventListener('close-chatbot', onCloseChatbot);
    return () => {
      window.removeEventListener('open-chatbot', onOpenChatbot);
      window.removeEventListener('close-chatbot', onCloseChatbot);
    };
  }, []);

  useEffect(() => {
    installNavSessionPersistence();
    const { state, url } = restoreNavigationOnLoad();
    const currentUrl = window.location.pathname + window.location.search + (window.location.hash || '');
    if (!parseAppState(window.history.state) || url !== currentUrl) {
      window.history.replaceState(state, '', url);
    }
    applyHistoryState(state);
    navSnapshotRef.current = state;
    persistNavSession();
    navBootstrappedRef.current = true;
    historyReadyRef.current = true;
  }, []);

  useEffect(() => {
    const onNavigate = (event) => {
      applyHistoryState(event.detail?.state ?? window.history.state);
      navSnapshotRef.current = readNavigationState();
      persistNavSession();
    };

    const onPopState = (event) => {
      applyHistoryState(event.state);
      navSnapshotRef.current = readNavigationState();
      persistNavSession();
    };

    window.addEventListener('bamppa-navigate', onNavigate);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('bamppa-navigate', onNavigate);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const [weatherTapCount, setWeatherTapCount] = useState(0);
  const [lastWeatherTap, setLastWeatherTap] = useState(0);
  const weatherTimeoutRef = useRef(null);
  // 다크 모드 완전 삭제 및 항상 라이트 테마 고정
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  }, []);

  const handleOpenModal = (setter, value = true, overlayKey = 'partyPoster') => {
    pushOverlay(overlayKey);
    setter(value);
  };

  /** 달력 모드 → 포스터 상세 모드 (달력 UI 숨김) */
  const enterPosterDetailView = useCallback(
    (card, { pushHistory = true, overlayKey = 'partyPoster' } = {}) => {
      if (!card) return;
      fullCalendarBeforeDetailRef.current = showFullCalendar;
      setShowFullCalendar(false);
      setIsDetailView(true);
      if (pushHistory) pushOverlay(overlayKey);
      setSelectedPoster(card);
    },
    [showFullCalendar],
  );

  /** 상세 모드 → 달력 모드 복귀 */
  const exitPosterDetailView = useCallback(() => {
    setIsDetailView(false);
    if (!closeOverlay()) {
      setSelectedPoster(null);
    } else {
      setSelectedPoster(null);
    }
    if (fullCalendarBeforeDetailRef.current) {
      setShowFullCalendar(true);
      fullCalendarBeforeDetailRef.current = false;
    }
  }, []);

  const handleVipLogout = () => {
    setVipLoggedIn(false);
    setShowVipMenu(false);
    setShowVipLogin(false);
    setVipLoginId('');
    setVipLoginPw('');
    setVipAuthMode('login');
    setVipRecoverEmail('');
    setVipRecoveredPassword('');
    setVipPendingClassRegister(false);
    localStorage.removeItem('vip_instructor_session');
  };

  const resetVipAuthToLogin = () => {
    setVipAuthMode('login');
    setVipRecoverEmail('');
    setVipRecoveredPassword('');
  };

  const handleVipPasswordRecover = async () => {
    const email = vipRecoverEmail.trim();
    if (!email) {
      alert('이메일을 입력해주세요');
      return;
    }
    setVipLoginLoading(true);
    setVipRecoveredPassword('');
    try {
      if (!supabase) {
        alert('서버 연결을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      const { data, error } = await supabase
        .from('instructors')
        .select('login_password')
        .eq('email', email)
        .maybeSingle();
      if (error || !data) {
        alert('등록된 이메일이 없습니다');
        return;
      }
      setVipRecoveredPassword(data.login_password || '');
    } catch {
      alert('등록된 이메일이 없습니다');
    } finally {
      setVipLoginLoading(false);
    }
  };

  const handleVipSignupSubmit = async () => {
    const id = vipLoginId.trim();
    const pw = vipLoginPw;
    if (!id || !pw) {
      alert('아이디와 비밀번호를 입력해주세요');
      return;
    }
    setVipLoginLoading(true);
    try {
      if (!supabase) {
        alert('서버 연결을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      const { error } = await supabase
        .from('instructors')
        .insert({
          login_id: id,
          login_password: pw,
          name: id,
          custom_id: id,
          status: 'active',
        });
      if (error) {
        alert('가입에 실패했습니다. 다시 시도해주세요.');
        return;
      }
      alert('가입 완료! 로그인해주세요');
      setVipAuthMode('login');
      setVipLoginPw('');
    } catch {
      alert('가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setVipLoginLoading(false);
    }
  };

  const handleVipLoginSubmit = async () => {
    const id = vipLoginId.trim();
    const pw = vipLoginPw;
    if (!id || !pw) {
      alert('아이디와 비밀번호를 입력해주세요');
      return;
    }
    setVipLoginLoading(true);
    try {
      if (!supabase) {
        alert('서버 연결을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      const { data, error } = await supabase
        .from('instructors')
        .select('id, login_id')
        .eq('login_id', id)
        .eq('login_password', pw)
        .eq('status', 'active')
        .maybeSingle();
      if (error || !data) {
        alert('아이디 또는 비밀번호가 틀렸습니다');
        return;
      }
      setVipLoggedIn(true);
      localStorage.setItem('vip_instructor_session', JSON.stringify({ id: data.id, login_id: data.login_id }));
      setShowVipLogin(false);
      if (vipPendingClassRegister) {
        setVipPendingClassRegister(false);
        setShowClassRegister(true);
      } else {
        setShowVipMenu(true);
      }
      setVipLoginPw('');
    } catch {
      alert('아이디 또는 비밀번호가 틀렸습니다');
    } finally {
      setVipLoginLoading(false);
    }
  };

  /** Route_Lounge — 이미 로그인된 마스터 메뉴에서 진입: 재인증 없이 바로 클래스 등록 모달 */
  const openClassRegisterFromLounge = useCallback(() => {
    const session = readVipInstructorSession();
    setShowLuxuryUpsellModal(false);
    setVipPendingClassRegister(false);
    setShowVipLogin(false);
    setShowVipMenu(false);

    if (session?.id) {
      setVipLoggedIn(true);
      setShowClassRegister(true);
      return;
    }
    if (vipLoggedIn) {
      setShowClassRegister(true);
      return;
    }
    setVipAuthMode('login');
    setShowVipLogin(true);
  }, [vipLoggedIn]);

  /** Route_Home 등 공개 진입 — 검증 후 비마스터면 럭셔리 업셀 */
  const openClassRegisterFromHome = useCallback(async () => {
    const isInstructor = await verifyActiveInstructorMember();
    if (isInstructor) {
      const session = readVipInstructorSession();
      if (session) {
        setVipLoggedIn(true);
        localStorage.setItem('vip_instructor_session', JSON.stringify(session));
      }
      setVipPendingClassRegister(false);
      setShowVipLogin(false);
      setShowVipMenu(false);
      setShowClassRegister(true);
      return;
    }

    setVipPendingClassRegister(false);
    setShowVipLogin(false);
    setShowVipMenu(false);
    setShowClassRegister(false);
    setShowLuxuryUpsellModal(true);
  }, []);

  const redirectToMasterLogin = () => {
    setShowLuxuryUpsellModal(false);
    setVipAuthMode('login');
    setShowVipLogin(true);
  };

  const redirectToMasterSignup = () => {
    setShowLuxuryUpsellModal(false);
    setVipAuthMode('signup');
    setShowVipLogin(true);
  };

  const openVipMasterFlow = () => {
    setVipPendingClassRegister(false);
    if (vipLoggedIn) {
      setShowVipMenu(true);
    } else {
      setShowVipLogin(true);
    }
  };

  const openLessonRegisterChoice = useCallback(() => {
    setShowLessonRegisterChoice(true);
  }, []);

  const handleCloseModal = () => {
    setIsMenuOpen(false);
    setShowVipLogin(false);
    setVipAuthMode('login');
    setVipRecoverEmail('');
    setVipRecoveredPassword('');
    setShowVipMenu(false);
    setShowLuxuryUpsellModal(false);
    setVipPendingClassRegister(false);
    if (parseAppState(window.history.state)?.overlay) {
      if (closeOverlay()) return;
    }
    setShowFullCalendar(false);
    setShowWeather(false);
    setShowWishlist(false);
    setShowSaju(false);
    setShowRentalModal(false);
    setShowPartner(false);
    setShowRoute(false);
    setShowPlaceInquiry(false);
    setShowGridModal(false);
    setShowFilterPanel(false);
    setShowFilteredResults(false);
    setShowIncheonModal(false);
    setChatbotOverlay(false);
  };

  useEffect(() => {
    // 공지사항 가이드 자동 팝업 (디바이스당 한 번)
    const guideShown = localStorage.getItem('notice_guide_shown');
    if (!guideShown) {
      setTimeout(() => {
        setShowNoticeGuide(true);
      }, 1000); // 1초 뒤에 자연스럽게 팝업
    }
  }, []);

  const fetchFollowedInstructors = async () => {
    try {
      if (!supabase) return;
      const s = localStorage.getItem('user_session') || localStorage.getItem('oneulbam_session');
      if (!s) return;
      const { data: followData, error: followErr } = await runSupabaseQuery('instructor_follows', (db) =>
        db.from('instructor_follows').select('instructor_id').eq('user_session', s),
      );
      if (followErr) {
        console.warn('[App] instructor_follows:', followErr.message || followErr);
        setFollowedInstructors([]);
        return;
      }

      if (followData && followData.length > 0) {
        const ids = followData.map((f) => f.instructor_id);
        const { data: instData, error: instErr } = await runSupabaseQuery('instructors', (db) =>
          db.from('instructors').select('*').in('id', ids).eq('status', 'active'),
        );
        if (instErr) {
          console.warn('[App] instructors:', instErr.message || instErr);
          setFollowedInstructors([]);
          return;
        }
        setFollowedInstructors(instData || []);
      } else {
        setFollowedInstructors([]);
      }
    } catch (err) {
      console.error('Failed to fetch followed instructors:', err);
      setFollowedInstructors([]);
    }
  };

  useEffect(() => {
    if (view !== 'instructors' && view !== 'home' && !isMenuOpen) return;
    fetchFollowedInstructors();
  }, [isMenuOpen, view]);

  useEffect(() => {
    const onRefresh = () => fetchFollowedInstructors();
    window.addEventListener('refresh-sidebar', onRefresh);
    return () => window.removeEventListener('refresh-sidebar', onRefresh);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vip_instructor_session');
      if (raw) setVipLoggedIn(true);
    } catch (_) { /* ignore */ }
  }, []);

  const openVipMasterFlowRef = useRef(openVipMasterFlow);
  openVipMasterFlowRef.current = openVipMasterFlow;
  const openClassRegisterFromHomeRef = useRef(openClassRegisterFromHome);
  openClassRegisterFromHomeRef.current = openClassRegisterFromHome;
  const openLessonRegisterChoiceRef = useRef(openLessonRegisterChoice);
  openLessonRegisterChoiceRef.current = openLessonRegisterChoice;

  useEffect(() => {
    const onOpenVip = () => openVipMasterFlowRef.current();
    const onOpenClassReg = () => openLessonRegisterChoiceRef.current();
    window.addEventListener('open-vip-master-login', onOpenVip);
    window.addEventListener('open-class-register', onOpenClassReg);
    return () => {
      window.removeEventListener('open-vip-master-login', onOpenVip);
      window.removeEventListener('open-class-register', onOpenClassReg);
    };
  }, []);

  /* 지역 캐러셀 연동 스크롤 — 독립 스크롤로 전환, 구 로직 주석 보관
  useEffect(() => {
    if (view !== 'home') return undefined;

    let syncing = false;
    const cleanups = [];

    const bindRegionCarouselSync = () => {
      while (cleanups.length) cleanups.pop()();
      const containers = document.querySelectorAll('.region-scroll-container');
      if (containers.length < 2) return;

      containers.forEach((source) => {
        const onScroll = () => {
          if (syncing) return;
          syncing = true;
          const left = source.scrollLeft;
          containers.forEach((el) => {
            if (el !== source) el.scrollLeft = left;
          });
          requestAnimationFrame(() => {
            syncing = false;
          });
        };
        source.addEventListener('scroll', onScroll, { passive: true });
        cleanups.push(() => source.removeEventListener('scroll', onScroll));
      });
    };

    bindRegionCarouselSync();
    const t1 = window.setTimeout(bindRegionCarouselSync, 400);
    const t2 = window.setTimeout(bindRegionCarouselSync, 1200);

    const root = document.querySelector('[data-bchata-app-root]');
    const mo = root
      ? new MutationObserver(() => bindRegionCarouselSync())
      : null;
    if (root && mo) mo.observe(root, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      mo?.disconnect();
      while (cleanups.length) cleanups.pop()();
    };
  }, [view, selectedDate, loading, displayParties.length]);
  */

  useEffect(() => {
    if (view !== 'instructors') return undefined;
    const bindMasterBtn = () => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => (b.textContent?.includes('강사 전용') || b.textContent?.includes('마스터 전용')) && !b.dataset.vipBound
      );
      if (!btn) return undefined;
      btn.dataset.vipBound = '1';
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openVipMasterFlow();
      };
      btn.addEventListener('click', handler, true);
      return () => {
        delete btn.dataset.vipBound;
        btn.removeEventListener('click', handler, true);
      };
    };
    let cleanup = bindMasterBtn();
    const t = setTimeout(() => {
      if (cleanup) cleanup();
      cleanup = bindMasterBtn() || cleanup;
    }, 400);
    const obs = new MutationObserver(() => {
      if (cleanup) cleanup();
      cleanup = bindMasterBtn() || cleanup;
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(t);
      obs.disconnect();
      if (cleanup) cleanup();
    };
  }, [view, vipLoggedIn]);

  const prefetchInstructorsList = useCallback(async () => {
    if (!supabase || instructorsPrefetchRef.current) return;
    instructorsPrefetchRef.current = true;
    try {
      const { data, error } = await runSupabaseQuery('instructorsPrefetch', (db) =>
        db.from('instructors').select('*').eq('status', 'active').order('follower_count', { ascending: false }),
      );
      if (!error && data?.length) setInstructorsCache(data);
    } catch (err) {
      console.warn('[App] instructors prefetch:', err);
      instructorsPrefetchRef.current = false;
    }
  }, []);

  const fetchParties = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      if (!supabase) {
        console.warn('[App.fetchParties] Supabase client unavailable — check .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
        setParties([]);
        setBootcamps([]);
        setFestivals([]);
        return;
      }

      const [partiesRes, locationsRes, bootcampsRes, festivalsRes] = await Promise.all([
        runSupabaseQuery('parties', (db) =>
          db.from('parties').select(PARTIES_SELECT).eq('status', 'approved').order('date', { ascending: true }),
        ),
        runSupabaseQuery('locations', (db) => db.from('locations').select(LOCATIONS_SELECT)),
        runSupabaseQuery('bootcamps', (db) =>
          db.from('bootcamps').select('*').eq('status', 'active'),
        ),
        runSupabaseQuery('festivals', (db) =>
          db.from('festivals').select('*').eq('status', 'active'),
        ),
      ]);

      if (partiesRes.error) {
        logPartiesFetchError(partiesRes.error);
        setParties([]);
        setBootcamps(bootcampsRes.data || []);
        setFestivals(festivalsRes.data || []);
        return;
      }
      if (locationsRes.error) {
        logSupabaseError('App.fetchParties.locations', locationsRes.error);
      }
      if (bootcampsRes.error) logSupabaseError('App.fetchParties.bootcamps', bootcampsRes.error);
      if (festivalsRes.error) logSupabaseError('App.fetchParties.festivals', festivalsRes.error);

      const rawParties = partiesRes.data || [];
      const rawLocations = locationsRes.error ? [] : (locationsRes.data || []);

      const locationMap = rawLocations.reduce((acc, loc) => {
        acc[loc.id] = loc.name;
        return acc;
      }, {});

      const mappedParties = rawParties.map(p => {
        const locName = locationMap[p.location_id] || p.locationName || p.location_name || '장소 미지정';
        
        let broadRegion = '전국';
        const regionStr = String(p.region || '');
        const tStr = p.title || '';
        if (regionStr.includes('서울')) broadRegion = '서울';
        else if (tStr.includes('[서울]')) broadRegion = '서울';
        else if (tStr.includes('[경인]') || tStr.includes('[경기/인천]') || tStr.includes('[인천광역시]') || tStr.includes('[인천]')) broadRegion = '경인';
        else if (tStr.includes('[경상도]')) broadRegion = '경상도';
        else if (tStr.includes('[전라도]')) broadRegion = '전라도';
        else if (tStr.includes('[충청도]')) broadRegion = '충청도';
        else if (tStr.includes('[강원/제주]')) broadRegion = '강원/제주';
        else {
          const fullSearchText = `${p.address || ''} ${locName} ${p.cityName || ''}`;
          if (fullSearchText.includes('부산') || fullSearchText.includes('대구') || fullSearchText.includes('울산') || fullSearchText.includes('경상') || fullSearchText.includes('경남') || fullSearchText.includes('경북') || fullSearchText.includes('창원') || fullSearchText.includes('포항') || fullSearchText.includes('김해')) broadRegion = '경상도';
          else if (fullSearchText.includes('서울') || fullSearchText.includes('강남') || fullSearchText.includes('홍대') || fullSearchText.includes('잠실') || fullSearchText.includes('성수') || fullSearchText.includes('서초') || fullSearchText.includes('영등포') || fullSearchText.includes('신림') || fullSearchText.includes('건대')) broadRegion = '서울';
          else if (fullSearchText.includes('경기') || fullSearchText.includes('인천') || fullSearchText.includes('부천') || fullSearchText.includes('수원') || fullSearchText.includes('안양') || fullSearchText.includes('의정부') || fullSearchText.includes('분당') || fullSearchText.includes('일산')) broadRegion = '경인';
          else if (fullSearchText.includes('광주') || fullSearchText.includes('전라') || fullSearchText.includes('전남') || fullSearchText.includes('전북') || fullSearchText.includes('전주') || fullSearchText.includes('목포') || fullSearchText.includes('여수') || fullSearchText.includes('순천')) broadRegion = '전라도';
          else if (fullSearchText.includes('대전') || fullSearchText.includes('충남') || fullSearchText.includes('충북') || fullSearchText.includes('충청') || fullSearchText.includes('세종') || fullSearchText.includes('천안') || fullSearchText.includes('청주')) broadRegion = '충청도';
          else if (fullSearchText.includes('강원') || fullSearchText.includes('제주') || fullSearchText.includes('춘천') || fullSearchText.includes('원주') || fullSearchText.includes('서귀포')) broadRegion = '강원/제주';
        } 
        
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
      setParties(mappedParties);
      setBootcamps(bootcampsRes.data || []);
      setFestivals(festivalsRes.data || []);
    } catch (err) {
      logPartiesFetchError(err);
      console.error('[App.fetchParties] 데이터 로딩 오류:', err);
      setParties([]);
      setBootcamps([]);
      setFestivals([]);
    } finally {
      if (!silent) setLoading(false);
      prefetchInstructorsList();
    }
  }, [prefetchInstructorsList]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  useEffect(() => {
    const activeTodayStr = getKSTDate().dateStr;
    const upcomingParties = parties.filter((p) => normDate(p.date) >= activeTodayStr);
    
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

  const partyDeepLinkHandled = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const partyId = params.get('party');
    if (!partyId || loading) return;
    if (partyDeepLinkHandled.current === partyId) return;

    const openPartyFromLink = (party) => {
      const card = buildPartyShareCard(party);
      if (!card) return;
      partyDeepLinkHandled.current = partyId;
      setView('home');
      if (location.pathname !== '/') navigate('/');
      if (party.date) setSelectedDate(party.date);
      fullCalendarBeforeDetailRef.current = showFullCalendar;
      setShowFullCalendar(false);
      setIsDetailView(true);
      setSelectedPoster(card);
      pushOverlay('partyPoster', { meta: { partyId: String(party.id) } });
      const u = new URL(window.location.href);
      u.searchParams.delete('party');
      u.searchParams.delete('open');
      const qs = u.searchParams.toString();
      const cleanUrl = u.pathname + (qs ? `?${qs}` : '');
      const st = readNavigationState() || buildAppState({ view: 'home', homeTab: homeActiveTab });
      window.history.pushState(st, '', cleanUrl);
      window.dispatchEvent(new CustomEvent('bamppa-navigate', { detail: { state: st } }));
    };

    const found = parties.find((p) => String(p.id) === String(partyId));
    if (found) {
      openPartyFromLink(found);
      return;
    }

    if (parties.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        if (!supabase) return;
        const { data, error } = await runSupabaseQuery('partyDeepLink', (db) =>
          db.from('parties').select(PARTIES_SELECT).eq('id', partyId).eq('status', 'approved').maybeSingle(),
        );
        if (error) logPartiesFetchError(error);
        if (!cancelled && data) openPartyFromLink(data);
      } catch (err) {
        logPartiesFetchError(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, parties, location.pathname]);

  const partyOverlayOpenedRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const openFromOverlay = () => {
      const st = readNavigationState();
      const partyId = st?.overlayMeta?.partyId;
      if (st?.overlay !== 'partyPoster' || !partyId) {
        if (st?.overlay !== 'partyPoster') partyOverlayOpenedRef.current = null;
        return;
      }
      if (loading) return;
      if (partyOverlayOpenedRef.current === String(partyId)) return;

      const openParty = (party) => {
        const card = buildPartyShareCard(party);
        if (!card) return;
        partyOverlayOpenedRef.current = String(partyId);
        if (party.date) setSelectedDate(party.date);
        fullCalendarBeforeDetailRef.current = showFullCalendar;
        setShowFullCalendar(false);
        setIsDetailView(true);
        setSelectedPoster(card);
      };

      const found = parties.find((p) => String(p.id) === String(partyId));
      if (found) {
        openParty(found);
        return;
      }

      if (parties.length === 0) return;

      (async () => {
        try {
          if (!supabase) return;
          const { data, error } = await runSupabaseQuery('partyOverlay', (db) =>
            db.from('parties').select(PARTIES_SELECT).eq('id', partyId).eq('status', 'approved').maybeSingle(),
          );
          if (error) logPartiesFetchError(error);
          if (!cancelled && data) openParty(data);
        } catch (err) {
          logPartiesFetchError(err);
        }
      })();
    };

    openFromOverlay();
    window.addEventListener('bamppa-navigate', openFromOverlay);
    return () => {
      cancelled = true;
      window.removeEventListener('bamppa-navigate', openFromOverlay);
    };
  }, [loading, parties]);

  const openAnalysis = (saju = false) => {
    pushOverlay('incheon');
    setIsSajuCall(saju);
    setIsAnalyzing(true);
    setTimeout(() => { setIsAnalyzing(false); setShowIncheonModal(true); }, 1200);
  };

  const handleRegister = (type = 'party') => {
    if (type === 'party') {
      navigate('/register-party');
      return;
    }
    openLessonRegisterChoice();
  };

  const requestLocation = (force = false) => {
    getUserCoords({ force, enableHighAccuracy: false })
      .then((c) => setUserCoords({ lat: c.lat, lon: c.lng }))
      .catch(() => {});
  };

  useEffect(() => {
    syncGeoPermissionState();
    const cached = readCachedCoords();
    if (cached) {
      setUserCoords({ lat: cached.lat, lon: cached.lng });
      return;
    }
    if (!isGeoDenied()) requestLocation();
  }, []);

  useEffect(() => {
    const runDailyCleanup = async () => {
      const day = getKSTCalendarTodayStr();
      if (lastPosterCleanupDayRef.current === day) return;
      lastPosterCleanupDayRef.current = day;
      await purgePastPartyPostersAndRows(supabase);
    };

    runDailyCleanup();
    const timer = window.setInterval(runDailyCleanup, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const withHistory = (overlayKey, isOpen, setter) => (v) => {
    if (v === true && !isOpen) {
      pushOverlay(overlayKey);
    } else if (v === false && isOpen) {
      if (!closeOverlay()) setter(false);
      return;
    }
    setter(v);
  };

  const setActiveTab = (tab) => {
    setHomeActiveTab(tab);
    window.dispatchEvent(new CustomEvent('home-active-tab', { detail: tab }));
  };

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
    showFullCalendar, setShowFullCalendar: withHistory('fullCalendar', showFullCalendar, setShowFullCalendar),
    showFilterPanel, setShowFilterPanel,
    showFilteredResults, setShowFilteredResults,
    likedIds: [], toggleLike: () => {},
    filterRegion, setFilterRegion, filterGenre, setFilterGenre,
    showGridModal, setShowGridModal, gridRegion, setGridRegion, filterStep, setFilterStep,
    handleOpenModal, handleCloseModal,
    isDetailView,
    enterPosterDetailView,
    exitPosterDetailView,
    IncheonBanner: () => <IncheonPremiumBanner t={t} onClick={() => openAnalysis(false)} />, venueCounts: {}, resetToToday: () => { setView('home'); setSelectedDate(todayData.dateStr); }, formatItemDate: (d, t) => `${d} ${t}`, formatFee: (f) => f, 
    handleRegister, 
    fetchParties,
    setShowSaju: withHistory('saju', showSaju, setShowSaju),
    setShowWeather: withHistory('weather', showWeather, setShowWeather),
    setShowWishlist: withHistory('wishlist', showWishlist, setShowWishlist),
    setShowRentalModal: withHistory('rental', showRentalModal, setShowRentalModal),
    setShowPartner: withHistory('partner', showPartner, setShowPartner),
    openAnalysis,
    setShowRoute: withHistory('route', showRoute, setShowRoute),
    setShowPlaceInquiry: withHistory('placeInquiry', showPlaceInquiry, setShowPlaceInquiry),
    logActivity: () => {}, regionalTheme: { welcomeMsg: "전국 댄서들을 위한 실시간 정보", specialBanner: true },
    followedInstructors,
    LiveExposureStrip,
    homeTab: homeActiveTab,
    onHomeTabChange: setActiveTab,
  };

  // 파티/클래스/부트캠프/페스티벌 등록 중에는 하단 네비 숨김 (등록 폼 버튼 가림 방지)
  const hideBottomNav =
    view === 'register-party' ||
    view === 'register-class' ||
    view === 'bootcamp-register' ||
    view === 'festival-register' ||
    view === 'admin' ||
    view === 'admin-portal' ||
    location.pathname === '/register-party' ||
    location.pathname === '/register-class' ||
    location.pathname === '/bootcamp/register' ||
    location.pathname === '/festival/register' ||
    location.pathname === '/admin' ||
    location.pathname === '/admin-portal' ||
    location.pathname === '/terms' ||
    location.pathname === '/privacy';

  const isLegalPage = location.pathname === '/terms' || location.pathname === '/privacy';

  const bottomNavAccent = '#FF1744'
  const navActiveColor = bottomNavAccent
  const navInactiveColor = '#94A3B8'
  const socialNavActive = bottomNavAccent
  const socialNavInactive = navInactiveColor
  const isHomeNavActive = location.pathname === '/' && view === 'home' && homeActiveTab === null && !showPartner
  const isWishlistNavActive = showWishlist
  const isConciergeNavActive = chatbotOverlay
  const isLivepickNavActive = location.pathname === '/livepick'
  const bottomNavRef = useRef(null)

  useEffect(() => {
    const el = bottomNavRef.current
    if (!el || hideBottomNav) return undefined
    const layout = [
      ['border-radius', '0'],
      ['margin', '0'],
      ['width', '100%'],
      ['max-width', 'none'],
      ['left', '0'],
      ['right', '0'],
      ['bottom', '0'],
      ['transform', 'none'],
      ['padding-left', '0'],
      ['padding-right', '0'],
      ['padding-bottom', 'env(safe-area-inset-bottom, 0px)'],
      ['min-height', 'calc(54px + env(safe-area-inset-bottom, 0px))'],
      ['height', 'auto'],
    ]
    layout.forEach(([prop, value]) => {
      el.style.setProperty(prop, value, 'important')
    })
    return () => {
      layout.forEach(([prop]) => {
        el.style.removeProperty(prop)
      })
    }
  }, [hideBottomNav])

  useEffect(() => {
    document.body.classList.toggle('has-bottom-nav', !hideBottomNav)
    return () => document.body.classList.remove('has-bottom-nav')
  }, [hideBottomNav])

  useEffect(() => {
    document.body.classList.toggle('bchata-admin-shell-active', isAdminShell)
    return () => document.body.classList.remove('bchata-admin-shell-active')
  }, [isAdminShell])

  return (
    <>
    <div
      className={[
        'bchata-app-shell',
        isHomeGateNav ? 'bchata-app-shell--gate' : '',
        isDarkAppSurface ? 'bchata-app-shell--dark' : '',
      ].filter(Boolean).join(' ')}
    >
    <div
      data-bchata-app-root
      style={{ 
      width: '100%',
      background: isDarkAppSurface ? '#0D0D0D' : 'var(--color-bg)',
      color: isDarkAppSurface ? '#F8FAFC' : 'var(--color-text-main)',
      minHeight: '100dvh', position: 'relative',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: showSplash ? 0 : 1 }} 
        transition={{ duration: 0.5, ease: 'easeOut', delay: showSplash ? 0 : 0.1 }}
        style={{
          width: '100%',
          minHeight: '100dvh',
          position: 'relative',
          background: isDarkAppSurface ? '#0D0D0D' : 'transparent',
        }}
      >
      <AnimatePresence>{isAnalyzing && <motion.div className="bchata-overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: Z.modalBackdrop, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(30px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '60px', height: '60px', border: '4px solid #FFEBEE', borderTop: '4px solid #E53935', borderRadius: '50%', marginBottom: '20px' }} /><h2 style={{ color: '#1E293B', fontSize: '20px', fontWeight: '900' }}>실시간 지능형 분석 중...</h2></motion.div>}</AnimatePresence>

      {/* 햄버거 메뉴 버튼 — 비활성화
      {!isMenuOpen && (
        <motion.button 
          drag
          ...
        </motion.button>
      )}
      */}

      {/* 햄버거 드로어 — 비활성화 */}
      <AnimatePresence>
        {false && isMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', top: 0, bottom: 0, left: 0,
              width: '75vw', maxWidth: '320px',
              zIndex: Z.modalBackdrop,
              background: '#121212', padding: '24px',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
              borderRight: '1px solid rgba(201,168,76,0.3)',
              color: '#fff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseModal}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '12px', padding: '10px', color: '#C9A84C', cursor: 'pointer' }}
              >
                <ChevronLeft size={24} />
              </motion.button>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ color: '#F8FAFC', fontSize: '22px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#C9A84C' }}>🌟</span> 마스터 전용 메뉴
              </h2>
              <p style={{ color: '#C9A84C', fontSize: '13px', marginTop: '4px', fontWeight: 700, letterSpacing: '0.5px' }}>VIP INSTRUCTOR LOUNGE</p>
              <p style={{ color: '#94A3B8', fontSize: '11px', marginTop: '8px', fontWeight: 600, lineHeight: 1.45 }}>
                우리 시스템은 '오늘'과 '내일'의 정보만 제공한다. 지난 정보는 삭제되니, 항상 최신 포스터를 등록하여 활동을 증명하라.
              </p>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', marginBottom: '12px', letterSpacing: '1px' }}>
              VIP NAVIGATION
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/*
              전체 강사 / 강사 클래스 / 구 VIP 메뉴 — 주석 보관
              */}
              {[
                {
                  icon: <span style={{ fontSize: '20px', lineHeight: 1 }}>📋</span>,
                  text: '수강생 관리',
                  action: () => { setIsMenuOpen(false); alert('준비 중입니다 🔧'); },
                },
                {
                  icon: <span style={{ fontSize: '20px', lineHeight: 1 }}>💰</span>,
                  text: '수입 집계',
                  action: () => { setIsMenuOpen(false); alert('준비 중입니다 🔧'); },
                },
                {
                  icon: <span style={{ fontSize: '20px', lineHeight: 1 }}>📅</span>,
                  text: '내 클래스 일정',
                  action: () => { setIsMenuOpen(false); alert('준비 중입니다 🔧'); },
                },
                {
                  icon: <span style={{ fontSize: '20px', lineHeight: 1 }}>📊</span>,
                  text: '내 프로필 통계',
                  action: () => { setIsMenuOpen(false); alert('준비 중입니다 🔧'); },
                },
                {
                  icon: <span style={{ fontSize: '20px', lineHeight: 1 }}>📢</span>,
                  text: '공지 보내기',
                  action: () => { setIsMenuOpen(false); alert('준비 중입니다 🔧'); },
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <span style={{ color: '#F8FAFC', fontSize: '15px', fontWeight: 800 }}>{item.text}</span>
                </motion.div>
              ))}
            </div>

            {false && (<>
            {/* 기존 마스터 전용 메뉴 아래에 구분선 후 추가 */}
            <div style={{ height: '1px', background: 'rgba(201,168,76,0.2)', margin: '32px 0 24px' }} />

            {/* MY MASTERS 섹션 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 950, color: '#F8FAFC', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🌟 내 강사
              </div>
              
              {followedInstructors.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '14px', fontWeight: 600 }}>아직 팔로우한 강사가 없어요 💫</div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      localStorage.setItem('instructor_target_genre', '전체');
                      navigate('/instructors');
                      setView('instructors');
                      setIsMenuOpen(false);
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('apply-instructor-filter'));
                      }, 300);
                    }}
                    style={{
                      padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.3)',
                      background: 'rgba(201,168,76,0.1)', color: '#C9A84C', fontSize: '12px', fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    강사 찾기 →
                  </motion.button>
                </div>
              ) : (
                <div style={{ display: 'flex', overflowX: 'auto', gap: '14px', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                  {followedInstructors.map(inst => (
                    <motion.div
                      key={inst.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate(instructorProfilePath(inst.id), {
                          view: 'instructors',
                          instructorId: inst.id,
                          instructorTab: 'BIO',
                          force: true,
                        });
                      }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <div style={{ width: '58px', height: '58px', borderRadius: '50%', border: '2px solid #C9A84C', padding: '2px', background: '#000', boxShadow: '0 4px 12px rgba(201,168,76,0.2)' }}>
                        <img src={inst.photo_url || DEFAULT_AVATAR_IMAGE} onError={imgFallbackHandler(DEFAULT_AVATAR_IMAGE)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt={inst.name} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#E2E8F0', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inst.name.split(' ')[0]}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            </>)}

            <div style={{ marginTop: 'auto', paddingTop: '40px', textAlign: 'center' }}>
              <p style={{ color: '#64748B', fontSize: '11px', fontWeight: 700 }}>© 2026 BAMPPA VIP Lounge</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdminShell && showLuxuryUpsellModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="luxury-master-upsell-title"
          style={{ position: 'fixed', inset: 0, zIndex: Z.modal, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowLuxuryUpsellModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: 360, background: '#121212', borderRadius: 16, padding: 24, border: '1px solid rgba(201,168,76,0.35)' }}
          >
            <button
              type="button"
              onClick={() => setShowLuxuryUpsellModal(false)}
              aria-label="닫기"
              style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: 8, color: '#C9A84C', cursor: 'pointer' }}
            >
              ✕
            </button>
            <p style={{ margin: '0 0 6px', color: '#C9A84C', fontSize: 11, fontWeight: 900, letterSpacing: '0.04em' }}>
              럭셔리 마스터 전환
            </p>
            <h2 id="luxury-master-upsell-title" style={{ margin: '0 0 12px', color: '#F8FAFC', fontSize: 20, fontWeight: 900 }}>
              오늘밤빠 마스터(강사) 안내
            </h2>
            <p style={{ margin: '0 0 18px', color: '#CBD5E1', fontSize: 14, lineHeight: 1.55, fontWeight: 600 }}>
              본 서비스는 검증된 마스터 회원만 클래스 등록이 가능합니다.
              <br />
              마스터 계정으로 로그인하여 클래스를 생성하세요.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={redirectToMasterLogin}
                style={{ flex: 1, padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(201,168,76,0.45)', background: 'transparent', color: '#C9A84C', fontWeight: 800, cursor: 'pointer' }}
              >
                마스터 로그인
              </button>
              <button
                type="button"
                onClick={redirectToMasterSignup}
                style={{ flex: 1, padding: '11px 12px', borderRadius: 10, border: 'none', background: '#C9A84C', color: '#121212', fontWeight: 900, cursor: 'pointer' }}
              >
                마스터 회원가입
              </button>
            </div>
          </div>
        </div>
      )}

      {!isAdminShell && showVipLogin && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: Z.modal, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => { setShowVipLogin(false); resetVipAuthToLogin(); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: 340, background: '#121212', borderRadius: 16, padding: 24, border: '1px solid rgba(201,168,76,0.35)' }}
          >
            <button
              type="button"
              onClick={() => { setShowVipLogin(false); resetVipAuthToLogin(); }}
              aria-label="닫기"
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={20} color="#C9A84C" />
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingRight: 40 }}>
              <motion.div>
                <h3 style={{ margin: '0 0 8px', color: '#F8FAFC', fontSize: 18, fontWeight: 900 }}>{vipAuthMode === 'login' ? '마스터 로그인' : vipAuthMode === 'signup' ? '회원가입' : '비밀번호 찾기'}</h3>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>VIP INSTRUCTOR LOUNGE</p>
              </motion.div>
              {vipAuthMode !== 'recover' && (
                <button
                  type="button"
                  onClick={() => setVipAuthMode(vipAuthMode === 'login' ? 'signup' : 'login')}
                  style={{ flexShrink: 0, marginTop: 2, padding: 0, border: 'none', background: 'transparent', color: '#C9A84C', fontSize: 13, fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {vipAuthMode === 'login' ? '회원가입' : '로그인'}
                </button>
              )}
            </div>
            {vipAuthMode === 'recover' ? (
              <>
                <input
                  type="email"
                  placeholder="이메일"
                  value={vipRecoverEmail}
                  onChange={(e) => setVipRecoverEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVipPasswordRecover()}
                  style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }}
                />
                {vipRecoveredPassword !== '' && (
                  <p style={{ margin: '0 0 12px', padding: '12px 14px', borderRadius: 10, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', color: '#F8FAFC', fontSize: 14, fontWeight: 700, wordBreak: 'break-all' }}>
                    비밀번호: {vipRecoveredPassword}
                  </p>
                )}
                <button
                  type="button"
                  disabled={vipLoginLoading}
                  onClick={handleVipPasswordRecover}
                  style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#C9A84C', color: '#121212', fontSize: 15, fontWeight: 900, cursor: vipLoginLoading ? 'wait' : 'pointer', opacity: vipLoginLoading ? 0.7 : 1, marginBottom: 12 }}
                >
                  {vipLoginLoading ? '확인 중...' : '확인'}
                </button>
                <button
                  type="button"
                  onClick={resetVipAuthToLogin}
                  style={{ width: '100%', padding: 0, border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  다시 로그인으로 돌아가기
                </button>
              </>
            ) : (
              <>
            <input
              type="text"
              placeholder="아이디"
              value={vipLoginId}
              onChange={(e) => setVipLoginId(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={vipLoginPw}
              onChange={(e) => setVipLoginPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (vipAuthMode === 'login' ? handleVipLoginSubmit() : handleVipSignupSubmit())}
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 16, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }}
            />
            <button
              type="button"
              disabled={vipLoginLoading}
              onClick={vipAuthMode === 'login' ? handleVipLoginSubmit : handleVipSignupSubmit}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#C9A84C', color: '#121212', fontSize: 15, fontWeight: 900, cursor: vipLoginLoading ? 'wait' : 'pointer', opacity: vipLoginLoading ? 0.7 : 1 }}
            >
              {vipLoginLoading ? (vipAuthMode === 'login' ? '확인 중...' : '가입 중...') : (vipAuthMode === 'login' ? '로그인' : '가입')}
            </button>
                {vipAuthMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setVipAuthMode('recover'); setVipRecoveredPassword(''); }}
                    style={{ width: '100%', marginTop: 14, padding: 0, border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    비밀번호 찾기
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {!isAdminShell && showVipMenu && vipLoggedIn && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', top: 0, bottom: 0, left: 0,
              width: '75vw', maxWidth: '320px',
              zIndex: Z.modal,
              background: '#121212', padding: '24px',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
              borderRight: '1px solid rgba(201,168,76,0.3)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={handleVipLogout}
                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.12)', color: '#C9A84C', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                로그아웃
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowVipMenu(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: 10, color: '#C9A84C', cursor: 'pointer' }}
              >
                <ChevronLeft size={24} />
              </motion.button>
            </div>
            <motion.div style={{ marginBottom: 32 }}>
              <h2 style={{ color: '#F8FAFC', fontSize: 22, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#C9A84C' }}>🌟</span> 마스터 전용 메뉴
              </h2>
              <p style={{ color: '#C9A84C', fontSize: 13, marginTop: 4, fontWeight: 700, letterSpacing: '0.5px' }}>VIP INSTRUCTOR LOUNGE</p>
            </motion.div>
            <motion.div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 12, letterSpacing: '1px' }}>VIP NAVIGATION</motion.div>
            <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  icon: <GraduationCap size={20} color="#C9A84C" />,
                  text: '클래스등록',
                  action: () => openClassRegisterFromLounge(),
                },
                { icon: <Users size={20} color="#C9A84C" />, text: '수강생 관리' },
                { icon: <TrendingUp size={20} color="#C9A84C" />, text: '수입 집계' },
                { icon: <CalendarDays size={20} color="#C9A84C" />, text: '내 클래스 일정' },
                { icon: <BarChart2 size={20} color="#C9A84C" />, text: '내 프로필 통계' },
                { icon: <Bell size={20} color="#C9A84C" />, text: '공지 보내기' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                      return;
                    }
                    setShowVipMenu(false);
                    alert('준비 중입니다 🔧');
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  }}
                >
                  <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</motion.div>
                  <span style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 800 }}>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
            <motion.div style={{ marginTop: 'auto', paddingTop: 40, textAlign: 'center' }}>
              <p style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>© 2026 BAMPPA VIP Lounge</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {false && location.pathname === '/' && view === 'home' && !showPartner && !showSplash && (
        <div
          style={{
            position: 'fixed',
            top: 'max(10px, env(safe-area-inset-top, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '500px',
            zIndex: Z.modalBackdrop9,
            padding: '0 16px',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/register-class')}
            style={{
              pointerEvents: 'auto',
              padding: '8px 14px',
              borderRadius: '12px',
              border: 'none',
              background: '#FF1744',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 23, 68, 0.25)',
            }}
          >
            강사등록
          </button>
        </div>
      )}

      {isAdminShell ? (
        <main className="bchata-admin-shell" data-bchata-shell="admin">
          <Suspense fallback={<LoadingFallback />}>
            {view === 'admin-portal' ? (
              <div
                className="bchata-admin-portal"
                style={{
                  minHeight: '100dvh',
                  background: '#0F172A',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  gap: '20px',
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <ShieldCheck size={64} color="#FF1744" style={{ margin: '0 auto 16px' }} />
                  <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 900 }}>{t('admin_portal')}</h2>
                  <p style={{ color: '#94A3B8', fontSize: '14px' }}>{t('admin_portal_desc')}</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  style={{
                    width: '100%',
                    maxWidth: '320px',
                    padding: '24px',
                    borderRadius: '20px',
                    background: '#1E293B',
                    color: 'white',
                    border: '1px solid #334155',
                    fontSize: '18px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                  }}
                >
                  <Music2 size={24} color="#FF1744" /> {t('admin_manage_party')}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{ marginTop: '40px', background: 'none', border: 'none', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                >
                  {t('back_to_main')}
                </button>
              </div>
            ) : (
              <AdminDashboard setView={setView} onBack={goBack} refreshData={fetchParties} />
            )}
          </Suspense>
        </main>
      ) : (
        <main className="bchata-user-shell" data-bchata-shell="user">
          {isLegalPage ? (
          <Suspense fallback={<LoadingFallback />}>
            {location.pathname === '/terms' ? <Terms onBack={goBack} /> : <Privacy onBack={goBack} />}
          </Suspense>
          ) : (
          <>
          <div className="bchata-tab-panels">

          <div className="bchata-tab-panel" data-active={view === 'home'} aria-hidden={view !== 'home'}>

            <HomePage {...sharedProps} />

          </div>

          <div

            className="bchata-tab-panel"

            data-active={view === 'bootcamp' || view === 'bootcamp-register'}

            aria-hidden={view !== 'bootcamp' && view !== 'bootcamp-register'}

          >

            <Bootcamp

              onBack={goBack}

              initialView={view === 'bootcamp-register' ? 'register' : 'list'}

              cachedBootcamps={bootcamps}

              onBootcampsRefresh={setBootcamps}

            />

          </div>

          <div className="bchata-tab-panel" data-active={view === 'instructors'} aria-hidden={view !== 'instructors'}>

            <Instructors onOpenVipMaster={openVipMasterFlow} cachedInstructors={instructorsCache} />

          </div>

          <div

            className="bchata-tab-panel"

            data-active={view === 'festival' || view === 'festival-register'}

            aria-hidden={view !== 'festival' && view !== 'festival-register'}

          >

            <Festival

              onBack={goBack}

              initialRegister={view === 'festival-register'}

              cachedFestivals={festivals}

              onFestivalsRefresh={setFestivals}

            />

          </div>

        </div>
          <Suspense fallback={<LoadingFallback />}>
            {view === 'community' ? <Community setSelectedPoster={setSelectedPoster} setView={setView} /> :
             view === 'parking' ? <Parking onBack={goBack} /> :
             view === 'restaurant' ? <Restaurant onBack={goBack} /> :
             view === 'register-party' ? null :
             null}
          </Suspense>
          </>
          )}
        </main>
      )}


      {!isAdminShell && (
        <>


      <DynamicAnalysisModal isOpen={showIncheonModal} onClose={() => setShowIncheonModal(false)} userCoords={userCoords} isSajuCall={isSajuCall} />
      <AnimatePresence>
        <Suspense fallback={null}>
          {showIncheon && <IncheonRoute parties={parties} onClose={() => setShowIncheon(false)} />}
        </Suspense>
      </AnimatePresence>
      <AnimatePresence>
        <Suspense fallback={null}>
          {showSaju && <SajuModal parties={parties} onClose={closeModalWithHistory(() => setShowSaju(false))} lang={lang} />}
        </Suspense>
      </AnimatePresence>
      <AnimatePresence>
        <Suspense fallback={null}>
          {showWeather && <WeatherModal onClose={() => setShowWeather(false)} />}
        </Suspense>
      </AnimatePresence>
      <AnimatePresence>
        {showWishlist && (
          <WishlistModal
            onClose={closeModalWithHistory(() => setShowWishlist(false))}
            setSelectedPoster={enterPosterDetailView}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRentalModal && <RentalModal onClose={() => setShowRentalModal(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showFullCalendar && view !== 'home' && (
          <>
            <motion.div className="bchata-overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: Z.modalBackdrop }} />
            <motion.div className="bchata-overlay-panel bchata-overlay-sheet" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', left: '10px', right: '10px', background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: Z.modal, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
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
                        {['서울', '경인', '부산', '대구', '대전', '광주', '기타'].map(r => (
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
                            <div key={item.id} onClick={() => {
                              const card = buildPartyShareCard(item);
                              if (!card) return;
                              enterPosterDetailView(card);
                            }} style={{ background: '#F8FAFC', borderRadius: '16px', padding: '12px', display: 'flex', gap: '15px', border: '1px solid #EDF2F7', cursor: 'pointer' }}>
                              <div className="bchata-poster-frame" style={{ width: '80px', height: '100px', borderRadius: '10px', flexShrink: 0 }}>
                                <img src={item.poster_url} className="bchata-poster-fit" alt="Poster" />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#FF1744', fontWeight: 800 }}>{item.displayBroadRegion}</div>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: '#1E293B', marginTop: '2px' }}>{formatPartyTitleDisplay(item.title)}</div>
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
        {showNoticeGuide && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bchata-overlay-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: Z.modalHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}
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
        </>
      )}

      </motion.div>

    </div>
    
    {/* [B] [포스터 확대 모달 - 컨테이너 외부 최상위 배치] */}
    {!isAdminShell && showPartner && (
      <PartnerModal onClose={() => { if (!closeOverlay()) setShowPartner(false); }} />
    )}
    <LessonRegisterChoiceModal
      isOpen={showLessonRegisterChoice}
      onClose={() => setShowLessonRegisterChoice(false)}
      isEn={i18n.language.startsWith('en')}
      onPickInstructorClass={() => openClassRegisterFromHome()}
      onPickVenueClass={() => {
        navigateHomeTab('social');
        window.setTimeout(() => {
          alert(
            i18n.language.startsWith('en')
              ? 'Open any BAR card, go to the Lesson tab, then tap “BAR class register”.'
              : 'Social BAR에서 원하는 BAR를 연 뒤, 수업 탭의 「BAR 수업 등록」을 눌러 주세요.',
          );
        }, 400);
      }}
      onPickInstructorProfile={() => historyNavigate('/register-class')}
    />
    {showClassRegister && (
      <ClassRegisterModal
        onClose={() => { if (!closeOverlay()) setShowClassRegister(false); }}
        instructorId={(() => {
          try {
            const raw = localStorage.getItem('vip_instructor_session');
            return raw ? JSON.parse(raw).id || '' : '';
          } catch {
            return '';
          }
        })()}
      />
    )}
    {(view === 'register-class' || location.pathname === '/register-class') && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: Z.modalBackdrop,
          background: '#fff',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Suspense fallback={null}>
          <InstructorRegister onBack={goBack} />
        </Suspense>
      </div>
    )}
    {false && false && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: Z.modal, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setShowStudentManager(false)}
      >
        <motion.div onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', minHeight: '200px', background: '#121212', borderRadius: '16px', border: '1px solid rgba(201,168,76,0.3)' }}>
          <div />
        </motion.div>
      </div>
    )}
    {false && false && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: Z.modal, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setShowRevenueStats(false)}
      >
        <motion.div onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', minHeight: '200px', background: '#121212', borderRadius: '16px', border: '1px solid rgba(201,168,76,0.3)' }}>
          <div />
        </motion.div>
      </div>
    )}
    {(view === 'register-party' || location.pathname === '/register-party') && (
      <Suspense fallback={<LoadingFallback />}>
        <RegisterForm
          onBack={goBack}
          onSuccess={() => { fetchParties(); goBack(); }}
          initialData={{ date: selectedDate }}
        />
      </Suspense>
    )}
    <AnimatePresence>
      {selectedPoster && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bchata-overlay-backdrop detail-container"
          data-detail-container
          style={{ position: 'fixed', inset: 0, zIndex: Z.modalMax }}
        >
          <PosterModal 
            src={selectedPoster.src} 
            shareTitle={selectedPoster.title}
            shareDesc={selectedPoster.desc}
            shareLines={selectedPoster.lines}
            shareFeedDesc={selectedPoster.feedDesc}
            partyId={selectedPoster.partyId}
            onClose={exitPosterDetailView}
          />
        </motion.div>
      )}
    </AnimatePresence>
    </div>

    {/* [Premium Floating Capsule Navigation - viewport fixed, outside app shell] */}
    {!hideBottomNav && (
    <nav
      ref={bottomNavRef}
      className="bottom-nav bottom-nav--social-light"
      aria-label="메인 메뉴"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        borderRadius: 0,
        margin: 0,
        width: '100%',
        maxWidth: 'none',
        left: 0,
        right: 0,
        bottom: 0,
        transform: 'none',
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxSizing: 'border-box',
      }}
    >
      <div 
        onClick={() => {
          setShowPartner(false);
          setActiveTab(null);
          navigate('/');
        }}
        style={{ 
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          color: isHomeNavActive ? bottomNavAccent : navInactiveColor
        }}
      >
        <HomeIcon size={22} strokeWidth={isHomeNavActive ? 2.5 : 1.5} />
        <span style={{ fontSize: '9px', fontWeight: isHomeNavActive ? 900 : 600, marginTop: '2px' }}>
          {i18n.language?.startsWith('en') ? 'Home' : '홈'}
        </span>
      </div>
      <div
        onClick={() => {
          setShowPartner(false);
          setActiveTab(null);
          pushOverlay('wishlist');
        }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          color: isWishlistNavActive ? bottomNavAccent : navInactiveColor,
        }}
      >
        <Heart size={22} strokeWidth={isWishlistNavActive ? 2.5 : 1.5} />
        <span style={{ fontSize: '9px', fontWeight: isWishlistNavActive ? 900 : 600, marginTop: '2px' }}>
          {i18n.language?.startsWith('en') ? 'Saved' : '찜하기'}
        </span>
      </div>

      <div
        onClick={() => {
          setShowPartner(false);
          setActiveTab(null);
          window.dispatchEvent(new CustomEvent('open-chatbot'));
        }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          color: isConciergeNavActive ? bottomNavAccent : navInactiveColor,
        }}
      >
        <Zap size={22} strokeWidth={isConciergeNavActive ? 2.5 : 1.5} />
        <span style={{ fontSize: '9px', fontWeight: isConciergeNavActive ? 900 : 600, marginTop: '2px' }}>
          {i18n.language?.startsWith('en') ? 'Concierge' : '컨시어지'}
        </span>
      </div>

      <div 
        onClick={() => {
          setShowPartner(false);
          setActiveTab(null);
          navigate('/livepick');
        }}
        style={{ 
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          color: isLivepickNavActive ? bottomNavAccent : navInactiveColor
        }}
      >
        <Camera size={22} strokeWidth={isLivepickNavActive ? 2.5 : 1.5} />
        <span style={{ fontSize: '9px', fontWeight: isLivepickNavActive ? 900 : 600, marginTop: '2px' }}>
          {i18n.language?.startsWith('en') ? 'Live pick' : '라이브픽'}
        </span>
      </div>

      <div
        onClick={() => {
          setShowPartner(false);
          setActiveTab(null);
          window.open('https://open.kakao.com/o/gP43rNri', '_blank');
        }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          color: navInactiveColor,
        }}
      >
        <MessageSquare size={22} strokeWidth={1.5} />
        <span style={{ fontSize: '9px', fontWeight: 600, marginTop: '2px' }}>
          {i18n.language?.startsWith('en') ? 'Chat' : '채팅문의'}
        </span>
      </div>
    </nav>
    )}
    {!isAdminShell && chatbotOverlay && (
      <ChatBot key="chatbot-overlay-active" />
    )}
    {exitToast ? (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(88px + env(safe-area-inset-bottom))',
          transform: 'translateX(-50%)',
          zIndex: 100010,
          padding: '10px 18px',
          borderRadius: '100px',
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#F8FAFC',
          fontSize: '13px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
        }}
      >
        {exitToast}
      </motion.div>
    ) : null}
    </>
  );
}

export default App;
