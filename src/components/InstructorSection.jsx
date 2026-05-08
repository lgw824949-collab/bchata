import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Camera, ChevronLeft, Check, Sparkles, User, MessageCircle, MapPin, Zap } from 'lucide-react'

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
  const [posts, setPosts] = useState([])

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

  useEffect(() => {
    if (!selectedInstructor) return
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('instructor_posts')
        .select('*')
        .eq('instructor_id', selectedInstructor.id)
        .order('created_at', { ascending: false })
      if (data) setPosts(data)
    }
    fetchPosts()
  }, [selectedInstructor])

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
        {filteredInstructors.map((instructor) => (
          <motion.div
            key={instructor.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedInstructor(instructor)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '20px', borderRadius: '24px', background: '#fff',
              marginBottom: '12px', border: '1px solid #F1F5F9',
              cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}
            whileHover={{ y: -2, boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
          >
            {/* 프로필 사진 */}
            <div style={{
              width: 72, height: 72, borderRadius: '24px', overflow: 'hidden',
              background: '#F8FAFC', flexShrink: 0,
              border: follows[instructor.id] ? '2px solid #7C3AED' : '1px solid #E2E8F0'
            }}>
              {instructor.photo_url
                ? <img src={instructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💃</div>
              }
            </div>

            {/* 정보 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>{instructor.name}</span>
                <span style={{ 
                  fontSize: 10, color: '#7C3AED', background: '#F5F3FF', 
                  padding: '2px 8px', borderRadius: '6px', fontWeight: 800,
                  border: '1px solid #EDE9FE'
                }}>{getGenre(instructor.genre)}</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14 }}>📍</span> {instructor.city}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>팔로워</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>{instructor.follower_count || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>좋아요</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>{instructor.likes_count || 0}</span>
                </div>
              </div>
            </div>

            {/* 이동 아이콘 */}
            <div style={{ color: '#CBD5E1' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </motion.div>
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

      {/* 강사 상세 모달 (고도화된 포트폴리오 스타일) */}
      {selectedInstructor && (
        <motion.div 
          initial={{ y: '100%' }} 
          animate={{ y: 0 }} 
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ position: 'fixed', inset: 0, zIndex: 4000, background: '#09090b', color: '#fff', overflowY: 'auto' }}
        >
          {/* 1. 히어로 커버 섹션 */}
          <div style={{ position: 'relative', height: '280px', background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)', overflow: 'hidden' }}>
            {selectedInstructor.cover_url ? (
              <img src={selectedInstructor.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, #3f3f46 0%, #09090b 100%)', opacity: 0.5 }} />
            )}
            
            {/* 상단 네비게이션 */}
            <div style={{ position: 'absolute', top: 'calc(20px + env(safe-area-inset-top))', left: 0, right: 0, padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <button
                onClick={() => setSelectedInstructor(null)}
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              >←</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => toggleLike(null, selectedInstructor.id)}
                  style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20 }}
                >{likes[selectedInstructor.id] ? '❤️' : '🤍'}</button>
              </div>
            </div>
          </div>

          {/* 2. 프로필 핵심 정보 (플로팅) */}
          <div style={{ padding: '0 24px', marginTop: '-60px', position: 'relative', zIndex: 5 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 20 }}>
              {/* 프로필 이미지 */}
              <div style={{ 
                width: 120, height: 120, borderRadius: '32px', border: '4px solid #09090b', 
                background: '#18181b', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                flexShrink: 0
              }}>
                {selectedInstructor.photo_url
                  ? <img src={selectedInstructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>💃</div>
                }
              </div>
              
              {/* 이름 및 장르 */}
              <div style={{ paddingBottom: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 950, color: '#fff', marginBottom: 6, letterSpacing: '-0.5px' }}>
                  {selectedInstructor.name}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ 
                    fontSize: 12, color: '#FFD700', border: '1px solid #FFD700', 
                    padding: '2px 10px', borderRadius: '8px', fontWeight: 800 
                  }}>
                    {getGenre(selectedInstructor.genre)}
                  </span>
                  <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600 }}>📍 {selectedInstructor.city}</span>
                </div>
              </div>
            </div>

            {/* 소개글 */}
            <div style={{ 
              fontSize: 15, color: '#d4d4d8', lineHeight: 1.8, marginBottom: 24, 
              background: '#18181b', padding: '20px', borderRadius: '24px', border: '1px solid #27272a'
            }}>
              {selectedInstructor.bio || '환영합니다! 열정 넘치는 댄서입니다. 💜'}
            </div>

            {/* 스태츠 섹션 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: '팔로워', value: selectedInstructor.follower_count || 0, color: '#fff' },
                { label: '좋아요', value: selectedInstructor.likes_count || 0, color: '#ef4444' },
                { label: '게시물', value: posts.length, color: '#fff' }
              ].map((stat, idx) => (
                <div key={idx} style={{ background: '#18181b', padding: '16px', borderRadius: '20px', border: '1px solid #27272a', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#71717a', fontWeight: 700 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* 액션 버튼 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
              <button
                onClick={(e) => toggleFollow(e, selectedInstructor.id)}
                style={{
                  flex: 1, padding: '18px', borderRadius: '20px', border: 'none',
                  background: follows[selectedInstructor.id] ? '#27272a' : 'linear-gradient(90deg, #F59E0B, #D97706)',
                  color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                  boxShadow: follows[selectedInstructor.id] ? 'none' : '0 10px 20px rgba(245, 158, 11, 0.2)'
                }}
              >
                {follows[selectedInstructor.id] ? '✓ 팔로잉 중' : '팔로우하기'}
              </button>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedInstructor.instagram && (
                  <button
                    onClick={() => window.open(`https://instagram.com/${selectedInstructor.instagram}`, '_blank')}
                    style={{ width: 56, height: 56, borderRadius: '20px', border: '1px solid #27272a', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" style={{ width: 24, height: 24 }} />
                  </button>
                )}
                {selectedInstructor.kakao_link && (
                  <button
                    onClick={() => window.open(selectedInstructor.kakao_link, '_blank')}
                    style={{ width: 56, height: 56, borderRadius: '20px', border: 'none', background: '#FEE500', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 24 }}>💬</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. 예정 파티 · 클래스 (프리미엄 카드) */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#F59E0B' }}>✦</span> 예정 파티 · 클래스
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)', 
                borderRadius: '24px', padding: '40px 20px', border: '1px dashed #3f3f46', textAlign: 'center' 
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎭</div>
                <div style={{ fontSize: 15, color: '#a1a1aa', fontWeight: 600 }}>
                  현재 진행 중인 클래스가 없습니다.<br/>
                  <span style={{ fontSize: 13, color: '#71717a' }}>새로운 소식을 기다려주세요!</span>
                </div>
              </div>
            </div>

            {/* 4. 포트폴리오 갤러리 */}
            <div style={{ paddingBottom: 100 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#F59E0B' }}>✦</span> 게시물
              </div>
              
              {posts.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      style={{ 
                        aspectRatio: '1', overflow: 'hidden', background: '#18181b', 
                        cursor: 'pointer', borderRadius: '16px', border: '1px solid #27272a' 
                      }}
                      onClick={() => window.open(post.image_url, '_blank')}
                    >
                      <img src={post.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#18181b', borderRadius: '24px', padding: '40px 20px', border: '1px solid #27272a', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
                  <div style={{ fontSize: 15, color: '#71717a', fontWeight: 600 }}>아직 등록된 사진이 없습니다.</div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default InstructorSection
