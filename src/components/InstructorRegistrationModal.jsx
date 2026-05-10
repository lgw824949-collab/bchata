import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Check, User, Music, MapPin, MessageCircle, Info, Zap, Camera, Globe, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

const GENRES = ['바차타', '살사', '키좀바', '쥬크']
const CITIES = ['서울', '경기/인천', '부산', '대구', '대전', '광주', '강원', '제주']

const InstructorRegistrationModal = ({ isOpen, onClose, onSuccess, formData, setFormData }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Local state to prevent focus loss and ensure smooth transitions
  const [localData, setLocalData] = useState(() => formData || {})
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  // Sync back to parent only on blur or when needed, not on every re-render
  const syncWithParent = (data = localData) => {
    if (setFormData) {
      setFormData(data)
    }
  }

  // Handle step changes without forcing a parent sync that might interrupt the transition
  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1)
    } else {
      onClose()
    }
  }

  const handleClose = () => {
    syncWithParent()
    onClose()
  }

  const TOTAL_STEPS = 5

  const toggleGenre = (g) => {
    const currentGenres = Array.isArray(localData.genre) ? localData.genre : []
    const newData = {
      ...localData,
      genre: currentGenres.includes(g) 
        ? currentGenres.filter(item => item !== g)
        : [...currentGenres, g]
    }
    setLocalData(newData)
    syncWithParent(newData)
  }

  const handleSubmit = async () => {
    if (!localData.name || !localData.custom_id || (localData.genre || []).length === 0) {
      alert('필수 정보를 모두 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      let finalPhotoUrl = localData.photo_url || '';

      // Upload image if a new file is selected
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `instructors/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(fileName, imageFile)
        
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('posters')
          .getPublicUrl(fileName)
        
        finalPhotoUrl = urlData.publicUrl
      }

      // Create a copy without the 'experience' field as it doesn't exist in the DB schema
      const { experience, ...submitData } = localData;
      
      // Merge experience info into the bio if it exists
      const finalBio = experience 
        ? `[경력: ${experience}]\n${submitData.bio || ''}`
        : submitData.bio;

      const { error } = await supabase
        .from('instructors')
        .insert([{
          ...submitData,
          photo_url: finalPhotoUrl,
          bio: finalBio,
          status: 'pending',
          follower_count: 0,
          likes_count: 0
        }])

      if (error) throw error
      
      alert('강사 등록 신청이 완료되었습니다! 관리자 승인 후 리스트에 표시됩니다.')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      alert('등록 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ padding: '30px 25px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '8px' }}>
                <Sparkles size={16} color="#C9A84C" />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#C9A84C', letterSpacing: '2px' }}>1단계 / 5단계</span>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 950, color: '#FFF', margin: '0 0 8px 0', letterSpacing: '-1px' }}>어떤 강사님이신가요?</h2>
              <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 500 }}>당신의 멋진 예술가적 이름을 알려주세요.</p>
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#C9A84C', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1.5px' }}>강사명 (활동명)</label>
              <input 
                type="text" 
                value={localData.name || ''} 
                onChange={e => setLocalData({...localData, name: e.target.value})}
                onBlur={() => syncWithParent()}
                placeholder="예: 아만다 로페즈"
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', color: '#FFF', fontSize: '16px', fontWeight: 600, outline: 'none', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#C9A84C', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1.5px' }}>강사 아이디 (나만의 고유 ID)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#C9A84C', fontWeight: 900 }}>@</span>
                <input 
                  type="text" 
                  value={localData.custom_id || ''} 
                  onChange={e => setLocalData({...localData, custom_id: e.target.value})}
                  onBlur={() => syncWithParent()}
                  placeholder="amanda_dance"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px 20px 20px 40px', color: '#FFF', fontSize: '16px', fontWeight: 600, outline: 'none', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '8px', paddingLeft: '5px' }}>* 프로필 주소 및 로그인에 사용되는 고유 아이디입니다.</p>
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ padding: '30px 25px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '8px' }}>
                <Music size={16} color="#C9A84C" />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#C9A84C', letterSpacing: '2px' }}>2단계 / 5단계</span>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 950, color: '#FFF', margin: '0 0 8px 0', letterSpacing: '-1px' }}>전문 분야</h2>
              <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 500 }}>주력 장르와 경력을 선택해주세요.</p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#C9A84C', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1.5px' }}>주력 장르 (중복 선택 가능)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {GENRES.map(g => {
                  const isSelected = (localData.genre || []).includes(g)
                  return (
                    <button 
                      key={g}
                      onClick={() => toggleGenre(g)}
                      style={{ 
                        padding: '12px 22px', borderRadius: '30px', fontSize: '14px', fontWeight: 800,
                        background: isSelected ? 'linear-gradient(135deg, #C9A84C, #FFD700)' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#000' : '#8E8E93',
                        border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isSelected ? '0 10px 20px rgba(201,168,76,0.3)' : 'none'
                      }}
                    >
                      {g}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#C9A84C', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1.5px' }}>강사 경력</label>
              <input 
                type="text" 
                value={localData.experience || ''} 
                onChange={e => setLocalData({...localData, experience: e.target.value})}
                onBlur={() => syncWithParent()}
                placeholder="예: 10년 이상"
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', color: '#FFF', fontSize: '16px', fontWeight: 600, outline: 'none', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
              />
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ padding: '30px 25px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '8px' }}>
                <MapPin size={16} color="#C9A84C" />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#C9A84C', letterSpacing: '2px' }}>3단계 / 5단계</span>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 950, color: '#FFF', margin: '0 0 8px 0', letterSpacing: '-1px' }}>활동 및 소통</h2>
              <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 500 }}>주요 활동 지역과 SNS를 알려주세요.</p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#C9A84C', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1.5px' }}>주요 활동 지역</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {CITIES.map(c => (
                  <button 
                    key={c}
                    onClick={() => setLocalData({...localData, city: c})}
                    style={{ 
                      padding: '14px 0', borderRadius: '14px', fontSize: '13px', fontWeight: 800,
                      background: localData.city === c ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                      color: localData.city === c ? '#C9A84C' : '#8E8E93',
                      border: localData.city === c ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#C9A84C', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1.5px' }}>인스타그램 아이디</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#8E8E93' }}>
                   <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" style={{ width: 18, height: 18, filter: 'grayscale(1) brightness(0.7)' }} />
                </span>
                <input 
                  type="text" 
                  value={localData.instagram || ''} 
                  onChange={e => setLocalData({...localData, instagram: e.target.value})}
                  onBlur={() => syncWithParent()}
                  placeholder="amanda_lopez"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px 20px 20px 50px', color: '#FFF', fontSize: '16px', fontWeight: 600, outline: 'none', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
                />
              </div>
            </div>
          </motion.div>
        )
      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ padding: '30px 25px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '8px' }}>
                <Camera size={16} color="#C9A84C" />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#C9A84C', letterSpacing: '2px' }}>4단계 / 5단계</span>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 950, color: '#FFF', margin: '0 0 8px 0', letterSpacing: '-1px' }}>사진 및 링크</h2>
              <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 500 }}>프로필 사진과 예약 링크를 등록해주세요.</p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#C9A84C', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1.5px' }}>프로필 사진 등록</label>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ cursor: 'pointer', position: 'relative' }}>
                  <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
                  <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(201,168,76,0.3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', transition: 'all 0.3s' }}>
                    {preview || localData.photo_url ? (
                      <img src={preview || localData.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Camera size={28} color="#C9A84C" />
                        <div style={{ fontSize: '9px', color: '#C9A84C', fontWeight: 900, marginTop: '4px' }}>사진 선택</div>
                      </div>
                    )}
                  </div>
                </label>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFF', marginBottom: '4px' }}>{imageFile ? imageFile.name : '사진을 선택해주세요'}</div>
                  <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 500 }}>최대 5MB, JPG/PNG 지원</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#C9A84C', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1.5px' }}>카카오톡 오픈채팅 링크</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#8E8E93' }}><MessageCircle size={18} /></span>
                <input 
                  type="text" 
                  value={localData.kakao_link || ''} 
                  onChange={e => setLocalData({...localData, kakao_link: e.target.value})}
                  onBlur={() => syncWithParent()}
                  placeholder="https://open.kakao.com/..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px 20px 20px 50px', color: '#FFF', fontSize: '14px', fontWeight: 600, outline: 'none', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
                />
              </div>
            </div>
          </motion.div>
        )
      case 5:
        return (
          <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ padding: '30px 25px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '8px' }}>
                <Info size={16} color="#C9A84C" />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#C9A84C', letterSpacing: '2px' }}>5단계 / 5단계</span>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 950, color: '#FFF', margin: '0 0 8px 0', letterSpacing: '-1px' }}>강사 소개</h2>
              <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 500 }}>당신을 표현하는 한 문장을 적어주세요.</p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#C9A84C', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1.5px' }}>강사 한 줄 소개 (BIO)</label>
              <textarea 
                value={localData.bio || ''} 
                onChange={e => setLocalData({...localData, bio: e.target.value})}
                onBlur={() => syncWithParent()}
                placeholder="예: 춤을 통해 세상을 표현하는 컨템포러리 댄서입니다."
                style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', color: '#FFF', fontSize: '15px', fontWeight: 600, outline: 'none', resize: 'none', lineHeight: 1.6, boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
              />
            </div>

            {/* Final Review Summary - Luxury Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.02) 100%)', 
              border: '1px solid rgba(201,168,76,0.25)', borderRadius: '24px', padding: '25px',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }} />
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#C9A84C', marginBottom: '15px', letterSpacing: '1px' }}>최종 확인</div>
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', overflow: 'hidden', background: '#222', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={localData.photo_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFF' }}>{localData.name || '강사명'}</div>
                  <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600 }}>{(localData.genre || []).join(', ')} · {localData.city || ''}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )
      default: return null
    }
  }

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(15px)' }} />
      
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }} 
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        style={{ 
          position: 'relative', width: '100%', maxWidth: '500px', 
          background: 'radial-gradient(circle at center, #1A1A1A 0%, #0D0D0D 100%)', 
          borderRadius: '40px 40px 0 0', maxHeight: '94vh', overflow: 'hidden', 
          display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: "'Outfit', sans-serif",
          boxShadow: '0 -20px 60px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '30px 25px 15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={handleBack} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#FFF', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#FFF', letterSpacing: '2px' }}>강사 등록 신청서</span>
          </div>
          <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#FFF', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Progress Bar - Glowing Gold */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', width: '100%', position: 'relative' }}>
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} 
            style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, #C9A84C, #FFD700)',
              boxShadow: '0 0 15px rgba(201,168,76,0.6)'
            }} 
          />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Footer with Reflection Line */}
        <div style={{ padding: '20px 25px 45px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '15px', position: 'relative' }}>
          {/* Reflection Line */}
          <div style={{ position: 'absolute', top: -1, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)', filter: 'blur(0.5px)' }} />
          
          {step > 1 && (
            <button 
              onClick={handleBack}
              style={{ flex: 1, height: '65px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', color: '#FFF', fontWeight: 800, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
            >
              이전으로
            </button>
          )}
          <button 
            onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
            disabled={loading}
            style={{ 
              flex: 2, height: '65px', borderRadius: '20px', 
              background: 'linear-gradient(135deg, #C9A84C 0%, #FFD700 100%)', 
              color: '#000', fontWeight: 950, fontSize: '16px', border: 'none', 
              cursor: 'pointer', boxShadow: '0 12px 30px rgba(201, 168, 76, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              letterSpacing: '0.5px'
            }}
          >
            {loading ? '처리 중...' : (step === TOTAL_STEPS ? '등록 신청하기' : '다음 단계')}
            {step < TOTAL_STEPS && !loading && <ChevronRight size={20} />}
            {step === TOTAL_STEPS && !loading && <Zap size={20} fill="#000" />}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default InstructorRegistrationModal
