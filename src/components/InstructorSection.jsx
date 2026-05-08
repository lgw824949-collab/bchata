import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const GENRES = ['전체', '바차타', '살사', '키좀바', '쥬크', '⭐ 내 팔로잉']

const SESSION_KEY = 'oneulbam_session'
const getSession = () => {
  let s = localStorage.getItem(SESSION_KEY)
  if (!s) { s = crypto.randomUUID(); localStorage.setItem(SESSION_KEY, s) }
  return s
}

const InstructorSection = () => {
  const [instructors, setInstructors] = useState([])
  const [follows, setFollows] = useState({})
  const [likes, setLikes] = useState({})
  const [selectedGenre, setSelectedGenre] = useState('전체')
  const [selectedInstructor, setSelectedInstructor] = useState(null)

  useEffect(() => {
    fetchInstructors()
  }, [])

  const fetchInstructors = async () => {
    const { data } = await supabase
      .from('instructors')
      .select('*')
      .eq('status', 'active')
      .order('follower_count', { ascending: false })
    if (data) setInstructors(data)

    const session = getSession()
    const { data: followData } = await supabase
      .from('instructor_follows')
      .select('instructor_id')
      .eq('user_session', session)
    if (followData) {
      const map = {}
      followData.forEach(f => { map[f.instructor_id] = true })
      setFollows(map)
    }

    const { data: likeData } = await supabase
      .from('instructor_likes')
      .select('instructor_id')
      .eq('user_session', session)
    if (likeData) {
      const map = {}
      likeData.forEach(l => { map[l.instructor_id] = true })
      setLikes(map)
    }
  }

  const toggleFollow = async (e, instructorId) => {
    e.stopPropagation()
    const session = getSession()
    const isFollowing = follows[instructorId]
    const instructor = instructors.find(i => i.id === instructorId)
    if (isFollowing) {
      await supabase.from('instructor_follows').delete().eq('instructor_id', instructorId).eq('user_session', session)
      await supabase.from('instructors').update({ follower_count: (instructor?.follower_count || 1) - 1 }).eq('id', instructorId)
    } else {
      await supabase.from('instructor_follows').insert({ instructor_id: instructorId, user_session: session })
      await supabase.from('instructors').update({ follower_count: (instructor?.follower_count || 0) + 1 }).eq('id', instructorId)
    }
    setFollows(prev => ({ ...prev, [instructorId]: !isFollowing }))
    setInstructors(prev => prev.map(i => i.id === instructorId
      ? { ...i, follower_count: i.follower_count + (isFollowing ? -1 : 1) }
      : i
    ))
  }

  const toggleLike = async (e, instructorId) => {
    e.stopPropagation()
    const session = getSession()
    const isLiked = likes[instructorId]
    const instructor = instructors.find(i => i.id === instructorId)
    if (isLiked) {
      await supabase.from('instructor_likes').delete().eq('instructor_id', instructorId).eq('user_session', session)
      await supabase.from('instructors').update({ likes_count: (instructor?.likes_count || 1) - 1 }).eq('id', instructorId)
    } else {
      await supabase.from('instructor_likes').insert({ instructor_id: instructorId, user_session: session })
      await supabase.from('instructors').update({ likes_count: (instructor?.likes_count || 0) + 1 }).eq('id', instructorId)
    }
    setLikes(prev => ({ ...prev, [instructorId]: !isLiked }))
    setInstructors(prev => prev.map(i => i.id === instructorId
      ? { ...i, likes_count: i.likes_count + (isLiked ? -1 : 1) }
      : i
    ))
  }

  const filteredInstructors = selectedGenre === '전체'
    ? instructors
    : selectedGenre === '⭐ 내 팔로잉'
    ? instructors.filter(i => follows[i.id])
    : instructors.filter(i => {
        const genre = Array.isArray(i.genre) ? i.genre.join(' ') : (i.genre || '')
        return genre.includes(selectedGenre)
      })

  const getGenre = (genre) => Array.isArray(genre) ? genre.join(' · ') : (genre || '')

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* 장르 탭 */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0', overflowX: 'auto' }}>
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: 20,
              border: selectedGenre === g ? 'none' : '1px solid #E5E7EB',
              background: selectedGenre === g ? '#7C3AED' : '#fff',
              color: selectedGenre === g ? '#fff' : '#666',
              fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >{g}</button>
        ))}
      </div>

      {/* 강사 수 */}
      <div style={{ padding: '12px 16px 4px', fontSize: 12, color: '#999' }}>
        {selectedGenre === '⭐ 내 팔로잉'
          ? `${filteredInstructors.length}명 팔로잉 중`
          : `${filteredInstructors.length}명의 강사`
        }
      </div>

      {/* 강사 리스트 */}
      <div style={{ padding: '8px 16px 100px' }}>
        {filteredInstructors.map(instructor => (
          <div
            key={instructor.id}
            onClick={() => setSelectedInstructor(instructor)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 0', borderBottom: '1px solid #F3F4F6',
              cursor: 'pointer'
            }}
          >
            {/* 프로필 사진 */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
              background: '#F3F4F6', flexShrink: 0,
              border: follows[instructor.id] ? '2px solid #7C3AED' : '2px solid #E5E7EB'
            }}>
              {instructor.photo_url
                ? <img src={instructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💃</div>
              }
            </div>

            {/* 정보 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{instructor.name}</span>
                <span style={{ fontSize: 11, color: '#fff', background: '#7C3AED', padding: '2px 8px', borderRadius: 10 }}>{getGenre(instructor.genre)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{instructor.city}</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{instructor.bio}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#999' }}>👥 {instructor.follower_count || 0}명</span>
                <span style={{ fontSize: 11, color: '#999' }}>❤️ {instructor.likes_count || 0}</span>
              </div>
            </div>

            {/* 팔로우 버튼 */}
            <button
              onClick={(e) => toggleFollow(e, instructor.id)}
              style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 20,
                border: follows[instructor.id] ? '1px solid #7C3AED' : '1px solid #E5E7EB',
                background: follows[instructor.id] ? '#7C3AED' : '#fff',
                color: follows[instructor.id] ? '#fff' : '#666',
                fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >{follows[instructor.id] ? '✓ 팔로잉' : '+ 팔로우'}</button>
          </div>
        ))}

        {filteredInstructors.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: 14, whiteSpace: 'pre-line' }}>
            {selectedGenre === '⭐ 내 팔로잉'
              ? '아직 팔로우한 강사가 없어요 💜\n마음에 드는 강사를 팔로우해보세요!'
              : '해당 장르 강사가 없어요 🕺'
            }
          </div>
        )}
      </div>

      {/* 강사 상세 모달 */}
      {selectedInstructor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: '#fff', overflowY: 'auto' }}>
          {/* 헤더 */}
          <div style={{ position: 'sticky', top: 0, background: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F1F5F9', zIndex: 1 }}>
            <button
              onClick={() => setSelectedInstructor(null)}
              style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18 }}
            >←</button>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{selectedInstructor.name}</span>
          </div>

          {/* 프로필 */}
          {/* 프로필 상단 - 좌우 레이아웃 */}
          <div style={{ padding: '24px', display: 'flex', gap: 20, alignItems: 'flex-start', borderBottom: '1px solid #F3F4F6' }}>
            
            {/* 왼쪽: 프로필 사진 */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: '#F3F4F6', border: '3px solid #7C3AED' }}>
                {selectedInstructor.photo_url
                  ? <img src={selectedInstructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>💃</div>
                }
              </div>
            </div>

            {/* 오른쪽: 정보 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111', marginBottom: 4 }}>{selectedInstructor.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#fff', background: '#7C3AED', padding: '2px 10px', borderRadius: 10, fontWeight: 700 }}>
                  {Array.isArray(selectedInstructor.genre) ? selectedInstructor.genre.join(' · ') : selectedInstructor.genre}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>📍 {selectedInstructor.city}</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>{selectedInstructor.bio}</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 13, color: '#555' }}>👥 <strong>{selectedInstructor.follower_count || 0}</strong> 팔로워</span>
                <span style={{ fontSize: 13, color: '#E53935' }}>❤️ <strong>{selectedInstructor.likes_count || 0}</strong> 좋아요</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div style={{ padding: '16px 24px', display: 'flex', gap: 8, borderBottom: '1px solid #F3F4F6' }}>
            <button
              onClick={(e) => toggleFollow(e, selectedInstructor.id)}
              style={{
                flex: 1, padding: '14px', borderRadius: 16, border: 'none',
                background: follows[selectedInstructor.id] ? '#EDE9FE' : '#7C3AED',
                color: follows[selectedInstructor.id] ? '#7C3AED' : '#fff',
                fontSize: 15, fontWeight: 900, cursor: 'pointer'
              }}
            >{follows[selectedInstructor.id] ? '✓ 팔로잉 중' : '+ 팔로우'}</button>
            
            <button
              onClick={(e) => toggleLike(e, selectedInstructor.id)}
              style={{
                width: 52, height: 52, borderRadius: 16, border: '1px solid #E5E7EB',
                background: likes[selectedInstructor.id] ? '#FEE2E2' : '#fff',
                fontSize: 22, cursor: 'pointer', flexShrink: 0
              }}
            >{likes[selectedInstructor.id] ? '❤️' : '🤍'}</button>

            {selectedInstructor.instagram && (
              <button
                onClick={() => window.open(`https://instagram.com/${selectedInstructor.instagram}`, '_blank')}
                style={{ width: 52, height: 52, borderRadius: 16, border: '1px solid #E5E7EB', background: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0 }}
              >📸</button>
            )}
            {selectedInstructor.kakao_link && (
              <button
                onClick={() => window.open(selectedInstructor.kakao_link, '_blank')}
                style={{ width: 52, height: 52, borderRadius: 16, border: '1px solid #FEE500', background: '#FEE500', fontSize: 20, cursor: 'pointer', flexShrink: 0 }}
              >💬</button>
            )}
          </div>

          <div style={{ padding: '24px' }}>
            {/* 1. 강사 한줄 소개 카드 */}
            <div style={{ margin: '0 0 16px', background: '#F8F7FF', borderRadius: 16, padding: 20, border: '1px solid #EDE9FE', textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 800, marginBottom: 8, letterSpacing: 1 }}>✦ 강사 소개</div>
              <div style={{ fontSize: 15, color: '#333', lineHeight: 1.8 }}>
                {selectedInstructor.bio || '소개글을 준비 중이에요 💜'}
              </div>
            </div>

            {/* 2. 경력/활동 지역 카드 */}
            <div style={{ margin: '0 0 16px', display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: '#F8F7FF', borderRadius: 16, padding: 16, border: '1px solid #EDE9FE', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>📍</div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>활동 지역</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{selectedInstructor.city || '전국'}</div>
              </div>
              <div style={{ flex: 1, background: '#F8F7FF', borderRadius: 16, padding: 16, border: '1px solid #EDE9FE', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>💃</div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>전문 장르</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>
                  {getGenre(selectedInstructor.genre)}
                </div>
              </div>
              <div style={{ flex: 1, background: '#F8F7FF', borderRadius: 16, padding: 16, border: '1px solid #EDE9FE', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>👥</div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>팔로워</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{selectedInstructor.follower_count || 0}명</div>
              </div>
            </div>

            {/* 3. 예정 파티/클래스 섹션 */}
            <div style={{ margin: '0 0 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#111', marginBottom: 12 }}>📅 예정 파티 · 클래스</div>
              <div style={{ background: '#F8F7FF', borderRadius: 16, padding: 20, border: '1px solid #EDE9FE', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
                <div style={{ fontSize: 14, color: '#999', lineHeight: 1.6 }}>
                  등록된 파티/클래스가 없어요<br/>
                  <span style={{ fontSize: 12 }}>곧 업데이트될 예정이에요</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InstructorSection
