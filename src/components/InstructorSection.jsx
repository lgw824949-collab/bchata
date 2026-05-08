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
  const [activeTab, setActiveTab] = useState('BIO')

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
    if (e) e.stopPropagation()
    const session = getSession()
    const isFollowing = follows[instructorId]
    const instructor = instructors.find(i => i.id === instructorId)
    if (isFollowing) {
      await supabase.from('instructor_follows').delete().eq('instructor_id', instructorId).eq('user_session', session)
      await supabase.from('instructors').update({ follower_count: Math.max(0, (instructor?.follower_count || 1) - 1) }).eq('id', instructorId)
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
    if (e) e.stopPropagation()
    const session = getSession()
    const isLiked = likes[instructorId]
    const instructor = instructors.find(i => i.id === instructorId)
    if (isLiked) {
      await supabase.from('instructor_likes').delete().eq('instructor_id', instructorId).eq('user_session', session)
      await supabase.from('instructors').update({ likes_count: Math.max(0, (instructor?.likes_count || 1) - 1) }).eq('id', instructorId)
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
    <div style={{ background: '#0D0D0D', minHeight: '100vh', fontFamily: 'Pretendard, -apple-system, sans-serif', color: '#fff' }}>
      {/* 장르 탭 */}
      <div style={{ display: 'flex', gap: 10, padding: '20px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            style={{
              flexShrink: 0, padding: '10px 22px', borderRadius: 25,
              border: selectedGenre === g ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: selectedGenre === g ? 'linear-gradient(135deg, #C9A84C 0%, #FFD700 100%)' : 'rgba(255,255,255,0.05)',
              color: selectedGenre === g ? '#000' : '#A1A1AA',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s'
            }}
          >{g}</button>
        ))}
      </div>

      {/* 강사 리스트 */}
      <div style={{ padding: '12px 20px 100px' }}>
        {filteredInstructors.map((instructor) => (
          <motion.div
            key={instructor.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedInstructor(instructor)}
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '20px', borderRadius: '24px', 
              background: 'rgba(255,255,255,0.03)',
              marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer', backdropFilter: 'blur(15px)'
            }}
            whileHover={{ scale: 1.02, border: '1px solid rgba(201,168,76,0.3)' }}
          >
            <div style={{ width: 75, height: 75, borderRadius: '22px', overflow: 'hidden', background: '#1A1A1A', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
              {instructor.photo_url ? <img src={instructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>💃</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{instructor.name}</div>
              <div style={{ fontSize: 14, color: '#A1A1AA', fontWeight: 500 }}>{getGenre(instructor.genre)} · {instructor.city}</div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* 강사 상세 페이지 (selectedInstructor) 전체 교체 */}
      {selectedInstructor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: '#0a0a0a', overflowY: 'auto' }}>

          {/* 히어로 영역 */}
          <div style={{ position: 'relative', height: 320 }}>
            {/* 배경 이미지 */}
            <div style={{
              position: 'absolute', inset: 0,
              background: selectedInstructor.photo_url
                ? `url(${selectedInstructor.photo_url}) center/cover`
                : 'linear-gradient(135deg, #1a0a2e, #2d1b4e)',
              filter: 'brightness(0.5)'
            }} />

            {/* 상단 버튼 */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
              <button
                onClick={() => setSelectedInstructor(null)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >←</button>
              <button
                onClick={() => {
                  if (selectedInstructor.instagram) window.open(`https://instagram.com/${selectedInstructor.instagram}`, '_blank')
                }}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >📸</button>
            </div>

            {/* 프로필 사진 + 이름 (히어로 하단) */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid #FFD700', flexShrink: 0, background: '#1a1a1a' }}>
                {selectedInstructor.photo_url
                  ? <img src={selectedInstructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>💃</div>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: -0.5, marginBottom: 4 }}>{selectedInstructor.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  {Array.isArray(selectedInstructor.genre) ? selectedInstructor.genre.join(' | ') : selectedInstructor.genre}
                  {selectedInstructor.city ? ` | ${selectedInstructor.city}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* 통계 4개 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#222', margin: '0' }}>
            {[
              { label: 'Followers', value: selectedInstructor.follower_count || 0 },
              { label: 'Likes', value: selectedInstructor.likes_count || 0 },
              { label: 'Posts', value: posts.length },
              { label: 'Genre', value: Array.isArray(selectedInstructor.genre) ? selectedInstructor.genre.length : 1 }
            ].map((stat, i) => (
              <div key={i} style={{ background: '#111', padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD700' }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 탭 */}
          <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
            {['BIO', 'GALLERY'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '14px', background: 'transparent', border: 'none',
                  color: activeTab === tab ? '#FFD700' : 'rgba(255,255,255,0.4)',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 1,
                  borderBottom: activeTab === tab ? '2px solid #FFD700' : '2px solid transparent'
                }}
              >{tab}</button>
            ))}
          </div>

          {/* BIO 탭 */}
          {activeTab === 'BIO' && (
            <div style={{ padding: '24px 20px' }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                {selectedInstructor.bio || '등록된 소개가 없습니다.'}
              </div>
            </div>
          )}

          {/* GALLERY 탭 */}
          {activeTab === 'GALLERY' && (
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {posts.map((post, idx) => (
                <div key={idx} style={{ aspectRatio: '1/1', background: '#1a1a1a', overflow: 'hidden' }}>
                  {post.media_url && <img src={post.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InstructorSection
