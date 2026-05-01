import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Camera, Loader2, Sparkles, AlertCircle, ExternalLink, Check, Instagram, MapPin, DollarSign, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Tesseract from 'tesseract.js'

const PostClass = ({ onBack }) => {
  const [loading, setLoading] = useState(false)
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    class_type: '베이직',
    start_time: '19:00',
    end_time: '21:00',
    selected_days: [],
    rule_confirmed: false,
    fee: '',
    description: '',
    custom_class_type: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    studio_name: '',
    address: '',
    region: '서울',
    dance_style: '바차타'
  })

  const DANCE_STYLES = ['바차타', '살사', '주크', '키좀바']
  const REGIONS = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주']

  const CLASS_TYPES = [
    '한곡반', '릴스반', '베이직', '공연반', '마스터반', '레이디스타일링', 
    '맨스타일링', '풋워크', '부트캠프', '워크샾', '기초반', '중급반', '고급반', '기타'
  ];

  const DAYS = [
    { label: '월', value: '월' }, { label: '화', value: '화' }, { label: '수', value: '수' },
    { label: '목', value: '목' }, { label: '금', value: '금' }, { label: '토', value: '토' },
    { label: '일', value: '일' }
  ]

  const THEME_COLOR = '#2ECC71'
  const BEIGE_BG = '#FDFBF7'

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      selected_days: prev.selected_days.includes(day)
        ? prev.selected_days.filter(d => d !== day)
        : [...prev.selected_days, day]
    }))
  }

  const handleOcr = async (imageFile) => {
    setIsOcrProcessing(true)
    try {
      const result = await Tesseract.recognize(imageFile, 'kor+eng')
      const { words } = result.data
      const bannedWords = ['수강료', '강습료', '레슨비', '교육비', '수업료', '입금', '은행']
      let foundBannedInImage = false

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.src = URL.createObjectURL(imageFile)
      await new Promise(resolve => img.onload = resolve)

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      words.forEach(word => {
        const cleanText = word.text.trim()
        if (bannedWords.some(bw => cleanText.includes(bw))) {
          foundBannedInImage = true
          const { x0, y0, x1, y1 } = word.bbox
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fillRect(x0 - 2, y0 - 2, (x1 - x0) + 4, (y1 - y0) + 4)
          ctx.fillStyle = THEME_COLOR
          ctx.font = `bold ${Math.floor((y1 - y0) * 0.9)}px sans-serif`
          ctx.fillText('참여비', x0, y1 - ((y1 - y0) * 0.1))
        }
      })

      if (foundBannedInImage) {
        canvas.toBlob((blob) => {
          const editedFile = new File([blob], `edited_${imageFile.name}`, { type: 'image/jpeg' })
          setFile(editedFile)
          setPreview(URL.createObjectURL(editedFile))
        }, 'image/jpeg', 0.9)
      }
    } catch (err) {
      console.error('OCR Error:', err)
    } finally {
      setIsOcrProcessing(false)
    }
  }

  const handleSubmit = async () => {
    if (!file) return alert('포스터 사진을 업로드해주세요.')
    if (!formData.title) return alert('강습명을 입력해주세요.')
    if (formData.selected_days.length === 0) return alert('요일을 선택해주세요.')
    if (!formData.rule_confirmed) return alert('유의사항 확인이 필요합니다.')
    setLoading(true)

    try {
      let finalPosterUrl = ''
      if (file) {
        const fileName = `${Date.now()}_post.jpg`
        const { error: uploadError } = await supabase.storage.from('posters').upload(`posters/${fileName}`, file)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('posters').getPublicUrl(`posters/${fileName}`)
        finalPosterUrl = data.publicUrl
      }

      const { error } = await supabase.from('classes_info').insert([{
        title: formData.title,
        genre: formData.dance_style,
        level: formData.class_type === '기타' ? formData.custom_class_type : formData.class_type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        day_of_week: formData.selected_days.join(', '),
        start_date: formData.startDate,
        duration: formData.endDate ? `~ ${formData.endDate}` : '기간 미지정',
        studio_name: formData.studio_name,
        address: formData.address,
        city: formData.region,
        poster_url: finalPosterUrl,
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      handleOcr(selectedFile)
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px', backgroundColor: '#F7FDF9', minHeight: '100vh' }}>
        <div style={{ backgroundColor: THEME_COLOR, width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 10px 25px rgba(46, 204, 113, 0.2)' }}><Check size={40} color="white" /></div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#111827', marginBottom: '12px' }}>강습 등록 완료</h2>
        <p style={{ fontSize: '16px', color: '#6B7280', lineHeight: '1.6', marginBottom: '40px' }}>
          정상적으로 접수되었습니다.<br />관리자 승인 후 강습 목록에 노출됩니다.
        </p>
        <button onClick={onBack} style={{ width: '100%', padding: '20px', background: THEME_COLOR, color: 'white', borderRadius: '16px', fontWeight: 800, fontSize: '18px', border: 'none', cursor: 'pointer' }}>확인</button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '32px 20px 120px 20px', fontFamily: "'Pretendard', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
        <button onClick={onBack} style={{ background: 'white', border: 'none', borderRadius: '14px', padding: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <ChevronLeft size={28} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '22px', fontWeight: 800, marginRight: '48px', color: '#111', letterSpacing: '-0.03em' }}>초간편 강습 등록</h1>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={cardStyle}>
          <div style={{ marginBottom: '32px' }}>
            <label style={sectionTitleStyle}>포스터 사진 업로드</label>
            <div
              onClick={() => document.getElementById('poster-upload').click()}
              style={{
                height: '280px', borderRadius: '24px', border: `2px dashed ${isOcrProcessing ? THEME_COLOR : '#DDD'}`,
                backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'all 0.2s'
              }}
            >
              {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <><Camera size={44} color="#999" /><p style={{ marginTop: '12px', fontSize: '15px', color: '#999', fontWeight: 500 }}>사진 선택하기</p></>}
              {isOcrProcessing && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <Loader2 className="animate-spin" size={36} color={THEME_COLOR} /><p style={{ marginTop: '12px', fontWeight: 700, color: THEME_COLOR, fontSize: '16px' }}>AI 분석 중...</p>
                </div>
              )}
            </div>
            <input id="poster-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <label style={sectionTitleStyle}>댄스 장르</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {DANCE_STYLES.map(style => (
                <button 
                  key={style}
                  type="button"
                  onClick={() => setFormData({...formData, dance_style: style})}
                  style={{ 
                    height: '45px', 
                    borderRadius: '12px', 
                    border: '1.5px solid', 
                    borderColor: formData.dance_style === style ? THEME_COLOR : '#EEE',
                    background: formData.dance_style === style ? `${THEME_COLOR}10` : 'white',
                    color: formData.dance_style === style ? THEME_COLOR : '#666',
                    fontWeight: formData.dance_style === style ? 700 : 500,
                    fontSize: '14px'
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: '#333', marginBottom: '12px' }}>참가비</label>
            <input 
              type="number" 
              placeholder="예) 1.5" 
              value={formData.fee}
              onChange={e => setFormData({...formData, fee: e.target.value})}
              style={{ ...inputStyle, border: '1.5px solid #EEE' }} 
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: '#333', marginBottom: '12px' }}>강습 기간</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                style={{ ...inputStyle, flex: 1, border: '1.5px solid #EEE' }} 
              />
              <span style={{ color: '#999' }}>~</span>
              <input 
                type="date" 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                style={{ ...inputStyle, flex: 1, border: '1.5px solid #EEE' }} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={sectionTitleStyle}>활동 지역</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {REGIONS.map(reg => (
                <button 
                  key={reg}
                  onClick={() => setFormData({...formData, region: reg})}
                  style={{ 
                    height: '45px', 
                    borderRadius: '12px', 
                    border: '1.5px solid', 
                    borderColor: formData.region === reg ? THEME_COLOR : '#EEE',
                    background: formData.region === reg ? `${THEME_COLOR}10` : 'white',
                    color: formData.region === reg ? THEME_COLOR : '#666',
                    fontWeight: formData.region === reg ? 700 : 500,
                    fontSize: '14px'
                  }}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={sectionTitleStyle}>장소 및 주소</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                placeholder="장소명 (미정 시 '추후 공지' 입력)" 
                value={formData.studio_name}
                onChange={e => setFormData({...formData, studio_name: e.target.value})}
                style={{ ...inputStyle, border: '1.5px solid #EEE' }} 
              />
              <p style={{ fontSize: '11px', color: '#999', marginTop: '-5px', marginBottom: '5px' }}>* 장소가 아직 정해지지 않았다면 '추후 공지'라고 적어주세요.</p>
              <input 
                placeholder="상세 주소 (카카오 지도 연동용)" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                style={{ ...inputStyle, border: '1.5px solid #EEE' }} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={sectionTitleStyle}>강습명</label>
            <input 
              style={{ ...inputStyle, border: 'none', borderBottom: `2px solid ${THEME_COLOR}`, borderRadius: 0, padding: '12px 0', height: 'auto', fontSize: '22px', fontWeight: 800 }}
              placeholder="강습 이름을 입력하세요"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={sectionTitleStyle}>강습 유형</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {CLASS_TYPES.map(cat => (
                <button
                  key={cat} type="button" onClick={() => setFormData({ ...formData, class_type: cat })}
                  style={{
                    height: '48px', borderRadius: '12px', border: formData.class_type === cat ? 'none' : '1.5px solid #EEE',
                    backgroundColor: formData.class_type === cat ? THEME_COLOR : '#FFF',
                    color: formData.class_type === cat ? '#FFF' : '#444',
                    fontWeight: 700, fontSize: '14px', transition: '0.2s',
                    boxShadow: formData.class_type === cat ? `0 4px 12px ${THEME_COLOR}33` : 'none'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            {formData.class_type === '기타' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '12px' }}>
                <input 
                  style={{ ...inputStyle, border: `2.5px solid ${THEME_COLOR}`, background: '#FFF' }}
                  placeholder="직접 입력 (예: 소셜 파티)"
                  value={formData.custom_class_type || ''}
                  onChange={e => setFormData({ ...formData, custom_class_type: e.target.value })}
                />
              </motion.div>
            )}
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={sectionTitleStyle}>강습 요일</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              {DAYS.map(day => (
                <button
                  key={day.value} type="button" onClick={() => toggleDay(day.value)}
                  style={{
                    flex: 1, height: '48px', borderRadius: '12px', border: formData.selected_days.includes(day.value) ? 'none' : '1.5px solid #EEE',
                    backgroundColor: formData.selected_days.includes(day.value) ? THEME_COLOR : '#FFF',
                    color: formData.selected_days.includes(day.value) ? '#FFF' : '#444',
                    fontWeight: 700, fontSize: '14px', transition: '0.2s',
                    boxShadow: formData.selected_days.includes(day.value) ? `0 4px 12px ${THEME_COLOR}33` : 'none'
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="시작 시간">
              <input 
                type="time" style={{ ...inputStyle, height: '52px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} 
                value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              />
            </Field>
            <Field label="종료 시간">
              <input 
                type="time" style={{ ...inputStyle, height: '52px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} 
                value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #EDF2F7' }}>
            <input 
              type="checkbox" checked={formData.rule_confirmed}
              onChange={e => setFormData({ ...formData, rule_confirmed: e.target.checked })}
              style={{ width: '22px', height: '22px', accentColor: THEME_COLOR, cursor: 'pointer' }}
            />
            <label style={{ fontSize: '14px', color: '#4A5568', fontWeight: 600, lineHeight: 1.5, cursor: 'pointer' }}>포스터 내 '참여비' 용어 사용을 확인했습니다. (레슨비/강습료 기재 시 반려될 수 있습니다.)</label>
          </div>
        </div>

        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid #EEE', zIndex: 100 }}>
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'block', height: '64px', backgroundColor: THEME_COLOR, color: 'white', borderRadius: '16px', fontWeight: 800, fontSize: '18px', border: 'none', boxShadow: `0 8px 24px ${THEME_COLOR}44`, cursor: 'pointer' }}
          >
            {loading ? '등록 중...' : '강습 등록 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '24px',
  padding: '32px 24px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
}

const sectionTitleStyle = {
  fontFamily: "'Pretendard', sans-serif",
  fontSize: '18px',
  fontWeight: 700,
  color: '#222',
  marginBottom: '16px',
  display: 'block',
  letterSpacing: '-0.03em'
}

const Field = ({ label, children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
    <label style={{ fontSize: '14px', fontWeight: 700, color: '#718096' }}>{label}</label>
    {children}
  </div>
)

const inputStyle = {
  width: '100%',
  height: '52px',
  padding: '0 16px',
  borderRadius: '12px',
  border: '1px solid #DDD',
  backgroundColor: '#FFF',
  fontSize: '16px',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
  letterSpacing: '-0.02em'
}

export default PostClass
