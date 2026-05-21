import { Z } from './constants/zLayers';
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, ChevronLeft, Check, X, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'
import { getKakaoApiKey } from './lib/kakaoEnv'
import { findBarByName } from './lib/BarLib'
import { normalizeVenueAddressKey } from './lib/venueDedupe'

const METRO_REGIONS = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

const TITLE_EXAMPLES = [
  "[강남] 라틴클럽 바차타 맛집 ㅣ 오늘밤빠",
  "[홍대] 홍턴 외국인의 성지 소셜파티 ㅣ 오늘밤빠",
  "[청주] 살사사랑 화요일 정모 맛집 ㅣ 오늘밤빠",
  "[대구] 바야 구라짱이랑 놀자! 라틴 성지 ㅣ 오늘밤빠"
];

const PARTY_REGISTER_Z = Z.modalHigh
const PARTY_REGISTER_BODY_CLASS = 'party-register-open'

const GENRE_RATIO_FIELDS = [
  { key: 'bRatio', tags: ['바차타', 'bachata'] },
  { key: 'sRatio', tags: ['살사', 'salsa'] },
  { key: 'jRatio', tags: ['쥬크', 'zouk'] },
  { key: 'kRatio', tags: ['키좀바', 'kizomba'] },
]

const getDominantGenreEntry = (data) => {
  const scored = GENRE_RATIO_FIELDS.map((g) => ({ ...g, val: Number(data[g.key]) || 0 }))
  const max = Math.max(...scored.map((s) => s.val), 0)
  if (max <= 0) return null
  const tops = scored.filter((s) => s.val === max)
  return tops.length === 1 ? tops[0] : null
}

/** 입장료 — 예매·현장·메너음료 각각 가격 선택 후 합쳐 저장 */
const FEE_CHANNELS = [
  { key: 'booking', label: '예매' },
  { key: 'onsite', label: '현장' },
  { key: 'mannerDrink', label: '메너음료' },
]

const FEE_QUICK_PRICES = [
  { label: '1만', display: '1만' },
  { label: '1.2만', display: '1.2만' },
  { label: '1.5만', display: '1.5만' },
  { label: '1.8만', display: '1.8만' },
  { label: '2만', display: '2만' },
  { label: '2.5만', display: '2.5만' },
  { label: '3만', display: '3만' },
]

const emptyFeeParts = () => ({ booking: '', onsite: '', mannerDrink: '' })

const parseTitleRegion = (title) => {
  const m = (title || '').match(/^\[(.*?)\]/)
  return m?.[1]?.trim() || ''
}

/** DB fee 문자열 → 예매/현장/메너음료 UI 상태 */
const parsePartyFeeToParts = (feeStr) => {
  const feeParts = emptyFeeParts()
  if (!feeStr || !String(feeStr).trim()) return { feeParts, feeCustom: '' }

  const unmatched = []
  for (const seg of String(feeStr).split('·').map((s) => s.trim()).filter(Boolean)) {
    if (/^메너음료$/i.test(seg)) {
      feeParts.mannerDrink = 'on'
      continue
    }
    let matched = false
    for (const ch of FEE_CHANNELS) {
      if (ch.key === 'mannerDrink') continue
      const prefix = `${ch.label} `
      if (seg.startsWith(prefix)) {
        feeParts[ch.key] = seg.slice(prefix.length).trim()
        matched = true
        break
      }
    }
    if (!matched) unmatched.push(seg)
  }
  return { feeParts, feeCustom: unmatched.join(' · ') }
}

const isMannerDrinkSelected = (feeParts) => feeParts.mannerDrink === 'on'

const composePartyFee = (feeParts, feeCustom) => {
  const segments = []
  FEE_CHANNELS.forEach((ch) => {
    const val = (feeParts[ch.key] || '').trim()
    if (!val) return
    if (ch.key === 'mannerDrink') {
      segments.push(ch.label)
      return
    }
    segments.push(`${ch.label} ${val}`)
  })
  const custom = (feeCustom || '').trim()
  if (custom) segments.push(custom)
  return segments.join(' · ')
}

