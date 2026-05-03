import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronLeft, ChevronRight, Camera, Check, X, MapPin, Search, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const PostClass = ({ onBack }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isCustomDuration, setIsCustomDuration] = useState(false)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    genre: '',
    level: '',
    description: '',
    day_of_week: [],
    start_time: '',
    end_time: '',
    start_date: '',
    duration: '',
    city: '',
    district: '',
    studio_name: '',
    address: '',
    fee: '',
    price_label: '유료',
    poster_url: ''
  })

  // 장소 데이터 불러오기 (중복 제거)
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        // parties 테이블에서 장소 정보 조회 (실제 컬럼명에 맞춰 location_name 등으로 대체 가능하나 지시대로 진행)
        const { data, error } = await supabase
          .from('parties')
          .select('location_name, address, cityName, broadRegion')
        
        if (data) {
          const unique = Array.from(new Set(data.map(v => JSON.stringify({
            studio_name: v.location_name || '',
            address: v.address || '',
            city: v.broadRegion || '',
            district: v.cityName || ''
          })))).map(s => JSON.parse(s))
          setVenues(unique.filter(v => v.studio_name))
        }
      } catch (err) {
        console.error('Venue fetch error:', err)
      }
    }
    fetchVenues()
  }, [])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const fileName = `${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage.from('posters').upload(`classes/${fileName}`, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(data.path)
      setFormData(prev => ({ ...prev, poster_url: publicUrl }))
    } catch (err) {
      alert('업로드 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (loading) return
    setLoading(true)
    try {
      const { error } = await supabase.from('classes_info').insert([{
        ...formData,
        day_of_week: formData.day_of_week.join(', '),
        category_type: 'class',
        status: 'pending',
        fee: parseInt(formData.fee.toString().replace(/[^0-9]/g, '')) || 0
      }])
      if (error) throw error
      alert('강습 등록 신청이 완료되었습니다!')
      onBack()
    } catch (err) {
      alert('등록 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      day_of_week: prev.day_of_week.includes(day) ? prev.day_of_week.filter(d => d !== day) : [...prev.day_of_week, day]
    }))
  }

  const selectVenue = (v) => {
    if (v === 'manual') {
      setFormData({ ...formData, studio_name: '', address: '', city: '', district: '' })
      setSearchTerm('직접 입력')
    } else {
      setFormData({ ...formData, studio_name: v.studio_name, address: v.address, city: v.city, district: v.district })
      setSearchTerm(v.studio_name)
    }
  }

  // 스타일 정의
  const inputStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '16px', outline: 'none', backgroundColor: '#F7FAFC' }
  const labelStyle = { fontSize: '12px', fontWeight: 800, color: '#A0AEC0', marginBottom: '8px', display: 'block' }
  const btnStyle = (active) => ({
    padding: '12px', borderRadius: '12px', border: '2px solid',
    borderColor: active ? '#FF3B30' : '#E2E8F0',
    backgroundColor: active ? '#FFF5F5' : '#FFFFFF',
    color: active ? '#FF3B30' : '#4A5568',
    fontWeight: 800, fontSize: '14px', cursor: 'pointer'
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onBack} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '32px 32px 0 0', height: '94vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* 헤더 */}
        <div style={{ padding: '20px', borderBottom: '1px solid #EDF2F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ border: 'none', background: 'none' }}><ChevronLeft size={24} color="#1A202C" /></button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 950, fontSize: '18px', color: '#1A202C' }}>강습 등록 신청</span>
            <div style={{ fontSize: '11px', color: '#A0AEC0', fontWeight: 700 }}>STEP {step} / 5</div>
          </div>
          <button onClick={onBack} style={{ border: 'none', background: 'none' }}><X size={24} color="#A0AEC0" /></button>
        </div>

        {/* 진행 바 */}
        <div style={{ height: '4px', width: '100%', background: '#EDF2F7' }}>
          <motion.div animate={{ width: `${(step / 5) * 100}%` }} style={{ height: '100%', background: '#FF3B30' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="st1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: '22px', fontWeight: 950, marginBottom: '24px' }}>강습 포스터 업로드</h2>
                <div onClick={() => fileInputRef.current?.click()} style={{ width: '100%', aspectRatio: '3/4', borderRadius: '24px', border: '2px dashed #E2E8F0', background: '#F7FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                  {formData.poster_url ? <img src={formData.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={48} color="#CBD5E0" />}
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} hidden />
                <div style={{ marginTop: '20px', backgroundColor: '#FFFBEB', color: '#92400E', padding: '14px', borderRadius: '12px', fontSize: '12px', lineHeight: '1.6', fontWeight: 600 }}>
                  💡 살사+바차타 등 두 과목을 함께 진행하시는 경우, 과목별로 각각 따로 등록해 주세요. 같은 포스터를 두 번 사용하셔도 됩니다.
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="st2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 style={{ fontSize: '22px', fontWeight: 950, marginBottom: '24px' }}>강습 및 강사명</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div><label style={labelStyle}>강습명 (최대 16자)</label><input maxLength={16} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="예: 바차타 정규 입문" style={inputStyle} /></div>
                  <div><label style={labelStyle}>강사명</label><input value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} placeholder="강사 닉네임" style={inputStyle} /></div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="st3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 style={{ fontSize: '22px', fontWeight: 950, marginBottom: '24px' }}>장르 및 레벨</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>장르</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {['바차타', '살사', '키즘바', '쥬크'].map(g => <button key={g} onClick={() => setFormData({...formData, genre: g})} style={btnStyle(formData.genre === g)}>{g}</button>)}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>레벨</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {['입문', '초급', '중급', '상급'].map(l => <button key={l} onClick={() => setFormData({...formData, level: l})} style={btnStyle(formData.level === l)}>{l}</button>)}
                    </div>
                  </div>
                  <div><label style={labelStyle}>한줄 설명</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="강습의 특징" style={inputStyle} /></div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="st4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 style={{ fontSize: '22px', fontWeight: 950, marginBottom: '24px' }}>강습 일정</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {['월', '화', '수', '목', '금', '토', '일'].map(d => <button key={d} onClick={() => toggleDay(d)} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid', borderColor: formData.day_of_week.includes(d) ? '#FF3B30' : '#E2E8F0', backgroundColor: formData.day_of_week.includes(d) ? '#FF3B30' : '#fff', color: formData.day_of_week.includes(d) ? '#fff' : '#4A5568', fontWeight: 800 }}>{d}</button>)}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}><label style={labelStyle}>시작 시간</label><input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} style={inputStyle} /></div>
                    <div style={{ flex: 1 }}><label style={labelStyle}>종료 시간</label><input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} style={inputStyle} /></div>
                  </div>
                  <div><label style={labelStyle}>개강일</label><input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} style={inputStyle} /></div>
                  <div>
                    <label style={labelStyle}>운영 기간</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                      {['4주', '6주', '8주', '12주', '기타'].map(d => <button key={d} onClick={() => { setIsCustomDuration(d === '기타'); setFormData({...formData, duration: d === '기타' ? '' : d}) }} style={btnStyle(isCustomDuration ? d === '기타' : formData.duration === d)}>{d}</button>)}
                    </div>
                    {isCustomDuration && <input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="예: 매주 화요일 상시 운영" style={{ ...inputStyle, marginTop: '12px' }} />}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="st5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 style={{ fontSize: '22px', fontWeight: 950, marginBottom: '24px' }}>장소 및 비용</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ position: 'relative' }}>
                    <label style={labelStyle}>장소 검색</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="장소명 검색 (예: 보니따, 강턴)" style={{ ...inputStyle, paddingLeft: '44px' }} />
                      </div>
                    </div>
                    {searchTerm && searchTerm !== '직접 입력' && !formData.studio_name && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                        <div onClick={() => selectVenue('manual')} style={{ padding: '14px 20px', borderBottom: '1px solid #F7FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#FF3B30', fontWeight: 700 }}><Plus size={16} /> 새로운 장소 직접 입력</div>
                        {venues.filter(v => v.studio_name.includes(searchTerm)).map((v, i) => (
                          <div key={i} onClick={() => selectVenue(v)} style={{ padding: '14px 20px', borderBottom: '1px solid #F7FAFC', cursor: 'pointer' }}>
                            <div style={{ fontWeight: 800, fontSize: '14px' }}>{v.studio_name}</div>
                            <div style={{ fontSize: '11px', color: '#A0AEC0' }}>{v.city} {v.district} | {v.address}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {(!searchTerm || formData.studio_name || searchTerm === '직접 입력') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div><label style={labelStyle}>지역/도시</label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>{['서울', '경기·인천', '경상', '전라', '충청', '강원·제주'].map(c => <button key={c} onClick={() => setFormData({...formData, city: c})} style={btnStyle(formData.city === c)}>{c}</button>)}</div></div>
                      <div style={{ display: 'flex', gap: '12px' }}><div style={{ flex: 1 }}><label style={labelStyle}>구/동</label><input value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder="홍대, 강남 등" style={inputStyle} /></div><div style={{ flex: 1 }}><label style={labelStyle}>장소명</label><input value={formData.studio_name} onChange={e => setFormData({...formData, studio_name: e.target.value})} placeholder="스튜디오 이름" style={inputStyle} /></div></div>
                      <div><label style={labelStyle}>상세 주소</label><input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="네비게이션용 주소" style={inputStyle} /></div>
                    </motion.div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}><label style={labelStyle}>참여비 (숫자만)</label><input type="number" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} placeholder="예: 80000" style={inputStyle} /></div>
                    <div style={{ flex: 0.6, display: 'flex', gap: '4px' }}>{['무료', '유료'].map(p => <button key={p} onClick={() => setFormData({...formData, price_label: p})} style={{ ...btnStyle(formData.price_label === p), flex: 1 }}>{p}</button>)}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 푸터 */}
        <div style={{ padding: '24px', display: 'flex', gap: '12px', background: '#fff', borderTop: '1px solid #EDF2F7' }}>
          {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: '#F7FAFC', border: '1px solid #E2E8F0', fontWeight: 800 }}>이전</button>}
          <button 
            disabled={loading || (step === 1 && !formData.poster_url)} 
            onClick={step === 5 ? handleSubmit : () => setStep(s => s + 1)} 
            style={{ flex: 2, padding: '18px', borderRadius: '16px', background: 'linear-gradient(135deg, #FF3B30 0%, #E60000 100%)', color: '#fff', fontWeight: 900, border: 'none', boxShadow: '0 8px 20px rgba(255, 59, 48, 0.2)', opacity: (step === 1 && !formData.poster_url) ? 0.5 : 1 }}
          >
            {loading ? '처리 중...' : (step === 5 ? '신청하기' : '다음 단계')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default PostClass
