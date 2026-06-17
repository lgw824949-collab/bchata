import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Z } from '../constants/zLayers'
import { supabase } from '../lib/supabase'
import { findBarByName } from '../lib/BarLib'
import { toDateOrNull } from '../lib/dbSanitize'
import { getKSTNightlifeTodayStr } from '../lib/dateNorm'
import { KOREAN_WEEKDAYS } from '../lib/partyRecurrence'

const FORM_Z = Z.modalHigh

const parseTitleRegion = (title) => {
  const m = (title || '').match(/^\[(.*?)\]/)
  return m?.[1]?.trim() || ''
}

const stripPartyTitle = (title) =>
  (title || '').replace(/^\[.*?\]\s*/, '').replace(/ ㅣ 오늘밤빠$/, '').trim()

const parseTimeRange = (timeRaw, endTimeFallback) => {
  const raw = String(timeRaw || '').trim()
  if (raw.includes('-')) {
    const [start, end] = raw.split('-').map((s) => s.trim().slice(0, 5))
    return { start: start || '21:00', end: end || '02:00' }
  }
  return {
    start: raw.slice(0, 5) || '21:00',
    end: String(endTimeFallback || '02:00').slice(0, 5) || '02:00',
  }
}

export const buildFormState = (item) => {
  const times = parseTimeRange(item?.time, item?.end_time)
  return {
    title: stripPartyTitle(item?.title),
    location_name: item?.location_name || item?.locations?.name || '',
    location_id: item?.location_id ?? item?.locations?.id ?? null,
    address: item?.address || item?.locations?.address || '',
    date: item?.date || (item?.is_weekly_recurring ? '' : getKSTNightlifeTodayStr()),
    start_time: times.start,
    end_time: times.end,
    region: item?.region || parseTitleRegion(item?.title) || '서울',
    fee: item?.fee || '',
    is_weekly_recurring: Boolean(item?.is_weekly_recurring),
    day_of_week: item?.day_of_week || '',
    poster_url: item?.poster_url || '',
    s_ratio: item?.s_ratio ?? 5,
    b_ratio: item?.b_ratio ?? 5,
    j_ratio: item?.j_ratio ?? 0,
    k_ratio: item?.k_ratio ?? 0,
    latitude: item?.latitude ?? item?.locations?.latitude ?? null,
    longitude: item?.longitude ?? item?.locations?.longitude ?? null,
  }
}

const classifyRegion = (address) => {
  if (!address) return ''
  if (address.includes('서울')) return '서울'
  if (address.includes('인천')) return '인천'
  if (address.includes('경기')) return '경기'
  if (address.includes('부산')) return '부산'
  if (address.includes('대구')) return '대구'
  if (address.includes('광주')) return '광주'
  if (address.includes('대전')) return '대전'
  if (address.includes('울산')) return '울산'
  if (address.includes('세종')) return '세종'
  if (address.includes('강원')) return '강원'
  if (address.includes('제주')) return '제주'
  return ''
}

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
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 800,
  color: '#475569',
  marginBottom: '6px',
}