const RegisterForm = ({ onBack, onSuccess, isEdit = false, isAdminMode = false, initialData = null }) => {
  const parsedFee = initialData?.feeParts
    ? { feeParts: initialData.feeParts, feeCustom: initialData.feeCustom || '' }
    : parsePartyFeeToParts(initialData?.fee)

  const [file, setFile] = useState(null)
  const [inputUrl, setInputUrl] = useState(initialData?.poster_url || '')
  const [formData, setFormData] = useState({
    title: initialData?.title?.replace(/^\[.*?\]\s*/, '').replace(/ ㅣ 오늘밤빠$/, '') || '',
    location_name: initialData?.location_name || initialData?.locations?.name || '',
    location_id: initialData?.location_id ?? initialData?.locations?.id ?? null,
    address: initialData?.address || initialData?.locations?.address || '',
    date: initialData?.date || new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: initialData?.time || '21:00',
    end_time: initialData?.end_time || '02:00',
    fee: initialData?.fee || '',
    feeParts: parsedFee.feeParts,
    feeCustom: parsedFee.feeCustom,
    region: initialData?.region || parseTitleRegion(initialData?.title) || '',
    day_of_week: initialData?.day_of_week || '',
    sRatio: initialData?.s_ratio ?? 5,
    bRatio: initialData?.b_ratio ?? 5,
    jRatio: initialData?.j_ratio ?? 0,
    kRatio: initialData?.k_ratio ?? 0,
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(1)
  const [suggestions, setSuggestions] = useState([])
  const TOTAL_STEPS = 5

  const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토']

  useEffect(() => {
    document.body.classList.add(PARTY_REGISTER_BODY_CLASS)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.classList.remove(PARTY_REGISTER_BODY_CLASS)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    if (!initialData) return
    if (initialData.poster_url) setInputUrl(initialData.poster_url)
    if (initialData.fee && !initialData.feeParts) {
      const parsed = parsePartyFeeToParts(initialData.fee)
      setFormData((prev) => ({
        ...prev,
        feeParts: parsed.feeParts,
        feeCustom: parsed.feeCustom,
        fee: initialData.fee,
      }))
    }
  }, [initialData?.id, initialData?.fee, initialData?.poster_url])

  useEffect(() => {
    if (formData.date) {
      const d = new Date(formData.date)
      const dayName = DAYS_KOR[d.getDay()]
      setFormData(prev => ({ ...prev, day_of_week: dayName }))
    }
  }, [formData.date])

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length <= 32) {
      setFormData(prev => ({ ...prev, title: value }));
    }
  };

  const handleUrlChange = (e) => {
    setInputUrl(e.target.value);
    if (e.target.value) {
      setFile(null);
    }
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setInputUrl('')
  }

  const classifyRegion = (address) => {
    if (!address) return ''
    if (address.includes('서울')) return '서울'
    if (address.includes('인천')) return '인천광역시'
    if (address.includes('경기') || address.includes('용인') || address.includes('수원') || address.includes('성남') || address.includes('고양')) return '경기도'
    if (address.includes('부산') || address.includes('대구') || address.includes('울산') || address.includes('경북') || address.includes('경남')) return '경상도'
    if (address.includes('광주') || address.includes('전북') || address.includes('전남')) return '전라도'
    if (address.includes('대전') || address.includes('세종') || address.includes('충북') || address.includes('충남')) return '충청도'
    if (address.includes('강원')) return '강원도'
    if (address.includes('제주')) return '제주도'
    return ''
  }

  const dedupeLocationSuggestions = (rows) => {
    const seen = new Set()
    const unique = []
    for (const row of rows || []) {
      const venueName = (row.name || '').trim()
      const venueAddress = (row.address || '').trim()
      if (!venueName) continue
      const key = `${venueName}|||${venueAddress}`
      if (seen.has(key)) continue
      seen.add(key)
      unique.push({
        id: row.id ?? null,
        name: venueName,
        address: venueAddress,
        latitude: row.latitude,
        longitude: row.longitude,
        region: classifyRegion(venueAddress),
      })
    }
    return unique
  }

  const pickLocationIdFromRows = (rows, name, address) => {
    const list = rows || []
    if (!list.length) return null
    if (list.length === 1) return list[0].id ?? null
    const trimmedName = (name || '').trim()
    const exactName = list.filter((r) => (r.name || '').trim() === trimmedName)
    if (exactName.length === 1) return exactName[0].id ?? null
    const addrKey = normalizeVenueAddressKey(address)
    if (addrKey) {
      const byAddr = list.find((r) => normalizeVenueAddressKey(r.address) === addrKey)
      if (byAddr?.id) return byAddr.id
    }
    return exactName[0]?.id ?? list[0]?.id ?? null
  }

  const resolveLocationIdForParty = async (data) => {
    if (data.location_id) return data.location_id

    const name = (data.location_name || '').trim()
    if (!name) return null

    const { data: exactRows } = await supabase
      .from('locations')
      .select('id, name, address, latitude')
      .eq('name', name)
      .limit(10)
    const exactId = pickLocationIdFromRows(exactRows, name, data.address)
    if (exactId) return exactId

    const { data: fuzzyRows } = await supabase
      .from('locations')
      .select('id, name, address, latitude')
      .ilike('name', `%${name}%`)
      .limit(15)
    const fuzzyId = pickLocationIdFromRows(fuzzyRows, name, data.address)
    if (fuzzyId) return fuzzyId

    const bar = findBarByName(name)
    if (bar?.name) {
      const { data: barRows } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('name', bar.name)
        .limit(5)
      const barId = pickLocationIdFromRows(barRows, bar.name, data.address || bar.address)
      if (barId) return barId

      const { data: barFuzzy } = await supabase
        .from('locations')
        .select('id, name, address')
        .ilike('name', `%${bar.name}%`)
        .limit(5)
      const barFuzzyId = pickLocationIdFromRows(barFuzzy, bar.name, data.address || bar.address)
      if (barFuzzyId) return barFuzzyId
    }

    const dominant = getDominantGenreEntry(data)
    if (dominant && fuzzyRows?.length) {
      const genreHit = fuzzyRows.find((row) =>
        dominant.tags.some((tag) => (row.name || '').toLowerCase().includes(tag.toLowerCase()))
      )
      if (genreHit?.id) return genreHit.id
      if (fuzzyRows.length === 1) return fuzzyRows[0].id ?? null
    }

    return null
  }

  const handleLocationNameChange = async (name) => {
    setFormData(prev => ({ ...prev, location_name: name, location_id: null }))

    if (name.length >= 1) {
      const { data: dbLocs } = await supabase
        .from('locations')
        .select('id, name, address, latitude, longitude')
        .or(`name.ilike.%${name}%,address.ilike.%${name}%`)
        .limit(50)

      const deduped = dedupeLocationSuggestions(dbLocs).slice(0, 5)
      setSuggestions(deduped)

      const resolvedId = pickLocationIdFromRows(dbLocs, name, formData.address)
      const bar = findBarByName(name)
      if (bar) {
        setFormData(prev => ({
          ...prev,
          address: prev.address || bar.address || prev.address,
          region: prev.region || bar.region || classifyRegion(bar.address),
          location_id: resolvedId ?? prev.location_id,
        }))
      } else if (resolvedId) {
        setFormData(prev => ({ ...prev, location_id: resolvedId }))
      }

      // // 1. 로컬 BAR_DATABASE에서 먼저 검색
      // const filtered = BAR_DATABASE.filter(bar =>
      //   bar.name.toLowerCase().includes(name.toLowerCase()) ||
      //   (bar.aliases && bar.aliases.some(a => a.toLowerCase().includes(name.toLowerCase())))
      // ).slice(0, 5)
      //
      // // 2. Supabase locations 에서도 검색해서 자동완성에 추가
      // const { data: dbLocs } = await supabase
      //   .from('locations')
      //   .select('name, address, latitude, longitude')
      //   .ilike('name', `%${name}%`)
      //   .limit(5)
      //
      // if (dbLocs && dbLocs.length > 0) {
      //   const dbSuggestions = dbLocs.map(l => ({
      //     name: l.name,
      //     address: l.address || '',
      //     latitude: l.latitude,
      //     longitude: l.longitude
      //   }))
      //   setSuggestions([...filtered, ...dbSuggestions].slice(0, 5))
      // } else {
      //   setSuggestions(filtered)
      // }
      //
      // // 3. 일치하는 빠 정보(별칭 포함)가 있는 경우 주소 자동 입력
      // const exactMatch = findBarByName(name)
      // if (exactMatch) {
      //   setFormData(prev => ({
      //     ...prev,
      //     address: exactMatch.address,
      //     region: exactMatch.region || classifyRegion(exactMatch.address)
      //   }))
      // }
    } else {
      setSuggestions([])
    }
  }

  const selectSuggestion = async (bar) => {
    let locationId = bar.id ?? null
    if (!locationId && bar.name) {
      locationId = await resolveLocationIdForParty({
        location_name: bar.name,
        address: bar.address,
        location_id: null,
        bRatio: formData.bRatio,
        sRatio: formData.sRatio,
        jRatio: formData.jRatio,
        kRatio: formData.kRatio,
      })
    }
    setFormData(prev => ({
      ...prev,
      location_name: bar.name,
      location_id: locationId ?? prev.location_id,
      address: bar.address,
      region: bar.region || classifyRegion(bar.address),
      latitude: bar.latitude ?? prev.latitude,
      longitude: bar.longitude ?? prev.longitude,
    }))
    setSuggestions([])
  }

  const handleAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 서비스 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete: async (data) => {
        const fullAddress = data.roadAddress || data.address;
        let lat = null, lng = null;

        // Geocoding
        try {
          const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(fullAddress)}`, {
            headers: { Authorization: `KakaoAK ${getKakaoApiKey()}` }
          });
          const result = await response.json();
          if (result.documents && result.documents.length > 0) {
            const { x, y } = result.documents[0];
            lat = parseFloat(y);
            lng = parseFloat(x);
          }
        } catch (err) {
          console.error('Geocoding error:', err);
        }

        setFormData(prev => ({ 
          ...prev, 
          address: fullAddress,
          region: classifyRegion(fullAddress),
          latitude: lat,
          longitude: lng
        }));

        // 새 장소면 locations 테이블에 자동 저장
        if (formData.location_name) {
          const { data: existing } = await supabase
            .from('locations')
            .select('id, latitude')
            .eq('name', formData.location_name)
            .maybeSingle()

          if (!existing) {
            const { data: inserted } = await supabase.from('locations').insert({
              name: formData.location_name,
              address: fullAddress,
              latitude: lat,
              longitude: lng
            }).select('id').maybeSingle()
            if (inserted?.id) {
              setFormData(prev => ({ ...prev, location_id: inserted.id }))
            }
          } else if (!existing.latitude && lat) {
            // 기존 장소인데 위도/경도 없으면 업데이트
            await supabase.from('locations')
              .update({ 
                address: fullAddress,
                latitude: lat, 
                longitude: lng 
              })
              .eq('name', formData.location_name)
          }
          if (existing?.id) {
            setFormData(prev => ({ ...prev, location_id: existing.id }))
          }
        }
      }
    }).open();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    if (!formData.title || !formData.location_name || !formData.date) {
      alert('필수 정보를 모두 입력해주세요. (제목, 장소명, 날짜)')
      return
    }

    setLoading(true)
    try {
      const resolveContributorId = () => {
        const oneulbam = localStorage.getItem('oneulbam_session')
        if (oneulbam && oneulbam.trim()) return oneulbam.trim()
        const generic = localStorage.getItem('user_session')
        if (generic && generic.trim()) return generic.trim()
        try {
          const vipRaw = localStorage.getItem('vip_instructor_session')
          if (vipRaw) {
            const vip = JSON.parse(vipRaw)
            if (vip?.id) return String(vip.id).trim()
          }
        } catch {}
        return ''
      }

      const contributorId = isAdminMode
        ? (isEdit && initialData?.contributor_id
          ? String(initialData.contributor_id).trim()
          : 'bchata-admin')
        : resolveContributorId()
      if (!isAdminMode && !contributorId) {
        alert('로그인 후 파티 등록이 가능합니다.')
        setLoading(false)
        return
      }

      let finalPosterUrl = ''
      if (file) {
        const fileName = `${Math.random()}.jpg`
        const { error: uploadError } = await supabase.storage.from('posters').upload(`posters/${fileName}`, file)
        if (uploadError) {
          alert('포스터 이미지 업로드 실패: ' + uploadError.message)
          setLoading(false)
          return
        }
        const { data } = supabase.storage.from('posters').getPublicUrl(`posters/${fileName}`)
        finalPosterUrl = data.publicUrl
      }

      let finalLocationId = await resolveLocationIdForParty(formData)

      if (!finalLocationId) {
        const targetRegion = formData.region || classifyRegion(formData.address) || '서울'
        const { data: reg } = await supabase.from('regions').select('id').ilike('name', `%${targetRegion}%`).limit(1).maybeSingle()
        const barMaster = findBarByName(formData.location_name)
        const insertName = barMaster?.name || formData.location_name
        const insertAddress = formData.address || barMaster?.address || ''
        const { data: newLocs, error: locError } = await supabase.from('locations').insert([{
          name: insertName,
          address: insertAddress,
          region_id: reg?.id || 1,
          latitude: formData.latitude,
          longitude: formData.longitude
        }]).select('id, latitude')
        if (locError) {
          alert('장소 저장 실패: ' + locError.message)
          setLoading(false)
          return
        }
        if (newLocs?.length > 0) finalLocationId = newLocs[0].id
      } else {
        const { data: existingLoc } = await supabase
          .from('locations')
          .select('id, latitude')
          .eq('id', finalLocationId)
          .maybeSingle()
        if (existingLoc?.latitude == null && formData.latitude) {
          await supabase.from('locations')
            .update({
              address: formData.address,
              latitude: formData.latitude,
              longitude: formData.longitude
            })
            .eq('id', finalLocationId)
        }
      }

      if (!finalLocationId) {
        alert('장소(location_id) 연결에 실패했습니다. 장소 이름을 자동완성에서 선택하거나 주소 검색 후 다시 시도해주세요.')
        setLoading(false)
        return
      }

      let finalProcessedTitle = formData.title.trim();
      const suffix = " ㅣ 오늘밤빠";
      if (finalProcessedTitle && !finalProcessedTitle.includes("오늘밤빠")) {
        finalProcessedTitle = `${finalProcessedTitle}${suffix}`;
      }

      const partyData = {
        title: `[${formData.region}] ${finalProcessedTitle}`,
        location_id: finalLocationId,
        address: formData.address,
        fee: composePartyFee(formData.feeParts, formData.feeCustom) || formData.fee || '문의',
        date: formData.date?.trim() || null,
        time: formData.time,
        day_of_week: formData.day_of_week,
        poster_url: finalPosterUrl || inputUrl?.trim() || initialData?.poster_url || null,
        s_ratio: formData.sRatio,
        b_ratio: formData.bRatio,
        j_ratio: formData.jRatio,
        k_ratio: formData.kRatio,
        contributor_id: contributorId,
        status: 'approved'
      };

      let error;
      if (isEdit && initialData?.id) {
        const targetTable = initialData._table || 'parties';
        const { error: updateError } = await supabase.from(targetTable).update(partyData).eq('id', initialData.id);
        error = updateError;
      } else {
        const insertTable = isAdminMode ? (initialData?._table || 'parties') : 'parties';
        const { error: insertError } = await supabase.from(insertTable).insert([partyData]);
        error = insertError;
      }

      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      alert('등록 저장 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 13; h <= 23; h++) { slots.push({ value: `${h}:00`, label: `오후 ${h - 12}:00` }); slots.push({ value: `${h}:30`, label: `오후 ${h - 12}:30` }); }
    for (let h = 0; h <= 5; h++) { const hh = String(h).padStart(2, '0'); slots.push({ value: `${hh}:00`, label: `새벽 ${h}:00` }); slots.push({ value: `${hh}:30`, label: `새벽 ${h}:30` }); }
    return slots;
  })();

  if (submitted) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: PARTY_REGISTER_Z, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#FF1744', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Check size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>{isEdit ? '파티 수정 완료!' : '파티 등록 완료!'}</h2>
          <p style={{ fontSize: '16px', color: '#64748B', lineHeight: '1.6', marginBottom: '32px' }}>
            {isAdminMode ? 'Supabase에 저장되었습니다.' : '지금 즉시 메인 화면에 게시되었습니다.'}
          </p>
          <button onClick={onSuccess || onBack} style={{ width: '100%', padding: '20px', background: '#FF1744', color: 'white', borderRadius: '16px', fontWeight: 900, fontSize: '18px', border: 'none' }}>확인</button>
        </motion.div>
      </div>,
      document.body
    )
  }

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>📸 {isEdit ? '포스터 변경 (선택)' : '파티 포스터 선택'}</label>
            <div onClick={() => document.getElementById('poster-upload').click()} style={{ height: '350px', border: '2px dashed #E2E8F0', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', overflow: 'hidden', cursor: 'pointer' }}>
              {(file || inputUrl) ? (
                <img src={file ? URL.createObjectURL(file) : inputUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <>
                  <Plus size={40} color="#FF1744" style={{ marginBottom: '16px' }} />
                  <p style={{ fontWeight: 700, color: '#64748B' }}>탭하여 사진 업로드</p>
                </>
              )}
            </div>
            <input type="file" id="poster-upload" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>또는 이미지 URL 직접 입력</label>
              <input 
                type="url" 
                value={inputUrl} 
                onChange={handleUrlChange} 
                placeholder="https://example.com/poster.jpg" 
                style={{ width: '100%', padding: '16px', border: '2px solid #E2E8F0', borderRadius: '16px', fontSize: '15px', background: '#F8FAFC', outline: 'none', color: '#1E293B', fontWeight: 600 }} 
              />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>✍️ 파티 제목 입력</label>
            <textarea 
              value={formData.title} 
              onChange={handleTitleChange} 
              placeholder="예: 라틴 바차타 맛집" 
              maxLength={32}
              style={{ width: '100%', height: '120px', padding: '20px', border: '2px solid #F1F5F9', borderRadius: '20px', fontSize: '18px', fontWeight: 700, background: '#F8FAFC', outline: 'none', resize: 'none' }} 
            />
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#94A3B8' }}>* 지역과 제목을 알기 쉽게 적어주세요 (최대 32자)</p>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>📍 장소 및 지역 선택</label>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>장소 이름</p>
              <input type="text" value={formData.location_name} onChange={e => handleLocationNameChange(e.target.value)} placeholder="예: 홍대 보니따" style={{ width: '100%', padding: '18px', border: '2px solid #F1F5F9', borderRadius: '16px', fontSize: '16px', background: '#F8FAFC' }} />
              
              {/* Autocomplete Suggestions */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginTop: '8px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                    {suggestions.map((bar, i) => (
                      <div key={`${bar.name}|||${bar.address}`} onClick={() => selectSuggestion(bar)} style={{ padding: '16px', borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#FEF2F2', padding: '8px', borderRadius: '8px' }}>
                          <MapPin size={16} color="#FF1744" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B' }}>{bar.name}</p>
                          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{bar.address}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>상세 주소</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  placeholder="장소 선택 시 주소가 자동 입력됩니다" 
                  style={{ flex: 1, padding: '18px', border: '2px solid #F1F5F9', borderRadius: '16px', fontSize: '15px', background: '#F8FAFC' }} 
                />
                <button 
                  type="button" 
                  onClick={handleAddressSearch}
                  style={{ padding: '0 15px', background: '#1D9E75', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 800, whiteSpace: 'nowrap' }}
                >
                  주소 검색
                </button>
              </div>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '12px' }}>대분류 지역</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['서울', '경기도', '인천광역시', '경상도', '전라도', '충청도', '강원도', '제주도'].map(r => (
                <button key={r} type="button" onClick={() => setFormData({...formData, region: r})} style={{ padding: '12px 0', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 800, background: formData.region === r ? '#FF1744' : '#F1F5F9', color: formData.region === r ? '#fff' : '#64748B' }}>{r.replace('도','').replace('광역시','')}</button>
              ))}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>🎶 음악 비율 & 입장료</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {[{l:'B',k:'bRatio'},{l:'S',k:'sRatio'},{l:'J',k:'jRatio'},{l:'K',k:'kRatio'}].map(g => (
                <div key={g.k} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#FF1744', marginBottom: '4px' }}>{g.l}</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>{formData[g.k]}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={()=>setFormData(p=>({...p,[g.k]:Math.max(0,p[g.k]-1)}))} style={{ flex: 1, border: 'none', background: '#fff', borderRadius: '6px', height: '30px' }}>-</button>
                    <button type="button" onClick={()=>setFormData(p=>({...p,[g.k]:Math.min(10,p[g.k]+1)}))} style={{ flex: 1, border: 'none', background: '#fff', borderRadius: '6px', height: '30px' }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '12px' }}>입장료 (복수 선택 가능)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {FEE_CHANNELS.map((ch) => {
                const isManner = ch.key === 'mannerDrink'
                const selected = isManner
                  ? isMannerDrinkSelected(formData.feeParts)
                  : Boolean((formData.feeParts[ch.key] || '').trim())
                return (
                  <div
                    key={ch.key}
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      border: selected ? '2px solid #FF1744' : '1px solid #E2E8F0',
                      background: selected ? '#FFF5F7' : '#F8FAFC',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isManner ? 0 : '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B' }}>{ch.label}</span>
                      {selected ? (
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#FF1744' }}>
                          {isManner ? ch.label : `${ch.label} ${formData.feeParts[ch.key].trim()}`}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>
                          {isManner ? '탭하여 선택' : '가격 선택'}
                        </span>
                      )}
                    </div>
                    {isManner ? (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            feeParts: {
                              ...prev.feeParts,
                              mannerDrink: isMannerDrinkSelected(prev.feeParts) ? '' : 'on',
                            },
                          }))
                        }
                        style={{
                          width: '100%',
                          marginTop: '10px',
                          padding: '12px 0',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 800,
                          background: selected ? '#FF1744' : '#fff',
                          color: selected ? '#fff' : '#64748B',
                        }}
                      >
                        {selected ? '메너음료 포함 (선택됨)' : '메너음료 포함'}
                      </button>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                          {FEE_QUICK_PRICES.map((opt) => (
                            <button
                              key={`${ch.key}-${opt.label}`}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  feeParts: { ...prev.feeParts, [ch.key]: opt.display },
                                }))
                              }
                              style={{
                                padding: '10px 0',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: formData.feeParts[ch.key] === opt.display ? '#FF1744' : '#fff',
                                color: formData.feeParts[ch.key] === opt.display ? '#fff' : '#64748B',
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {selected ? (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                feeParts: { ...prev.feeParts, [ch.key]: '' },
                              }))
                            }
                            style={{
                              marginTop: '8px',
                              padding: 0,
                              border: 'none',
                              background: 'none',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#94A3B8',
                              cursor: 'pointer',
                            }}
                          >
                            선택 해제
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            {composePartyFee(formData.feeParts, formData.feeCustom) ? (
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#D81B60',
                  marginBottom: '12px',
                  lineHeight: 1.5,
                }}
              >
                저장 표기: {composePartyFee(formData.feeParts, formData.feeCustom)}
              </p>
            ) : null}
            <input
              type="text"
              value={formData.feeCustom}
              onChange={(e) => setFormData({ ...formData, feeCustom: e.target.value })}
              placeholder="직접 입력 (예: 현장 1.5만)"
              style={{
                width: '100%',
                padding: '18px',
                border: '2px solid #F1F5F9',
                borderRadius: '16px',
                fontSize: '16px',
                background: '#F8FAFC',
                fontWeight: 700,
              }}
            />
          </motion.div>
        );
      case 5:
        return (
          <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>📅 파티 일정 확인</label>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>파티 날짜</p>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '20px', border: '2px solid #F1F5F9', borderRadius: '16px', fontSize: '18px', fontWeight: 900, background: '#F8FAFC' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>시작 시간</p>
                <select value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={{ width: '100%', padding: '18px', border: '2px solid #F1F5F9', borderRadius: '16px', background: '#F8FAFC' }}>{TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>종료 시간</p>
                <select value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} style={{ width: '100%', padding: '18px', border: '2px solid #F1F5F9', borderRadius: '16px', background: '#F8FAFC' }}>{TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
              </div>
            </div>
          </motion.div>
        );
      default: return null;
    }
  }

  return createPortal(
    <motion.div style={{ position: 'fixed', inset: 0, zIndex: PARTY_REGISTER_Z, display: 'flex', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onBack} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} />
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }} 
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ position: 'relative', width: '100%', maxWidth: '500px', height: '100dvh', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button onClick={() => { if(step > 1) setStep(step - 1); else onBack(); }} style={{ border: 'none', background: 'none', color: '#1E293B' }}><ChevronLeft size={24} /></button>
          <span style={{ fontWeight: 900, fontSize: '18px' }}>파티 등록 신청 ({step}/{TOTAL_STEPS})</span>
          <button onClick={onBack} style={{ border: 'none', background: 'none', color: '#94A3B8' }}><X size={24} /></button>
        </div>

        <div style={{ height: '4px', background: '#F1F5F9', width: '100%', flexShrink: 0 }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} style={{ height: '100%', background: '#FF1744' }} />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        <div style={{
          padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          gap: '12px',
          flexShrink: 0,
          background: '#fff',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, height: '60px', borderRadius: '18px', background: '#F1F5F9', color: '#64748B', fontWeight: 900, border: 'none' }}>이전</button>}
          <button 
            onClick={() => { if(step < TOTAL_STEPS) setStep(step + 1); else handleSubmit(); }} 
            disabled={loading}
            style={{ flex: 2, height: '60px', borderRadius: '18px', background: '#FF1744', color: 'white', fontWeight: 900, fontSize: '18px', border: 'none', boxShadow: '0 8px 20px rgba(255, 23, 68, 0.2)' }}
          >
            {loading ? '처리 중...' : (step === TOTAL_STEPS ? (isEdit ? '수정 완료' : '등록 완료') : '다음 단계')}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default RegisterForm
