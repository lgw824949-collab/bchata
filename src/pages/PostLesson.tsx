import React, { useState } from 'react'
import { ChevronLeft, Camera, Loader2, Check, Clock, Calendar, Plus, DollarSign, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Tesseract from 'tesseract.js'

import { CLASS_CATEGORIES, DANCE_STYLES, DAYS } from '../lib/constants'
import { appendLessonPublisherMeta } from '../lib/lessonPublisher'

const PostLesson = ({ onBack, user, initialVenue = null }) => {
  const venueLocked = Boolean(initialVenue?.name || initialVenue?.studio_name)
  const [loading, setLoading] = useState(false)
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(1)

  const TOTAL_STEPS = 4

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    categories: [] as string[],
    dance_styles: ['바차타'] as string[],
    custom_category: '',
    days: [],
    startTime: '19:00',
    endTime: '21:00',
    fee: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    studio_name: initialVenue?.name || initialVenue?.studio_name || '',
    address: initialVenue?.address || '',
    region: initialVenue?.region || '서울',
    location_id: initialVenue?.id ? String(initialVenue.id) : '',
  })

  const REGIONS = ['서울', '경인', '경상', '전라', '충청', '강원/제주']

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day]
    }))
  }

  const toggleCategory = (cat) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }))
  }

  const toggleDanceStyle = (style) => {
    setFormData((prev) => ({
      ...prev,
      dance_styles: prev.dance_styles.includes(style)
        ? prev.dance_styles.filter((item) => item !== style)
        : [...prev.dance_styles, style],
    }))
  }

  const buildCategoryLevelLabel = (categories, customCategory) => {
    const parts = categories.map((cat) => (
      cat === '기타' && String(customCategory || '').trim()
        ? String(customCategory).trim()
        : cat
    )).filter(Boolean)
    return parts.join(' · ')
  }

  const handleOcr = async (imageFile) => {
    setIsOcrProcessing(true)
    try {
      const result = await Tesseract.recognize(imageFile, 'kor+eng')
      const text = result.data.text
      
      // Simple extraction logic
      if (text.includes('원') || text.includes('만원')) {
        const feeMatch = text.match(/(\d+)\s*(?:원|만원)/)
        if (feeMatch) setFormData(prev => ({ ...prev, fee: feeMatch[1] }))
      }
    } catch (err) {
      console.error('OCR Error:', err)
    } finally {
      setIsOcrProcessing(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      handleOcr(selectedFile)
    }
  }

  const handleSubmit = async () => {
    if (!file) return alert('포스터 이미지를 올려주세요.')
    if (!formData.title) return alert('강습 또는 동호회 명칭을 입력해주세요.')
    if (formData.days.length === 0) return alert('요일을 선택해주세요.')
    
    setLoading(true)
    try {
      let posterUrl = ''
      if (file) {
        const fileName = `${Date.now()}_lesson.jpg`
        const { error: uploadError } = await supabase.storage.from('posters').upload(`lessons/${fileName}`, file)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('posters').getPublicUrl(`lessons/${fileName}`)
        posterUrl = data.publicUrl
      }

      const publisherId = formData.location_id || '';
      const lessonRow = {
        title: formData.title,
        genre: formData.dance_styles.join(', '),
        level: buildCategoryLevelLabel(formData.categories, formData.custom_category),
        day_of_week: formData.days.join(', '),
        start_time: formData.startTime,
        end_time: formData.endTime,
        start_date: formData.startDate,
        duration: formData.endDate ? `~ ${formData.endDate}` : '기간 미지정',
        studio_name: formData.studio_name,
        address: formData.address,
        city: formData.region,
        fee: formData.fee ? `${formData.fee}만원` : '참가비 문의',
        poster_url: posterUrl,
        status: 'approved',
        category_type: 'venue',
        description: appendLessonPublisherMeta(formData.description, 'venue', publisherId),
      };

      const withLocationId = publisherId && !String(publisherId).startsWith('bar-')
        ? { ...lessonRow, location_id: publisherId }
        : lessonRow;

      let { error } = await supabase.from('classes_info').insert([withLocationId]);
      if (error && /location_id/i.test(String(error.message || ''))) {
        ({ error } = await supabase.from('classes_info').insert([lessonRow]));
      }

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
      <div style={{ textAlign: 'center', padding: '100px 24px', background: 'white', minHeight: '100vh' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <Check size={40} color="#FF8C00" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>등록 완료!</h2>
        <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: '1.6', marginBottom: '40px' }}>
          {venueLocked
            ? <>BAR 수업으로 등록되었습니다.<br />해당 BAR 상세 · 수업 탭에서 바로 확인할 수 있습니다.</>
            : <>정상적으로 등록되었습니다.<br />강습 목록에 즉시 노출됩니다.</>}
        </p>
        <button onClick={onBack} style={{ width: '100%', height: '56px', borderRadius: '16px', background: '#FF8C00', color: 'white', fontWeight: 800, fontSize: '16px', border: 'none' }}>확인</button>
      </div>
    )
  }

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', paddingBottom: '60px' }}>
      <header style={{ position: 'sticky', top: 0, background: 'white', padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        <ChevronLeft onClick={() => {
          if (step > 1) setStep(step - 1)
          else onBack()
        }} size={28} style={{ cursor: 'pointer' }} />
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 800, marginRight: '28px' }}>
          {venueLocked ? `BAR 수업 등록 (${step}/${TOTAL_STEPS})` : `강습 홍보하기 (${step}/${TOTAL_STEPS})`}
        </h1>
      </header>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: '#F3F4F6', width: '100%' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          style={{ height: '100%', background: '#FF8C00' }}
        />
      </div>

      <main style={{ padding: '24px 20px' }}>
        {venueLocked ? (
          <div style={{ margin: '0 0 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(212, 67, 110, 0.1)',
                color: '#9D174D',
                border: '1px solid rgba(212, 67, 110, 0.2)',
              }}
            >
              업체 전용
            </span>
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* 포스터 섹션 */}
              <section style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>포스터 이미지</label>
                <div 
                  style={{ 
                    width: 'calc(100% + 40px)', 
                    marginLeft: '-20px', 
                    minHeight: preview ? 'auto' : '320px', 
                    background: 'white', 
                    borderTop: '1px solid #F3F4F6',
                    borderBottom: '1px solid #F3F4F6',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                >
                  {preview ? (
                    <div style={{ width: '100%', position: 'relative' }}>
                      <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreview(null);
                          setFile(null);
                        }}
                        style={{ 
                          position: 'absolute', top: '16px', right: '16px', 
                          background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', 
                          borderRadius: '50%', width: '36px', height: '36px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)'
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => document.getElementById('lesson-poster').click()}
                      style={{ padding: '40px 0', textAlign: 'center', cursor: 'pointer', width: '100%' }}
                    >
                      <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Camera size={32} color="#9CA3AF" />
                      </div>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: '#6B7280' }}>포스터 이미지 선택</p>
                      <p style={{ marginTop: '4px', fontSize: '13px', color: '#9CA3AF' }}>AI가 내용을 자동으로 분석해드려요</p>
                    </div>
                  )}
                  {isOcrProcessing && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                      <Loader2 className="animate-spin" color="#FF8C00" />
                    </div>
                  )}
                </div>
                <input id="lesson-poster" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              </section>

              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '8px' }}>강습/동호회 명칭</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="예: 강남턴 바차타 파티" 
                    maxLength={16}
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    style={{ width: '100%', height: '48px', padding: '0 60px 0 16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '15px', outline: 'none' }} 
                  />
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: formData.title.length >= 16 ? '#EF4444' : '#9CA3AF' }}>
                    {formData.title.length}/16
                  </div>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>16자 이내로 입력해주세요</p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6' }}>
                {/* 댄스 장르 선택 */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>댄스 장르 (중복 선택)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {DANCE_STYLES.map((style) => {
                      const selected = formData.dance_styles.includes(style)
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleDanceStyle(style)}
                          style={{
                            height: '40px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 700,
                            border: '1px solid',
                            borderColor: selected ? '#FF8C00' : '#E5E7EB',
                            background: selected ? '#FF8C00' : 'white',
                            color: selected ? 'white' : '#6B7280',
                          }}
                        >
                          {style}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 강습 유형 선택 */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>강습 유형 (중복 선택)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {CLASS_CATEGORIES.map(cat => {
                      const selected = formData.categories.includes(cat)
                      return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        style={{
                          height: '42px', borderRadius: '10px', border: '1px solid', fontSize: '13px',
                          borderColor: selected ? '#FF8C00' : '#E5E7EB',
                          background: selected ? '#FFF7ED' : 'white',
                          color: selected ? '#FF8C00' : '#6B7280',
                          fontWeight: selected ? 700 : 400
                        }}
                      >
                        {cat}
                      </button>
                    )})}
                  </div>
                  {formData.categories.includes('기타') && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="직접 입력하세요" 
                        value={formData.custom_category || ''} 
                        onChange={e => setFormData({...formData, custom_category: e.target.value})}
                        style={{ width: '100%', height: '45px', border: '2.5px solid #FF8C00', borderRadius: '10px', padding: '0 15px', outline: 'none' }}
                      />
                    </motion.div>
                  )}
                </div>

                {/* 활동 지역 */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>활동 지역</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {REGIONS.map(reg => (
                      <button 
                        key={reg}
                        type="button"
                        onClick={() => setFormData({...formData, region: reg})}
                        style={{ 
                          height: '40px', 
                          borderRadius: '10px', 
                          fontSize: '13px', 
                          fontWeight: 700,
                          border: '1px solid',
                          borderColor: formData.region === reg ? '#FF8C00' : '#E5E7EB',
                          background: formData.region === reg ? '#FF8C00' : 'white',
                          color: formData.region === reg ? 'white' : '#6B7280'
                        }}
                      >
                        {reg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6' }}>
                {/* 요일 선택 */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>진행 요일</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {DAYS.map(day => (
                      <button 
                        key={day}
                        onClick={() => toggleDay(day)}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '20px', 
                          fontSize: '13px', 
                          fontWeight: 700,
                          border: '1px solid',
                          borderColor: formData.days.includes(day) ? '#FF8C00' : '#E5E7EB',
                          background: formData.days.includes(day) ? '#FF8C00' : 'white',
                          color: formData.days.includes(day) ? 'white' : '#6B7280'
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>강습 기간</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="date" 
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                      style={{ flex: 1, height: '42px', padding: '0 10px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }} 
                    />
                    <span style={{ color: '#9CA3AF' }}>~</span>
                    <input 
                      type="date" 
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                      style={{ flex: 1, height: '42px', padding: '0 10px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }} 
                    />
                  </div>
                </div>

                {/* 시간 설정 */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>강습 시간</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Clock size={16} style={{ position: 'absolute', left: '12px', top: '16px', color: '#9CA3AF' }} />
                      <input 
                        type="time" 
                        value={formData.startTime}
                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                        style={{ width: '100%', height: '48px', padding: '0 12px 0 36px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '15px' }} 
                      />
                    </div>
                    <span style={{ color: '#9CA3AF' }}>~</span>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Clock size={16} style={{ position: 'absolute', left: '12px', top: '16px', color: '#9CA3AF' }} />
                      <input 
                        type="time" 
                        value={formData.endTime}
                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                        style={{ width: '100%', height: '48px', padding: '0 12px 0 36px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '15px' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6' }}>
                {/* 장소 및 주소 */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>장소 및 주소</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      placeholder="장소명 (미정 시 '추후 공지' 입력)" 
                      value={formData.studio_name}
                      readOnly={venueLocked}
                      onChange={e => setFormData({...formData, studio_name: e.target.value})}
                      style={{ height: '42px', padding: '0 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', background: venueLocked ? '#F3F4F6' : '#fff' }} 
                    />
                    <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '-4px', marginBottom: '4px' }}>* 장소 미정 시 '추후 공지'라고 적어주세요.</p>
                    <input 
                      placeholder="상세 주소 (카카오 지도 연동용)" 
                      value={formData.address}
                      readOnly={venueLocked && Boolean(formData.address)}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      style={{ height: '42px', padding: '0 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', background: venueLocked && formData.address ? '#F3F4F6' : '#fff' }} 
                    />
                    {venueLocked ? (
                      <p style={{ fontSize: 11, color: '#D4436E', margin: 0, fontWeight: 700 }}>
                        * 이 BAR에 연결된 수업으로 등록됩니다.
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* 참가비 */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '8px' }}>참가비</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '16px', color: '#9CA3AF' }} />
                    <input 
                      type="number" 
                      placeholder="예) 1.5 (만원 단위)" 
                      value={formData.fee}
                      onChange={e => setFormData({...formData, fee: e.target.value})}
                      style={{ width: '100%', height: '48px', padding: '0 16px 0 36px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '15px' }} 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                flex: 1, height: '56px', borderRadius: '16px', background: '#F3F4F6', color: '#4B5563', fontWeight: 700, fontSize: '16px', border: 'none'
              }}
            >
              이전으로
            </button>
          )}
          
          {step < TOTAL_STEPS ? (
            <button
              onClick={() => {
                if (step === 1 && !formData.title) return alert('명칭을 입력해주세요.')
                if (step === 2 && formData.dance_styles.length === 0) return alert('댄스 장르를 하나 이상 선택해주세요.')
                if (step === 2 && formData.categories.length === 0) return alert('강습 유형을 하나 이상 선택해주세요.')
                if (step === 2 && formData.categories.includes('기타') && !String(formData.custom_category || '').trim()) {
                  return alert('기타 유형을 입력해주세요.')
                }
                setStep(step + 1)
              }}
              style={{
                flex: 2, height: '56px', borderRadius: '16px', background: '#FF8C00', color: 'white', fontWeight: 800, fontSize: '16px', border: 'none',
                boxShadow: '0 8px 20px rgba(255, 140, 0, 0.2)'
              }}
            >
              다음 단계로
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              style={{ 
                flex: 2, height: '56px', borderRadius: '16px', background: '#FF8C00', color: 'white', fontWeight: 800, fontSize: '16px', border: 'none',
                boxShadow: '0 8px 20px rgba(255, 140, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}
            >
              {loading ? <Loader2 className="animate-spin" /> : '작성 완료'}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

export default PostLesson
