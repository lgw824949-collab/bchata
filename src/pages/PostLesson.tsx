import React, { useState } from 'react'
import { ChevronLeft, Camera, Loader2, Check, Clock, Calendar, Plus, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Tesseract from 'tesseract.js'

import { CLASS_CATEGORIES, DANCE_STYLES, DAYS } from '../lib/constants'

const PostLesson = ({ onBack, user }) => {
  const [loading, setLoading] = useState(false)
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '베이직',
    dance_style: '바차타',
    custom_category: '',
    days: [],
    startTime: '19:00',
    endTime: '21:00',
    fee: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    studio_name: '',
    address: '',
    region: '서울'
  })

  const REGIONS = ['서울', '경기/인천', '경상', '전라', '충청', '강원/제주']

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day]
    }))
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

      const { error } = await supabase.from('classes_info').insert([{
        title: formData.title,
        genre: formData.dance_style,
        level: formData.category === '기타' ? formData.custom_category : formData.category,
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
        status: 'pending',
        category_type: 'class'
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
      <div style={{ textAlign: 'center', padding: '100px 24px', background: 'white', minHeight: '100vh' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <Check size={40} color="#FF8C00" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>등록 신청 완료!</h2>
        <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: '1.6', marginBottom: '40px' }}>
          관리자 승인 후 강습 목록에 노출됩니다.<br />보통 1시간 내로 처리됩니다.
        </p>
        <button onClick={onBack} style={{ width: '100%', height: '56px', borderRadius: '16px', background: '#FF8C00', color: 'white', fontWeight: 800, fontSize: '16px', border: 'none' }}>확인</button>
      </div>
    )
  }

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', paddingBottom: '60px' }}>
      <header style={{ position: 'sticky', top: 0, background: 'white', padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        <ChevronLeft onClick={onBack} size={28} style={{ cursor: 'pointer' }} />
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 800, marginRight: '28px' }}>강습 홍보하기</h1>
      </header>

      <main style={{ padding: '24px 20px' }}>
        {/* 포스터 섹션 */}
        <section style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>포스터 이미지</label>
          <div 
            onClick={() => document.getElementById('lesson-poster').click()}
            style={{ 
              width: '100%', 
              height: '240px', 
              background: 'white', 
              borderRadius: '20px', 
              border: '2px dashed #E5E7EB', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {preview ? (
              <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <>
                <Camera size={40} color="#9CA3AF" />
                <p style={{ marginTop: '12px', fontSize: '14px', color: '#9CA3AF' }}>이미지 선택 (AI 분석 포함)</p>
              </>
            )}
            {isOcrProcessing && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" color="#FF8C00" />
              </div>
            )}
          </div>
          <input id="lesson-poster" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </section>

        {/* 강습 기본 정보 */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '8px' }}>강습/동호회 명칭</label>
            <input 
              type="text" 
              placeholder="예) 바차타 패턴 원리반" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '15px', outline: 'none' }} 
            />
          </div>

          {/* 댄스 장르 선택 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>댄스 장르</label>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {DANCE_STYLES.map(style => (
                <button
                  key={style}
                  onClick={() => setFormData({...formData, dance_style: style})}
                  style={{
                    padding: '10px 20px', borderRadius: '12px', border: '1px solid', fontSize: '14px', whiteSpace: 'nowrap',
                    borderColor: formData.dance_style === style ? '#FF8C00' : '#E5E7EB',
                    background: formData.dance_style === style ? '#FFF7ED' : 'white',
                    color: formData.dance_style === style ? '#FF8C00' : '#6B7280',
                    fontWeight: formData.dance_style === style ? 700 : 400
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* 강습 유형 선택 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>강습 유형</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CLASS_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFormData({...formData, category: cat})}
                  style={{
                    height: '42px', borderRadius: '10px', border: '1px solid', fontSize: '13px',
                    borderColor: formData.category === cat ? '#FF8C00' : '#E5E7EB',
                    background: formData.category === cat ? '#FFF7ED' : 'white',
                    color: formData.category === cat ? '#FF8C00' : '#6B7280',
                    fontWeight: formData.category === cat ? 700 : 400
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            {formData.category === '기타' && (
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

          {/* 요일 선택 */}
          {/* 댄스 장르 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>댄스 장르</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {DANCE_STYLES.map(style => (
                <button 
                  key={style}
                  type="button"
                  onClick={() => setFormData({...formData, dance_style: style})}
                  style={{ 
                    height: '40px', 
                    borderRadius: '10px', 
                    fontSize: '13px', 
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: formData.dance_style === style ? '#FF8C00' : '#E5E7EB',
                    background: formData.dance_style === style ? '#FF8C00' : 'white',
                    color: formData.dance_style === style ? 'white' : '#6B7280'
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* 활동 지역 */}
          <div style={{ marginBottom: '24px' }}>
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
          
          {/* 장소 및 주소 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '12px' }}>장소 및 주소</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                placeholder="장소명 (미정 시 '추후 공지' 입력)" 
                value={formData.studio_name}
                onChange={e => setFormData({...formData, studio_name: e.target.value})}
                style={{ height: '42px', padding: '0 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }} 
              />
              <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '-4px', marginBottom: '4px' }}>* 장소 미정 시 '추후 공지'라고 적어주세요.</p>
              <input 
                placeholder="상세 주소 (카카오 지도 연동용)" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                style={{ height: '42px', padding: '0 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }} 
              />
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
          <div style={{ marginBottom: '24px' }}>
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

          {/* 참가비 */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '8px' }}>참가비</label>
            <input 
              type="number" 
              placeholder="예) 1.5 (만원 단위)" 
              value={formData.fee}
              onChange={e => setFormData({...formData, fee: e.target.value})}
              style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '15px' }} 
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading}
            style={{ 
              width: '100%', 
              height: '56px', 
              borderRadius: '16px', 
              background: '#FF8C00', 
              color: 'white', 
              fontWeight: 800, 
              fontSize: '17px', 
              border: 'none',
              boxShadow: '0 10px 25px rgba(255, 140, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? <Loader2 className="animate-spin" /> : '작성 완료'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default PostLesson
