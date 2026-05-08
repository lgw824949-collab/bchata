import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ChevronLeft, Check, Sparkles, User, MessageCircle, MapPin, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

const GENRES = ['바차타', '살사', '키좀바', '쥬크']
const CITIES = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '제주', '기타']

const InstructorRegister = ({ onBack }) => {
  const [name, setName] = useState('')
  const [customId, setCustomId] = useState('')
  const [genre, setGenre] = useState([])
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [kakaoLink, setKakaoLink] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const toggleGenre = (g) => {
    setGenre(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async () => {
    if (!name || !customId || genre.length === 0 || !city || !bio) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      let photoUrl = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `instructors/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(fileName, imageFile)
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('posters')
            .getPublicUrl(fileName)
          photoUrl = urlData.publicUrl
        }
      }
      await supabase.from('instructors').insert({
        name,
        custom_id: customId,
        genre,
        city,
        bio,
        instagram,
        kakao_link: kakaoLink,
        photo_url: photoUrl,
        status: 'pending',
        follower_count: 0,
        likes_count: 0
      })
      setDone(true)
    } catch (err) {
      alert('등록 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      console.error(err)
    }
    setLoading(false)
  }

  if (done) return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ padding: '60px 40px', textAlign: 'center', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ width: 100, height: 100, borderRadius: '40px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 20px 40px rgba(124, 58, 237, 0.1)' }}>
        <Sparkles size={48} color="#7C3AED" />
      </div>
      <div style={{ fontSize: 28, fontWeight: 950, color: '#1E293B', marginBottom: 12, letterSpacing: '-0.5px' }}>신청이 완료되었습니다!</div>
      <div style={{ fontSize: 16, color: '#64748B', lineHeight: 1.8, marginBottom: 40, fontWeight: 500 }}>
        전문 강사 포트폴리오 구성을 위해<br/>
        관리자가 꼼꼼히 검토 중입니다.<br/>
        <span style={{ color: '#7C3AED', fontWeight: 800 }}>보통 24시간 이내</span>에 승인됩니다 💜
      </div>
      <button
        onClick={onBack}
        style={{ width: '100%', maxWidth: 200, padding: '18px', borderRadius: '20px', background: '#7C3AED', color: '#fff', border: 'none', fontSize: 16, fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)' }}
      >확인</button>
    </motion.div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFB', paddingBottom: 100 }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <button
          onClick={onBack}
          style={{ background: '#F1F5F9', border: 'none', borderRadius: '16px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1E293B' }}
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 950, color: '#1E293B', letterSpacing: '-0.5px' }}>강사 등록 신청 💃</div>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>나만의 프리미엄 포트폴리오 만들기</div>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
          {/* 1. 프로필 이미지 업로드 */}
          <section>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 900, color: '#64748B', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Camera size={16} /> 01. Profile Photo
            </label>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <label style={{ cursor: 'pointer', position: 'relative' }}>
                <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
                <div style={{ 
                  width: 140, height: 140, borderRadius: '48px', background: '#F1F5F9', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  overflow: 'hidden', border: '2px dashed #CBD5E1', transition: 'all 0.2s ease'
                }}>
                  {preview ? (
                    <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Camera size={32} color="#94A3B8" />
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 800, marginTop: 4 }}>UPLOAD</div>
                    </div>
                  )}
                </div>
                {preview && (
                  <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#7C3AED', width: 32, height: 32, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }}>
                    <Check size={16} color="#fff" strokeWidth={4} />
                  </div>
                )}
              </label>
            </div>
          </section>

          {/* 2. 기본 정보 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 900, color: '#64748B', marginBottom: '-8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <User size={16} /> 02. Essential Info
            </label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  value={name} onChange={e => setName(e.target.value)} 
                  placeholder="활동명 (예: 김춤꾼)" 
                  style={{ width: '100%', padding: '20px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '16px', fontWeight: 700, color: '#1E293B', outline: 'none', transition: 'all 0.2s ease' }} 
                />
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  value={customId} onChange={e => setCustomId(e.target.value)} 
                  placeholder="고유 ID (예: dancer_kim)" 
                  style={{ width: '100%', padding: '20px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '16px', fontWeight: 700, color: '#1E293B', outline: 'none' }} 
                />
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, marginLeft: 12 }}>* 강사 프로필 URL에 사용됩니다.</div>
              </div>
            </div>
          </section>

          {/* 3. 장르 선택 */}
          <section>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 900, color: '#64748B', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Zap size={16} /> 03. Genre Selection
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  style={{
                    padding: '12px 24px', borderRadius: '16px', fontSize: '15px', fontWeight: 800,
                    border: genre.includes(g) ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                    background: genre.includes(g) ? '#F5F3FF' : '#fff',
                    color: genre.includes(g) ? '#7C3AED' : '#64748B',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >{g}</button>
              ))}
            </div>
          </section>

          {/* 4. 활동 지역 */}
          <section>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 900, color: '#64748B', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <MapPin size={16} /> 04. Primary City
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  style={{
                    padding: '10px 0', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                    border: city === c ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                    background: city === c ? '#F5F3FF' : '#fff',
                    color: city === c ? '#7C3AED' : '#64748B',
                    cursor: 'pointer'
                  }}
                >{c}</button>
              ))}
            </div>
          </section>

          {/* 5. 자기 소개 */}
          <section>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 900, color: '#64748B', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Sparkles size={16} /> 05. Biography
            </label>
            <textarea 
              value={bio} onChange={e => setBio(e.target.value)} 
              placeholder="자신을 자유롭게 소개해주세요 (경력, 스타일 등)" 
              style={{ width: '100%', height: '140px', padding: '20px', borderRadius: '24px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '16px', color: '#1E293B', outline: 'none', resize: 'none', lineHeight: 1.6 }} 
            />
          </section>

          {/* 6. SNS 채널 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 900, color: '#64748B', marginBottom: '-4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Camera size={16} /> 06. Social Channels
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '6px 20px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" style={{ width: 20, height: 20 }} />
              <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="인스타그램 ID" style={{ flex: 1, padding: '16px 0', border: 'none', fontSize: '15px', fontWeight: 700, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '6px 20px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <MessageCircle size={20} color="#FEE500" fill="#FEE500" />
              <input value={kakaoLink} onChange={e => setKakaoLink(e.target.value)} placeholder="카카오 오픈프로필 링크" style={{ flex: 1, padding: '16px 0', border: 'none', fontSize: '15px', fontWeight: 700, outline: 'none' }} />
            </div>
          </section>

          {/* 제출 버튼 */}
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={submit}
              disabled={loading}
              style={{
                width: '100%', padding: '24px', borderRadius: '24px', border: 'none',
                background: loading ? '#94A3B8' : 'linear-gradient(90deg, #7C3AED, #6D28D9)',
                color: '#fff', fontSize: '18px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 15px 30px rgba(124, 58, 237, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
              }}
            >
              {loading ? '신청 중...' : '신청하기 💃'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default InstructorRegister
