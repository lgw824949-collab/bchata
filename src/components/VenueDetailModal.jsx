import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../constants/zLayers';
import { X, ChevronLeft, ChevronRight, Clock, MessageCircle, Globe, Loader2 } from 'lucide-react';
import { findBarByName } from '../lib/BarLib';
import { getDevTestLessons } from '../data/devTestLessons';
import { lessonMatchesVenue, partyMatchesVenue } from '../lib/partyVenueMatch';
import { supabase, logActivity } from '../lib/supabase';
import PartyLiveHybridBadge from './PartyLiveHybridBadge';
import { useBarStatsRealtime } from '../hooks/useBarStatsRealtime';
import { formatPartyMusicRatio } from '../pages/Social';
import { formatPartyFeeDisplay } from '../lib/partyFeeDisplay';

export { partyMatchesVenue } from '../lib/partyVenueMatch';

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

/** BAR 상세 — 홈 브랜드(핑크·골드) 톤 */
const VD = {
  brand: '#D4436E',
  accent: '#E53935',
  gold: '#C9A84C',
  title: '#1A1A1A',
  body: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  border: '#F1F5F9',
  borderAccent: '#FECDD3',
  bgPage: '#FFFBFA',
  bgHeader: 'linear-gradient(180deg, #FFF8FA 0%, #FFFFFF 100%)',
  bgCard: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 100%)',
  bgCalendar: '#FFFBF8',
  shadowCard: '0 8px 24px rgba(212, 67, 110, 0.12)',
};

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
const VENUE_DETAIL_NAV_HIDDEN_CLASS = 'venue-detail-nav-hidden';

/** b_ratio 등 가중치(0~10) → B4:S2. %는 표시하지 않음 */
const RatioBar = ({ item, compact }) => {
  const text = formatPartyMusicRatio(item);
  if (!text) return null;
  return (
    <p
      style={{
        margin: compact ? '4px 0 0' : '8px 0 0',
        fontSize: '12px',
        fontWeight: 800,
        color: VD.brand,
        lineHeight: 1.3,
        letterSpacing: '0.02em',
      }}
    >
      {text}
    </p>
  );
};

