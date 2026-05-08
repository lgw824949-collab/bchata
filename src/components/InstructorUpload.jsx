import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const InstructorUpload = ({ onBack }) => {
  const [instructorId, setInstructorId] = useState('')
  const [instructor, setInstructor] = useState(null)
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const findInstructor = async () => {
    if (!instructorId.trim()) return
    const { data } = await supabase
      .from('instructors')
      .select('*')
      .eq('id', instructorId.trim())
      .single()
    if (data) {
      setInstructor(data)
      setStep(2)
    } else {
      alert('강사 ID를 찾을 수 없어요.')
    }
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const upload = async () => {
    if (!imageFile || !instructor) return
    setLoading(true)
    try {
      const ext = imageFile.name.split('.').pop()
      const fileName = `instructor_posts/${instructor.id}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(fileName, imageFile)
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage
        .from('posters')
        .getPublicUrl(fileName)
      await supabase.from('instructor_posts').insert({
        instructor_id: instructor.id,
        image_url: urlData.publicUrl,
        caption: caption,
        status: 'pending'
      })
      setDone(true)
    } catch (err) {
      alert('업로드 실패했어요. 다시 시도해주세요.')
      console.error(err)
    }
    setLoading(false)
  }

  if (done) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 8 }}>업로드 완료!</div>
      <div style={{ fontSize: 14, color: '#999', lineHeight: 1.6, marginBottom: 32 }}>
        관리자 승인 후 프로필에 표시돼요.<br/>보통 24시간 이내에 처리됩니다.
      </div>
      <button onClick={onBack} style={{ padding: '14px 32px', borderRadius: 16, background: '#7C3AED', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>확인</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F1F5F9' }}>
        <button onClick={onBack} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18 }}>←</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>게시물 올리기 📸</div>
          <div style={{ fontSize: 12, color: '#999' }}>강사 전용 포스터 업로드</div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {step === 1 && (
          <>
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 8 }}>강사 ID를 입력해주세요</div>
              <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>관리자에게 받은 고유 ID를 입력하세요</div>
            </div>
            <input
              value={instructorId}
              onChange={e => setInstructorId(e.target.value)}
              placeholder="강사 ID 입력"
              style={{ width: '100%', padding: '16px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
            <button onClick={findInstructor} style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#7C3AED', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>확인</button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8F7FF', borderRadius: 16, padding: 16, marginBottom: 24, border: '1px solid #EDE9FE' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: '#EDE9FE', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {instructor?.photo_url ? <img src={instructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '💃'}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{instructor?.name}</div>
                <div style={{ fontSize: 12, color: '#7C3AED' }}>{Array.isArray(instructor?.genre) ? instructor.genre.join(' · ') : instructor?.genre}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>포스터 이미지 *</div>
              <label style={{ display: 'flex', width: '100%', aspectRatio: '1', background: '#F8F7FF', border: '2px dashed #DDD6FE', borderRadius: 16, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', boxSizing: 'border-box' }}>
                {preview
                  ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
                      <div style={{ fontSize: 14, color: '#999' }}>이미지를 선택해주세요</div>
                    </div>
                }
                <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>설명 (선택)</div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="파티/클래스 소개를 입력해주세요"
                rows={3}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 14, resize: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={upload}
              disabled={!imageFile || loading}
              style={{ width: '100%', padding: '16px', borderRadius: 16, background: imageFile ? '#7C3AED' : '#E5E7EB', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: imageFile ? 'pointer' : 'default' }}
            >{loading ? '업로드 중...' : '게시물 올리기'}</button>
          </>
        )}
      </div>
    </div>
  )
}

export default InstructorUpload
