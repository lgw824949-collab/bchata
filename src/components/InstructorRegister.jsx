import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const GENRES = ['바차타', '살사', '키좀바', '쥬크']
const CITIES = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '제주', '기타']

const InstructorRegister = ({ onBack }) => {
  const [name, setName] = useState('')
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
    if (!name || genre.length === 0 || !city || !bio) {
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
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 8 }}>신청 완료!</div>
      <div style={{ fontSize: 14, color: '#999', lineHeight: 1.8, marginBottom: 32 }}>
        관리자 검토 후 승인되면<br/>
        라틴에 진심 페이지에 등록돼요.<br/>
        보통 24시간 이내에 처리됩니다 💜
      </div>
      <button
        onClick={onBack}
        style={{ padding: '14px 32px', borderRadius: 16, background: '#7C3AED', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
      >확인</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
        <button
          onClick={onBack}
          style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18 }}
        >←</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>강사 등록 신청 💃</div>
          <div style={{ fontSize: 12, color: '#999' }}>라틴에 진심에 등록해보세요</div>
        </div>
      </div>

      <div style={{ padding: 24 }}>

        {/* 프로필 사진 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <label style={{ cursor: 'pointer', display: 'inline-block' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: '#F3F4F6', border: '3px dashed #DDD6FE', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {preview
                ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28 }}>📸</div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>사진 추가</div>
                  </div>
              }
            </div>
            <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          </label>
          <div style={{ fontSize: 12, color: '#999' }}>프로필 사진 (선택)</div>
        </div>

        {/* 이름 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>이름 <span style={{ color: '#E53935' }}>*</span></div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="강사 이름"
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        {/* 장르 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>전문 장르 <span style={{ color: '#E53935' }}>*</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GENRES.map(g => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                style={{ padding: '8px 16px', borderRadius: 20, border: genre.includes(g) ? 'none' : '1px solid #E5E7EB', background: genre.includes(g) ? '#7C3AED' : '#fff', color: genre.includes(g) ? '#fff' : '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >{g}</button>
            ))}
          </div>
        </div>

        {/* 활동 지역 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>활동 지역 <span style={{ color: '#E53935' }}>*</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CITIES.map(c => (
              <button
                key={c}
                onClick={() => setCity(c)}
                style={{ padding: '8px 16px', borderRadius: 20, border: city === c ? 'none' : '1px solid #E5E7EB', background: city === c ? '#7C3AED' : '#fff', color: city === c ? '#fff' : '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* 한줄 소개 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>한줄 소개 <span style={{ color: '#E53935' }}>*</span></div>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="예: 바차타 10년 경력 · 전국 파티 강사"
            rows={3}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 14, resize: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* 인스타그램 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>인스타그램 아이디</div>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <span style={{ padding: '14px', background: '#F8F8F8', color: '#999', fontSize: 14, borderRight: '1px solid #E5E7EB' }}>@</span>
            <input
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="instagram_id"
              style={{ flex: 1, padding: '14px', border: 'none', fontSize: 14, outline: 'none' }}
            />
          </div>
        </div>

        {/* 카카오 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>카카오 오픈채팅 링크</div>
          <input
            value={kakaoLink}
            onChange={e => setKakaoLink(e.target.value)}
            placeholder="https://open.kakao.com/..."
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={submit}
          disabled={loading}
          style={{ width: '100%', padding: '18px', borderRadius: 16, background: '#7C3AED', color: '#fff', border: 'none', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}
        >{loading ? '신청 중...' : '등록 신청하기 💜'}</button>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 16, lineHeight: 1.6 }}>
          등록 신청 후 관리자 검토를 거쳐 승인됩니다.<br/>
          허위 정보 등록 시 승인이 거절될 수 있어요.
        </div>
      </div>
    </div>
  )
}

export default InstructorRegister
