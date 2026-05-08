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
    <div style={{ background: '#0D0D0D', minHeight: '100vh', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      {/* 장르 탭 */}
      <div style={{ display: 'flex', gap: 10, padding: '20px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            style={{
              flexShrink: 0, padding: '10px 20px', borderRadius: 25,
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
              cursor: 'pointer', backdropFilter: 'blur(10px)'
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div style={{ width: 70, height: 70, borderRadius: '20px', overflow: 'hidden', background: '#1A1A1A', flexShrink: 0 }}>
              {instructor.photo_url ? <img src={instructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 24 }}>💃</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{instructor.name}</div>
              <div style={{ fontSize: 13, color: '#A1A1AA' }}>{getGenre(instructor.genre)} · {instructor.city}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 강사 상세 모달 (시안 100% 동일 구현) */}
      <AnimatePresence>
        {selectedInstructor && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0D0D0D', color: '#fff', overflowY: 'auto' }}
          >
            {/* 상단 히어로 섹션 */}
            <div style={{ position: 'relative', height: '360px' }}>
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                {selectedInstructor.cover_url ? (
                  <img src={selectedInstructor.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)' }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to bottom, transparent, #0D0D0D)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, transparent, #C9A84C, #FFD700, #C9A84C, transparent)', opacity: 0.6 }} />
              </div>

              {/* 상단 컨트롤 */}
              <div style={{ position: 'absolute', top: '50px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setSelectedInstructor(null)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={24} /></button>
                <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
              </div>

              {/* 프로필 이미지 (크게 오버랩) */}
              <div style={{ position: 'absolute', bottom: '-45px', left: '20px', zIndex: 10 }}>
                <div style={{ width: 145, height: 145, borderRadius: '50%', border: '6px solid #0D0D0D', background: '#1A1A1A', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  {selectedInstructor.photo_url ? <img src={selectedInstructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 60 }}>💃</div>}
                </div>
              </div>

              {/* 우측 하단 플로팅 버튼 (시안 스타일) */}
              <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: 12 }}>
                <button style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C' }}><Zap size={22} fill="#C9A84C" /></button>
                <button onClick={() => toggleLike(null, selectedInstructor.id)} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: likes[selectedInstructor.id] ? '#FFD700' : '#fff' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={likes[selectedInstructor.id] ? "#FFD700" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>
            </div>

            <div style={{ padding: '65px 24px 24px' }}>
              <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#fff', margin: '0 0 6px 0', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>{selectedInstructor.name}</h1>
              <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0, fontWeight: 500 }}>Professional Dancer | Choreographer | Instructor</p>
            </div>

            {/* 스탯 카드 (시안 100% 동일) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '0 20px 35px' }}>
              {[
                { label: 'Followers', value: '2.8M', sub: '245K new', icon: <User size={10} color="#C9A84C" /> },
                { label: 'Likes', value: '14.5M', sub: '1.2M new', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
                { label: 'Classes', value: '190', sub: '', icon: null },
                { label: 'Bookings', value: '75+', sub: '', icon: null }
              ].map((stat, idx) => (
                <div key={idx} style={{ 
                  background: 'rgba(44, 44, 46, 0.4)', backdropFilter: 'blur(30px)',
                  padding: '25px 4px', borderRadius: '24px', border: '1.2px solid rgba(255,255,255,0.08)',
                  textAlign: 'center', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '115px',
                  boxShadow: 'inset 0 0 20px rgba(201, 168, 76, 0.05)'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1.5px', background: 'linear-gradient(90deg, transparent, #C9A84C, #FFD700, #C9A84C, transparent)', opacity: 0.9 }} />
                  <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '1.5px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)', opacity: 0.5 }} />
                  {stat.icon && (
                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(201,168,76,0.6)' }}>
                      {stat.icon}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 500, marginBottom: 8 }}>{stat.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFF' }}>{stat.value}</div>
                  {stat.sub && <div style={{ fontSize: '9px', color: '#C9A84C', fontWeight: 700, marginTop: 4 }}>{stat.sub}</div>}
                </div>
              ))}
            </div>

            {/* 탭 내비게이션 */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 24px', gap: 40, marginBottom: 35 }}>
              {['BIO', 'CLASSES', 'GALLERY'].map(tab => (
                <button key={tab} style={{ 
                  background: 'none', border: 'none', color: tab === 'BIO' ? '#FFF' : '#8E8E93', 
                  fontSize: '15px', fontWeight: 800, padding: '15px 0', cursor: 'pointer',
                  borderBottom: tab === 'BIO' ? '2.5px solid #C9A84C' : '2.5px solid transparent'
                }}>{tab}</button>
              ))}
            </div>

            {/* 상세 정보 섹션 */}
            <div style={{ padding: '0 24px 140px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', margin: 0 }}>About {selectedInstructor.name}</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{ width: 44, height: 44, borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={20} /></button>
                  <button style={{ width: 44, height: 44, borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
                </div>
              </div>
              <p style={{ fontSize: '15px', color: '#A1A1AA', lineHeight: 1.8, marginBottom: 35 }}>
                {selectedInstructor.bio || `Passionate professional with 15+ years experience. Focused on technique, expression, and artistry. Based in Los Angeles.`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 40 }}>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Experience</div>
                    <div style={{ fontSize: '14px', color: '#8E8E93' }}>12 Yrs+</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Specialties</div>
                    <div style={{ fontSize: '14px', color: '#8E8E93' }}>Contemporary, Urban, Jazz</div>
                  </div>
                </div>
                <button 
                  onClick={() => selectedInstructor.kakao_link && window.open(selectedInstructor.kakao_link, '_blank')}
                  style={{ 
                    padding: '16px 32px', borderRadius: '22px', border: '1.5px solid #C9A84C',
                    background: 'rgba(0,0,0,0.5)', color: '#C9A84C', fontSize: '15px', fontWeight: 950, 
                    cursor: 'pointer', boxShadow: '0 0 20px rgba(201, 168, 76, 0.2)'
                  }}
                >
                  BOOK NOW
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InstructorSection
