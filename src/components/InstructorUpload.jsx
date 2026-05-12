import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const InstructorUpload = ({ onBack, instructorId = '8f69b01d-bf65-4459-88fa-84190fe1f160' }) => {
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [postCount, setPostCount] = useState(0)

  React.useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('instructor_posts')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
      setPostCount(count || 0)
    }
    fetchCount()
  }, [instructorId])



  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const upload = async () => {
    if (!imageFile) return
    
    // 30 Photo Limit Check
    if (postCount >= 30) {
      const confirmRotate = window.confirm('갤러리가 30장으로 가득 찼습니다. 새 사진을 올리면 가장 오래된 사진이 자동으로 삭제됩니다. 계속하시겠습니까?')
      if (!confirmRotate) return
    }

    setLoading(true)
    try {
      // If over limit, delete oldest first
      if (postCount >= 30) {
        const { data: oldest } = await supabase
          .from('instructor_posts')
          .select('id')
          .eq('instructor_id', instructorId)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()
        
        if (oldest) {
          await supabase.from('instructor_posts').delete().eq('id', oldest.id)
        }
      }

      const ext = imageFile.name.split('.').pop()
      const fileName = `instructor_posts/${instructorId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(fileName, imageFile)
      if (uploadError) throw uploadError
      
      const { data: urlData } = supabase.storage
        .from('posters')
        .getPublicUrl(fileName)
      
      await supabase.from('instructor_posts').insert({
        instructor_id: instructorId,
        image_url: urlData.publicUrl,
        caption: caption,
        status: 'active' // Set to active directly for now as per user request for "immediate result"
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
        지금 즉시 마스터 프로필에 게시되었습니다.<br/>
        나의 최신 소식을 확인해보세요.
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
        {true && (
          <>

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
