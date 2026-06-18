import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Z } from '../constants/zLayers';
import { supabase } from '../lib/supabase';
import { adminDbMutate } from '../lib/adminApi';
import { findBarByName } from '../lib/BarLib';
import {
  appendLessonPublisherMeta,
  getLessonPublisherMeta,
  stripLessonPublisherMeta,
} from '../lib/lessonPublisher';
import { CLASS_CATEGORIES, DANCE_STYLES, DAYS, REGIONS } from '../lib/constants';

const FORM_Z = Z.modalHigh;

const WEEK_COUNT_OPTIONS = [4, 6, 8];
const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

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

const weekdayFromDate = (dateStr) => {
  if (!dateStr) return '';
  return DAYS_KOR[parseDateParts(dateStr).getDay()];
};

/** N주반 — 같은 요일 기준 N회차의 마지막 수업일 */
export const calcRegularCourseEndDate = (startDate, weekCount) => {
  if (!startDate || !weekCount || weekCount === 'custom') return '';
  const weeks = Number(weekCount);
  if (!Number.isFinite(weeks) || weeks < 1) return '';
  const d = parseDateParts(startDate);
  d.setDate(d.getDate() + (weeks - 1) * 7);
  return formatDateParts(d);
};

export const buildDurationLabel = (scheduleType, weekCount, endDate) => {
  if (scheduleType === 'oneday') return '원데이';
  if (weekCount === 'custom') return endDate ? `~ ${endDate}` : '기간 미지정';
  const weeks = Number(weekCount);
  if (!Number.isFinite(weeks)) return endDate ? `~ ${endDate}` : '기간 미지정';
  return endDate ? `${weeks}주 · ~ ${endDate}` : `${weeks}주`;
};

const parseScheduleFromItem = (item) => {
  const duration = String(item?.duration || '');
  const endDateMatch = duration.match(/~\s*(\d{4}-\d{2}-\d{2})/);
  const endDate = endDateMatch?.[1] || '';
  const startDate = item?.start_date || '';

  if (/원데이/i.test(duration)) {
    return {
      scheduleType: 'oneday',
      weekCount: 4,
      endDate: startDate || endDate,
    };
  }

  const weekMatch = duration.match(/(\d+)\s*주/);
  if (weekMatch) {
    const weekCount = Number(weekMatch[1]);
    return {
      scheduleType: 'regular',
      weekCount: WEEK_COUNT_OPTIONS.includes(weekCount) ? weekCount : 'custom',
      endDate: endDate || calcRegularCourseEndDate(startDate, weekCount),
    };
  }

  if (endDate) {
    return { scheduleType: 'regular', weekCount: 'custom', endDate };
  }

  return { scheduleType: 'regular', weekCount: 4, endDate: calcRegularCourseEndDate(startDate, 4) };
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '2px solid #E2E8F0',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 600,
  color: '#1E293B',
  background: '#fff',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 800,
  color: '#475569',
  marginBottom: '6px',
};

const chipStyle = (active) => ({
  padding: '8px 12px',
  borderRadius: '999px',
  border: active ? '2px solid #E53935' : '1px solid #E2E8F0',
  background: active ? '#FFF5F5' : '#fff',
  color: active ? '#E53935' : '#64748B',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
});

const buildCategoryLevelLabel = (categories, customCategory) => {
  const parts = categories.map((cat) => (
    cat === '기타' && String(customCategory || '').trim()
      ? String(customCategory).trim()
      : cat
  )).filter(Boolean);
  return parts.join(' · ');
};