/** 홈 소셜 카드와 같은 톤 — 세로 포스터는 좌측 고정폭 + cover (레터박스 없음) */
const FeaturedPartyCard = ({
  party,
  onOpenPoster,
  isLesson = false,
  displayDate,
  liveCount = 0,
  clickCount = 0,
}) => {
  const title = cleanTitle(party.title);
  const time = isLesson
    ? [party.day_of_week, party.start_time?.slice(0, 5) || party.time?.split('-')[0]?.trim()]
        .filter(Boolean)
        .join(' · ') || '—'
    : party.time?.split('-')[0]?.trim() || '—';
  const fee = formatPartyFeeDisplay(party.fee, { fallback: '—' });
  const feeLabel = isLesson ? '수강' : '입장';
  const tagLabel = isLesson
    ? [party.level, party.genre || getGenreLabel(party)].filter(Boolean).join(' · ') || '수업'
    : getGenreLabel(party);

  return (
    <motion.div
      layout
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        height: 162,
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${VD.borderAccent}`,
        boxShadow: VD.shadowCard,
        background: '#fff',
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenPoster?.(party);
        }}
        aria-label="포스터 크게 보기"
        style={{
          position: 'relative',
          width: 118,
          flexShrink: 0,
          padding: 0,
          border: 'none',
          background: '#1a1a2e',
          cursor: party.poster_url ? 'pointer' : 'default',
        }}
      >
        {party.poster_url ? (
          <img
            src={party.poster_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            포스터
          </div>
        )}
        {party.poster_url && (
          <span
            style={{
              position: 'absolute',
              left: 6,
              right: 6,
              bottom: 6,
              padding: '4px 0',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.45)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.2,
            }}
          >
            탭 · 크게 보기
          </span>
        )}
      </button>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: '14px 16px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: VD.bgCard,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#fff',
              background: `linear-gradient(135deg, ${VD.brand} 0%, ${VD.accent} 100%)`,
              padding: '4px 10px',
              borderRadius: 8,
              letterSpacing: 0.2,
            }}
          >
            {tagLabel}
          </span>
          <div
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: 900,
              color: VD.title,
              lineHeight: 1.3,
              letterSpacing: '-0.4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          {displayDate && (
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: VD.brand }}>
              {formatLessonShortDate(displayDate)}
              {isLesson ? ' 수업' : ' 행사'}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 10,
            marginTop: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap',
              gap: 8,
              fontSize: 14,
              lineHeight: 1.2,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: VD.muted, fontWeight: 700, flexShrink: 0 }}>
              <Clock size={14} color={VD.muted} style={{ flexShrink: 0 }} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
            </span>
            <span style={{ color: VD.faint, fontWeight: 700, flexShrink: 0 }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ color: VD.faint, fontWeight: 700 }}>{feeLabel}</span>
              <span style={{ color: VD.accent, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fee}</span>
            </span>
          </div>
            <RatioBar item={party} compact />
          </div>
          {!isLesson ? (
            <PartyLiveHybridBadge liveCount={liveCount} clickCount={clickCount} />
          ) : null}
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

const lessonToCardItem = (lesson, todayStr) => {
  const g = String(lesson.genre || '');
  const nextOccurrenceDate = getNextLessonOccurrence(lesson, todayStr);
  return {
    ...lesson,
    date: nextOccurrenceDate || normDate(lesson.start_date) || lesson.date,
    nextOccurrenceDate,
    time: [lesson.start_time, lesson.end_time].filter(Boolean).join('-') || lesson.time,
    locationName: lesson.studio_name,
    b_ratio: g.includes('바차타') ? 1 : 0,
    s_ratio: g.includes('살사') ? 1 : 0,
    j_ratio: g.includes('쥬크') ? 1 : 0,
    k_ratio: g.includes('키좀') ? 1 : 0,
  };
};

const VenueModeTabs = ({ mode, onChange }) => (
  <div
    style={{
      display: 'flex',
      gap: 6,
      marginTop: 8,
      padding: 3,
      borderRadius: 10,
      background: 'rgba(212, 67, 110, 0.08)',
      border: `1px solid ${VD.borderAccent}`,
    }}
  >
    {[
      { id: 'social', label: '소셜' },
      { id: 'lesson', label: '수업' },
    ].map(({ id, label }) => {
      const active = mode === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 8,
            border: 'none',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            background: active ? '#fff' : 'transparent',
            color: active ? VD.brand : VD.muted,
            boxShadow: active ? '0 1px 4px rgba(212, 67, 110, 0.2)' : 'none',
          }}
        >
          {label}
        </button>
      );
    })}
  </div>
);

export default function VenueDetailModal({
  venue,
  parties = [],
  lessons = [],
  onClose,
  onOpenPoster,
  onVenueUpdated,
}) {
  const todayStr = getKSTTodayStr();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return { year: y, month: m };
  });
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [navHidden, setNavHidden] = useState(false);
  const scrollRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const [showLinkRegister, setShowLinkRegister] = useState(false);
  const [linkForm, setLinkForm] = useState({ kakao_url: '', instagram_url: '' });
  const [venueDescription, setVenueDescription] = useState('');
  const [savingLinks, setSavingLinks] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [detailTab, setDetailTab] = useState('social');
  const [fetchedLessons, setFetchedLessons] = useState([]);
  const [venueFavorited, setVenueFavorited] = useState(false);
  const { stats: venueBarStats } = useBarStatsRealtime(venue);

  const hasBothVenueLinks = Boolean(
    venue?.kakao_url?.trim() && venue?.instagram_url?.trim()
  );

  useEffect(() => {
    setLinkForm({
      kakao_url: venue?.kakao_url || '',
      instagram_url: venue?.instagram_url || '',
    });
    setVenueDescription((venue?.description || '').slice(0, VENUE_DESC_MAX));
    setShowLinkRegister(false);
    setDetailTab('social');
  }, [venue?.id, venue?.kakao_url, venue?.instagram_url, venue?.description]);

  /** 강남턴·라틴 — 수업 탭 스케줄 비표시 (데이터 삭제·운영 정책) */
  const isLessonsSuppressedVenue = useMemo(() => {
    const n = String(venue?.name || '').trim();
    return n === '라틴' || n.includes('강남턴') || n === '강턴';
  }, [venue?.name]);

  const handleDetailTabChange = useCallback((tab) => {
    setDetailTab(tab);
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
  }, []);

  const allLessons = useMemo(() => {
    const base = lessons?.length ? lessons : fetchedLessons;
    if (!import.meta.env.DEV) return base;
    const devRows = getDevTestLessons(todayStr);
    const ids = new Set(base.map((r) => r.id));
    return [...base, ...devRows.filter((r) => !ids.has(r.id))];
  }, [lessons, fetchedLessons, todayStr]);

  const venueParties = useMemo(() => {
    return (parties || [])
      .filter((p) => partyMatchesVenue(p, venue))
      .sort((a, b) => normDate(a.date).localeCompare(normDate(b.date)));
  }, [parties, venue]);

  const venueLessons = useMemo(() => {
    return (allLessons || [])
      .filter((l) => lessonMatchesVenue(l, venue))
      .map((l) => lessonToCardItem(l, todayStr))
      .sort((a, b) => normDate(a.nextOccurrenceDate || a.date).localeCompare(normDate(b.nextOccurrenceDate || b.date)));
  }, [allLessons, venue, todayStr]);

  const isSocialTab = detailTab === 'social';

  const venueLessonsForDisplay = useMemo(() => {
    if (isLessonsSuppressedVenue && !isSocialTab) return [];
    return venueLessons;
  }, [isLessonsSuppressedVenue, isSocialTab, venueLessons]);

  const pickInitialSelectedDate = useCallback(() => {
    if (isSocialTab) {
      const future = venueParties.find((p) => normDate(p.date) >= todayStr);
      if (future) return normDate(future.date);
      if (venueParties.length) return normDate(venueParties[venueParties.length - 1].date);
      return todayStr;
    }
    const dates = [...venueLessonsForDisplay.flatMap((l) => [...collectLessonCalendarDates(l, todayStr, 8)])].sort();
    const future = dates.find((d) => d >= todayStr);
    if (future) return future;
    if (dates.length) return dates[dates.length - 1];
    return todayStr;
  }, [isSocialTab, venueParties, venueLessonsForDisplay, todayStr]);

  const activeItems = isSocialTab ? venueParties : venueLessonsForDisplay;

  const datesWithEvents = useMemo(() => {
    const set = new Set();
    if (isSocialTab) {
      activeItems.forEach((p) => {
        const d = normDate(p.date);
        if (d) set.add(d);
      });
    } else {
      venueLessonsForDisplay.forEach((lesson) => {
        collectLessonCalendarDates(lesson, todayStr, 8).forEach((d) => set.add(d));
      });
    }
    return set;
  }, [activeItems, isSocialTab, venueLessonsForDisplay, todayStr]);

  useEffect(() => {
    const d = pickInitialSelectedDate();
    setSelectedDate(d);
    const [y, m] = d.split('-').map(Number);
    setCalendarMonth({ year: y, month: m });
  }, [venue?.id, venue?.name, detailTab, pickInitialSelectedDate]);

  const setDetailNavHidden = useCallback((hidden) => {
    setNavHidden(hidden);
    document.body.classList.toggle(VENUE_DETAIL_NAV_HIDDEN_CLASS, hidden);
  }, []);

  useEffect(() => {
    document.body.classList.add(VENUE_DETAIL_BODY_CLASS);
    setDetailNavHidden(false);
    lastScrollTopRef.current = 0;
    return () => {
      document.body.classList.remove(VENUE_DETAIL_BODY_CLASS);
      document.body.classList.remove(VENUE_DETAIL_NAV_HIDDEN_CLASS);
    };
  }, [setDetailNavHidden]);

  const handleBodyScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      const scrollTop = el.scrollTop;
      const delta = scrollTop - lastScrollTopRef.current;
      lastScrollTopRef.current = scrollTop;

      if (scrollTop <= 40) {
        setDetailNavHidden(false);
        return;
      }
      if (delta > 10) setDetailNavHidden(true);
      else if (delta < -10) setDetailNavHidden(false);
    },
    [setDetailNavHidden]
  );

  const dayItems = useMemo(() => {
    if (isSocialTab) return activeItems.filter((p) => normDate(p.date) === selectedDate);
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
          .filter(({ date }) => date)
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
      const d = normDate(p.date);
      if (!d) return;
      const prev = byDate.get(d);
      if (!prev || (p.poster_url && !prev.poster_url)) byDate.set(d, p);
    });
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, party]) => ({ date, party }));
  }, [activeItems, isSocialTab, venueLessonsForDisplay, todayStr]);

  const master = findBarByName(venue?.name);
  const displayName = venue?.name || master?.name || '제휴 BAR';
  const displayAddress = venue?.address || master?.address || '';

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ empty: true, key: `e-${i}` });
    for (let d = 1; d <= lastDate; d++) {
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ empty: false, date: d, fullDate, key: fullDate });
    }
    return days;
  }, [calendarMonth]);

  const openKakao = () => {
    if (!venue?.kakao_url?.trim()) {
      alert('카카오톡 문의 링크가 아직 등록되지 않았습니다.');
      return;
    }
    window.open(venue.kakao_url, '_blank');
  };

  const openInsta = () => {
    if (!venue?.instagram_url?.trim()) {
      alert('인스타그램 링크가 아직 등록되지 않았습니다.');
      return;
    }
    window.open(venue.instagram_url, '_blank');
  };

  const persistVenuePatch = async (patch) => {
    if (isPersistedVenueId(venue?.id) && supabase) {
      const { data, error } = await supabase.from('locations').update(patch).eq('id', venue.id).select().single();
      if (error) throw error;
      onVenueUpdated?.({ ...venue, ...data });
      return;
    }
    if (supabase) {
      const masterBar = findBarByName(venue?.name);
      const { data, error } = await supabase
        .from('locations')
        .insert([
          {
            name: venue?.name || masterBar?.name,
            address: venue?.address || masterBar?.address || '',
            ...patch,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      onVenueUpdated?.({ ...venue, ...data });
    }
  };

  const saveVenueDescription = async () => {
    const text = venueDescription.trim().slice(0, VENUE_DESC_MAX);
    setSavingDescription(true);
    try {
      await persistVenuePatch({ description: text || null });
      alert('상세 설명이 저장되었습니다.');
    } catch (err) {
      console.error(err);
      alert(`저장에 실패했습니다: ${err.message}`);
    } finally {
      setSavingDescription(false);
    }
  };

  const saveVenueLinks = async (e) => {
    e.preventDefault();
    const kakao = linkForm.kakao_url.trim();
    const insta = linkForm.instagram_url.trim();
    if (!kakao && !insta) {
      alert('카카오톡 또는 인스타그램 링크를 입력해 주세요.');
      return;
    }

    setSavingLinks(true);
    try {
      const patch = {};
      if (kakao) patch.kakao_url = kakao;
      if (insta) patch.instagram_url = insta;
      await persistVenuePatch(patch);
      alert('연락처가 저장되었습니다.');
      setShowLinkRegister(false);
    } catch (err) {
      console.error(err);
      alert(`저장에 실패했습니다: ${err.message}`);
    } finally {
      setSavingLinks(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: Z.modalBackdrop,
          background: VD.bgPage,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `1px solid ${VD.borderAccent}`,
            background: VD.bgHeader,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F8FAFC',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={22} color="#1E293B" />
          </button>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <VenueAvatar venue={venue} size={40} />
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: VD.brand, letterSpacing: 0.3, marginBottom: 2 }}>
                {isSocialTab ? '오늘의 플로어' : '오늘의 수업'}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: VD.title, lineHeight: 1.25 }}>{displayName}</div>
              {displayAddress && (
                <div
                  style={{
                    fontSize: '11px',
                    color: VD.muted,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 2,
                  }}
                >
                  {displayAddress}
                </div>
              )}
              <VenueModeTabs mode={detailTab} onChange={setDetailTab} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F8FAFC',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* 상단: 달력 */}
        <div style={{ flexShrink: 0, padding: '12px 16px 10px', borderBottom: `1px solid ${VD.border}`, background: VD.bgCalendar }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: VD.brand }}>{calendarMonth.month}월</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setCalendarMonth((m) => { const nm = m.month > 1 ? m.month - 1 : 12; const ny = m.month > 1 ? m.year : m.year - 1; return { year: ny, month: nm }; })} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff' }}><ChevronLeft size={16} /></button>
              <button type="button" onClick={() => setCalendarMonth((m) => { const nm = m.month < 12 ? m.month + 1 : 1; const ny = m.month < 12 ? m.year : m.year + 1; return { year: ny, month: nm }; })} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff' }}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {DAYS_KOR.map((d) => (
              <div key={d} style={{ fontSize: '10px', fontWeight: 700, color: d === '일' ? VD.accent : VD.faint, padding: '2px 0' }}>{d}</div>
            ))}
            {calendarDays.map((day) => {
              if (day.empty) return <div key={day.key} />;
              const isSelected = selectedDate === day.fullDate;
              const hasEvent = datesWithEvents.has(day.fullDate);
              const isPast = day.fullDate < todayStr;
              return (
                <button key={day.key} type="button" onClick={() => setSelectedDate(day.fullDate)} style={{ border: 'none', background: isSelected ? VD.brand : hasEvent ? 'rgba(212, 67, 110, 0.08)' : 'transparent', borderRadius: 10, padding: '6px 0', cursor: 'pointer', opacity: isPast && !hasEvent ? 0.35 : 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#fff' : hasEvent ? VD.brand : VD.title }}>{day.date}</div>
                  <div style={{ height: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{hasEvent && <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : VD.gold }} />}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 본문: 카드 → 다른 행사 → SNS (한 스크롤) */}
        <motion.div
          ref={scrollRef}
          onScroll={handleBodyScroll}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: navHidden
              ? '16px 16px max(20px, env(safe-area-inset-bottom))'
              : '16px 16px max(100px, calc(88px + env(safe-area-inset-bottom)))',
            transition: 'padding-bottom 0.25s ease',
            background: VD.bgPage,
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: VD.brand }}>
            {formatLessonShortDate(selectedDate)} · {isSocialTab ? '이 날의 행사' : '이 날의 수업'}
          </p>
          {featuredItem ? (
            <FeaturedPartyCard
              party={featuredItem}
              onOpenPoster={onOpenPoster}
              isLesson={!isSocialTab}
              displayDate={selectedDate}
              liveCount={venueBarStats.liveCount}
              clickCount={venueBarStats.clickCount}
            />
          ) : (
            <p style={{ margin: '8px 0 12px', fontSize: '14px', color: VD.muted, textAlign: 'center', fontWeight: 600 }}>
              {formatLessonShortDate(selectedDate)} — 이 날 등록된 {isSocialTab ? '파티' : '수업'}이 없습니다.
            </p>
          )}

          <div
            style={{
              marginTop: 12,
              marginBottom: 16,
              padding: 14,
              borderRadius: 14,
              border: `1px solid ${VD.borderAccent}`,
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: VD.brand }}>상세 설명</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: VD.faint }}>
                BAR 공통 · {venueDescription.length}/{VENUE_DESC_MAX}
              </span>
            </div>
            <textarea
              value={venueDescription}
              onChange={(e) => setVenueDescription(e.target.value.slice(0, VENUE_DESC_MAX))}
              rows={3}
              maxLength={VENUE_DESC_MAX}
              placeholder="운영 시간, 주차, 드레스코드 등"
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${VD.border}`,
                fontSize: 13,
                lineHeight: 1.5,
                color: VD.body,
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={saveVenueDescription}
              disabled={savingDescription}
              style={{
                marginTop: 8,
                width: '100%',
                padding: 9,
                borderRadius: 10,
                border: 'none',
                background: VD.brand,
                color: '#fff',
                fontWeight: 800,
                fontSize: 12,
                cursor: savingDescription ? "not-allowed" : "pointer",
                opacity: savingDescription ? 0.7 : 1,
              }}
            >
              {savingDescription ? '저장 중…' : '저장'}
            </button>
          </div>

          {featuredItem && dayItems.length > 1 && (
            <div style={{ marginTop: 12, marginBottom: 4 }}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: VD.brand, margin: '0 0 8px' }}>
                {isSocialTab ? '같은 날 다른 행사' : '같은 날 다른 수업'}
              </p>
              {dayItems.slice(1).map((p) => (
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
                  {cleanTitle(p.title)} · {p.time?.split('-')[0]?.trim()}
                </button>
              ))}
            </div>
          )}

          {(isSocialTab ? schedulePosters.length > 0 : true) && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: VD.brand, margin: '0 0 8px' }}>
                {isSocialTab ? '행사 일정' : '수업 일정'}
              </p>
              {schedulePosters.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: VD.muted, fontWeight: 600 }}>
                  등록된 수업 일정이 없습니다.
                </p>
              ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {schedulePosters.map(({ date, party: p }) => (
                    <button
                      key={`${p.id}-${date}`}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      style={{
                        flexShrink: 0,
                        padding: 4,
                        borderRadius: 10,
                        border: selectedDate === date ? `2px solid ${VD.brand}` : `1px solid ${VD.border}`,
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {p.poster_url ? (
                        <img src={p.poster_url} alt="" style={{ width: 64, height: 88, objectFit: "cover", borderRadius: 8, display: "block" }} />
                      ) : (
                        <div style={{ width: 64, height: 88, background: "#F1F5F9", borderRadius: 8 }} />
                      )}
                      <span style={{ fontSize: 10, fontWeight: 800, color: VD.muted, display: 'block', marginTop: 4, textAlign: 'center' }}>
                        {formatLessonShortDate(date)}
                      </span>
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

          <div style={{ display: 'flex', gap: '10px', paddingTop: 4 }}>
            <button
              type="button"
              onClick={openKakao}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 12,
                border: 'none',
                background: '#FEE500',
                color: '#3C1E1E',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MessageCircle size={18} />
              카카오톡
            </button>
            <button
              type="button"
              onClick={openInsta}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 12,
                border: `1px solid ${VD.borderAccent}`,
                background: '#fff',
                color: VD.brand,
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Globe size={18} color={VD.brand} />
              인스타그램
            </button>
          </div>

          {!hasBothVenueLinks && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
            <button
              type="button"
              onClick={() => setShowLinkRegister((v) => !v)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px dashed #CBD5E1',
                background: '#F8FAFC',
                color: '#475569',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {showLinkRegister ? '연락처 등록 닫기' : '카카오 · 인스타 등록하기'}
            </button>

            {showLinkRegister && (
              <form onSubmit={saveVenueLinks} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 4 }}>
                    카카오톡 링크
                  </label>
                  <input
                    type="url"
                    value={linkForm.kakao_url}
                    onChange={(e) => setLinkForm((f) => ({ ...f, kakao_url: e.target.value }))}
                    placeholder="https://open.kakao.com/o/..."
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 4 }}>
                    인스타그램 링크
                  </label>
                  <input
                    type="url"
                    value={linkForm.instagram_url}
                    onChange={(e) => setLinkForm((f) => ({ ...f, instagram_url: e.target.value }))}
                    placeholder="https://instagram.com/..."
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingLinks}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 12,
                    border: 'none',
                    background: '#E53935',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: savingLinks ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: savingLinks ? 0.7 : 1,
                  }}
                >
                  {savingLinks ? <Loader2 size={16} className="animate-spin" /> : '저장하기'}
                </button>
              </form>
            )}
          </div>
          )}
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}
