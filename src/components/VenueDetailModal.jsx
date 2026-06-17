import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../constants/zLayers';
import { X, ChevronLeft, ChevronRight, ChevronDown, Clock, MapPin } from 'lucide-react';
import { findBarByName } from '../lib/BarLib';
import { findBarMasterGps } from '../lib/barMasterCoords';
import { openExternalMap } from '../lib/mapLinks';
import KakaoMapPreview from './KakaoMapPreview';
import { getDevTestLessons } from '../data/devTestLessons';
import { lessonMatchesVenue, partyMatchesVenue } from '../lib/partyVenueMatch';
import { supabase, logActivity } from '../lib/supabase';
import PartyLiveHybridBadge from './PartyLiveHybridBadge';
import { useBarStatsRealtime } from '../hooks/useBarStatsRealtime';
import { formatPartyMusicRatio } from '../pages/Social';
import PartyFeeChips from './PartyFeeChips';
import { formatPartyTitleDisplay, PARTY_TITLE_CARD_FONT_SIZE } from '../lib/partyTitleDisplay';
import { mergeVenueWithLocalExtras, resetOptionalColumnsCache } from '../lib/venueLocalExtras';
import { lessonPublisherBadge, stripLessonPublisherMeta } from '../lib/lessonPublisher';
import {
  expandPartyDatesInRange,
  isWeeklyRecurringParty,
  partyIsUpcomingOrRecurring,
  partyMatchesCalendarDate,
} from '../lib/partyRecurrence';

export { partyMatchesVenue } from '../lib/partyVenueMatch';

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

/** BAR 상세 — 사장님 공간: 홈 카드와 동일한 글꼴·색 계층 */
const VD = {
  brand: '#D4436E',
  brandSoft: '#C2185B',
  accent: '#E53935',
  ink: '#0F172A',
  title: '#111111',
  body: '#334155',
  muted: '#64748B',
  meta: '#757575',
  faint: '#94A3B8',
  border: '#F1F5F9',
  borderAccent: 'rgba(216, 27, 96, 0.14)',
  bgPage: '#FFFBFA',
  bgHeader: 'linear-gradient(180deg, #FFF8FA 0%, #FFFFFF 100%)',
  bgCard: '#FFFFFF',
  bgCalendar: '#FFFBF8',
  shadowCard: '0 4px 20px rgba(0, 0, 0, 0.06)',
  font: "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

const VD_GENRE_PILL = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 11px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #FFFBFC 0%, #FFF0F5 100%)',
  border: `1px solid ${VD.borderAccent}`,
  boxShadow: '0 1px 4px rgba(216, 27, 96, 0.08)',
};

const vdSectionLabel = (dateLabel, suffix) => (
  <p className="vd-section-label" style={{ margin: '0 0 12px' }}>
    <span className="vd-section-label__date">{dateLabel}</span>
    <span className="vd-section-label__sep"> · </span>
    <span className="vd-section-label__text">{suffix}</span>
  </p>
);

const vdChip = (label, tone = 'muted') => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 7px',
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 700,
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
      ...(tone === 'brand'
        ? {
            background: 'rgba(212, 67, 110, 0.08)',
            color: VD.brandSoft,
            border: `1px solid ${VD.borderAccent}`,
          }
        : {
            background: '#F8FAFC',
            color: VD.muted,
            border: `1px solid ${VD.border}`,
          }),
    }}
  >
    {label}
  </span>
);

const vdHintBox = (children, style = {}) => (
  <div
    style={{
      padding: '10px 12px',
      borderRadius: 10,
      border: `1px solid ${VD.border}`,
      background: '#fff',
      fontSize: 12,
      fontWeight: 600,
      color: VD.muted,
      lineHeight: 1.35,
      textAlign: 'center',
      ...style,
    }}
  >
    {children}
  </div>
);

/** 상세 설명: 약 3줄 분량 */
const VENUE_DESC_MAX = 120;

const GENRE_MAP = {
  바차타: { key: 'b_ratio', label: 'B' },
  살사: { key: 's_ratio', label: 'S' },
  쥬크: { key: 'j_ratio', label: 'J' },
  키좀바: { key: 'k_ratio', label: 'K' },
};

const normDate = (d) => (d ? String(d).slice(0, 10) : '');

