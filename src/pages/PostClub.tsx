import React, { useState } from 'react'
import { ChevronLeft, Camera, Loader2, Check, Clock, Calendar, Plus, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Tesseract from 'tesseract.js'

import { CLASS_CATEGORIES, DANCE_STYLES, REGIONS, DAYS } from '../lib/constants'

const PostClub = ({ onBack, user }) => {
  const [loading, setLoading] = useState(false)
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    category: '베이직/기초',
    days: [],
    startTime: '19:00',
    endTime: '21:00',
    fee: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    studio_name: '',
    address: '',
    region: '서울',
    dance_style: '바차타',
    rule_confirmed: false
  })

  const THEME_COLOR = '#FF8C00' // Distinctive Orange for Clubs

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day]
    }))
  }

  // Location Auto-lookup logic (consistent with RegisterForm)
  const handleLocationNameChange = (name) => {
    setFormData(prev => ({ ...prev, studio_name: name }))
    if (name.length >= 2) {
      const { findBarByName } = require('../lib/BarLib') // Import dynamically or ensure it's available
      const matched = findBarByName(name)
      if (matched) {
        setFormData(prev => ({
          ...prev,
          address: matched.address,
          region: matched.region || '서울' // Default or classify
        }))
      }
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async () => {
    if (!file) return alert('포스터 이미지를 올려주세요.')
    if (!formData.title) return alert('동호회/강습 명칭을 입력해주세요.')
    if (formData.days.length === 0) return alert('요일을 선택해주세요.')
    if (!formData.rule_confirmed) return alert('유의사항 확인이 필요합니다.')
    
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

      const { error } = await supabase.from('classes_info').insert([{
        title: formData.title,
        instructor: formData.instructor,
        genre: formData.dance_style,
        level: formData.category,
        day_of_week: formData.days.join(', '),
        start_time: formData.startTime,
        end_time: formData.endTime,
        start_date: formData.startDate,
        duration: formData.endDate ? `~ ${formData.endDate}` : '상시 운영',
        studio_name: formData.studio_name,
        address: formData.address,
        city: formData.region,
        fee: formData.fee ? `${formData.fee}만원` : '참가비 문의',
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
      <div style={{ textAlign: 'center', padding: '100px 24px', background: 'white', minHeight: '100vh' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <Check size={40} color={THEME_COLOR} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>등록 신청 완료!</h2>
        <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: '1.6', marginBottom: '40px' }}>
          정상적으로 접수되었습니다.<br/>관리자 승인 후 즉시 노출됩니다.
        </p>
        <button onClick={onBack} style={{ width: '100%', height: '56px', borderRadius: '16px', background: THEME_COLOR, color: 'white', fontWeight: 800, fontSize: '16px', border: 'none' }}>확인</button>
      </div>
    )
  }

  return (
    <div style={{ background: '#F9FAFB', height: '100vh', overflowY: 'auto', paddingBottom: '100px', fontFamily: "'Pretendard', sans-serif", WebkitOverflowScrolling: 'touch' }}>
      <header style={{ position: 'sticky', top: 0, background: 'white', padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        <ChevronLeft onClick={onBack} size={28} style={{ cursor: 'pointer' }} />
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 800, marginRight: '28px' }}>강습 · 정모 등록하기</h1>
      </header>

      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <section style={{ marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div 
            onClick={() => document.getElementById('club-poster').click()}
            style={{ 
              width: '120px', height: '160px', background: '#F3F4F6', borderRadius: '16px', border: '2px dashed #E5E7EB', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', flexShrink: 0
            }}
          >
            {preview ? <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : (
              <><Plus size={24} color="#9CA3AF" /><p style={{ marginTop: '8px', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>포스터 업로드</p></>
            )}
          </div>
          <div style={{ flex: 1, fontSize: '12px', color: '#999', lineHeight: '1.6' }}>
            <p style={{ margin: 0 }}>"포스터에 일정 · 가격 · 강사 정보를 모두 담아주세요."</p>
            <p style={{ margin: 0 }}>"수강료 · 강습비 · 렌트비 · 수업료는 참가비 또는 금액으로 통일해주세요."</p>
          </div>
          <input id="club-poster" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </section>

        <div style={{ background: 'white', padding: '24px', borderRadius: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>강습/동호회 명칭</label>
            <input 
              type="text" placeholder="예) 강남 바차타 기초반, 살사사랑 정모" value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              style={inputStyle} 
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>강사명</label>
            <input 
              type="text" placeholder="예) 강사 이름 또는 닉네임" value={formData.instructor}
              onChange={e => setFormData({...formData, instructor: e.target.value})}
              style={inputStyle} 
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>강습 유형 (카테고리)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CLASS_CATEGORIES.map(cat => (
                <button 
                  key={cat} onClick={() => setFormData({...formData, category: cat})}
                  style={{ 
                    height: '44px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, border: '1px solid',
                    borderColor: formData.category === cat ? THEME_COLOR : '#F3F4F6',
                    background: formData.category === cat ? THEME_COLOR : '#F9FAFB',
                    color: formData.category === cat ? 'white' : '#6B7280'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>댄스 장르</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {DANCE_STYLES.map(style => (
                <button 
                  key={style} type="button" onClick={() => setFormData({...formData, dance_style: style})}
                  style={{ 
                    height: '42px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, border: '1px solid',
                    borderColor: formData.dance_style === style ? THEME_COLOR : '#F3F4F6',
                    background: formData.dance_style === style ? THEME_COLOR : '#F9FAFB',
                    color: formData.dance_style === style ? 'white' : '#6B7280'
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>활동 지역</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {REGIONS.map(reg => (
                <button 
                  key={reg} type="button" onClick={() => setFormData({...formData, region: reg})}
                  style={{ 
                    height: '42px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, border: '1px solid',
                    borderColor: formData.region === reg ? THEME_COLOR : '#F3F4F6',
                    background: formData.region === reg ? THEME_COLOR : '#F9FAFB',
                    color: formData.region === reg ? 'white' : '#6B7280'
                  }}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>정모/강습 요일</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
              {DAYS.map(day => (
                <button 
                  key={day} onClick={() => toggleDay(day)}
                  style={{ 
                    flex: 1, height: '40px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: '1px solid',
                    borderColor: formData.days.includes(day) ? THEME_COLOR : '#F3F4F6',
                    background: formData.days.includes(day) ? THEME_COLOR : '#F9FAFB',
                    color: formData.days.includes(day) ? 'white' : '#6B7280'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>장소 및 주소</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                placeholder="장소명 (예: 강남 턴 바)" value={formData.studio_name}
                onChange={e => setFormData({...formData, studio_name: e.target.value})}
                style={inputStyle} 
              />
              <input 
                placeholder="상세 주소 (카카오 지도 연동용)" value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                style={inputStyle} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>운영 기간</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="date" value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                style={{ ...inputStyle, flex: 1 }} 
              />
              <span style={{ color: '#9CA3AF' }}>~</span>
              <input 
                type="date" value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                style={{ ...inputStyle, flex: 1 }} 
              />
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>* 종료일 미지정 시 '상시 운영'으로 노출됩니다.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionTitleStyle}>활동 시간 (30분 단위)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
                style={{ ...inputStyle, flex: 1, textAlign: 'center', appearance: 'none', textAlignLast: 'center' }}
              >
                {Array.from({ length: 19 }).map((_, i) => {
                  const totalMinutes = 12 * 60 + i * 30;
                  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
                  const m = (totalMinutes % 60 === 0 ? '00' : '30');
                  const t = `${h}:${m}`;
                  return <option key={t} value={t}>{t}</option>;
                })}
              </select>
              <span style={{ color: '#9CA3AF' }}>~</span>
              <select 
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
                style={{ ...inputStyle, flex: 1, textAlign: 'center', appearance: 'none', textAlignLast: 'center' }}
              >
                {Array.from({ length: 19 }).map((_, i) => {
                  const totalMinutes = 12 * 60 + i * 30;
                  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
                  const m = (totalMinutes % 60 === 0 ? '00' : '30');
                  const t = `${h}:${m}`;
                  return <option key={t} value={t}>{t}</option>;
                })}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={sectionTitleStyle}>참가비</label>
            <input 
              type="number" step="0.1" placeholder="예) 1.5 (만원 단위)" value={formData.fee}
              onChange={e => setFormData({...formData, fee: e.target.value})}
              style={inputStyle} 
            />
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>* 숫자만 입력하세요 (1.5 = 15,000원)</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', padding: '16px', background: '#FFF7ED', borderRadius: '16px', marginBottom: '32px', border: '1px solid #FFEDD5' }}>
            <input 
              type="checkbox" checked={formData.rule_confirmed}
              onChange={e => setFormData({...formData, rule_confirmed: e.target.checked})}
              style={{ width: '22px', height: '22px', accentColor: THEME_COLOR }}
            />
            <label style={{ fontSize: '13px', color: '#9A3412', fontWeight: 600, lineHeight: 1.5 }}>포스터 내 '참가비' 또는 '금액' 용어 사용 확인 (수강료/회비 등 기재 시 반려 가능)</label>
          </div>

          <button 
            onClick={handleSubmit} disabled={loading}
            style={{ 
              width: '100%', height: '60px', borderRadius: '18px', background: THEME_COLOR, color: 'white', 
              fontWeight: 800, fontSize: '17px', border: 'none', boxShadow: `0 8px 20px ${THEME_COLOR}33`,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '등록 중...' : '동호회 강습 등록 완료'}
          </button>
        </div>
      </main>
    </div>
  )
}

const sectionTitleStyle = {
  display: 'block', fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '10px'
}

const inputStyle = {
  width: '100%', height: '50px', padding: '0 16px', borderRadius: '12px', border: '1px solid #F3F4F6', background: '#F9FAFB', fontSize: '15px', outline: 'none', transition: 'all 0.2s'
}

export default PostClub
