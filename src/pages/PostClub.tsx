import React, { useState, useEffect } from 'react'
import { ChevronLeft, Camera, Loader2, Check, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { findBarByName } from '../lib/BarLib'

const DANCE_STYLES = ['바차타', '살사', '주크', '키좀바', '기타']
const CLASS_CATEGORIES = ['입문', '기초', '중급', '고급', '마스터', '기타']
const REGIONS = ['서울', '경기도', '인천광역시', '경상도', '전라도', '충청도', '강원도', '제주도']
const DAYS = ['월', '화', '수', '목', '금', '토', '일']
const FEES = ['무료', '1만원', '1.5만원', '2만원', '기타']

const THEME_COLOR = '#FF8C00' // 동호회/강습 고유 테마 컬러 오렌지 유지

const PostClub = ({ onBack, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    dance_style: '바차타',
    category: '기초',
    custom_category: '',
    days: [],
    startTime: '19:00',
    endTime: '21:00',
    studio_name: '',
    address: '',
    region: '',
    fee: '1만원',
    custom_fee: '',
    startDate: new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: ''
  })

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day]
    }))
  }

  const classifyRegion = (address) => {
    if (!address) return ''
    if (address.includes('서울')) return '서울'
    if (address.includes('인천')) return '인천광역시'
    if (address.includes('경기') || address.includes('용인') || address.includes('수원') || address.includes('성남') || address.includes('고양')) return '경기도'
    if (address.includes('부산') || address.includes('대구') || address.includes('울산') || address.includes('경북') || address.includes('경남') || address.includes('포항') || address.includes('창원')) return '경상도'
    if (address.includes('광주') || address.includes('전북') || address.includes('전남') || address.includes('여수') || address.includes('순천')) return '전라도'
    if (address.includes('대전') || address.includes('세종') || address.includes('충북') || address.includes('충남') || address.includes('충청')) return '충청도'
    if (address.includes('강원')) return '강원도'
    if (address.includes('제주')) return '제주도'
    return ''
  }

  const handleLocationLookup = (name) => {
    if (!name) return
    const matched = findBarByName(name)
    if (matched) {
      setFormData(prev => ({
        ...prev,
        address: matched.address,
        region: matched.region || classifyRegion(matched.address) || prev.region
      }))
      return true
    }
    return false
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLocationLookup(formData.studio_name)
    }
  }

  useEffect(() => {
    if (formData.studio_name.length >= 2) {
      handleLocationLookup(formData.studio_name)
    }
  }, [formData.studio_name])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return alert('포스터 이미지를 올려주세요.')
    if (!formData.title || !formData.studio_name || !formData.region) {
      return alert('필수 정보를 모두 입력해주세요.')
    }
    if (formData.days.length === 0) return alert('활동 요일을 선택해주세요.')
    
    const finalFee = formData.fee === '기타' ? formData.custom_fee : formData.fee;
    if (!finalFee) return alert('참가비를 입력해주세요.')

    const finalCategory = formData.category === '기타' ? formData.custom_category : formData.category;
    if (formData.category === '기타' && !finalCategory) return alert('난이도를 입력해주세요.')

    setLoading(true)
    try {
      let posterUrl = ''
      if (file) {
        const fileName = `${Date.now()}_club.jpg`
        const { error: uploadError } = await supabase.storage.from('posters').upload(`posters/${fileName}`, file)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('posters').getPublicUrl(`posters/${fileName}`)
        posterUrl = data.publicUrl
      }

      // [Auto-Learning] 장소가 DB에 없으면 자동 추가
      const { data: existingLoc } = await supabase
        .from('locations')
        .select('id')
        .eq('name', formData.studio_name)
        .maybeSingle()

      if (!existingLoc) {
        const targetRegion = formData.region || classifyRegion(formData.address) || '서울'
        const { data: reg } = await supabase.from('regions').select('id').ilike('name', `%${targetRegion}%`).limit(1).maybeSingle()
        await supabase.from('locations').insert([{
          name: formData.studio_name,
          address: formData.address,
          region_id: reg?.id || 1
        }])
      }

      const { error } = await supabase.from('classes_info').insert([{
        title: formData.title,
        instructor: formData.instructor,
        genre: formData.dance_style,
        level: finalCategory,
        day_of_week: formData.days.join(', '),
        start_time: formData.startTime,
        end_time: formData.endTime,
        start_date: formData.startDate,
        duration: formData.endDate ? `~ ${formData.endDate}` : '상시 운영',
        studio_name: formData.studio_name,
        address: formData.address,
        city: formData.region,
        fee: finalFee,
        poster_url: posterUrl,
        status: 'pending',
        category_type: 'club'
      }])

      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      alert('등록 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px', backgroundColor: 'white', minHeight: '100vh', overflowY: 'auto' }}>
        <div style={{ backgroundColor: THEME_COLOR, width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: `0 10px 25px ${THEME_COLOR}33` }}><Check size={40} color="white" /></div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#111827', marginBottom: '12px' }}>등록 신청 완료!</h2>
        <p style={{ fontSize: '16px', color: '#6B7280', lineHeight: '1.6', marginBottom: '40px', fontWeight: 500 }}>
          정상적으로 접수되었습니다.<br />
          관리자 승인 후 메인 화면에<br />
          즉시 노출됩니다.
        </p>
        <button onClick={onSuccess || onBack} style={{ width: '100%', padding: '20px', background: THEME_COLOR, color: 'white', borderRadius: '16px', fontWeight: 800, fontSize: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>확인</button>
      </div>
    )
  }

  const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 10; h <= 23; h++) {
      slots.push({ value: `${String(h).padStart(2,'0')}:00`, label: `${h < 12 ? '오전' : '오후'} ${h === 12 ? 12 : h % 12 || 12}:00` });
      slots.push({ value: `${String(h).padStart(2,'0')}:30`, label: `${h < 12 ? '오전' : '오후'} ${h === 12 ? 12 : h % 12 || 12}:30` });
    }
    for (let h = 0; h <= 6; h++) {
      const hh = String(h).padStart(2, '0');
      const labelPrefix = h === 0 ? '자정' : '새벽';
      slots.push({ value: `${hh}:00`, label: `${labelPrefix} ${h}:00` });
      if (h < 6) slots.push({ value: `${hh}:30`, label: `${labelPrefix} ${h}:30` });
    }
    return slots;
  })();

  return (
    <div style={{ backgroundColor: '#fff', height: '100vh', overflowY: 'auto', paddingBottom: '100px', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><ChevronLeft size={24} /></button>
        <span style={{ fontSize: '18px', fontWeight: 800, marginLeft: '8px' }}>수업/정모 등록하기</span>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          {preview ? (
            <img src={preview} style={{ width: '100%', height: '240px', objectFit: 'contain', borderRadius: '16px', backgroundColor: '#F9FAFB' }} onClick={() => document.getElementById('club-poster').click()} />
          ) : (
            <div onClick={() => document.getElementById('club-poster').click()} style={{ height: '160px', border: '2px dashed #E5E7EB', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
              <Plus size={40} />
              <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>포스터 업로드</p>
            </div>
          )}
          <input id="club-poster" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#FFF7ED', borderRadius: '12px', border: '1px solid #FFEDD5' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9A3412', fontWeight: 600, lineHeight: 1.5 }}>
              포스터에 '수강료', '강습비', '레슨비' 등의 표현 대신 반드시 '참가비' 또는 금액으로 표기해주세요.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>강습/모임 명칭 (필수)</label>
          <input 
            type="text" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            placeholder="예: 강남 바차타 기초반, 살사사랑 정모" 
            required 
            style={{ width: '100%', padding: '16px', border: '1.5px solid #F3F4F6', borderRadius: '14px', fontSize: '16px', backgroundColor: '#F9FAFB', outline: 'none' }} 
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>강사명 또는 닉네임</label>
          <input 
            type="text" 
            value={formData.instructor} 
            onChange={e => setFormData({...formData, instructor: e.target.value})} 
            placeholder="예: 강사 이름 또는 닉네임" 
            style={{ width: '100%', padding: '16px', border: '1.5px solid #F3F4F6', borderRadius: '14px', fontSize: '16px', backgroundColor: '#F9FAFB', outline: 'none' }} 
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>댄스 장르</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {DANCE_STYLES.map(style => (
              <button
                key={style}
                type="button"
                onClick={() => setFormData({...formData, dance_style: style})}
                style={{
                  padding: '10px 0',
                  backgroundColor: formData.dance_style === style ? THEME_COLOR : '#F3F4F6',
                  color: formData.dance_style === style ? 'white' : '#4B5563',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>난이도</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
            {CLASS_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFormData({...formData, category: cat})}
                style={{
                  padding: '10px 0',
                  backgroundColor: formData.category === cat ? THEME_COLOR : '#F3F4F6',
                  color: formData.category === cat ? 'white' : '#4B5563',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          {formData.category === '기타' && (
            <input 
              type="text" 
              value={formData.custom_category} 
              onChange={e => setFormData({...formData, custom_category: e.target.value})} 
              placeholder="난이도 직접 입력" 
              style={{ width: '100%', padding: '14px', border: '1.5px solid #F3F4F6', borderRadius: '12px', fontSize: '14px', backgroundColor: '#F9FAFB', outline: 'none' }} 
            />
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>활동 요일 (다중 선택 가능)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                style={{
                  padding: '12px 0',
                  backgroundColor: formData.days.includes(day) ? THEME_COLOR : '#F3F4F6',
                  color: formData.days.includes(day) ? 'white' : '#4B5563',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>시작 시간</label>
            <select 
              value={formData.startTime} 
              onChange={e => setFormData({...formData, startTime: e.target.value})} 
              style={{ width: '100%', padding: '14px 8px', border: '1.5px solid #F3F4F6', borderRadius: '12px', fontSize: '14px', backgroundColor: '#F9FAFB', outline: 'none' }}
            >
              {TIME_SLOTS.map(slot => <option key={`start-${slot.value}`} value={slot.value}>{slot.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>종료 시간</label>
            <select 
              value={formData.endTime} 
              onChange={e => setFormData({...formData, endTime: e.target.value})} 
              style={{ width: '100%', padding: '14px 8px', border: '1.5px solid #F3F4F6', borderRadius: '12px', fontSize: '14px', backgroundColor: '#F9FAFB', outline: 'none' }}
            >
              {TIME_SLOTS.map(slot => <option key={`end-${slot.value}`} value={slot.value}>{slot.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>장소 명칭 (자동완성)</label>
          <input 
            type="text" 
            value={formData.studio_name} 
            onChange={e => {
              const name = e.target.value;
              setFormData({...formData, studio_name: name});
              if (name.length >= 2) {
                handleLocationLookup(name);
              }
            }} 
            onKeyDown={handleKeyDown} 
            placeholder="장소명 (예: 강남 턴 바)" 
            required 
            style={{ width: '100%', padding: '16px', border: '1.5px solid #F3F4F6', borderRadius: '14px', fontSize: '16px', backgroundColor: '#F9FAFB', outline: 'none' }} 
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>상세 주소 (자동 연동)</label>
          <input 
            type="text" 
            value={formData.address} 
            onChange={e => {
              const address = e.target.value;
              const autoSelectedRegion = classifyRegion(address) || formData.region;
              setFormData({
                ...formData, 
                address: address,
                region: autoSelectedRegion
              });
            }} 
            placeholder="상세 주소 (카카오 지도 연동용)" 
            required 
            style={{ width: '100%', padding: '16px', border: '1.5px solid #F3F4F6', borderRadius: '14px', fontSize: '15px', backgroundColor: '#F9FAFB', outline: 'none' }} 
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>지역 선택 (필수)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {REGIONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setFormData({...formData, region: r})}
                style={{
                  padding: '10px 4px',
                  backgroundColor: formData.region === r ? THEME_COLOR : '#F3F4F6',
                  color: formData.region === r ? 'white' : '#4B5563',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {r.replace('도', '').replace('광역시', '').replace('특별자치도', '')}
              </button>
            ))}
          </div>
          {!formData.region && <p style={{ fontSize: '10px', color: '#EF4444', marginTop: '4px' }}>* 지역을 선택해주세요.</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>참가비</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
            {FEES.map(fee => (
              <button
                key={fee}
                type="button"
                onClick={() => {
                  if (fee === '기타') {
                    setFormData({...formData, fee: fee})
                    document.getElementById('custom-fee-input')?.focus()
                  } else {
                    setFormData({...formData, fee: fee})
                  }
                }}
                style={{ 
                  padding: '10px 0', 
                  backgroundColor: formData.fee === fee ? THEME_COLOR : '#F3F4F6', 
                  color: formData.fee === fee ? 'white' : '#4B5563',
                  border: 'none', 
                  borderRadius: '10px', 
                  fontSize: '11px', 
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {fee}
              </button>
            ))}
          </div>
          
          {formData.fee === '기타' && (
            <input 
              id="custom-fee-input"
              type="text" 
              value={formData.custom_fee} 
              onChange={e => setFormData({...formData, custom_fee: e.target.value})} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                border: '1.5px solid #F3F4F6', 
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: '#F9FAFB',
                outline: 'none'
              }} 
              placeholder="직접 입력 (예: 2만원)"
            />
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>운영 기간</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="date" value={formData.startDate}
              onChange={e => setFormData({...formData, startDate: e.target.value})}
              style={{ width: '100%', padding: '14px 8px', border: '1.5px solid #F3F4F6', borderRadius: '12px', fontSize: '13px', backgroundColor: '#F9FAFB', outline: 'none', flex: 1 }} 
            />
            <span style={{ color: '#9CA3AF' }}>~</span>
            <input 
              type="date" value={formData.endDate}
              onChange={e => setFormData({...formData, endDate: e.target.value})}
              style={{ width: '100%', padding: '14px 8px', border: '1.5px solid #F3F4F6', borderRadius: '12px', fontSize: '13px', backgroundColor: '#F9FAFB', outline: 'none', flex: 1 }} 
            />
          </div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px' }}>* 종료일 미지정 시 '상시 운영'으로 노출됩니다.</p>
        </div>

        <button 
          type="submit" 
          disabled={loading || !formData.title || !formData.studio_name || !formData.region || formData.days.length === 0} 
          style={{ 
            width: '100%', padding: '20px', background: THEME_COLOR, color: 'white', borderRadius: '16px', 
            fontWeight: 800, fontSize: '18px', border: 'none',
            opacity: (loading || !formData.title || !formData.studio_name || !formData.region || formData.days.length === 0) ? 0.5 : 1,
            boxShadow: `0 4px 12px ${THEME_COLOR}33`
          }}
        >
          등록 완료
        </button>
      </form>
    </div>
  )
}

export default PostClub