const parseCategories = (levelStr) => {
  const parts = String(levelStr || '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const known = parts.filter((p) => CLASS_CATEGORIES.includes(p));
  const custom = parts.find((p) => !CLASS_CATEGORIES.includes(p));
  if (known.length) {
    return {
      categories: known.includes('기타') ? known : known,
      custom_category: known.includes('기타') ? (custom || '') : '',
    };
  }
  if (custom) return { categories: ['기타'], custom_category: custom };
  return { categories: [], custom_category: '' };
};

export const buildVenueLessonFormState = (item) => {
  const days = String(item?.day_of_week || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const genres = String(item?.genre || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const { categories, custom_category: customCategory } = parseCategories(item?.level);
  const publisher = getLessonPublisherMeta(item || {});
  const feeRaw = String(item?.fee || '').replace(/만원|원/g, '').trim();
  const { scheduleType, weekCount, endDate } = parseScheduleFromItem(item);
  const startDate = item?.start_date || new Date().toISOString().split('T')[0];

  return {
    title: item?.title || '',
    dance_styles: genres.length ? genres : ['바차타'],
    categories,
    custom_category: customCategory,
    days,
    scheduleType,
    weekCount,
    startTime: item?.start_time || '19:00',
    endTime: item?.end_time || '21:00',
    fee: feeRaw,
    description: stripLessonPublisherMeta(item?.description),
    startDate,
    endDate: scheduleType === 'oneday' ? startDate : endDate,
    studio_name: item?.studio_name || '',
    address: item?.address || '',
    region: item?.city || '서울',
    location_id: item?.location_id ? String(item.location_id) : (publisher.id || ''),
    poster_url: item?.poster_url || '',
    status: item?.status || 'approved',
  };
};

export default function AdminVenueLessonForm({
  item,
  isEdit = false,
  adminApiSecret = '',
  onClose,
  onSaved,
}) {
  const itemKey = item?.id || 'new';
  const initial = useMemo(() => buildVenueLessonFormState(item), [itemKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState(initial);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(initial.poster_url);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const next = buildVenueLessonFormState(item);
    setForm(next);
    setPosterFile(null);
    setPosterPreview(next.poster_url);
    setError('');
  }, [itemKey, item]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('locations')
        .select('id, name, address')
        .order('name', { ascending: true });
      if (!cancelled) setLocations(data || []);
    })();
    return () => { cancelled = true; };
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setScheduleType = (scheduleType) => {
    setForm((prev) => {
      const next = { ...prev, scheduleType };
      if (scheduleType === 'oneday') {
        const day = weekdayFromDate(prev.startDate);
        return {
          ...next,
          endDate: prev.startDate,
          days: day ? [day] : prev.days,
        };
      }
      const end = prev.weekCount === 'custom'
        ? prev.endDate
        : calcRegularCourseEndDate(prev.startDate, prev.weekCount);
      return { ...next, endDate: end };
    });
  };

  const setWeekCount = (weekCount) => {
    setForm((prev) => {
      const endDate = weekCount === 'custom'
        ? prev.endDate
        : calcRegularCourseEndDate(prev.startDate, weekCount);
      return { ...prev, weekCount, endDate };
    });
  };

  const setStartDate = (startDate) => {
    setForm((prev) => {
      if (prev.scheduleType === 'oneday') {
        const day = weekdayFromDate(startDate);
        return {
          ...prev,
          startDate,
          endDate: startDate,
          days: day ? [day] : prev.days,
        };
      }
      const endDate = prev.weekCount === 'custom'
        ? prev.endDate
        : calcRegularCourseEndDate(startDate, prev.weekCount);
      return { ...prev, startDate, endDate };
    });
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const toggleStyle = (style) => {
    setForm((prev) => ({
      ...prev,
      dance_styles: prev.dance_styles.includes(style)
        ? prev.dance_styles.filter((s) => s !== style)
        : [...prev.dance_styles, style],
    }));
  };

  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleLocationPick = (locationId) => {
    const loc = locations.find((row) => String(row.id) === String(locationId));
    if (!loc) {
      setField('location_id', '');
      return;
    }
    setForm((prev) => ({
      ...prev,
      location_id: String(loc.id),
      studio_name: loc.name || prev.studio_name,
      address: loc.address || prev.address,
    }));
  };

  const handleStudioNameChange = (name) => {
    setField('studio_name', name);
    const match = findBarByName(name);
    if (match?.address) setField('address', match.address);
  };

  const buildRow = (posterUrl) => {
    const publisherId = form.location_id || '';
    const isOneday = form.scheduleType === 'oneday';
    const endDate = isOneday ? form.startDate : form.endDate;
    const dayOfWeek = isOneday
      ? (form.days[0] || weekdayFromDate(form.startDate))
      : form.days.join(', ');
    const row = {
      title: form.title.trim(),
      genre: form.dance_styles.join(', '),
      level: buildCategoryLevelLabel(form.categories, form.custom_category),
      day_of_week: dayOfWeek,
      start_time: form.startTime,
      end_time: form.endTime,
      start_date: form.startDate,
      duration: buildDurationLabel(form.scheduleType, form.weekCount, endDate),
      studio_name: form.studio_name.trim(),
      address: form.address.trim(),
      city: form.region,
      fee: form.fee ? `${form.fee}만원` : '참가비 문의',
      poster_url: posterUrl,
      status: form.status || 'approved',
      category_type: 'venue',
      description: appendLessonPublisherMeta(form.description, 'venue', publisherId),
    };
    if (publisherId && !String(publisherId).startsWith('bar-')) {
      row.location_id = publisherId;
    }
    return row;
  };

  const handleSave = async () => {
    setError('');
    const isOneday = form.scheduleType === 'oneday';
    if (!form.title.trim()) {
      setError('수업 명칭을 입력해주세요.');
      return;
    }
    if (!form.studio_name.trim()) {
      setError('BAR(업체) 이름을 입력해주세요.');
      return;
    }
    if (!form.startDate) {
      setError(isOneday ? '수업 날짜를 선택해주세요.' : '개강일을 선택해주세요.');
      return;
    }
    if (form.scheduleType !== 'oneday' && form.days.length === 0) {
      setError('요일을 하나 이상 선택해주세요.');
      return;
    }
    if (form.scheduleType === 'regular' && form.weekCount === 'custom' && !form.endDate) {
      setError('종강일을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      let posterUrl = (posterPreview || '').trim();
      if (posterFile) {
        const fileName = `lessons/${Date.now()}_admin_lesson.jpg`;
        const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, posterFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('posters').getPublicUrl(fileName);
        posterUrl = data.publicUrl;
      }
      if (!posterUrl) {
        setError('포스터 URL을 입력하거나 이미지를 업로드해주세요.');
        setLoading(false);
        return;
      }

      const row = buildRow(posterUrl);

      if (isEdit && item?.id) {
        let saveError = null;
        if (adminApiSecret) {
          const { error } = await adminDbMutate({
            adminSecret: adminApiSecret,
            table: 'classes_info',
            action: 'update',
            id: item.id,
            payload: row,
          });
          saveError = error;
        }
        if (!adminApiSecret || saveError) {
          let { error } = await supabase.from('classes_info').update(row).eq('id', item.id);
          if (error && /location_id/i.test(String(error.message || ''))) {
            const { location_id: _drop, ...legacy } = row;
            ({ error } = await supabase.from('classes_info').update(legacy).eq('id', item.id));
          }
          if (error) throw error;
        }
      } else {
        let { error } = await supabase.from('classes_info').insert([row]);
        if (error && /location_id/i.test(String(error.message || ''))) {
          const { location_id: _drop, ...legacy } = row;
          ({ error } = await supabase.from('classes_info').insert([legacy]));
        }
        if (error) throw error;
      }

      window.dispatchEvent(new CustomEvent('bchata-lessons-refresh'));
      onSaved?.();
    } catch (err) {
      setError(err?.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="admin-venue-lesson-form"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: FORM_Z,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
      }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? '업체 수업 수정' : '업체 수업 등록'}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(100%, 520px)',
          maxHeight: 'min(92vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px 18px 0 0',
          background: '#fff',
          boxShadow: '0 -8px 32px rgba(15, 23, 42, 0.16)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px 12px',
          borderBottom: '1px solid #F1F5F9',
          flexShrink: 0,
        }}
        >
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#1E293B' }}>
            {isEdit ? '업체 수업 수정' : '업체 수업 등록'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              border: 'none',
              background: '#F1F5F9',
              borderRadius: '10px',
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error ? (
            <p style={{ margin: 0, padding: '10px 12px', borderRadius: '10px', background: '#FEF2F2', color: '#B91C1C', fontSize: '13px', fontWeight: 700 }}>
              {error}
            </p>
          ) : null}

          <div>
            <label style={labelStyle}>수업 명칭 *</label>
            <input
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="예) 바차타 초급 정규반"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>연결 BAR (locations)</label>
            <select
              value={form.location_id}
              onChange={(e) => handleLocationPick(e.target.value)}
              style={inputStyle}
            >
              <option value="">직접 입력</option>
              {locations.map((loc) => (
                <option key={loc.id} value={String(loc.id)}>
                  {loc.name}
                  {loc.address ? ` · ${loc.address}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>BAR(업체) 이름 *</label>
            <input
              value={form.studio_name}
              onChange={(e) => handleStudioNameChange(e.target.value)}
              placeholder="예) 강남턴"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>주소</label>
            <input
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder="상세 주소"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>지역</label>
            <select value={form.region} onChange={(e) => setField('region', e.target.value)} style={inputStyle}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>장르</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DANCE_STYLES.map((style) => (
                <button key={style} type="button" style={chipStyle(form.dance_styles.includes(style))} onClick={() => toggleStyle(style)}>
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>레벨/유형</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CLASS_CATEGORIES.map((cat) => (
                <button key={cat} type="button" style={chipStyle(form.categories.includes(cat))} onClick={() => toggleCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            {form.categories.includes('기타') ? (
              <input
                value={form.custom_category}
                onChange={(e) => setField('custom_category', e.target.value)}
                placeholder="기타 유형 직접 입력"
                style={{ ...inputStyle, marginTop: '8px' }}
              />
            ) : null}
          </div>

          <div>
            <label style={labelStyle}>수업 유형 *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button type="button" style={chipStyle(form.scheduleType === 'oneday')} onClick={() => setScheduleType('oneday')}>
                원데이
              </button>
              <button type="button" style={chipStyle(form.scheduleType === 'regular')} onClick={() => setScheduleType('regular')}>
                정규반 (주차)
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>포스터 *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPosterFile(file);
                setPosterPreview(URL.createObjectURL(file));
              }}
              style={{ width: '100%', fontSize: '13px', marginBottom: '8px' }}
            />
            {posterPreview ? (
              <img
                src={posterPreview}
                alt=""
                style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '12px', display: 'block', marginBottom: '8px' }}
              />
            ) : null}
            <input
              value={form.poster_url}
              onChange={(e) => {
                const url = e.target.value;
                setField('poster_url', url);
                setPosterFile(null);
                setPosterPreview(url);
              }}
              placeholder="또는 포스터 URL"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{form.scheduleType === 'oneday' ? '수업 날짜 *' : '개강일 *'}</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
            {form.scheduleType === 'oneday' && form.startDate ? (
              <p style={{ margin: '6px 0 0', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                {weekdayFromDate(form.startDate)}요일 원데이 수업
              </p>
            ) : null}
          </div>

          {form.scheduleType === 'regular' ? (
            <>
              <div>
                <label style={labelStyle}>기간 (주차) *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {WEEK_COUNT_OPTIONS.map((weeks) => (
                    <button
                      key={weeks}
                      type="button"
                      style={chipStyle(form.weekCount === weeks)}
                      onClick={() => setWeekCount(weeks)}
                    >
                      {weeks}주
                    </button>
                  ))}
                  <button
                    type="button"
                    style={chipStyle(form.weekCount === 'custom')}
                    onClick={() => setWeekCount('custom')}
                  >
                    직접입력
                  </button>
                </div>
                {form.weekCount !== 'custom' && form.endDate ? (
                  <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: 700, color: '#E53935' }}>
                    종강일 자동: {form.endDate} ({form.weekCount}주 · 주 {form.days.join(', ') || '요일 선택'})
                  </p>
                ) : null}
              </div>

              <div>
                <label style={labelStyle}>요일 *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {DAYS.map((day) => (
                    <button key={day} type="button" style={chipStyle(form.days.includes(day))} onClick={() => toggleDay(day)}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {form.weekCount === 'custom' ? (
                <div>
                  <label style={labelStyle}>종강일 *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setField('endDate', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>시작 시간</label>
              <input type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>종료 시간</label>
              <input type="time" value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>참가비 (만원)</label>
            <input
              value={form.fee}
              onChange={(e) => setField('fee', e.target.value.replace(/[^\d]/g, ''))}
              placeholder="예) 15"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>노출 상태</label>
            <select value={form.status} onChange={(e) => setField('status', e.target.value)} style={inputStyle}>
              <option value="approved">승인(노출)</option>
              <option value="pending">승인대기</option>
              <option value="rejected">반려</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="수업 소개"
              rows={4}
              style={{ ...inputStyle, minHeight: '96px', resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '14px 18px calc(14px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid #F1F5F9',
          flexShrink: 0,
        }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#fff',
              color: '#64748B',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1.4,
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: loading ? '#FDA4AF' : '#E53935',
              color: '#fff',
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '저장 중…' : (isEdit ? '수정 완료' : '등록')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
