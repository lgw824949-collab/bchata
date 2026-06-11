import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Calendar, MapPin, Zap, X, ChevronDown, Plus, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { resolveEventDates, inferOneDayEvent } from '../lib/dbSanitize';
import EventDateFields from '../components/EventDateFields';
import { Z } from '../constants/zLayers';
import { goBackOrHome, parseAppState, pushOverlay, readNavigationState } from '../lib/appHistory';
import { BAR_DATABASE, findBarByName } from '../lib/BarLib';
import { getKSTCalendarTodayStr, normDate } from '../lib/dateNorm';

const mapBarRegionToFestivalRegion = (regionLabel) => {
  const r = String(regionLabel || '');
  if (r.includes('서울')) return '서울';
  if (r.includes('경기') || r.includes('인천')) return '경인';
  if (r.includes('제주')) return '제주';
  if (r.includes('강원')) return '강원';
  if (r.includes('부산') || r.includes('경상') || r.includes('대구') || r.includes('울산')) return '부산/경남';
  if (r.includes('전라') || r.includes('광주')) return '전라도';
  if (r.includes('충청') || r.includes('대전') || r.includes('세종')) return '충청도';
  return '서울';
};

const formatBarVenueLocationLine = (bar) => {
  if (!bar?.name) return '';
  const address = String(bar.address || '').trim();
  return address ? `${bar.name} · ${address}` : bar.name;
};

const searchBarVenueSuggestions = (query, limit = 8) => {
  const q = String(query || '').replace(/\s/g, '').toLowerCase();
  if (!q) return [];
  return BAR_DATABASE.filter((bar) => {
    const haystack = [bar.name, ...(bar.aliases || []), bar.address]
      .map((s) => String(s || '').replace(/\s/g, '').toLowerCase());
    return haystack.some((s) => s && (s.includes(q) || q.includes(s)));
  }).slice(0, limit);
};

const resolveFestivalLocationFields = (locationText, regionFallback = '서울') => {
  const raw = String(locationText || '').trim();
  if (!raw || raw === '추후 공지') {
    return { location: raw || '추후 공지', region: regionFallback };
  }
  const bar = findBarByName(raw);
  if (!bar) return { location: raw, region: regionFallback };
  return {
    location: formatBarVenueLocationLine(bar),
    region: mapBarRegionToFestivalRegion(bar.region),
  };
};

const isFestivalEnded = (fest, todayStr = getKSTCalendarTodayStr()) => {
  const end = normDate(fest?.end_date || fest?.start_date);
  return Boolean(end && end < todayStr);
};

const FESTIVAL_GENRE_OPTIONS = ['바차타', '살사', '키좀바', '쥬크'];

const parseFestivalGenres = (value) => {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  const raw = String(value || '').trim();
  if (!raw) return ['바차타'];
  return raw.split(/[,/·|]/).map((s) => s.trim()).filter(Boolean);
};

const formatFestivalGenres = (value) => parseFestivalGenres(value).join(', ');

const FESTIVAL_EVENT_TYPE_OPTIONS = [
  ['festival', '🎪 페스티벌'],
  ['mt', '🏕️ MT'],
  ['party', '🎉 파티'],
];

const getFestivalTabMeta = (activeTab) => {
  if (activeTab === 'mt') return { emoji: '🏕️', name: 'MT' };
  if (activeTab === 'party') return { emoji: '🎉', name: '파티' };
  return { emoji: '🎪', name: '페스티벌' };
};

const FESTIVAL_POSTER_FIELDS = [
  { key: 'poster_url', label: '행사 포스터', hint: '행사 메인 포스터 (필수)' },
  { key: 'price_poster_url', label: '가격 포스터', hint: '티켓·가격 안내 포스터 (필수)' },
  { key: 'extra_poster_url', label: '추가 이미지', hint: '타임테이블·부스 안내 등 (필수)' },
];

const createEmptyFestivalForm = (eventType = 'festival') => ({
  title: '',
  start_date: '',
  end_date: '',
  region: '서울',
  location: '',
  price: '',
  description: '',
  poster_url: '',
  price_poster_url: '',
  extra_poster_url: '',
  organizer: '',
  genres: ['바차타'],
  bank_info: '',
  event_type: eventType,
});

const countFestivalPosterImages = (form) =>
  FESTIVAL_POSTER_FIELDS.filter(({ key }) => String(form?.[key] || '').trim()).length;