export default function AdminSocialPartyForm({ item, isEdit = false, onClose, onSaved }) {
  const itemKey = item?.id || 'new'
  const initial = useMemo(() => buildFormState(item), [itemKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState(initial)
  const [posterFile, setPosterFile] = useState(null)
  const [posterPreview, setPosterPreview] = useState(initial.poster_url)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const next = buildFormState(item)
    setForm(next)
    setPosterFile(null)
    setPosterPreview(next.poster_url)
    setError('')
  }, [itemKey, item])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const resolveLocationId = async () => {
    if (form.location_id) return form.location_id
    const name = (form.location_name || '').trim()
    if (!name) return null

    const { data: exactRows } = await supabase.from('locations').select('id').eq('name', name).limit(3)
    if (exactRows?.[0]?.id) return exactRows[0].id

    const { data: fuzzyRows } = await supabase.from('locations').select('id').ilike('name', `%${name}%`).limit(3)
    if (fuzzyRows?.[0]?.id) return fuzzyRows[0].id

    const bar = findBarByName(name)
    if (bar?.name) {
      const { data: barRows } = await supabase.from('locations').select('id').eq('name', bar.name).limit(1)
      if (barRows?.[0]?.id) return barRows[0].id
    }

    const targetRegion = form.region || classifyRegion(form.address) || '서울'
    const { data: reg } = await supabase.from('regions').select('id').ilike('name', `%${targetRegion}%`).limit(1).maybeSingle()
    const barMaster = findBarByName(name)
    const { data: newLocs, error: locError } = await supabase.from('locations').insert([{
      name: barMaster?.name || name,
      address: form.address || barMaster?.address || '',
      region_id: reg?.id || 1,
      latitude: form.latitude,
      longitude: form.longitude,
    }]).select('id')
    if (locError) throw locError
    return newLocs?.[0]?.id ?? null
  }

  const handleSave = async () => {
    setError('')
    if (!form.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    if (!form.location_name.trim()) {
      setError('장소명을 입력해주세요.')
      return
    }
    if (form.is_weekly_recurring) {
      if (!form.day_of_week) {
        setError('매주 고정은 요일을 선택해주세요.')
        return
      }
    } else if (!form.date) {
      setError('날짜를 선택해주세요.')
      return
    }

    setLoading(true)
    try {
      let posterUrl = (posterPreview || '').trim()
      if (posterFile) {
        const fileName = `posters/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
        const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, posterFile)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('posters').getPublicUrl(fileName)
        posterUrl = data.publicUrl
      }
      if (!posterUrl) {
        setError('포스터 URL을 입력하거나 이미지를 업로드해주세요.')
        setLoading(false)
        return
      }

      const locationId = await resolveLocationId()
      if (!locationId) {
        setError('장소 연결에 실패했습니다. 장소명을 확인해주세요.')
        setLoading(false)
        return
      }

      const region = (form.region || classifyRegion(form.address) || '서울').trim()
      let processedTitle = form.title.trim()
      if (processedTitle && !processedTitle.includes('오늘밤빠')) {
        processedTitle = `${processedTitle} ㅣ 오늘밤빠`
      }
      const finalTitle = `[${region}] ${processedTitle}`
      const timeValue = [form.start_time, form.end_time].filter(Boolean).join('-')

      const contributorId = isEdit
        ? (item?.contributor_id ? String(item.contributor_id).trim() : null)
        : 'bchata-admin'

      const partyData = {
        title: finalTitle,
        location_id: locationId,
        address: form.address || '',
        fee: form.fee?.trim() || '문의',
        date: form.is_weekly_recurring ? null : toDateOrNull(form.date),
        time: timeValue,
        day_of_week: form.is_weekly_recurring ? form.day_of_week : form.day_of_week || null,
        is_weekly_recurring: Boolean(form.is_weekly_recurring),
        poster_url: posterUrl,
        s_ratio: Number(form.s_ratio) || 0,
        b_ratio: Number(form.b_ratio) || 0,
        j_ratio: Number(form.j_ratio) || 0,
        k_ratio: Number(form.k_ratio) || 0,
        contributor_id: contributorId,
        status: 'approved',
      }

      const table = item?._table || 'parties'
      if (isEdit && item?.id) {
        const { error: updateError } = await supabase.from(table).update(partyData).eq('id', item.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from(table).insert([partyData])
        if (insertError) throw insertError
      }

      window.dispatchEvent(new CustomEvent('bchata-refresh-parties'))
      if (typeof onSaved === 'function') onSaved()
    } catch (err) {
      setError(err?.message || '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const onPosterFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
  }

  const onDateChange = (nextDate) => {
    const dayName = nextDate ? KOREAN_WEEKDAYS[new Date(nextDate).getDay()] : ''
    setForm((prev) => ({
      ...prev,
      date: nextDate,
      day_of_week: prev.is_weekly_recurring ? dayName : prev.day_of_week,
    }))
  }

  const panel = (
    <div
      className="admin-social-party-form"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: FORM_Z,
        background: 'rgba(15, 23, 42, 0.72)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        colorScheme: 'light',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? '소셜 수정' : '소셜 등록'}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto',
          background: '#fff',
          minHeight: '100dvh',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
          color: '#1E293B',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>
            {isEdit ? '소셜 수정' : '소셜 등록'}
          </h2>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={24} />
          </button>
        </div>

        <div className="admin-social-party-form__body" style={{ padding: '20px', background: '#fff' }}>
          {error ? (
            <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: '13px', fontWeight: 700 }}>
              {error}
            </div>
          ) : null}

          {posterPreview ? (
            <img
              src={posterPreview}
              alt="포스터 미리보기"
              style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '12px', background: '#F8FAFC', marginBottom: '16px' }}
            />
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>제목</label>
              <input type="text" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="예: 라틴 바차타 맛집" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>지역</label>
              <select value={form.region} onChange={(e) => setField('region', e.target.value)} style={inputStyle}>
                {['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>장소명</label>
              <input type="text" value={form.location_name} onChange={(e) => setField('location_name', e.target.value)} placeholder="예: 홍대 보니따" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>주소</label>
              <input type="text" value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="상세 주소" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>일정 유형</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { key: false, label: '이번 날짜만' },
                  { key: true, label: '매주 고정' },
                ].map(({ key, label }) => (
                  <button
                    key={String(key)}
                    type="button"
                    onClick={() => setForm((prev) => ({
                      ...prev,
                      is_weekly_recurring: key,
                      day_of_week: key && prev.date ? KOREAN_WEEKDAYS[new Date(prev.date).getDay()] : prev.day_of_week,
                    }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: form.is_weekly_recurring === key ? '2px solid #FF1744' : '2px solid #E2E8F0',
                      background: form.is_weekly_recurring === key ? '#FFF5F7' : '#fff',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>{form.is_weekly_recurring ? '기준 날짜' : '날짜'}</label>
                <input type="date" value={form.date} onChange={(e) => onDateChange(e.target.value)} style={inputStyle} />
              </div>
              {form.is_weekly_recurring ? (
                <div>
                  <label style={labelStyle}>요일</label>
                  <select value={form.day_of_week} onChange={(e) => setField('day_of_week', e.target.value)} style={inputStyle}>
                    <option value="">선택</option>
                    {KOREAN_WEEKDAYS.map((d) => <option key={d} value={d}>{d}요일</option>)}
                  </select>
                </div>
              ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>시작</label>
                <input type="time" value={form.start_time} onChange={(e) => setField('start_time', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>종료</label>
                <input type="time" value={form.end_time} onChange={(e) => setField('end_time', e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>입장료</label>
              <input type="text" value={form.fee} onChange={(e) => setField('fee', e.target.value)} placeholder="예: 예매 1.5만 · 현장 2만" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>포스터 URL</label>
              <input
                type="url"
                value={posterFile ? '' : (form.poster_url || posterPreview || '')}
                onChange={(e) => {
                  setPosterFile(null)
                  setPosterPreview(e.target.value)
                  setField('poster_url', e.target.value)
                }}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>포스터 업로드</label>
              <input type="file" accept="image/*" onChange={onPosterFile} style={{ width: '100%', fontSize: '13px' }} />
            </div>

            <div>
              <label style={labelStyle}>음악 비율 (B / S / J / K)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { l: 'B', k: 'b_ratio' },
                  { l: 'S', k: 's_ratio' },
                  { l: 'J', k: 'j_ratio' },
                  { l: 'K', k: 'k_ratio' },
                ].map((g) => (
                  <div key={g.k} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#FF1744', marginBottom: '4px' }}>{g.l}</div>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={form[g.k]}
                      onChange={(e) => setField(g.k, Number(e.target.value) || 0)}
                      style={{ ...inputStyle, padding: '8px', textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px', background: '#fff' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', background: '#F1F5F9', color: '#64748B', fontWeight: 900, cursor: 'pointer' }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            style={{ flex: 2, height: '52px', borderRadius: '14px', border: 'none', background: '#FF1744', color: '#fff', fontWeight: 900, fontSize: '16px', cursor: 'pointer' }}
          >
            {loading ? '저장 중...' : (isEdit ? '수정 완료' : '등록 완료')}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}
