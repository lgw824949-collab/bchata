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
      {/* 강사 상세 페이지 (명품 포트폴리오 레이아웃 제안) */}
      {selectedInstructor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: '#050505', color: '#fff', overflowY: 'auto', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
          
          {/* 1. 임머시브 히어로 섹션 (Immersive Hero) */}
          <div style={{ position: 'relative', height: '60vh', overflow: 'hidden' }}>
            <div style={{ 
              position: 'absolute', inset: 0, 
              background: selectedInstructor.photo_url ? `url(${selectedInstructor.photo_url}) center/cover` : '#1A1A1A',
              filter: 'brightness(0.7)' 
            }} />
            {/* 상단 딥 그라데이션 (컨트롤 가독성) */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }} />
            {/* 하단 딥 페이드 (콘텐츠 연결) */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '250px', background: 'linear-gradient(to bottom, transparent, #050505)' }} />

            {/* 상단 내비게이션 */}
            <div style={{ position: 'absolute', top: '50px', left: '25px', right: '25px', display: 'flex', justifyContent: 'space-between', zIndex: 20 }}>
              <button onClick={() => setSelectedInstructor(null)} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronLeft size={24} />
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => selectedInstructor.instagram && window.open(`https://instagram.com/${selectedInstructor.instagram}`, '_blank')}
                  style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Camera size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* 2. 강사 프로필 카드 (Floating Profile Card - Deep Blur) */}
          <div style={{ marginTop: '-140px', padding: '0 25px', position: 'relative', zIndex: 30 }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              backdropFilter: 'blur(40px)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '35px', 
              padding: '35px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 25 }}>
                <div style={{ width: 85, height: 85, borderRadius: '50%', border: '2.5px solid #C9A84C', padding: '3px' }}>
                  <img src={selectedInstructor.photo_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#FFF', margin: '0 0 6px 0', letterSpacing: '-1px', textTransform: 'uppercase' }}>{selectedInstructor.name}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', color: '#C9A84C', fontWeight: 800, background: 'rgba(201,168,76,0.1)', padding: '4px 10px', borderRadius: '8px' }}>MASTER INSTRUCTOR</span>
                    <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600 }}>{selectedInstructor.city}</span>
                  </div>
                </div>
              </div>

              {/* 미니멀 통계 바 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px' }}>
                {[
                  { label: 'Followers', value: selectedInstructor.follower_count || 0 },
                  { label: 'Likes', value: selectedInstructor.likes_count || 0 },
                  { label: 'Classes', value: '120+' },
                  { label: 'Genre', value: Array.isArray(selectedInstructor.genre) ? selectedInstructor.genre[0] : selectedInstructor.genre }
                ].map((item, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{item.value}</div>
                    <div style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. 콘텐츠 영역 (Tabs & Details) */}
          <div style={{ padding: '40px 25px 150px' }}>
            {/* 커스텀 탭 내비게이션 */}
            <div style={{ display: 'flex', gap: 30, marginBottom: 35, paddingLeft: '5px' }}>
              {['BIO', 'GALLERY'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    background: 'none', border: 'none', color: activeTab === tab ? '#FFF' : 'rgba(255,255,255,0.3)', 
                    fontSize: '18px', fontWeight: 900, cursor: 'pointer', position: 'relative', paddingBottom: '8px',
                    transition: 'all 0.3s'
                  }}
                >
                  {tab}
                  {activeTab === tab && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#C9A84C', borderRadius: '2px' }} />}
                </button>
              ))}
            </div>

            {activeTab === 'BIO' ? (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid #C9A84C', marginBottom: 30 }}>
                  <p style={{ fontSize: '18px', color: '#FFF', fontWeight: 700, lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                    "Dance is not just movement, it's the signature of the soul."
                  </p>
                </div>
                <p style={{ fontSize: '16px', color: '#A1A1AA', lineHeight: 1.9, fontWeight: 500 }}>
                  {selectedInstructor.bio || `Professional instructor with over 15 years of experience in the international dance scene. Specializing in high-performance technique and emotional expression. Dedicated to training the next generation of master dancers.`}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15, animation: 'fadeIn 0.5s ease' }}>
                {posts.map((post, idx) => (
                  <div key={idx} style={{ aspectRatio: '4/5', background: '#1a1a1a', borderRadius: '20px', overflow: 'hidden' }}>
                    {post.media_url && <img src={post.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                ))}
                {posts.length === 0 && <div style={{ gridColumn: 'span 2', textAlign: 'center', color: '#444', padding: '80px 0', fontSize: '14px', fontWeight: 700 }}>PREMIUM CONTENT COMING SOON</div>}
              </div>
            )}
          </div>

          {/* 4. 하단 고정 하이엔드 액션 바 (Sticky Action Bar) */}
          <div style={{ 
            position: 'fixed', bottom: 0, left: 0, right: 0, 
            padding: '25px 25px 40px', 
            background: 'linear-gradient(to top, #050505 80%, transparent)',
            backdropFilter: 'blur(20px)',
            zIndex: 100
          }}>
            <button 
              onClick={() => selectedInstructor.kakao_link && window.open(selectedInstructor.kakao_link, '_blank')}
              style={{ 
                width: '100%', padding: '22px', borderRadius: '20px', 
                background: 'linear-gradient(135deg, #C9A84C 0%, #FFD700 100%)', 
                color: '#000', fontSize: '18px', fontWeight: 950, 
                border: 'none', cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(201, 168, 76, 0.4)',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}
            >
              Reserve a Private Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InstructorSection
