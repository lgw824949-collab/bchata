import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft, Calendar, MapPin, Zap, X, Plus, Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../constants/zLayers';
import { supabase } from '../lib/supabase';
import { goBackOrHome, parseAppState, pushOverlay, readNavigationState } from '../lib/appHistory';
import { resolveEventDates, inferOneDayEvent } from '../lib/dbSanitize';
import EventDateFields from '../components/EventDateFields';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../constants/imageAssets';
import { validateBootcampRegistration } from '../lib/postKind';
import AppPageHeader from '../components/AppPageHeader';
import { BAR_DATABASE, findBarByName } from '../lib/BarLib';
import { getKSTCalendarTodayStr, normDate } from '../lib/dateNorm';

const BOOTCAMP_GENRE_OPTIONS = ['바차타', '살사', '키좀바', '쥬크'];
const BOOTCAMP_REGIONS = ['전체', '수도권', '강원', '제주', '부산/경남', '전라', '충청', '해외'];

const BOOTCAMP_POSTER_FIELDS = [
  { key: 'poster_url', label: '마스터 포스터', hint: '메인 홍보 포스터 (필수)' },
  { key: 'price_poster_url', label: '가격 포스터', hint: '참가비·패키지 안내 (필수)' },
  { key: 'extra_poster_url', label: '추가 이미지', hint: '일정·커리큘럼 등 (필수)' },
];

const REGION_MAP = {
  수도권: ['서울', '경인', '수도권'],
  강원: ['강원', '강원도', '강원/제주'],
  제주: ['제주', '제주도', '강원/제주'],
  '부산/경남': ['부산', '경남', '경상도', '부산/경남'],
  전라: ['전라', '전라도', '전북', '전남'],
  충청: ['충청', '충청도', '충북', '충남'],
  해외: ['해외'],
};