const getKSTTodayStr = () => {
  const now = new Date();
  if (now.getHours() < 4) now.setDate(now.getDate() - 1);
  const kst = now.toLocaleString('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [m, d, y] = kst.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

const cleanTitle = (title) =>
  (title || '')
    .split(' ㅣ ')[0]
    .replace(/^\[.*?\]\s*/, '')
    .replace(/ㅣ\s*$/, '')
    .replace(/오늘밤빠/g, '')
    .trim();

const getGenreLabel = (item) => {
  const entries = Object.entries(GENRE_MAP).filter(([, info]) => (item[info.key] ?? 0) > 0);
  if (entries.length === 0) return '소셜';
  const sorted = [...entries].sort((a, b) => item[b[1].key] - item[a[1].key]);
  if (sorted.length >= 2 && item[sorted[0][1].key] === item[sorted[1][1].key]) {
    return `${sorted[0][0]} · ${sorted[1][0]}`;
  }
  return sorted[0][0];
};

const VenueAvatar = ({ venue, size = 40 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      border: `1.5px solid ${VD.borderAccent}`,
      flexShrink: 0,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    }}
  >
    {venue?.image_url ? (
      <img src={venue.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <img
        src="/logo.png"
        alt=""
        style={{ width: '70%', height: '70%', objectFit: 'contain', opacity: 0.9 }}
      />
    )}
  </div>
);

const VENUE_DETAIL_BODY_CLASS = 'venue-detail-open';

const GenreRatioPill = ({ tagLabel, item, showRatio = true }) => {
  const ratio = showRatio ? formatPartyMusicRatio(item) : null;
  return (
    <span style={VD_GENRE_PILL}>
      <span style={{ fontSize: 11, fontWeight: 800, color: VD.brandSoft, letterSpacing: '0.2px' }}>{tagLabel}</span>
      {ratio ? (
        <>
          <span
            aria-hidden
            style={{ width: 1, height: 10, background: 'rgba(216, 27, 96, 0.22)', borderRadius: 1, flexShrink: 0 }}
          />
          <span style={{ fontSize: 11, fontWeight: 800, color: VD.accent, letterSpacing: '0.02em' }}>{ratio}</span>
        </>
      ) : null}
    </span>
  );
};

const daysFromToday = (dateStr, todayStr) => {
  const a = normDate(dateStr);
  const b = normDate(todayStr);
  if (!a || !b) return 0;
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
};

/** D-day 칩: 오늘 · 내일 · D-n */
const getDateBadge = (selectedDate, todayStr) => {
  const diff = daysFromToday(selectedDate, todayStr);
  if (diff === 0) return { label: '오늘', tone: 'today' };
  if (diff === 1) return { label: '내일', tone: 'soon' };
  if (diff > 1 && diff <= 14) return { label: `D-${diff}`, tone: 'soon' };
  if (diff < 0) return { label: '지난 일정', tone: 'past' };
  return null;
};

/** description/title에서 파트너·레벨·DJ·게스트 태그 추출 (최대 3개) */
const extractPartyMetaTags = (party, isLesson) => {
  const description = isLesson ? stripLessonPublisherMeta(party.description) : party.description;
  const hay = `${party.title || ''} ${description || ''}`;
  const tags = [];
  const push = (key, label) => {
    if (!label || tags.some((t) => t.key === key)) return;
    tags.push({ key, label: String(label).trim().slice(0, 28) });
  };

  const partner = hay.match(/파트너\s*(필수|선택|불필요|있음|없음)/i);
  if (partner) push('partner', `파트너 ${partner[1]}`);

  if (isLesson && party.level) push('level', party.level);
  else {
    const level = hay.match(/(입문|초급|중급|중상|고급|센슈얼|인터미디엇)/);
    if (level) push('level', level[1]);
  }

  const dress = hay.match(/드레스\s*코드\s*[:：]?\s*([^\n·|,]{2,20})/i);
  if (dress) push('dress', `드레스 ${dress[1].trim()}`);
  else if (/캐주얼|스마트\s*캐주얼|포멀/i.test(hay)) {
    const m = hay.match(/(캐주얼|스마트\s*캐주얼|포멀)/i);
    if (m) push('dress', m[1]);
  }

  const dj = hay.match(/(?:DJ|디제이)\s*[:：]?\s*([^\n·|,]{2,24})/i);
  if (dj) push('dj', `DJ ${dj[1].trim()}`);

  const guest = hay.match(/\bWith\s+([^\n·|,]{2,28})/i);
  if (guest) push('guest', guest[1].trim());

  return tags.slice(0, 3);
};

/** 행사 전용 부제 — 매장 공통 설명(venue)과 중복 제거 */
const getFeaturedCardSubtitle = (party, isLesson, venueDesc) => {
  const venueNorm = String(venueDesc || '').replace(/\s+/g, ' ').trim();
  let desc = (isLesson
    ? stripLessonPublisherMeta(party.description)
    : String(party.description || '')
  ).replace(/\s+/g, ' ').trim();

  if (desc && venueNorm) {
    if (desc === venueNorm) desc = '';
    else if (desc.includes(venueNorm)) desc = desc.replace(venueNorm, '').replace(/\s*·\s*/g, ' · ').trim();
  }

  const tagLabels = new Set(extractPartyMetaTags(party, isLesson).map((t) => t.label.toLowerCase()));
  if (desc) {
    const stripped = desc
      .split('·')
      .map((s) => s.trim())
      .filter((seg) => seg && ![...tagLabels].some((tl) => seg.toLowerCase().includes(tl) || tl.includes(seg.toLowerCase())))
      .join(' · ');
    if (stripped) {
      const max = 52;
      return stripped.length > max ? `${stripped.slice(0, max)}…` : stripped;
    }
  }

  if (isLesson) {
    const line = [party.instructor_name || party.instructor, party.day_of_week]
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .join(' · ');
    if (line) return line;
  }

  const raw = String(party.time || '').trim();
  if (raw.includes('-')) {
    const [start, end] = raw.split('-').map((t) => t.trim());
    if (start && end) return `${start} – ${end}`;
  }

  return null;
};

/** 세로형 히어로 카드 — 포스터 크게, 정보는 아래 */
const FeaturedPartyCard = ({
  party,
  onOpenPoster,
  isLesson = false,
  selectedDate,
  todayStr,
  venueDescription = '',
  liveCount = 0,
  clickCount = 0,
}) => {
  const title = formatPartyTitleDisplay(party.title);
  const dateBadge = selectedDate && todayStr ? getDateBadge(selectedDate, todayStr) : null;
  const metaTags = extractPartyMetaTags(party, isLesson);
  const subtitle = getFeaturedCardSubtitle(party, isLesson, venueDescription);
  const time = isLesson
    ? [party.day_of_week, party.start_time?.slice(0, 5) || party.time?.split('-')[0]?.trim()]
        .filter(Boolean)
        .join(' · ') || '—'
    : party.time?.split('-')[0]?.trim() || '—';
  const tagLabel = isLesson
    ? [party.level, party.genre || getGenreLabel(party)].filter(Boolean).join(' · ') || '수업'
    : getGenreLabel(party);
  const lessonGenre = String(party.genre || '').trim();
  const lessonLevel = String(party.level || '').trim();
  const lessonDay = String(party.day_of_week || '').trim();
  const lessonTime = [party.start_time?.slice(0, 5), party.end_time?.slice(0, 5)].filter(Boolean).join(' - ');

  return (
    <motion.div layout className={`vd-featured-card${isLesson ? ' vd-featured-card--lesson' : ''}`}>
      <button
        type="button"
        className="vd-featured-card__poster"
        onClick={(e) => {
          e.stopPropagation();
          onOpenPoster?.(party);
        }}
        aria-label="포스터 크게 보기"
        style={{ cursor: party.poster_url ? 'pointer' : 'default' }}
      >
        {party.poster_url ? (
          <img src={party.poster_url} alt="" className="vd-featured-card__poster-img" />
        ) : (
          <div className="vd-featured-card__poster-empty">포스터</div>
        )}
        {party.poster_url ? <span className="vd-featured-card__poster-hint">탭 · 크게 보기</span> : null}
      </button>

      <div className={`vd-featured-card__body${isLesson ? ' vd-featured-card__body--lesson' : ''}`}>
        <GenreRatioPill tagLabel={tagLabel} item={party} showRatio={!isLesson} />
        <div className="vd-card-title-row">
          <h3 className="vd-card-title">{title}</h3>
          {dateBadge ? (
            <span className="vd-date-badge" data-tone={dateBadge.tone}>
              {dateBadge.label}
            </span>
          ) : null}
        </div>
        {metaTags.length > 0 ? (
          <div className="vd-card-tags" role="list">
            {metaTags.map((t) => (
              <span key={t.key} className="vd-card-tag" data-kind={t.key} role="listitem">
                {t.label}
              </span>
            ))}
          </div>
        ) : null}
        {subtitle ? <p className="vd-card-subtitle">{subtitle}</p> : null}
        {isLesson ? (
          <div className="vd-lesson-info-grid" role="list">
            <div className="vd-lesson-info-chip" role="listitem">
              <span className="vd-lesson-info-chip__label">요일</span>
              <strong className="vd-lesson-info-chip__value">{lessonDay || '미정'}</strong>
            </div>
            <div className="vd-lesson-info-chip" role="listitem">
              <span className="vd-lesson-info-chip__label">시간</span>
              <strong className="vd-lesson-info-chip__value">{lessonTime || '미정'}</strong>
            </div>
            <div className="vd-lesson-info-chip" role="listitem">
              <span className="vd-lesson-info-chip__label">레벨</span>
              <strong className="vd-lesson-info-chip__value">{lessonLevel || '전체'}</strong>
            </div>
            <div className="vd-lesson-info-chip" role="listitem">
              <span className="vd-lesson-info-chip__label">장르</span>
              <strong className="vd-lesson-info-chip__value">{lessonGenre || '소셜'}</strong>
            </div>
          </div>
        ) : null}
        <div className="vd-featured-card__footer">
          <div className="vd-card-footer-meta">
            <span className="vd-card-time">
              <Clock size={14} color={VD.meta} style={{ flexShrink: 0 }} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
            </span>
            <PartyFeeChips fee={party.fee} style={{ flex: 1, minWidth: 0 }} />
          </div>
          {!isLesson ? <PartyLiveHybridBadge liveCount={liveCount} clickCount={clickCount} /> : null}
        </div>
      </div>
    </motion.div>
  );
};

const isPersistedVenueId = (id) => id && !String(id).startsWith('bar-');

const LESSON_DAY_MAP = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

const parseDateParts = (dateStr) => {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDateParts = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseLessonWeekdays = (dayOfWeek) => {
  if (!dayOfWeek) return [];
  const tokens = String(dayOfWeek).split(/[,/·|\s]+/).map((t) => t.trim()).filter(Boolean);
  const days = new Set();
  tokens.forEach((tok) => {
    const key = tok.replace(/요일/g, '').slice(0, 1);
    if (key in LESSON_DAY_MAP) days.add(LESSON_DAY_MAP[key]);
  });
  return Array.from(days);
};

/** 오늘(또는 fromDate) 이후 가장 가까운 수업 날짜 */
const getNextLessonOccurrence = (lesson, fromDateStr) => {
  const from = normDate(fromDateStr);
  const start = normDate(lesson.start_date);
  const weekdays = parseLessonWeekdays(lesson.day_of_week);

  if (weekdays.length === 0) {
    if (start && start >= from) return start;
    return start || null;
  }

  const base = parseDateParts(from);
  for (let i = 0; i < 84; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const full = formatDateParts(d);
    if (start && full < start) continue;
    if (weekdays.includes(d.getDay())) return full;
  }
  return start && start >= from ? start : null;
};

const lessonOccursOnDate = (lesson, dateStr) => {
  const d = normDate(dateStr);
  if (!d) return false;
  if (normDate(lesson.start_date) === d) return true;
  const weekdays = parseLessonWeekdays(lesson.day_of_week);
  if (!weekdays.length) return false;
  const start = normDate(lesson.start_date);
  if (start && d < start) return false;
  return weekdays.includes(parseDateParts(d).getDay());
};

const collectLessonCalendarDates = (lesson, fromDateStr, weeks = 10) => {
  const dates = new Set();
  const start = normDate(lesson.start_date) || fromDateStr;
  const weekdays = parseLessonWeekdays(lesson.day_of_week);
  if (!weekdays.length) {
    if (start) dates.add(start);
    const next = getNextLessonOccurrence(lesson, fromDateStr);
    if (next) dates.add(next);
    return dates;
  }
  const base = parseDateParts(fromDateStr);
  const totalDays = weeks * 7;
  for (let i = 0; i < totalDays; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const full = formatDateParts(d);
    if (start && full < start) continue;
    if (weekdays.includes(d.getDay())) dates.add(full);
  }
  return dates;
};

const formatLessonShortDate = (dateStr) => {
  if (!dateStr) return '';
  const d = parseDateParts(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatLessonDateWithDow = (dateStr) => {
  if (!dateStr) return '';
  const d = parseDateParts(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_KOR[d.getDay()]})`;
};

const addDaysToDateStr = (dateStr, days) => {
  const d = parseDateParts(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateParts(d);
};

const lessonToCardItem = (lesson, todayStr) => {
  const nextOccurrenceDate = getNextLessonOccurrence(lesson, todayStr);
  return {
    ...lesson,
    date: nextOccurrenceDate || normDate(lesson.start_date) || lesson.date,
    nextOccurrenceDate,
    time: [lesson.start_time, lesson.end_time].filter(Boolean).join('-') || lesson.time,
    locationName: lesson.studio_name,
  };
};

const normalizeInstagramUrl = (raw) => {
  const v = String(raw || '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

const pickCoord = (...values) => {
  for (const value of values) {
    if (value == null || value === '') continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const resolveVenueMapTarget = (venue, master, displayAddress, displayName) => {
  const lat = pickCoord(venue?.latitude, master?.latitude);
  const lng = pickCoord(venue?.longitude, master?.longitude);
  if (lat != null && lng != null) {
    return { lat, lng, query: displayAddress || displayName || '' };
  }
  const gps = findBarMasterGps(venue?.name || master?.name, displayAddress);
  if (gps) {
    return { lat: gps.lat, lng: gps.lon, query: displayAddress || displayName || '' };
  }
  return {
    lat: null,
    lng: null,
    query: displayAddress || displayName || '',
  };
};

const VenueHeaderChips = ({ mode, onModeChange, instagramUrl }) => {
  const openRental = () => {
    const href = normalizeInstagramUrl(instagramUrl);
    if (!href) {
      alert('인스타그램 링크가 아직 등록되지 않았습니다.');
      return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const chips = [
    { id: 'social', label: '소셜', kind: 'tab' },
    { id: 'lesson', label: '수업', kind: 'tab' },
    { id: 'rental', label: '대관', kind: 'action' },
  ];

  return (
    <div className="vd-header-chips">
      {chips.map(({ id, label, kind }) => {
        const isTab = kind === 'tab';
        const active = isTab && mode === id;
        const onClick = () => {
          if (kind === 'tab') onModeChange(id);
          else openRental();
        };
        return (
          <button
            key={id}
            type="button"
            className="vd-header-chip"
            data-active={active ? 'true' : undefined}
            data-kind={kind}
            onClick={onClick}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default function VenueDetailModal({
  venue,
  parties = [],
  lessons = [],
  onClose,
  onOpenPoster,
  onVenueUpdated,
  onRegisterVenueLesson,
}) {
  const todayStr = getKSTTodayStr();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return { year: y, month: m };
  });
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const scrollRef = useRef(null);
  const [venueDescription, setVenueDescription] = useState('');
  const [detailTab, setDetailTab] = useState('social');
  const [fetchedLessons, setFetchedLessons] = useState([]);
  const [venueFavorited, setVenueFavorited] = useState(false);
  const { stats: venueBarStats } = useBarStatsRealtime(venue);

  const displayVenue = useMemo(() => mergeVenueWithLocalExtras(venue), [venue]);

  useEffect(() => {
    resetOptionalColumnsCache();
  }, [venue?.id]);

  useEffect(() => {
    const merged = mergeVenueWithLocalExtras(venue);
    setVenueDescription((merged?.description || '').slice(0, VENUE_DESC_MAX));
    setDetailTab('social');
  }, [venue?.id, venue?.name, venue?.description]);

  const [lessonsRefreshKey, setLessonsRefreshKey] = useState(0);

  useEffect(() => {
    const onRefresh = () => setLessonsRefreshKey((k) => k + 1);
    window.addEventListener('bchata-lessons-refresh', onRefresh);
    return () => window.removeEventListener('bchata-lessons-refresh', onRefresh);
  }, []);

  useEffect(() => {
    if (!venue?.name) return;
    logActivity('venue_detail_view', {
      target_id: isPersistedVenueId(venue.id) ? venue.id : null,
      bar_name: venue.name,
      region: venue.region,
    });
    window.dispatchEvent(new CustomEvent('bchata-venue-view', { detail: { venue } }));
  }, [venue?.id, venue?.name, venue?.region]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('classes_info')
          .select('*')
          .eq('status', 'approved');
        if (cancelled) return;
        if (error) {
          console.warn('[VenueDetailModal] classes_info:', error.message);
          return;
        }
        setFetchedLessons(data || []);
      } catch (err) {
        console.warn('[VenueDetailModal] classes_info fetch failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonsRefreshKey]);

  const allLessons = useMemo(() => {
    const base = lessons?.length ? lessons : fetchedLessons;
    if (!import.meta.env.DEV) return base;
    const devRows = getDevTestLessons(todayStr);
    const ids = new Set(base.map((r) => r.id));
    return [...base, ...devRows.filter((r) => !ids.has(r.id))];
  }, [lessons, fetchedLessons, todayStr]);

  const [todayYear, todayMonth, todayDay] = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    return [y, m, d];
  }, [todayStr]);

  /** 지난 행사·4월 등 — 캘린더·일정에서 제외 (오늘 이후만) */
  const venueParties = useMemo(() => {
    return (parties || [])
      .filter((p) => partyMatchesVenue(p, venue))
      .filter((p) => partyIsUpcomingOrRecurring(p, todayStr))
      .sort((a, b) => {
        const da = normDate(a.date) || `9-${a.day_of_week || ''}`;
        const db = normDate(b.date) || `9-${b.day_of_week || ''}`;
        return da.localeCompare(db);
      });
  }, [parties, venue, todayStr]);

  const venueLessons = useMemo(() => {
    return (allLessons || [])
      .filter((l) => lessonMatchesVenue(l, venue))
      .map((l) => lessonToCardItem(l, todayStr))
      .sort((a, b) => normDate(a.nextOccurrenceDate || a.date).localeCompare(normDate(b.nextOccurrenceDate || b.date)));
  }, [allLessons, venue, todayStr]);

  const isSocialTab = detailTab === 'social';

  const venueLessonsForDisplay = useMemo(() => venueLessons, [venueLessons]);

  const pickInitialSelectedDate = useCallback(() => todayStr, [todayStr]);

  const activeItems = isSocialTab ? venueParties : venueLessonsForDisplay;

  const datesWithEvents = useMemo(() => {
    const set = new Set();
    if (isSocialTab) {
      activeItems.forEach((p) => {
        if (isWeeklyRecurringParty(p)) {
          expandPartyDatesInRange(p, todayStr, addDaysToDateStr(todayStr, 56)).forEach((d) => set.add(d));
        } else {
          const d = normDate(p.date);
          if (d && d >= todayStr) set.add(d);
        }
      });
    } else {
      venueLessonsForDisplay.forEach((lesson) => {
        collectLessonCalendarDates(lesson, todayStr, 8).forEach((d) => {
          if (d >= todayStr) set.add(d);
        });
      });
    }
    return set;
  }, [activeItems, isSocialTab, venueLessonsForDisplay, todayStr]);

  const canGoPrevCalendarMonth = useMemo(() => {
    const { year, month } = calendarMonth;
    return year > todayYear || (year === todayYear && month > todayMonth);
  }, [calendarMonth, todayYear, todayMonth]);

  useEffect(() => {
    const { year, month } = calendarMonth;
    if (year < todayYear || (year === todayYear && month < todayMonth)) {
      setCalendarMonth({ year: todayYear, month: todayMonth });
    }
  }, [calendarMonth, todayYear, todayMonth]);

  useEffect(() => {
    if (selectedDate < todayStr) setSelectedDate(pickInitialSelectedDate());
  }, [selectedDate, todayStr, pickInitialSelectedDate]);

  useEffect(() => {
    const d = pickInitialSelectedDate();
    setSelectedDate(d);
    const [y, m] = d.split('-').map(Number);
    setCalendarMonth({ year: y, month: m });
  }, [venue?.id, venue?.name, detailTab, pickInitialSelectedDate]);

  useEffect(() => {
    document.body.classList.add(VENUE_DETAIL_BODY_CLASS);
    return () => {
      document.body.classList.remove(VENUE_DETAIL_BODY_CLASS);
    };
  }, []);

  const dayItems = useMemo(() => {
    if (isSocialTab) return activeItems.filter((p) => partyMatchesCalendarDate(p, selectedDate));
    return activeItems.filter((l) => lessonOccursOnDate(l, selectedDate));
  }, [activeItems, selectedDate, isSocialTab]);

  /** 캘린더에서 고른 날짜의 대표 포스터 (상세 설명과 별개) */
  const featuredItem = dayItems[0] || null;

  const schedulePosters = useMemo(() => {
    if (!isSocialTab) {
      const entries = [];
      venueLessonsForDisplay.forEach((l) => {
        const dates = collectLessonCalendarDates(l, todayStr, 8);
        dates.forEach((date) => {
          if (date >= todayStr) entries.push({ date, party: l });
        });
      });
      if (entries.length === 0) {
        return venueLessonsForDisplay
          .map((l) => ({ date: normDate(l.nextOccurrenceDate || l.date), party: l }))
          .filter(({ date }) => date && date >= todayStr)
          .sort((a, b) => a.date.localeCompare(b.date));
      }
      const byDate = new Map();
      entries
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach(({ date, party }) => {
          const prev = byDate.get(date);
          if (!prev || (party.poster_url && !prev.poster_url)) byDate.set(date, party);
        });
      return [...byDate.entries()].map(([date, party]) => ({ date, party }));
    }
    const byDate = new Map();
    activeItems.forEach((p) => {
      if (isWeeklyRecurringParty(p)) {
        expandPartyDatesInRange(p, todayStr, addDaysToDateStr(todayStr, 56)).forEach((d) => {
          const prev = byDate.get(d);
          if (!prev || (p.poster_url && !prev.poster_url)) byDate.set(d, p);
        });
        return;
      }
      const d = normDate(p.date);
      if (!d || d < todayStr) return;
      const prev = byDate.get(d);
      if (!prev || (p.poster_url && !prev.poster_url)) byDate.set(d, p);
    });
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, party]) => ({ date, party }));
  }, [activeItems, isSocialTab, venueLessonsForDisplay, todayStr]);

  const weekEndStr = useMemo(() => addDaysToDateStr(todayStr, 6), [todayStr]);

  const weekSchedulePosters = useMemo(
    () => schedulePosters.filter(({ date }) => date >= todayStr && date <= weekEndStr),
    [schedulePosters, todayStr, weekEndStr],
  );

  const master = findBarByName(venue?.name);
  const displayName = venue?.name || master?.name || '제휴 BAR';
  const displayAddress = venue?.address || master?.address || '';
  const mapTarget = useMemo(
    () => resolveVenueMapTarget(displayVenue, master, displayAddress, displayName),
    [displayVenue, master, displayAddress, displayName],
  );

  const openVenueMap = useCallback(() => {
    openExternalMap(mapTarget);
  }, [mapTarget]);

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const isCurrentMonth = year === todayYear && month === todayMonth;
    const startDayNum = isCurrentMonth ? todayDay : 1;
    const lastDate = new Date(year, month, 0).getDate();
    const firstWeekday = new Date(year, month - 1, startDayNum).getDay();
    const days = [];
    for (let i = 0; i < firstWeekday; i++) days.push({ empty: true, key: `e-${i}` });
    for (let d = startDayNum; d <= lastDate; d++) {
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ empty: false, date: d, fullDate, key: fullDate });
    }
    return days;
  }, [calendarMonth, todayYear, todayMonth, todayDay]);

  return (
    <AnimatePresence>
      <motion.div
        className="venue-detail-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ zIndex: Z.modalBackdrop }}
      >
        <div
          className="venue-detail-modal__frame"
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: VD.font,
            background: VD.bgPage,
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
        {/* 헤더 + 지도 */}
        <header className="vd-shell-header">
          <div className="vd-topbar">
            <button type="button" className="vd-icon-btn" onClick={onClose} aria-label="뒤로">
              <ChevronLeft size={22} aria-hidden />
            </button>
            <span className="vd-topbar-label">BAR</span>
            <button type="button" className="vd-icon-btn" onClick={onClose} aria-label="닫기">
              <X size={20} aria-hidden />
            </button>
          </div>

          <div className="vd-venue-row">
            <VenueAvatar venue={venue} size={48} />
            <div className="vd-venue-copy">
              <h1 className="vd-header-name">{displayName}</h1>
              {displayAddress ? (
                <p className="vd-venue-address">{displayAddress}</p>
              ) : null}
            </div>
          </div>

          <div className="vd-header-chips-wrap">
            <VenueHeaderChips
              mode={detailTab}
              onModeChange={setDetailTab}
              instagramUrl={displayVenue?.instagram_url}
            />
          </div>
        </header>

        <KakaoMapPreview
          lat={mapTarget.lat}
          lng={mapTarget.lng}
          address={mapTarget.query}
          label={displayName}
          onOpenExternal={openVenueMap}
        />

        {!isSocialTab && onRegisterVenueLesson ? (
          <div
            style={{
              flexShrink: 0,
              padding: '6px 16px 8px',
              borderBottom: `1px solid ${VD.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => onRegisterVenueLesson(displayVenue)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: `1px solid ${VD.borderAccent}`,
                background: '#fff',
                color: VD.brandSoft,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                lineHeight: 1.2,
              }}
            >
              BAR 수업 등록
            </button>
          </div>
        ) : null}

        {/* 상단: 달력 (펼치기/접기) */}
        <div
          className="vd-cal-wrap"
          style={{
            flexShrink: 0,
            padding: calendarExpanded ? '12px 16px 10px' : '8px 16px',
            borderBottom: `1px solid ${VD.border}`,
            background: VD.bgCalendar,
          }}
        >
          <div className="vd-cal-toolbar">
            <div className="vd-cal-toolbar__left">
              <span className="vd-cal-month">{calendarMonth.month}월</span>
              {!calendarExpanded ? (
                <span className="vd-cal-collapsed-date">
                  {formatLessonDateWithDow(selectedDate)}
                  {datesWithEvents.has(selectedDate) ? <span className="vd-cal-collapsed-dot" aria-hidden /> : null}
                </span>
              ) : null}
            </div>
            <div className="vd-cal-toolbar__actions">
              {calendarExpanded ? (
                <>
                  <button
                    type="button"
                    disabled={!canGoPrevCalendarMonth}
                    onClick={() => {
                      if (!canGoPrevCalendarMonth) return;
                      setCalendarMonth((m) => {
                        const nm = m.month > 1 ? m.month - 1 : 12;
                        const ny = m.month > 1 ? m.year : m.year - 1;
                        return { year: ny, month: nm };
                      });
                    }}
                    className="vd-cal-nav-btn"
                    style={{ opacity: canGoPrevCalendarMonth ? 1 : 0.35, cursor: canGoPrevCalendarMonth ? 'pointer' : 'not-allowed' }}
                    aria-label="이전 달"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((m) => {
                      const nm = m.month < 12 ? m.month + 1 : 1;
                      const ny = m.month < 12 ? m.year : m.year + 1;
                      return { year: ny, month: nm };
                    })}
                    className="vd-cal-nav-btn"
                    aria-label="다음 달"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="vd-cal-toggle"
                onClick={() => setCalendarExpanded((v) => !v)}
                aria-expanded={calendarExpanded}
                aria-label={calendarExpanded ? '달력 접기' : '달력 펼치기'}
              >
                <span>{calendarExpanded ? '접기' : '펼치기'}</span>
                <ChevronDown size={16} className="vd-cal-toggle__icon" data-expanded={calendarExpanded ? 'true' : undefined} />
              </button>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {calendarExpanded ? (
              <motion.div
                key="vd-cal-grid"
                className="vd-cal-grid-wrap"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', paddingTop: 10 }}>
                  {DAYS_KOR.map((d) => (
                    <div key={d} className="vd-cal-dow" data-sunday={d === '일' ? 'true' : undefined}>{d}</div>
                  ))}
                  {calendarDays.map((day) => {
                    if (day.empty) return <div key={day.key} />;
                    const isSelected = selectedDate === day.fullDate;
                    const hasEvent = datesWithEvents.has(day.fullDate);
                    return (
                      <button key={day.key} type="button" onClick={() => setSelectedDate(day.fullDate)} style={{ border: 'none', background: isSelected ? VD.brand : hasEvent ? 'rgba(212, 67, 110, 0.08)' : 'transparent', borderRadius: 10, padding: '6px 0', cursor: 'pointer' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#fff' : hasEvent ? VD.brand : VD.title }}>{day.date}</div>
                        <div style={{ height: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{hasEvent && <span className="vd-cal-dot" data-selected={isSelected ? 'true' : undefined} />}</div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* 본문: 이 날의 파티 → 이번 주 일정 */}
        <motion.div
          ref={scrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '20px 16px max(24px, env(safe-area-inset-bottom))',
            background: VD.bgPage,
          }}
        >
          {vdSectionLabel(formatLessonShortDate(selectedDate), isSocialTab ? '이 날의 파티' : '이 날의 수업')}
          {featuredItem ? (
            <FeaturedPartyCard
              party={featuredItem}
              onOpenPoster={onOpenPoster}
              isLesson={!isSocialTab}
              selectedDate={selectedDate}
              todayStr={todayStr}
              venueDescription={venueDescription}
              liveCount={venueBarStats.liveCount}
              clickCount={venueBarStats.clickCount}
            />
          ) : (
            vdHintBox(
              isSocialTab ? '이 날 파티 없음' : '이 날 수업 없음',
              { margin: '4px 0 10px' },
            )
          )}

          {featuredItem && dayItems.length > 1 && (
            <div style={{ marginTop: 12, marginBottom: 4 }}>
              <p className="vd-block-title" style={{ margin: '0 0 8px' }}>
                {isSocialTab ? '같은 날 다른 행사' : '같은 날 다른 수업'}
              </p>
              {dayItems.slice(1).map((p) => {
                const pubBadge = !isSocialTab ? lessonPublisherBadge(p, displayName) : null;
                return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenPoster?.(p)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    marginBottom: 6,
                    borderRadius: 12,
                    border: `1px solid ${VD.borderAccent}`,
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                    color: VD.body,
                  }}
                >
                  {pubBadge ? (
                    <span
                      style={{
                        display: 'inline-block',
                        marginRight: 6,
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 800,
                        background: 'rgba(212, 67, 110, 0.12)',
                        color: VD.brandSoft,
                      }}
                    >
                      {pubBadge.ko}
                    </span>
                  ) : null}
                  {formatPartyTitleDisplay(p.title)} · {p.time?.split('-')[0]?.trim()}
                </button>
              );
              })}
            </div>
          )}

          {(isSocialTab ? weekSchedulePosters.length > 0 : true) && (
            <div className="vd-week-section">
              <p className="vd-block-title vd-week-section__title">
                {isSocialTab ? '이번 주' : '수업 일정'}
              </p>
              {!isSocialTab && weekSchedulePosters.length === 0 ? (
                vdHintBox('일정 없음 · 상단 등록')
              ) : (
                <div className="vd-schedule-row">
                  {weekSchedulePosters.map(({ date, party: p }) => (
                    <button
                      key={`${p.id}-${date}`}
                      type="button"
                      className="vd-schedule-thumb"
                      data-selected={selectedDate === date ? 'true' : undefined}
                      onClick={() => setSelectedDate(date)}
                    >
                      {p.poster_url ? (
                        <img src={p.poster_url} alt="" className="vd-schedule-thumb__img" />
                      ) : (
                        <div className="vd-schedule-thumb__placeholder" />
                      )}
                      <span className="vd-schedule-thumb__date">{formatLessonShortDate(date)}</span>
                    </button>
                  ))}
                </div>
              )}
              {import.meta.env.DEV && !isSocialTab && venueLessonsForDisplay.some((l) => String(l.id).startsWith('dev-lesson-')) && (
                <p style={{ margin: '8px 0 0', fontSize: 10, color: VD.faint, fontWeight: 600 }}>
                  로컬 테스트 수업 (devTestLessons.js)
                </p>
              )}
            </div>
          )}
        </motion.div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