const festivalDetailPosterImages = (fest) =>
  FESTIVAL_POSTER_FIELDS
    .map(({ key, label }) => ({ label, url: String(fest?.[key] || '').trim() }))
    .filter((item) => item.url);

const filterFestivalsClient = (all, selectedRegion, activeTab) => {
  const eventType = activeTab || 'festival';
  const rows = (all || []).filter(
    (f) =>
      f.event_type === eventType
      && !isFestivalEnded(f),
  );
  if (selectedRegion === '전체') return rows;
  const REGION_MAP = {
    '수도권': ['서울', '경인', '수도권'],
    '강원': ['강원', '강원도', '강원/제주'],
    '제주': ['제주', '제주도', '강원/제주'],
    '부산/경남': ['부산', '경남', '경상도', '부산/경남'],
    '전라': ['전라', '전라도', '전북', '전남'],
    '충청': ['충청', '충청도', '충북', '충남'],
  };
  const aliases = REGION_MAP[selectedRegion] || [selectedRegion];
  return rows.filter((f) => aliases.some((a) => (f.region || '').includes(a)));
};

const FESTIVAL_TAB_SESSION_KEY = 'bchata_festival_tab';

const Festival = ({ onBack, initialRegister = false, cachedFestivals = null, onFestivalsRefresh }) => {
  const [festivals, setFestivals] = useState(() => filterFestivalsClient(cachedFestivals, '전체', 'festival'));
  const [loading, setLoading] = useState(!cachedFestivals?.length);
  const usedCacheRef = useRef(Boolean(cachedFestivals?.length));
  const [activeTab, setActiveTab] = useState('festival'); // 'festival' | 'mt' | 'party'
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [showBookingGuide, setShowBookingGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegistering, setIsRegistering] = useState(initialRegister);
  const [editingId, setEditingId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingField, setUploadingField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isOneDayEvent, setIsOneDayEvent] = useState(true);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [formData, setFormData] = useState(() => createEmptyFestivalForm());

  const regions = ['전체', '수도권', '강원', '제주', '부산/경남', '전라', '충청'];

  useEffect(() => {
    try {
      const tab = sessionStorage.getItem(FESTIVAL_TAB_SESSION_KEY);
      if (tab && ['festival', 'mt', 'party'].includes(tab)) {
        setActiveTab(tab);
        sessionStorage.removeItem(FESTIVAL_TAB_SESSION_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (cachedFestivals?.length) {
      setFestivals(filterFestivalsClient(cachedFestivals, selectedRegion, activeTab));
      setLoading(false);
    }
  }, [cachedFestivals, selectedRegion, activeTab]);

  useEffect(() => {
    const st = readNavigationState();
    const detailId = st?.overlayMeta?.festivalId;
    if (!detailId || st?.overlay !== 'festivalDetail') return;
    const pool = cachedFestivals?.length ? cachedFestivals : festivals;
    const match = pool.find((f) => String(f.id) === String(detailId));
    if (match) setSelectedFestival(match);
  }, [festivals, cachedFestivals]);

  const detailHistoryPushed = useRef(false);

  useEffect(() => {
    if (!selectedFestival) {
      detailHistoryPushed.current = false;
      return;
    }
    const st = readNavigationState();
    if (st?.overlay === 'festivalDetail') {
      detailHistoryPushed.current = true;
      return;
    }
    if (!detailHistoryPushed.current) {
      detailHistoryPushed.current = true;
      pushOverlay('festivalDetail', {
        path: '/festival',
        meta: { festivalId: selectedFestival.id },
      });
    }
  }, [selectedFestival]);

  useEffect(() => {
    const onHistory = (event) => {
      const st = event.detail?.state ?? parseAppState(window.history.state);
      if (st?.overlay !== 'festivalDetail') {
        setSelectedFestival(null);
      }
    };
    window.addEventListener('bamppa-history', onHistory);
    return () => window.removeEventListener('bamppa-history', onHistory);
  }, []);

  useEffect(() => {
    if (usedCacheRef.current) {
      usedCacheRef.current = false;
      return;
    }
    fetchFestivals();
  }, [selectedRegion, activeTab]);

  const REGION_MAP = {
    '수도권': ['서울', '경인', '수도권'],
    '강원':   ['강원', '강원도', '강원/제주'],
    '제주':   ['제주', '제주도', '강원/제주'],
    '부산/경남': ['부산', '경남', '경상도', '부산/경남'],
    '전라':   ['전라', '전라도', '전북', '전남'],
    '충청':   ['충청', '충청도', '충북', '충남'],
  };

  const fetchFestivals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('festivals').select('*').eq('status', 'active')
        .eq('event_type', activeTab || 'festival')
        .order('start_date', { ascending: true });
      if (error) throw error;
      const all = data || [];
      if (typeof onFestivalsRefresh === 'function') onFestivalsRefresh(all);
      setFestivals(filterFestivalsClient(all, selectedRegion, activeTab));
    } catch (err) {
      console.error('Error fetching festivals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, fieldKey) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingField(fieldKey);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `festivals/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('posters').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, [fieldKey]: publicUrl }));
    } catch (err) {
      alert('이미지 업로드 실패');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const openEdit = (fest) => {
    setFormData({
      title:       fest.title || '',
      organizer:   fest.organizer || '',
      genres:      parseFestivalGenres(fest.genre),
      start_date:  fest.start_date || '',
      end_date:    fest.end_date || '',
      region:      fest.region || '서울',
      location:    fest.location || '',
      price:       fest.price || '',
      description: fest.description || '',
      poster_url:       fest.poster_url || '',
      price_poster_url: fest.price_poster_url || '',
      extra_poster_url: fest.extra_poster_url || '',
      bank_info:   fest.bank_info || '',
      event_type:  fest.event_type || 'festival',
    });
    setIsOneDayEvent(inferOneDayEvent(fest.start_date, fest.end_date));
    setEditingId(fest.id);
    setCurrentStep(1);
    setSelectedFestival(null);
    setTimeout(() => setIsRegistering(true), 50);
  };

  const handleLocationInputChange = (value) => {
    setFormData((prev) => ({ ...prev, location: value }));
    if (!value.trim() || value.trim() === '추후 공지') {
      setLocationSuggestions([]);
      return;
    }
    setLocationSuggestions(searchBarVenueSuggestions(value));
  };

  const toggleFestivalGenre = (genre) => {
    setFormData((prev) => {
      const selected = prev.genres || [];
      const has = selected.includes(genre);
      if (has) return { ...prev, genres: selected.filter((g) => g !== genre) };
      return { ...prev, genres: [...selected, genre] };
    });
  };

  const validateRegisterStep = (step) => {
    if (step === 1) {
      if (!String(formData.title || '').trim()) {
        alert('이름을 입력해 주세요.');
        return false;
      }
      if (!String(formData.organizer || '').trim()) {
        alert('주최/주관을 입력해 주세요.');
        return false;
      }
      if (!(formData.genres || []).length) {
        alert('주요 장르를 하나 이상 선택해 주세요.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      const dates = resolveEventDates({
        isOneDay: isOneDayEvent,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      if (!dates.ok) {
        alert(dates.error);
        return false;
      }
      if (!String(formData.location || '').trim()) {
        alert('상세 장소/주소를 입력해 주세요.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!String(formData.price || '').trim()) {
        alert('티켓 가격 정보를 입력해 주세요.');
        return false;
      }
      if (!String(formData.poster_url || '').trim()) {
        alert('행사 포스터를 업로드해 주세요.');
        return false;
      }
      if (!String(formData.price_poster_url || '').trim()) {
        alert('가격 포스터를 업로드해 주세요.');
        return false;
      }
      if (countFestivalPosterImages(formData) < 3) {
        alert('이미지는 최소 3장이 필요합니다. (행사 포스터, 가격 포스터, 추가 이미지)');
        return false;
      }
      return true;
    }
    return true;
  };

  const goNextRegisterStep = () => {
    if (!validateRegisterStep(currentStep)) return;
    setCurrentStep((s) => s + 1);
  };

  const closeRegisterForm = () => {
    setIsRegistering(false);
    setEditingId(null);
    setCurrentStep(1);
    setIsOneDayEvent(true);
    setSubmitting(false);
    setUploadingField(null);
    setLocationSuggestions([]);
    setFormData(createEmptyFestivalForm(activeTab));
  };

  const selectLocationSuggestion = (bar) => {
    setFormData((prev) => ({
      ...prev,
      location: formatBarVenueLocationLine(bar),
      region: mapBarRegionToFestivalRegion(bar.region),
    }));
    setLocationSuggestions([]);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    for (const step of [1, 2, 3]) {
      if (!validateRegisterStep(step)) {
        setCurrentStep(step);
        return;
      }
    }
    const dates = resolveEventDates({
      isOneDay: isOneDayEvent,
      start_date: formData.start_date,
      end_date: formData.end_date,
    });
    if (!dates.ok) {
      alert(dates.error);
      setCurrentStep(2);
      return;
    }
    setSubmitting(true);
    const wasEdit = Boolean(editingId);
    try {
      const resolvedLocation = resolveFestivalLocationFields(formData.location, formData.region);
      const payload = {
        title:       formData.title,
        organizer:   formData.organizer,
        genre:       formatFestivalGenres(formData.genres),
        start_date:  dates.start_date,
        end_date:    dates.end_date,
        region:      resolvedLocation.region,
        location:    resolvedLocation.location,
        price:       formData.price,
        description: formData.description,
        poster_url:       formData.poster_url || null,
        price_poster_url: formData.price_poster_url || null,
        extra_poster_url: formData.extra_poster_url || null,
        bank_info:   formData.bank_info || null,
        event_type:  formData.event_type || 'festival',
        status:      'pending',
      };
      let error;
      if (editingId) {
        ({ error } = await supabase.from('festivals').update(payload).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('festivals').insert([payload]));
      }
      if (error) throw error;
      closeRegisterForm();
      fetchFestivals();
      window.setTimeout(() => {
        alert(
          wasEdit
            ? '수정 신청이 접수되었습니다. 관리자 승인 후 반영됩니다.'
            : '신청이 접수되었습니다. 관리자 승인 후 노출됩니다.',
        );
      }, 0);
    } catch (err) {
      alert('실패: ' + err.message);
      setSubmitting(false);
    }
  };

  const handleBookingClick = async (fest) => {
    try {
      await supabase.from('festival_booking_logs').insert([{
        festival_id: fest.id,
        festival_title: fest.title
      }]);
      setShowBookingGuide(true);
    } catch (err) {
      console.error('Booking log error:', err);
      setShowBookingGuide(true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDDay = (fest) => {
    const todayStr = getKSTCalendarTodayStr();
    const start = normDate(fest?.start_date);
    const end = normDate(fest?.end_date || fest?.start_date);
    if (isFestivalEnded(fest, todayStr)) return '종료';
    const target = start && start >= todayStr ? start : end;
    const targetDate = new Date(`${target}T12:00:00+09:00`);
    const todayDate = new Date(`${todayStr}T12:00:00+09:00`);
    const days = Math.ceil((targetDate - todayDate) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'D-DAY';
    return days > 0 ? `D-${days}` : '종료';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.slice(5).replace('-', '.');
  };

  const formatDateWithDay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.slice(5).replace('-', '.')} (${days[d.getDay()]})`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes shimmer-fest {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skeleton-fest {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 1200px 100%;
          animation: shimmer-fest 1.4s infinite linear;
          border-radius: 12px;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <div style={{ background: '#0D0D0D', minHeight: '100dvh', width: '100%', paddingBottom: '100px', color: '#f8fafc', fontFamily: "inherit", position: 'relative', overscrollBehavior: 'none' }}>
        
        {/* Background Glow */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(201, 168, 76, 0.25) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        {/* Header */}
        {!isRegistering && (
          <div style={{ 
            position: 'sticky', top: 0, zIndex: 2000, background: 'rgba(13, 13, 13, 0.95)', 
            backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={24} color="#f8fafc" /></button>
              {/* FESTIVAL / MT 탭 */}
              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '4px' }}>
                {[
                  { key: 'festival', label: 'FESTIVAL' },
                  { key: 'mt', label: 'MT' },
                  { key: 'party', label: 'PARTY' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setSelectedRegion('전체'); }}
                    style={{
                      padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: activeTab === tab.key ? '#C9A84C' : 'transparent',
                      color: activeTab === tab.key ? '#000' : '#8E8E93',
                      fontSize: 13, fontWeight: 900, letterSpacing: '0.5px',
                      transition: 'all 0.2s'
                    }}
                  >{tab.label}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  color: '#C9A84C', 
                  border: '1px solid rgba(201,168,76,0.3)', 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontWeight: 1000, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px'
                }}
              >
                {selectedRegion} <ChevronDown size={14} color="#C9A84C" />
              </button>
              <button 
                onClick={() => { setFormData(prev => ({ ...prev, event_type: activeTab })); setTimeout(() => setIsRegistering(true), 50); }}
                style={{ 
                  background: 'linear-gradient(135deg, #C9A84C, #A68A3D)', 
                  color: '#000', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontWeight: 1000, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  boxShadow: '0 8px 20px rgba(201, 168, 76, 0.3)'
                }}
              >
                <Plus size={14} strokeWidth={3} /> 등록
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {!isRegistering && (
          <div style={{ position: 'relative', zIndex: 1 }}>

            {/* ── 히어로 배너 ── */}
            <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
              <img
                src="/festival_hero_2026.png"
                alt="KEEP FESTIVAL-ING IN 2026"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 30%, #0D0D0D 100%)' }} />
            </div>

            {/* ── 지역 필터 탭 ── */}
            <div style={{ padding: '0 15px', marginTop: 14, marginBottom: 4 }}>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {regions.map(r => {
                  const active = selectedRegion === r;
                  return (
                    <button key={r} onClick={() => setSelectedRegion(r)} style={{
                      padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                      fontSize: 13, fontWeight: active ? 900 : 600, cursor: 'pointer',
                      background: active ? '#C9A84C' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${active ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                      color: active ? '#000' : '#94a3b8',
                      transition: 'all 0.2s'
                    }}>{r}</button>
                  );
                })}
              </div>
            </div>

            {/* ── 카드 리스트 ── */}
            <div style={{ padding: '12px 15px 100px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loading ? (
                [0, 1, 2].map(i => (
                  <div key={i} style={{ display: 'flex', height: 130, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#141414' }}>
                    <div className="skeleton-fest" style={{ width: '36%', borderRadius: 0, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="skeleton-fest" style={{ height: 10, width: '45%' }} />
                      <div className="skeleton-fest" style={{ height: 15, width: '80%' }} />
                      <div className="skeleton-fest" style={{ height: 11, width: '55%' }} />
                      <div className="skeleton-fest" style={{ height: 11, width: '40%' }} />
                    </div>
                  </div>
                ))
              ) : festivals.length === 0 ? (
                <div style={{ marginTop: 40, textAlign: 'center', padding: '40px 20px', borderRadius: 24, border: '1px dashed rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.03)' }}>
                  {(() => {
                    const tabMeta = getFestivalTabMeta(activeTab);
                    return (
                      <>
                  <div style={{ fontSize: 36, marginBottom: 14 }}>{tabMeta.emoji}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                    {selectedRegion === '전체'
                      ? `등록된 ${tabMeta.name}이 없습니다`
                      : `${selectedRegion} 지역 ${tabMeta.name}이 없습니다`}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                    {`첫 번째 ${tabMeta.name}를 등록해 보세요!`}
                  </div>
                  <button
                    onClick={() => { setFormData(prev => ({ ...prev, event_type: activeTab })); setTimeout(() => setIsRegistering(true), 50); }}
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #A68A3D)', color: '#000', border: 'none', padding: '13px 28px', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
                    + {tabMeta.name} 등록
                  </button>
                      </>
                    );
                  })()}
                </div>
              ) : (
                festivals.map((fest) => {
                  const ddayLabel = getDDay(fest);
                  return (
                  <motion.div
                    key={fest.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onClick={() => setSelectedFestival(fest)}
                    style={{ display: 'flex', cursor: 'pointer', background: '#111', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {/* 포스터 — 정보 영역 높이에 맞게 자동 늘어남 */}
                    <div style={{ width: '36%', flexShrink: 0, position: 'relative', background: '#000', alignSelf: 'stretch' }}>
                      <img
                        src={fest.poster_url}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                        alt={fest.title}
                      />
                    </div>

                    {/* 정보 — 내용에 맞게 높이 자동 */}
                    <div style={{ flex: 1, minWidth: 0, padding: '14px 14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

                      {/* 장르 + D-day */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                          {formatFestivalGenres(fest.genre)}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 900,
                          color: ddayLabel === '종료' ? '#475569' : ddayLabel === 'D-DAY' ? '#000' : '#C9A84C',
                          background: ddayLabel === 'D-DAY' ? '#C9A84C' : 'rgba(201,168,76,0.1)',
                          border: '1px solid rgba(201,168,76,0.3)',
                          padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap'
                        }}>
                          {ddayLabel}
                        </span>
                      </div>

                      {/* 제목 — 글자 수에 따라 자동 줄바꿈 */}
                      <div style={{
                        fontFamily: "'Bebas Neue', 'Black Han Sans', sans-serif",
                        fontSize: 20,
                        letterSpacing: '0.3px',
                        lineHeight: 1.25,
                        color: '#ffffff',
                        wordBreak: 'keep-all',
                        overflowWrap: 'break-word'
                      }}>
                        {fest.title}
                      </div>

                      {/* 날짜 + 장소 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto', paddingTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                          <Calendar size={11} color="#C9A84C" strokeWidth={2} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {formatDateWithDay(fest.start_date)}{fest.end_date && fest.end_date !== fest.start_date ? ` — ${formatDate(fest.end_date)}` : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                          <MapPin size={11} color="#C9A84C" strokeWidth={2} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(fest.location || fest.venue) && (fest.location || fest.venue) !== '추후 공지' ? (fest.location || fest.venue) : fest.region}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {isRegistering && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: '100%' }}
            style={{ 
              background: '#0D0D0D', 
              padding: '30px', 
              position: 'fixed', 
              inset: 0, 
              zIndex: Z.modal, 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 950, color: '#f8fafc', margin: 0 }}>{editingId ? '페스티벌 수정' : '페스티벌 신청'} ({currentStep}/4)</h2>
              <button type="button" onClick={closeRegisterForm} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} color="#94a3b8" /></button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= currentStep ? '#C9A84C' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
              ))}
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
            >
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>1. 유형 선택</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {FESTIVAL_EVENT_TYPE_OPTIONS.map(([val, label]) => (
                        <button key={val} type="button" onClick={() => setFormData(prev => ({ ...prev, event_type: val }))}
                          style={{ flex: '1 1 calc(33.333% - 7px)', minWidth: 96, padding: '14px 10px', borderRadius: 14, fontWeight: 900, fontSize: 14, cursor: 'pointer',
                            border: `1px solid ${formData.event_type === val ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                            background: formData.event_type === val ? 'rgba(201,168,76,0.15)' : '#1A1A1A',
                            color: formData.event_type === val ? '#C9A84C' : '#8E8E93' }}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>2. 이름 (최대 18자)</label><input maxLength={18} value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="이름을 입력하세요" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>2. 주최/주관</label><input value={formData.organizer} onChange={e => setFormData(prev => ({ ...prev, organizer: e.target.value }))} placeholder="단체 또는 이름" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>3. 주요 장르 (중복 선택 가능)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {FESTIVAL_GENRE_OPTIONS.map((genre) => {
                        const selected = (formData.genres || []).includes(genre);
                        return (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => toggleFestivalGenre(genre)}
                            aria-pressed={selected}
                            style={{
                              padding: '14px 18px',
                              borderRadius: 14,
                              fontWeight: 900,
                              fontSize: 15,
                              cursor: 'pointer',
                              border: `1px solid ${selected ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                              background: selected ? 'rgba(201,168,76,0.15)' : '#1A1A1A',
                              color: selected ? '#C9A84C' : '#8E8E93',
                            }}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <EventDateFields
                    compact
                    isOneDay={isOneDayEvent}
                    onOneDayChange={setIsOneDayEvent}
                    start_date={formData.start_date}
                    end_date={formData.end_date}
                    startLabel="4. 시작 날짜"
                    endLabel="5. 종료 날짜"
                    onDatesChange={({ start_date, end_date }) =>
                      setFormData(prev => ({ ...prev, start_date, end_date }))
                    }
                  />
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>6. 상세 장소/주소</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        value={formData.location}
                        onChange={(e) => handleLocationInputChange(e.target.value)}
                        placeholder="BAR·장소명 검색 (예: 보니따, 라틴)"
                        style={{ flex: 1, padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: '16px', color: '#f8fafc', outline: 'none' }}
                      />
                      <button type="button" onClick={() => { setFormData(prev => ({ ...prev, location: '추후 공지' })); setLocationSuggestions([]); }} style={{ padding: '0 20px', borderRadius: '18px', background: formData.location === '추후 공지' ? '#C9A84C' : 'rgba(255,255,255,0.05)', color: formData.location === '추후 공지' ? '#000' : '#94a3b8', fontSize: '13px', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>추후 공지</button>
                    </div>
                    {locationSuggestions.length > 0 ? (
                      <div style={{ marginTop: 10, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: '#141414', overflow: 'hidden' }}>
                        {locationSuggestions.map((bar) => (
                          <button
                            key={`${bar.name}-${bar.address}`}
                            type="button"
                            onClick={() => selectLocationSuggestion(bar)}
                            style={{ width: '100%', textAlign: 'left', padding: '14px 16px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#f8fafc', cursor: 'pointer' }}
                          >
                            <div style={{ fontSize: 14, fontWeight: 800 }}>{bar.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{bar.address}</div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>7. 지역</label><select value={formData.region} onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: '16px', color: '#f8fafc', outline: 'none' }}>{['서울','경인','강원','제주','부산/경남','전라도','충청도'].map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>8. 티켓 가격 정보</label><input value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="예: 풀패스 250,000 / 파티패스 50,000" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                    이미지 <strong style={{ color: '#C9A84C' }}>최소 3장</strong> 필수 · 행사 포스터와 가격 포스터를 반드시 포함해 주세요.
                  </p>
                  {FESTIVAL_POSTER_FIELDS.map(({ key, label, hint }, index) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>
                        {9 + index}. {label}
                      </label>
                      <div style={{ width: '100%', height: '200px', borderRadius: '24px', border: `2px dashed ${formData[key] ? 'rgba(201,168,76,0.55)' : 'rgba(201,168,76,0.3)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                        {formData[key] ? (
                          <img src={formData[key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <>
                            <ImageIcon color="#F59E0B" size={36} />
                            <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>
                              {uploadingField === key ? '업로드 중...' : `${label} 선택`}
                            </span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, key)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>{hint}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>12. 상세 설명</label><textarea rows={4} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="상세 내용 입력" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: '16px', color: '#f8fafc', outline: 'none', resize: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }}>13. 입금 계좌 정보</label><input value={formData.bank_info} onChange={e => setFormData(prev => ({ ...prev, bank_info: e.target.value }))} placeholder="예: 카카오뱅크 3333-01-1234567 홍길동" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: '16px', color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} /></div>
                </motion.div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingBottom: '30px' }}>
                {currentStep > 1 && <button type="button" onClick={() => setCurrentStep(s => s - 1)} style={{ flex: 1, padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)' }}>이전</button>}
                {currentStep < 4 ? (
                  <button type="button" onClick={goNextRegisterStep} style={{ flex: 2, padding: '20px', borderRadius: '18px', background: 'linear-gradient(135deg, #C9A84C, #A68A3D)', color: '#000', fontWeight: 900, border: 'none' }}>다음 단계</button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{ flex: 2, padding: '24px', borderRadius: '20px', background: submitting ? 'rgba(201,168,76,0.45)' : 'linear-gradient(135deg, #C9A84C, #A68A3D)', color: '#000', fontWeight: 1000, fontSize: '18px', border: 'none', cursor: submitting ? 'wait' : 'pointer' }}
                  >
                    {submitting ? '등록 중...' : '신청 완료'}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFestival && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bchata-overlay-panel"
              style={{ position: 'fixed', inset: 0, background: '#0D0D0D', zIndex: Z.modal, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 13, 13, 0.95)', backdropFilter: 'blur(20px)', color: '#f8fafc' }}>
              <X size={32} onClick={goBackOrHome} style={{ cursor: 'pointer' }} />
              <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>FESTIVAL DETAIL</span>
              <button
                onClick={() => openEdit(selectedFestival)}
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #C9A84C', color: '#C9A84C', padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
              >수정</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ position: 'relative', background: '#000', minHeight: '300px', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedFestival.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(0.3)', transform: 'scale(1.2)' }} />
                <img src={selectedFestival.poster_url} alt="" style={{ width: '100%', height: 'auto', display: 'block', position: 'relative', zIndex: 1 }} />
              </div>
              {festivalDetailPosterImages(selectedFestival).length > 1 ? (
                <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {festivalDetailPosterImages(selectedFestival).slice(1).map((item) => (
                    <div key={item.label} style={{ background: '#141414', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <p style={{ margin: 0, padding: '12px 16px', fontSize: '12px', fontWeight: 900, color: '#C9A84C', letterSpacing: '1px' }}>{item.label}</p>
                      <img src={item.url} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={{ padding: '30px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 950, marginBottom: '8px', color: '#f8fafc' }}>{selectedFestival.title}</h2>
                <div style={{ color: '#C9A84C', fontSize: '14px', fontWeight: 900, marginBottom: '25px' }}>{selectedFestival.organizer} · {formatFestivalGenres(selectedFestival.genre)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                  {[
                    { label: '기간', value: `${selectedFestival.start_date} - ${selectedFestival.end_date}`, icon: <Calendar size={18} color="#C9A84C" /> },
                    { label: '장소', value: selectedFestival.venue || selectedFestival.location, icon: <MapPin size={18} color="#C9A84C" /> },
                    { label: '장르', value: formatFestivalGenres(selectedFestival.genre), icon: <Zap size={18} color="#C9A84C" /> },
                    { label: '지역', value: selectedFestival.region, icon: <ImageIcon size={18} color="#C9A84C" /> }
                  ].map((cell, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 900, marginBottom: '6px' }}>{cell.icon} {cell.label}</div>
                      <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 800 }}>{cell.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #A68A3D 100%)', padding: '24px', borderRadius: '24px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(201, 168, 76, 0.3)' }}>
                  <div><p style={{ fontSize: '11px', color: 'rgba(0,0,0,0.7)', fontWeight: 800, marginBottom: '4px', letterSpacing: '1px' }}>티켓 가격</p><h3 style={{ fontSize: '20px', fontWeight: 950, color: '#000' }}>{selectedFestival.price}</h3></div>
                  <button onClick={() => handleBookingClick(selectedFestival)} style={{ background: '#000', border: 'none', padding: '14px 24px', borderRadius: '16px', color: '#C9A84C', fontWeight: 1000, fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer' }}>예매하기</button>
                </div>
                {selectedFestival.description && (<div style={{ padding: '24px', background: '#141414', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}><p style={{ color: '#f8fafc', lineHeight: 1.8, fontSize: '16px', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedFestival.description}</p></div>)}
              </div>
            </div>
            <AnimatePresence>
              {showBookingGuide && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: 'absolute', inset: 0, zIndex: Z.modalNested, background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
                  <div style={{ width: '100%', background: '#1A1A1A', borderRadius: '32px', padding: '40px 30px', textAlign: 'center', border: '1px solid rgba(201,168,76,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ width: '70px', height: '70px', background: 'rgba(201,168,76,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Zap size={32} color="#C9A84C" fill="#C9A84C" /></div>
                    <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#fff', marginBottom: '15px' }}>잠깐! 확인해 주세요</h3>
                    <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '30px' }}>입금 시 입금자명 뒤에 <br /><span style={{ color: '#C9A84C', fontWeight: 900 }}>'밤빠'</span>를 꼭 기재해 주세요!<br />(예: 홍길동 밤빠)</p>
                    <div
                      onClick={() => selectedFestival.bank_info && copyToClipboard(selectedFestival.bank_info)}
                      style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '24px', marginBottom: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)', cursor: selectedFestival.bank_info ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 900, letterSpacing: '1.5px' }}>ACCOUNT INFO</p>
                        {selectedFestival.bank_info && <span style={{ fontSize: '10px', color: '#C9A84C', fontWeight: 900 }}>{copied ? '복사 완료!' : '탭하여 복사'}</span>}
                      </div>
                      <p style={{ fontSize: '16px', color: '#fff', fontWeight: 850, lineHeight: 1.5, margin: 0 }}>{selectedFestival.bank_info || '계좌 정보 없음'}</p>
                      {copied && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(201,168,76,0.1)', pointerEvents: 'none' }} />}
                      {copied && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }} />}
                    </div>
                    <p style={{ fontSize: '13px', color: '#C9A84C', fontWeight: 800, marginBottom: '25px', letterSpacing: '-0.2px' }}>✨ 복사하기로 송금할 수 있습니다</p>
                    <button onClick={() => setShowBookingGuide(false)} style={{ width: '100%', padding: '22px', borderRadius: '20px', background: '#C9A84C', color: '#000', fontWeight: 1000, fontSize: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(201, 168, 76, 0.3)' }}>확인했습니다</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Festival;
