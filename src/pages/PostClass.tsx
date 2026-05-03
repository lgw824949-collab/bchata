import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Camera, Loader2, Sparkles, AlertCircle, ExternalLink, Check, X, MapPin, DollarSign, User, Plus, Music, GraduationCap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Tesseract from 'tesseract.js'

const PostClass = ({ onBack }) => {
  const [loading, setLoading] = useState(false)
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(1)
  const TOTAL_STEPS = 5

  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    class_level: '초급',
    class_detail: '',
    start_time: '19:00',
    end_time: '21:00',
    selected_days: [],
    rule_confirmed: false,
    fee: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    studio_name: '',
    address: '',
    region: '서울',
    dance_style: '바차타',
    week_type: '1주차',
    duration: '상시'
  })

  const DANCE_STYLES = ['바차타', '살사', '쥬크', '키좀바']
  const REGIONS = ['서울', '경기/인천', '경상', '전라', '충청', '강원/제주']
  const LEVELS = ['입문', '초급', '중급', '상급'];
  const DAYS = ['월', '화', '수', '목', '금', '토', '일']
  const THEME_COLOR = '#2ECC71'

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    
    setIsOcrProcessing(true)
    try {
      const result = await Tesseract.recognize(selectedFile, 'kor+eng')
      const { words } = result.data
      const bannedWords = ['수강료', '강습료', '레슨비', '교육비', '수업료']
      let foundBanned = false

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.src = URL.createObjectURL(selectedFile)
      await new Promise(resolve => img.onload = resolve)
      canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0)

      words.forEach(word => {
        if (bannedWords.some(bw => word.text.includes(bw))) {
          foundBanned = true
          const { x0, y0, x1, y1 } = word.bbox
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
          ctx.fillRect(x0 - 2, y0 - 2, (x1 - x0) + 4, (y1 - y0) + 4)
          ctx.fillStyle = THEME_COLOR
          ctx.font = `bold ${Math.floor((y1 - y0) * 0.9)}px sans-serif`
          ctx.fillText('참여비', x0, y1 - ((y1 - y0) * 0.1))
        }
      })

      if (foundBanned) {
        canvas.toBlob((blob) => {
          const editedFile = new File([blob], `edited_${selectedFile.name}`, { type: 'image/jpeg' })
          setFile(editedFile)
          setPreview(URL.createObjectURL(editedFile))
        }, 'image/jpeg', 0.9)
      }
    } catch (err) { console.error('OCR Error:', err) } finally { setIsOcrProcessing(false) }
  }

  const handleSubmit = async () => {
    if (!file || !formData.title || !formData.instructor) return alert('필수 정보를 확인해주세요.')
    setLoading(true)
    try {
      let finalPosterUrl = ''
      const fileName = `${Date.now()}_class.jpg`
      const { error: uploadError } = await supabase.storage.from('posters').upload(`posters/${fileName}`, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('posters').getPublicUrl(`posters/${fileName}`)
      finalPosterUrl = data.publicUrl

      const { error } = await supabase.from('classes_info').insert([{
        title: formData.title,
        instructor: formData.instructor,
        genre: formData.dance_style,
        level: formData.class_level,
        class_detail: formData.class_detail,
        start_time: formData.start_time,
        end_time: formData.end_time,
        day_of_week: formData.selected_days.join(', '),
        start_date: formData.startDate,
        duration: formData.duration,
        studio_name: formData.studio_name,
        address: formData.address,
        city: formData.region,
        poster_url: finalPosterUrl,
        status: 'pending',
        category_type: 'class',
        week_type: formData.week_type
      }])
      if (error) throw error
      setSubmitted(true)
    } catch (err) { alert('등록 실패: ' + err.message) } finally { setLoading(false) }
  }

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={stepTitleStyle}>📸 강습 포스터 선택</label>
            <div onClick={() => document.getElementById('class-upload').click()} style={{ height: '350px', border: `2px dashed ${THEME_COLOR}55`, borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F0FFF4', overflow: 'hidden', cursor: 'pointer' }}>
              {preview ? (
                <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <>
                  <Plus size={40} color={THEME_COLOR} style={{ marginBottom: '16px' }} />
                  <p style={{ fontWeight: 700, color: '#2D3748' }}>탭하여 강습 포스터 업로드</p>
                  <div style={{ marginTop: '12px', padding: '8px 16px', background: '#FFF5F5', borderRadius: '12px', border: '1px solid #FED7D7' }}>
                    <p style={{ fontSize: '11px', color: '#C53030', fontWeight: 800, margin: 0, textAlign: 'center' }}>
                      ⚠️ 중요: '참여비' 혹은 '금액'으로 기재되어야 등록이 가능합니다.
                    </p>
                  </div>
                </>
              )}
              {isOcrProcessing && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color={THEME_COLOR} /><p style={{ marginTop: '10px', fontWeight: 700, color: THEME_COLOR }}>AI 분석 중...</p></div>}
            </div>
            <input type="file" id="class-upload" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </motion.div>
        )
      case 2:
        return (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={stepTitleStyle}>✍️ 강습명 및 강사명</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <p style={labelStyle}>강습 제목</p>
                <div style={{ position: 'relative' }}>
                  <input 
                    style={{ ...inputStyle, paddingRight: '60px' }} 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="예: 강남턴 바차타 파티" 
                    maxLength={16}
                  />
                  <div style={{ position: 'absolute', right: '16px', bottom: '18px', fontSize: '12px', fontWeight: 800, color: formData.title.length >= 16 ? '#E53E3E' : '#A0AEC0' }}>
                    {formData.title.length}/16
                  </div>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#718096', fontWeight: 600 }}>16자 이내로 입력해주세요</p>
              </div>
              <div>
                <p style={labelStyle}>강사명 (또는 닉네임)</p>
                <input style={inputStyle} value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} placeholder="예: 벤틀리 & 제니" />
              </div>
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={stepTitleStyle}>💃 장르 및 레벨 선택</label>
            <p style={labelStyle}>댄스 장르</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {DANCE_STYLES.map(s => <button key={s} onClick={() => setFormData({...formData, dance_style: s})} style={{ ...chipStyle, background: formData.dance_style === s ? THEME_COLOR : '#F7FAFC', color: formData.dance_style === s ? '#fff' : '#4A5568' }}>{s}</button>)}
            </div>
            <p style={labelStyle}>강습 레벨</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {LEVELS.map(l => <button key={l} onClick={() => setFormData({...formData, class_level: l})} style={{ ...chipStyle, flex: 1, background: formData.class_level === l ? THEME_COLOR : '#F7FAFC', color: formData.class_level === l ? '#fff' : '#4A5568' }}>{l}</button>)}
            </div>
            <p style={labelStyle}>강습 한 줄 설명</p>
            <input style={{ ...inputStyle, border: `2px solid ${THEME_COLOR}33` }} value={formData.class_detail} onChange={e => setFormData({...formData, class_detail: e.target.value})} placeholder="어떤 수업인가요? (예: 골반의 움직임을 배웁니다)" />
          </motion.div>
        )
      case 4:
        return (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={stepTitleStyle}>📅 강습 일정 및 기간</label>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={labelStyle}>진행 주차 (필수)</p>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
                {['1주차', '2주차', '3주차', '4주차', '5주차'].map(w => (
                  <button 
                    key={w} 
                    onClick={() => setFormData({...formData, week_type: w})} 
                    style={{ 
                      flexShrink: 0, padding: '10px 16px', borderRadius: '12px', 
                      fontSize: '13px', fontWeight: '800', border: 'none', 
                      background: formData.week_type === w ? THEME_COLOR : '#F1F5F9', 
                      color: formData.week_type === w ? '#fff' : '#64748B',
                      transition: 'all 0.2s'
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={labelStyle}>운영 기간 (필수)</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['4주', '8주', '상시'].map(d => (
                  <button 
                    key={d} 
                    onClick={() => setFormData({...formData, duration: d})} 
                    style={{ 
                      flex: 1, padding: '12px 0', borderRadius: '12px', 
                      fontSize: '13px', fontWeight: '800', border: 'none', 
                      background: formData.duration === d ? THEME_COLOR : '#F1F5F9', 
                      color: formData.duration === d ? '#fff' : '#64748B' 
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={labelStyle}>강습 기간 (시작일 ~ 종료일)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="date" style={inputStyle} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                <input type="date" style={inputStyle} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} placeholder="종료일" />
              </div>
            </div>

            <p style={labelStyle}>강습 요일 (중복 선택 가능)</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px', marginBottom: '24px' }}>
              {DAYS.map(d => <button key={d} onClick={() => setFormData(p => ({...p, selected_days: p.selected_days.includes(d) ? p.selected_days.filter(x => x !== d) : [...p.selected_days, d]}))} style={{ ...dayBtnStyle, background: formData.selected_days.includes(d) ? THEME_COLOR : '#F7FAFC', color: formData.selected_days.includes(d) ? '#fff' : '#4A5568' }}>{d}</button>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><p style={labelStyle}>시작 시간</p><input type="time" style={inputStyle} value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} /></div>
              <div><p style={labelStyle}>종료 시간</p><input type="time" style={inputStyle} value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} /></div>
            </div>
          </motion.div>
        )
      case 5:
        return (
          <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={stepTitleStyle}>📍 장소 및 참여비</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div><p style={labelStyle}>지역</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>{REGIONS.map(r => <button key={r} onClick={() => setFormData({...formData, region: r})} style={{ ...chipStyle, background: formData.region === r ? THEME_COLOR : '#F7FAFC', color: formData.region === r ? '#fff' : '#4A5568' }}>{r}</button>)}</div></div>
              <div><p style={labelStyle}>장소명</p><input style={inputStyle} value={formData.studio_name} onChange={e => setFormData({...formData, studio_name: e.target.value})} placeholder="예: 홍대 댄스스튜디오" /></div>
              <div><p style={labelStyle}>상세 주소</p><input style={inputStyle} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="예: 서울 마포구 ..." /></div>
              <div><p style={labelStyle}>참여비 (숫자만)</p><input type="number" style={inputStyle} value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} placeholder="예: 1.5" /></div>
            </div>
          </motion.div>
        )
      default: return null
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px', background: '#F0FFF4', minHeight: '100vh' }}>
        <div style={{ backgroundColor: THEME_COLOR, width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}><Check size={40} color="white" /></div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#1A202C' }}>강습 등록 신청 완료</h2>
        <p style={{ marginTop: '12px', color: '#4A5568', lineHeight: 1.6 }}>관리자 승인 후 즉시 노출됩니다.</p>
        <button onClick={onBack} style={{ marginTop: '40px', width: '100%', padding: '20px', background: THEME_COLOR, color: 'white', borderRadius: '16px', fontWeight: 800, fontSize: '18px', border: 'none' }}>확인</button>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onBack} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '32px 32px 0 0', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #EDF2F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => { if(step > 1) setStep(step - 1); else onBack(); }} style={{ border: 'none', background: 'none' }}><ChevronLeft size={24} color="#1A202C" /></button>
          <span style={{ fontWeight: 900, fontSize: '18px', color: '#1A202C' }}>강습 등록 신청 ({step}/{TOTAL_STEPS})</span>
          <button onClick={onBack} style={{ border: 'none', background: 'none' }}><X size={24} color="#A0AEC0" /></button>
        </div>
        <div style={{ height: '4px', background: '#EDF2F7', width: '100%' }}><motion.div animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} style={{ height: '100%', background: THEME_COLOR }} /></div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid #EDF2F7', display: 'flex', gap: '12px' }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, height: '60px', borderRadius: '18px', background: '#EDF2F7', color: '#4A5568', fontWeight: 900, border: 'none' }}>이전</button>}
          <button onClick={() => { if(step < TOTAL_STEPS) setStep(step + 1); else handleSubmit(); }} disabled={loading} style={{ flex: 2, height: '60px', borderRadius: '18px', background: THEME_COLOR, color: 'white', fontWeight: 900, fontSize: '18px', border: 'none', boxShadow: `0 8px 20px ${THEME_COLOR}33` }}>{loading ? '처리 중...' : (step === TOTAL_STEPS ? '등록 신청' : '다음 단계')}</button>
        </div>
      </motion.div>
    </div>
  )
}

const stepTitleStyle = { display: 'block', fontSize: '20px', fontWeight: 950, color: '#1A202C', marginBottom: '24px' }
const labelStyle = { fontSize: '14px', fontWeight: 800, color: '#718096', marginBottom: '8px' }
const inputStyle = { width: '100%', padding: '18px', border: '2px solid #EDF2F7', borderRadius: '16px', fontSize: '16px', background: '#F7FAFC', outline: 'none' }
const chipStyle = { padding: '12px 0', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 800, transition: 'all 0.2s' }
const dayBtnStyle = { flex: 1, height: '45px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 800 }

export default PostClass