const mapBarRegionToBootcampRegion = (regionLabel) => {
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

const resolveBootcampLocationFields = (venueText, regionFallback = '서울', type = 'domestic') => {
  const raw = String(venueText || '').trim();
  if (!raw || raw === '추후 공지') {
    return { venue: raw || '추후 공지', region: type === 'overseas' ? '해외' : regionFallback };
  }
  const bar = findBarByName(raw);
  if (!bar) return { venue: raw, region: regionFallback };
  return {
    venue: formatBarVenueLocationLine(bar),
    region: mapBarRegionToBootcampRegion(bar.region),
  };
};

const parseBootcampGenres = (value) => {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  const raw = String(value || '').trim();
  if (!raw) return ['바차타'];
  return raw.split(/[,/·|]/).map((s) => s.trim()).filter(Boolean);
};

const formatBootcampGenres = (value) => parseBootcampGenres(value).join(', ');

const formatBootDateShort = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.slice(5).replace('-', '.')} (${days[d.getDay()]})`;
};

const formatBootDateDot = (date) => {
  if (!date) return '';
  return date.slice(5).replace('-', '.');
};

const formatBootcampVenueLabel = (row) => {
  const loc = row?.venue || row?.location;
  if (loc && loc !== '추후 공지') return String(loc).split(' · ')[0].trim();
  return String(row?.region || '').trim();
};

const formatBootcampCardMetaLine = (row) => {
  const start = formatBootDateShort(row?.start_date);
  const end = row?.end_date && row.end_date !== row.start_date
    ? formatBootDateDot(row.end_date)
    : '';
  const datePart = end ? `${start} — ${end}` : start;
  const venue = formatBootcampVenueLabel(row);
  return venue ? `${datePart} · ${venue}` : datePart;
};

const parseBootcampPriceLines = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw.split(/\n|\/\/+/).map((line) => line.trim()).filter(Boolean);
};

const isBootcampEnded = (row, todayStr = getKSTCalendarTodayStr()) => {
  const end = normDate(row?.end_date || row?.start_date);
  return Boolean(end && end < todayStr);
};

const countBootcampPosterImages = (form) =>
  BOOTCAMP_POSTER_FIELDS.filter(({ key }) => String(form?.[key] || '').trim()).length;

const bootcampDetailPosterImages = (row) =>
  BOOTCAMP_POSTER_FIELDS
    .map(({ key, label }) => ({ label, url: String(row?.[key] || '').trim() }))
    .filter((item) => item.url);

const createEmptyBootcampForm = () => ({
  title: '',
  instructor: '',
  type: 'domestic',
  region: '서울',
  country: '',
  start_date: '',
  end_date: '',
  venue: '',
  fee: '',
  description: '',
  poster_url: '',
  price_poster_url: '',
  extra_poster_url: '',
  genres: ['바차타'],
  level: '초급',
  instagram: '',
  youtube: '',
  bank_info: '',
});

const filterBootcampsClient = (all, selectedRegion) => {
  const rows = (all || []).filter((b) => !isBootcampEnded(b));
  const sorted = [...rows].sort((a, b) => normDate(a.start_date).localeCompare(normDate(b.start_date)));
  if (selectedRegion === '전체') return sorted;
  const aliases = REGION_MAP[selectedRegion] || [selectedRegion];
  return rows
    .filter((b) => {
      if (selectedRegion === '해외') return b.type === 'overseas';
      return aliases.some((a) => (b.region || '').includes(a));
    })
    .sort((a, b) => normDate(a.start_date).localeCompare(normDate(b.start_date)));
};

const pickFeaturedBootcampHero = (rows) => {
  const withPoster = (rows || []).filter((row) => String(row.poster_url || '').trim());
  if (!withPoster.length) return null;
  return [...withPoster].sort((a, b) => normDate(a.start_date).localeCompare(normDate(b.start_date)))[0];
};

const Bootcamp = ({ onBack, initialView = 'list', cachedBootcamps = null, onBootcampsRefresh }) => {
  const [bootcamps, setBootcamps] = useState(() => filterBootcampsClient(cachedBootcamps, '전체'));
  const [loading, setLoading] = useState(!cachedBootcamps?.length);
  const usedCacheRef = useRef(Boolean(cachedBootcamps?.length));
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedBootcamp, setSelectedBootcamp] = useState(null);
  const [showBookingGuide, setShowBookingGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegistering, setIsRegistering] = useState(initialView === 'register');
  const [editingId, setEditingId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingField, setUploadingField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isOneDayEvent, setIsOneDayEvent] = useState(true);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [formData, setFormData] = useState(() => createEmptyBootcampForm());

  const featuredHero = useMemo(() => pickFeaturedBootcampHero(bootcamps), [bootcamps]);

  useEffect(() => {
    setIsRegistering(initialView === 'register');
    if (initialView === 'register') setCurrentStep(1);
  }, [initialView]);

  useEffect(() => {
    if (cachedBootcamps?.length) {
      setBootcamps(filterBootcampsClient(cachedBootcamps, selectedRegion));
      setLoading(false);
    }
  }, [cachedBootcamps, selectedRegion]);

  useEffect(() => {
    const st = readNavigationState();
    const detailId = st?.overlayMeta?.bootcampId;
    if (!detailId || st?.overlay !== 'bootcampDetail') return;
    const pool = cachedBootcamps?.length ? cachedBootcamps : bootcamps;
    const match = pool.find((b) => String(b.id) === String(detailId));
    if (match) setSelectedBootcamp(match);
  }, [bootcamps, cachedBootcamps]);

  const detailHistoryPushed = useRef(false);

  useEffect(() => {
    if (!selectedBootcamp) {
      detailHistoryPushed.current = false;
      return;
    }
    const st = readNavigationState();
    if (st?.overlay === 'bootcampDetail') {
      detailHistoryPushed.current = true;
      return;
    }
    if (!detailHistoryPushed.current) {
      detailHistoryPushed.current = true;
      pushOverlay('bootcampDetail', {
        path: '/bootcamp',
        meta: { bootcampId: selectedBootcamp.id },
      });
    }
  }, [selectedBootcamp]);

  useEffect(() => {
    const onHistory = (event) => {
      const st = event.detail?.state ?? parseAppState(window.history.state);
      if (st?.overlay !== 'bootcampDetail') setSelectedBootcamp(null);
    };
    window.addEventListener('bamppa-history', onHistory);
    return () => window.removeEventListener('bamppa-history', onHistory);
  }, []);

  useEffect(() => {
    if (usedCacheRef.current) {
      usedCacheRef.current = false;
      return;
    }
    fetchBootcamps();
  }, [selectedRegion]);

  const fetchBootcamps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bootcamps')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true });
      if (error) throw error;
      const rows = data || [];
      if (typeof onBootcampsRefresh === 'function') onBootcampsRefresh(rows);
      setBootcamps(filterBootcampsClient(rows, selectedRegion));
    } catch (err) {
      console.error('Error fetching bootcamps:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDDay = (row) => {
    const todayStr = getKSTCalendarTodayStr();
    const start = normDate(row?.start_date);
    const end = normDate(row?.end_date || row?.start_date);
    if (isBootcampEnded(row, todayStr)) return '종료';
    const target = start && start >= todayStr ? start : end;
    const targetDate = new Date(`${target}T12:00:00+09:00`);
    const todayDate = new Date(`${todayStr}T12:00:00+09:00`);
    const days = Math.ceil((targetDate - todayDate) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'D-DAY';
    return days > 0 ? `D-${days}` : '종료';
  };

  const handleImageUpload = async (e, fieldKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldKey);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `bootcamps/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('posters').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, [fieldKey]: publicUrl }));
    } catch (err) {
      alert('이미지 업로드 실패: ' + (err.message || err));
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const openEdit = (camp) => {
    setFormData({
      title: camp.title || '',
      instructor: camp.instructor || '',
      type: camp.type || 'domestic',
      region: camp.region || '서울',
      country: camp.country || '',
      start_date: camp.start_date || '',
      end_date: camp.end_date || '',
      venue: camp.venue || camp.location || '',
      fee: camp.fee || camp.price || '',
      description: camp.description || '',
      poster_url: camp.poster_url || '',
      price_poster_url: camp.price_poster_url || '',
      extra_poster_url: camp.extra_poster_url || '',
      genres: parseBootcampGenres(camp.genre),
      level: camp.level || '초급',
      instagram: camp.instagram || '',
      youtube: camp.youtube || '',
      bank_info: camp.bank_info || '',
    });
    setIsOneDayEvent(inferOneDayEvent(camp.start_date, camp.end_date));
    setEditingId(camp.id);
    setCurrentStep(1);
    setSelectedBootcamp(null);
    setTimeout(() => setIsRegistering(true), 50);
  };

  const handleVenueInputChange = (value) => {
    setFormData((prev) => ({ ...prev, venue: value }));
    if (!value.trim() || value.trim() === '추후 공지') {
      setLocationSuggestions([]);
      return;
    }
    setLocationSuggestions(searchBarVenueSuggestions(value));
  };

  const selectVenueSuggestion = (bar) => {
    setFormData((prev) => ({
      ...prev,
      venue: formatBarVenueLocationLine(bar),
      region: mapBarRegionToBootcampRegion(bar.region),
      type: 'domestic',
    }));
    setLocationSuggestions([]);
  };

  const toggleBootcampGenre = (genre) => {
    setFormData((prev) => {
      const selected = prev.genres || [];
      const has = selected.includes(genre);
      if (has) return { ...prev, genres: selected.filter((g) => g !== genre) };
      return { ...prev, genres: [...selected, genre] };
    });
  };

  const validateRegisterStep = (step) => {
    if (step === 1) {
      if (!String(formData.instructor || '').trim()) {
        alert('강사명을 입력해 주세요.');
        return false;
      }
      if (!String(formData.title || '').trim()) {
        alert('캠프 제목을 입력해 주세요.');
        return false;
      }
      if (!(formData.genres || []).length) {
        alert('주요 장르를 하나 이상 선택해 주세요.');
        return false;
      }
      const kindCheck = validateBootcampRegistration({
        title: formData.title,
        description: formData.description,
      });
      if (!kindCheck.ok) {
        alert(kindCheck.message);
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
      if (!String(formData.venue || '').trim()) {
        alert('상세 장소를 입력해 주세요.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!String(formData.fee || '').trim()) {
        alert('참가비 정보를 입력해 주세요.');
        return false;
      }
      if (!String(formData.poster_url || '').trim()) {
        alert('마스터 포스터를 업로드해 주세요.');
        return false;
      }
      if (!String(formData.price_poster_url || '').trim()) {
        alert('가격 포스터를 업로드해 주세요.');
        return false;
      }
      if (countBootcampPosterImages(formData) < 3) {
        alert('이미지는 최소 3장이 필요합니다. (마스터·가격·추가 포스터)');
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
    setFormData(createEmptyBootcampForm());
  };

  const buildBootcampPayload = (dates, resolved, status) => {
    const venue = resolved.venue;
    const fee = String(formData.fee || '').trim();
    return {
      title: String(formData.title || '').trim(),
      instructor: String(formData.instructor || '').trim(),
      type: formData.type || 'domestic',
      region: resolved.region,
      country: String(formData.country || '').trim() || null,
      start_date: dates.start_date,
      end_date: dates.end_date,
      venue,
      location: venue,
      fee,
      price: fee,
      description: String(formData.description || '').trim() || null,
      poster_url: formData.poster_url || null,
      price_poster_url: formData.price_poster_url || null,
      extra_poster_url: formData.extra_poster_url || null,
      genre: formatBootcampGenres(formData.genres),
      level: formData.level || '초급',
      instagram: String(formData.instagram || '').trim() || null,
      youtube: String(formData.youtube || '').trim() || null,
      bank_info: String(formData.bank_info || '').trim() || null,
      status,
    };
  };

  const insertBootcampRow = async (payload) => {
    const { error } = await supabase.from('bootcamps').insert([payload]);
    if (!error) return { error: null };
    const msg = String(error.message || '');
    if (msg.includes('price_poster_url') || msg.includes('extra_poster_url')) {
      const { price_poster_url, extra_poster_url, ...legacy } = payload;
      return supabase.from('bootcamps').insert([legacy]);
    }
    return { error };
  };

  const updateBootcampRow = async (payload) => {
    const { error } = await supabase.from('bootcamps').update(payload).eq('id', editingId);
    if (!error) return { error: null };
    const msg = String(error.message || '');
    if (msg.includes('price_poster_url') || msg.includes('extra_poster_url')) {
      const { price_poster_url, extra_poster_url, ...legacy } = payload;
      return supabase.from('bootcamps').update(legacy).eq('id', editingId);
    }
    return { error };
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
      const resolved = resolveBootcampLocationFields(formData.venue, formData.region, formData.type);
      const payload = buildBootcampPayload(dates, resolved, 'pending');
      const { error } = wasEdit
        ? await updateBootcampRow(payload)
        : await insertBootcampRow(payload);
      if (error) throw error;
      closeRegisterForm();
      fetchBootcamps();
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPeriodRange = (start, end) => {
    if (!start) return '';
    const startLabel = start.slice(5).replace('-', '.');
    if (!end || end === start) return startLabel;
    return `${startLabel} - ${end.slice(5).replace('-', '.')}`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes shimmer-boot {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skeleton-boot {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 1200px 100%;
          animation: shimmer-boot 1.4s infinite linear;
          border-radius: 12px;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ background: '#0D0D0D', minHeight: '100dvh', width: '100%', paddingBottom: '100px', color: '#f8fafc', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.12, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '8%', right: '8%', width: '45%', height: '45%', background: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        {!isRegistering && (
          <AppPageHeader
            variant="dark"
            sticky
            left={(
              <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <ChevronLeft size={24} color="#f8fafc" />
              </button>
            )}
            center={(
              <div style={{ fontSize: 18, fontWeight: 950, color: '#fff', letterSpacing: '-0.3px' }}>
                BOOTCAMP <span style={{ color: '#C9A84C' }}>MASTERS</span>
              </div>
            )}
            right={(
              <button
                type="button"
                onClick={() => { setCurrentStep(1); setTimeout(() => setIsRegistering(true), 50); }}
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #A68A3D)',
                  color: '#000', border: 'none', padding: '8px 14px', borderRadius: 12,
                  fontSize: 12, fontWeight: 1000, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus size={14} strokeWidth={3} /> 등록
              </button>
            )}
          />
        )}

        {!isRegistering && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ padding: '0 15px', marginTop: 10 }}>
              {featuredHero ? (
                <button
                  type="button"
                  onClick={() => setSelectedBootcamp(featuredHero)}
                  style={{
                    position: 'relative', width: '100%', height: 128, overflow: 'hidden',
                    borderRadius: 18, border: '1px solid rgba(201,168,76,0.35)', padding: 0,
                    cursor: 'pointer', background: '#111', display: 'block', textAlign: 'left',
                  }}
                >
                  <img
                    src={featuredHero.poster_url}
                    alt={featuredHero.title || featuredHero.instructor}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.08) 100%)' }} />
                  <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 900, color: '#C9A84C',
                      background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(201,168,76,0.45)',
                      padding: '3px 8px', borderRadius: 999,
                    }}>
                      💎 월드 마스터 · {getDDay(featuredHero)}
                    </span>
                    <div style={{
                      fontFamily: "'Bebas Neue', 'Black Han Sans', sans-serif",
                      fontSize: 22, lineHeight: 1.15, color: '#fff', marginTop: 8,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {featuredHero.instructor || featuredHero.title}
                    </div>
                  </div>
                </button>
              ) : (
                <div style={{
                  height: 88, borderRadius: 18, border: '1px solid rgba(201,168,76,0.25)',
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(13,13,13,0.95))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  color: '#C9A84C', fontWeight: 900, fontSize: 15,
                }}>
                  <span style={{ fontSize: 24 }}>💎</span>
                  <span>월드 마스터 부트캠프를 모아봤어요</span>
                </div>
              )}
            </div>

            <div style={{ padding: '0 15px', marginTop: 12, marginBottom: 2 }}>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {BOOTCAMP_REGIONS.map((r) => {
                  const active = selectedRegion === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRegion(r)}
                      style={{
                        padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                        fontSize: 13, fontWeight: active ? 900 : 600, cursor: 'pointer',
                        background: active ? '#C9A84C' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${active ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                        color: active ? '#000' : '#94a3b8',
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {!loading && bootcamps.length > 0 && (
              <div style={{ padding: '8px 15px 0', fontSize: 12, fontWeight: 800, color: '#64748b' }}>
                진행·예정 {bootcamps.length}건 · 시작일 순
              </div>
            )}

            <div style={{ padding: '12px 15px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? (
                [0, 1, 2].map((i) => (
                  <div key={i} style={{ display: 'flex', height: 130, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#141414' }}>
                    <div className="skeleton-boot" style={{ width: '36%', borderRadius: 0, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="skeleton-boot" style={{ height: 10, width: '45%' }} />
                      <div className="skeleton-boot" style={{ height: 15, width: '80%' }} />
                      <div className="skeleton-boot" style={{ height: 11, width: '55%' }} />
                    </div>
                  </div>
                ))
              ) : bootcamps.length === 0 ? (
                <div style={{ marginTop: 40, textAlign: 'center', padding: '40px 20px', borderRadius: 24, border: '1px dashed rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.03)' }}>
                  <div style={{ fontSize: 36, marginBottom: 14 }}>💎</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                    {selectedRegion === '전체' ? '등록된 부트캠프가 없습니다' : `${selectedRegion} 부트캠프가 없습니다`}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>첫 번째 월드 마스터 캠프를 등록해 보세요!</div>
                  <button
                    type="button"
                    onClick={() => { setCurrentStep(1); setTimeout(() => setIsRegistering(true), 50); }}
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #A68A3D)', color: '#000', border: 'none', padding: '13px 28px', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
                  >
                    + 부트캠프 등록
                  </button>
                </div>
              ) : (
                bootcamps.map((row) => {
                  const ddayLabel = getDDay(row);
                  const genreList = parseBootcampGenres(row.genre);
                  const visibleGenres = genreList.slice(0, 2);
                  const extraGenres = genreList.length - visibleGenres.length;
                  return (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      onClick={() => setSelectedBootcamp(row)}
                      style={{ display: 'flex', cursor: 'pointer', background: '#111', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div style={{ width: '36%', flexShrink: 0, position: 'relative', background: '#000', alignSelf: 'stretch', minHeight: 118 }}>
                        <img
                          src={row.poster_url || DEFAULT_CARD_IMAGE}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                          alt={row.title}
                          onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, padding: '12px 14px 12px 16px', display: 'flex', flexDirection: 'column', gap: 7, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ fontFamily: "'Bebas Neue', 'Black Han Sans', sans-serif", fontSize: 19, lineHeight: 1.2, color: '#fff', flex: 1, wordBreak: 'keep-all' }}>
                            {row.instructor || row.title}
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 900, flexShrink: 0,
                            color: ddayLabel === '종료' ? '#475569' : ddayLabel === 'D-DAY' ? '#000' : '#C9A84C',
                            background: ddayLabel === 'D-DAY' ? '#C9A84C' : 'rgba(201,168,76,0.1)',
                            border: '1px solid rgba(201,168,76,0.3)', padding: '3px 9px', borderRadius: 6,
                          }}>
                            {ddayLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formatBootcampCardMetaLine(row)}
                        </div>
                        {row.title && row.instructor && (
                          <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.title}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto' }}>
                          {visibleGenres.map((genre) => (
                            <span key={genre} style={{ fontSize: 10, fontWeight: 800, color: '#C9A84C', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.22)', padding: '3px 8px', borderRadius: 999 }}>
                              {genre}
                            </span>
                          ))}
                          {extraGenres > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', padding: '3px 4px' }}>+{extraGenres}</span>}
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

      <AnimatePresence>
        {isRegistering && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            style={{ background: '#0D0D0D', padding: '30px', position: 'fixed', inset: 0, zIndex: Z.modal, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
              <h2 style={{ fontSize: 24, fontWeight: 950, color: '#f8fafc', margin: 0 }}>
                {editingId ? '부트캠프 수정' : '부트캠프 신청'} ({currentStep}/4)
              </h2>
              <button type="button" onClick={closeRegisterForm} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} color="#94a3b8" />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
              {[1, 2, 3, 4].map((s) => (
                <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= currentStep ? '#C9A84C' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
            >
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12, letterSpacing: '1.5px' }}>1. 강사명</label>
                    <input value={formData.instructor} onChange={(e) => setFormData((p) => ({ ...p, instructor: e.target.value }))} placeholder="강사 이름" style={{ width: '100%', padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12, letterSpacing: '1.5px' }}>2. 캠프 제목</label>
                    <input value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="캠프 제목" style={{ width: '100%', padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12, letterSpacing: '1.5px' }}>3. 주요 장르 (중복 선택)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {BOOTCAMP_GENRE_OPTIONS.map((genre) => {
                        const selected = (formData.genres || []).includes(genre);
                        return (
                          <button key={genre} type="button" onClick={() => toggleBootcampGenre(genre)} style={{ padding: '14px 18px', borderRadius: 14, fontWeight: 900, fontSize: 15, cursor: 'pointer', border: `1px solid ${selected ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`, background: selected ? 'rgba(201,168,76,0.15)' : '#1A1A1A', color: selected ? '#C9A84C' : '#8E8E93' }}>
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>4. 레벨</label>
                      <select value={formData.level} onChange={(e) => setFormData((p) => ({ ...p, level: e.target.value }))} style={{ width: '100%', padding: 18, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#fff' }}>
                        {['초급', '중급', '상급', '전체'].map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>5. 국내/해외</label>
                      <div style={{ display: 'flex', gap: 8, height: '100%' }}>
                        {[['domestic', '국내'], ['overseas', '해외']].map(([val, label]) => (
                          <button key={val} type="button" onClick={() => setFormData((p) => ({ ...p, type: val, region: val === 'overseas' ? '해외' : p.region === '해외' ? '서울' : p.region }))} style={{ flex: 1, padding: '14px 8px', borderRadius: 14, fontWeight: 900, border: `1px solid ${formData.type === val ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`, background: formData.type === val ? 'rgba(201,168,76,0.15)' : '#1A1A1A', color: formData.type === val ? '#C9A84C' : '#8E8E93' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <EventDateFields compact isOneDay={isOneDayEvent} onOneDayChange={setIsOneDayEvent} start_date={formData.start_date} end_date={formData.end_date} startLabel="6. 시작 날짜" endLabel="7. 종료 날짜" onDatesChange={({ start_date, end_date }) => setFormData((p) => ({ ...p, start_date, end_date }))} />
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>8. 상세 장소</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input value={formData.venue} onChange={(e) => handleVenueInputChange(e.target.value)} placeholder="BAR·장소명 검색" style={{ flex: 1, padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#f8fafc', outline: 'none' }} />
                      <button type="button" onClick={() => { setFormData((p) => ({ ...p, venue: '추후 공지' })); setLocationSuggestions([]); }} style={{ padding: '0 20px', borderRadius: 18, background: formData.venue === '추후 공지' ? '#C9A84C' : 'rgba(255,255,255,0.05)', color: formData.venue === '추후 공지' ? '#000' : '#94a3b8', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>추후 공지</button>
                    </div>
                    {locationSuggestions.length > 0 && (
                      <div style={{ marginTop: 10, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: '#141414', overflow: 'hidden' }}>
                        {locationSuggestions.map((bar) => (
                          <button key={`${bar.name}-${bar.address}`} type="button" onClick={() => selectVenueSuggestion(bar)} style={{ width: '100%', textAlign: 'left', padding: '14px 16px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#f8fafc', cursor: 'pointer' }}>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>{bar.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{bar.address}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>9. 지역</label>
                    <select value={formData.region} onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))} style={{ width: '100%', padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#f8fafc' }}>
                      {['서울', '경인', '강원', '제주', '부산/경남', '전라도', '충청도', '해외'].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>10. 참가비 정보</label>
                    <input value={formData.fee} onChange={(e) => setFormData((p) => ({ ...p, fee: e.target.value }))} placeholder="예: 풀패스 250,000 / 파티 50,000" style={{ width: '100%', padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                    이미지 <strong style={{ color: '#C9A84C' }}>최소 3장</strong> 필수 · 마스터 포스터와 가격 포스터를 반드시 포함해 주세요.
                  </p>
                  {BOOTCAMP_POSTER_FIELDS.map(({ key, label, hint }, index) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>{11 + index}. {label}</label>
                      <div style={{ width: '100%', height: 200, borderRadius: 24, border: `2px dashed ${formData[key] ? 'rgba(201,168,76,0.55)' : 'rgba(201,168,76,0.3)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                        {formData[key] ? (
                          <img src={formData[key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <>
                            <ImageIcon color="#C9A84C" size={36} />
                            <span style={{ fontSize: 13, color: '#94a3b8', marginTop: 10 }}>{uploadingField === key ? '업로드 중...' : `${label} 선택`}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, key)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>{hint}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>14. 상세 설명</label>
                    <textarea rows={4} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="캠프 상세 내용" style={{ width: '100%', padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#f8fafc', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>15. 인스타그램 (선택)</label>
                    <input value={formData.instagram} onChange={(e) => setFormData((p) => ({ ...p, instagram: e.target.value }))} placeholder="https://instagram.com/..." style={{ width: '100%', padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>16. 유튜브 (선택)</label>
                    <input value={formData.youtube} onChange={(e) => setFormData((p) => ({ ...p, youtube: e.target.value }))} placeholder="https://youtube.com/..." style={{ width: '100%', padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#C9A84C', marginBottom: 12 }}>17. 입금 계좌</label>
                    <input value={formData.bank_info} onChange={(e) => setFormData((p) => ({ ...p, bank_info: e.target.value }))} placeholder="예: 카카오뱅크 3333-01-1234567 홍길동" style={{ width: '100%', padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', fontSize: 16, color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </motion.div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingBottom: 30 }}>
                {currentStep > 1 && (
                  <button type="button" onClick={() => setCurrentStep((s) => s - 1)} style={{ flex: 1, padding: 20, borderRadius: 18, background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)' }}>이전</button>
                )}
                {currentStep < 4 ? (
                  <button type="button" onClick={goNextRegisterStep} style={{ flex: 2, padding: 20, borderRadius: 18, background: 'linear-gradient(135deg, #C9A84C, #A68A3D)', color: '#000', fontWeight: 900, border: 'none' }}>다음 단계</button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: 24, borderRadius: 20, background: submitting ? 'rgba(201,168,76,0.45)' : 'linear-gradient(135deg, #C9A84C, #A68A3D)', color: '#000', fontWeight: 1000, fontSize: 18, border: 'none', cursor: submitting ? 'wait' : 'pointer' }}>
                    {submitting ? '등록 중...' : '신청 완료'}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBootcamp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: '#0D0D0D', zIndex: Z.modal, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(20px)' }}>
              <X size={32} onClick={goBackOrHome} style={{ cursor: 'pointer' }} />
              <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>BOOTCAMP DETAIL</span>
              <button type="button" onClick={() => openEdit(selectedBootcamp)} style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #C9A84C', color: '#C9A84C', padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>수정</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ position: 'relative', background: '#000', minHeight: 300, display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedBootcamp.poster_url || DEFAULT_CARD_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(0.3)', transform: 'scale(1.2)' }} />
                <img src={selectedBootcamp.poster_url || DEFAULT_CARD_IMAGE} alt="" style={{ width: '100%', height: 'auto', display: 'block', position: 'relative', zIndex: 1 }} onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)} />
              </div>
              {bootcampDetailPosterImages(selectedBootcamp).length > 1 && (
                <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {bootcampDetailPosterImages(selectedBootcamp).slice(1).map((item) => (
                    <div key={item.label} style={{ background: '#141414', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <p style={{ margin: 0, padding: '12px 16px', fontSize: 12, fontWeight: 900, color: '#C9A84C' }}>{item.label}</p>
                      <img src={item.url} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ padding: 30 }}>
                <h2 style={{ fontSize: 28, fontWeight: 950, marginBottom: 8, color: '#f8fafc' }}>{selectedBootcamp.instructor || selectedBootcamp.title}</h2>
                <div style={{ color: '#C9A84C', fontSize: 14, fontWeight: 900, marginBottom: 25 }}>
                  {selectedBootcamp.title} · {formatBootcampGenres(selectedBootcamp.genre)} · {selectedBootcamp.level}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 30 }}>
                  {[
                    { label: '기간', value: formatPeriodRange(selectedBootcamp.start_date, selectedBootcamp.end_date), icon: <Calendar size={18} color="#C9A84C" /> },
                    { label: '장소', value: selectedBootcamp.venue || selectedBootcamp.location || selectedBootcamp.region, icon: <MapPin size={18} color="#C9A84C" /> },
                    { label: '장르', value: formatBootcampGenres(selectedBootcamp.genre), icon: <Zap size={18} color="#C9A84C" /> },
                    { label: '지역', value: selectedBootcamp.region, icon: <ImageIcon size={18} color="#C9A84C" /> },
                  ].map((cell) => (
                    <div key={cell.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', fontWeight: 900, marginBottom: 6 }}>{cell.icon} {cell.label}</div>
                      <div style={{ fontSize: 14, color: '#f8fafc', fontWeight: 800 }}>{cell.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #A68A3D 100%)', padding: 24, borderRadius: 24, marginBottom: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.7)', fontWeight: 800, margin: '0 0 10px' }}>참가비</p>
                    {parseBootcampPriceLines(selectedBootcamp.fee || selectedBootcamp.price).map((line, idx) => (
                      <p key={idx} style={{ fontSize: 18, fontWeight: 950, color: '#000', margin: '0 0 8px', lineHeight: 1.5 }}>{line}</p>
                    ))}
                  </div>
                  <button type="button" onClick={() => setShowBookingGuide(true)} style={{ alignSelf: 'flex-end', background: '#000', border: 'none', padding: '14px 24px', borderRadius: 16, color: '#C9A84C', fontWeight: 1000, fontSize: 16, cursor: 'pointer' }}>예약하기</button>
                </div>
                {selectedBootcamp.description && (
                  <div style={{ padding: 24, background: '#141414', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#f8fafc', lineHeight: 1.8, fontSize: 16, whiteSpace: 'pre-wrap', margin: 0 }}>{selectedBootcamp.description}</p>
                  </div>
                )}
                {(selectedBootcamp.instagram || selectedBootcamp.youtube) && (
                  <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                    {selectedBootcamp.instagram && (
                      <button type="button" onClick={() => window.open(selectedBootcamp.instagram, '_blank')} style={{ flex: 1, padding: 14, borderRadius: 14, border: '1px solid rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.1)', color: '#E5C266', fontWeight: 900, cursor: 'pointer' }}>INSTAGRAM</button>
                    )}
                    {selectedBootcamp.youtube && (
                      <button type="button" onClick={() => window.open(selectedBootcamp.youtube, '_blank')} style={{ flex: 1, padding: 14, borderRadius: 14, border: '1px solid rgba(255,0,0,0.3)', background: 'rgba(255,0,0,0.1)', color: '#FF4444', fontWeight: 900, cursor: 'pointer' }}>YOUTUBE</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBookingGuide && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: 'fixed', inset: 0, zIndex: Z.modalNested, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
            <div style={{ width: '100%', maxWidth: 400, background: '#1A1A1A', borderRadius: 32, padding: '40px 30px', textAlign: 'center', border: '1px solid rgba(201,168,76,0.3)' }}>
              <Zap size={40} color="#C9A84C" style={{ marginBottom: 20 }} />
              <h3 style={{ fontSize: 22, fontWeight: 950, color: '#fff', marginBottom: 15 }}>잠깐! 확인해 주세요</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: 25 }}>입금 시 입금자명 뒤에 <span style={{ color: '#C9A84C', fontWeight: 900 }}>'밤빠'</span>를 꼭 기재해 주세요!</p>
              <div onClick={() => selectedBootcamp?.bank_info && copyToClipboard(selectedBootcamp.bank_info)} style={{ background: 'rgba(0,0,0,0.4)', padding: 24, borderRadius: 24, marginBottom: 20, textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)', cursor: selectedBootcamp?.bank_info ? 'pointer' : 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: '#64748b', fontWeight: 900, margin: 0 }}>ACCOUNT INFO</p>
                  {selectedBootcamp?.bank_info && <span style={{ fontSize: 10, color: '#C9A84C', fontWeight: 900 }}>{copied ? '복사 완료!' : '탭하여 복사'}</span>}
                </div>
                <p style={{ fontSize: 16, color: '#fff', fontWeight: 850, margin: 0 }}>{selectedBootcamp?.bank_info || '계좌 정보 없음'}</p>
              </div>
              <button type="button" onClick={() => setShowBookingGuide(false)} style={{ width: '100%', padding: 22, borderRadius: 20, background: '#C9A84C', color: '#000', fontWeight: 1000, fontSize: 16, border: 'none', cursor: 'pointer' }}>확인했습니다</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Bootcamp;
