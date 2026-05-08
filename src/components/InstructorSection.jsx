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
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      {/* 장르 탭 (시안 분위기에 맞춰 다크하게 조정) */}
      <div style={{ display: 'flex', gap: 10, padding: '20px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            style={{
              flexShrink: 0, padding: '10px 20px', borderRadius: 25,
              border: selectedGenre === g ? 'none' : '1px solid rgba(201, 168, 76, 0.3)',
              background: selectedGenre === g ? 'linear-gradient(135deg, #C9A84C 0%, #FFD700 100%)' : 'rgba(255,255,255,0.05)',
              color: selectedGenre === g ? '#000' : '#A1A1AA',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
            }}
          >{g}</button>
        ))}
      </div>

      {/* 강사 리스트 (다크 테마 카드) */}
      <div style={{ padding: '12px 20px 100px' }}>
        {filteredInstructors.map((instructor) => (
          <motion.div
            key={instructor.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedInstructor(instructor)}
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '24px', borderRadius: '28px', 
              background: 'linear-gradient(145deg, #1A1A1A, #0D0D0D)',
              marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            whileHover={{ y: -4, border: '1px solid rgba(201, 168, 76, 0.4)' }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: '28px', overflow: 'hidden',
              background: '#1A1A1A', flexShrink: 0,
              border: follows[instructor.id] ? '2px solid #C9A84C' : '1px solid rgba(255,255,255,0.1)'
            }}>
              {instructor.photo_url
                ? <img src={instructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>💃</div>
              }
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#FFF', letterSpacing: '-0.5px' }}>{instructor.name}</span>
                <span style={{ 
                  fontSize: 11, color: '#C9A84C', background: 'rgba(201, 168, 76, 0.1)', 
                  padding: '4px 10px', borderRadius: '8px', fontWeight: 800,
                  border: '1px solid rgba(201, 168, 76, 0.2)'
                }}>{getGenre(instructor.genre)}</span>
              </div>
              <div style={{ fontSize: 14, color: '#A1A1AA', marginBottom: 10 }}>📍 {instructor.city}</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#71717A' }}>FOLLOWERS</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>{instructor.follower_count || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#71717A' }}>LIKES</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#FFD700' }}>{instructor.likes_count || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 강사 상세 모달 - 시안 100% 반영 버전 */}
      <AnimatePresence>
        {selectedInstructor && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0D0D0D', color: '#fff', overflowY: 'auto' }}
          >
            {/* 상단 히어로 커버 */}
            <div style={{ position: 'relative', height: '380px', overflow: 'hidden' }}>
              {selectedInstructor.cover_url ? (
                <img src={selectedInstructor.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0D0D0D 100%)' }} />
              
              {/* 상단 버튼류 */}
              <div style={{ position: 'absolute', top: '30px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                <button
                  onClick={() => setSelectedInstructor(null)}
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(15px)', border: 'none', borderRadius: '14px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                >
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <button
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(15px)', border: 'none', borderRadius: '14px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                </button>
              </div>

              {/* 프로필 이미지 (오버랩) */}
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 11 }}>
                <div style={{ 
                  width: 130, height: 130, borderRadius: '50%', border: '4px solid #0D0D0D', 
                  background: '#1A1A1A', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.6)'
                }}>
                  {selectedInstructor.photo_url
                    ? <img src={selectedInstructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>💃</div>
                  }
                </div>
              </div>

              {/* 우측 상단 플로팅 버튼 (알림/좋아요) */}
              <div style={{ position: 'absolute', bottom: '110px', right: '20px', display: 'flex', gap: 12, zIndex: 11 }}>
                <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C9A84C' }}>
                  <Zap size={20} fill="#C9A84C" />
                </button>
                <button 
                  onClick={() => toggleLike(null, selectedInstructor.id)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: likes[selectedInstructor.id] ? '#FFD700' : '#fff' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={likes[selectedInstructor.id] ? "#FFD700" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>
            </div>

            {/* 강사명 및 타이틀 */}
            <div style={{ padding: '0 24px 24px' }}>
              <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#fff', margin: '0 0 6px 0', letterSpacing: '-1.5px', textTransform: 'uppercase', fontFamily: 'Pretendard, sans-serif' }}>
                {selectedInstructor.name}
              </h1>
              <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0, fontWeight: 500, letterSpacing: '0.2px' }}>
                Professional Dancer | Choreographer | Instructor
              </p>
            </div>

            {/* 4단 스탯 카드 (시안 1:1 재현) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '0 20px 35px' }}>
              {[
                { label: 'Followers', value: '2.8M', sub: '245K new', icon: <User size={10} color="#000" fill="#000" /> },
                { label: 'Likes', value: '14.5M', sub: '1.2M new', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="#000"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
                { label: 'Classes', value: '190', sub: '', icon: null },
                { label: 'Bookings', value: '75+', sub: '', icon: null }
              ].map((stat, idx) => (
                <div key={idx} style={{ 
                  background: 'linear-gradient(180deg, rgba(44,44,46,0.8) 0%, rgba(28,28,30,0.8) 100%)', 
                  padding: '20px 8px', borderRadius: '22px', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'center', position: 'relative', overflow: 'hidden',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }}>
                  {/* 상단 골드 엣지 (더 넓고 선명하게) */}
                  <div style={{ 
                    position: 'absolute', top: 0, left: '5%', right: '5%', height: '1.2px',
                    background: 'linear-gradient(90deg, transparent, #C9A84C, #FFD700, #C9A84C, transparent)',
                    opacity: 0.9
                  }} />
                  
                  {/* 하단 골드 엣지 */}
                  <div style={{ 
                    position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '1.2px',
                    background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
                    opacity: 0.5
                  }} />

                  {stat.icon && (
                    <div style={{ 
                      position: 'absolute', top: 8, right: 8, 
                      background: 'linear-gradient(135deg, #C9A84C 0%, #FFD700 100%)', 
                      borderRadius: '50%', width: 20, height: 20, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      zIndex: 2, boxShadow: '0 0 10px rgba(201,168,76,0.5)'
                    }}>
                      {stat.icon}
                    </div>
                  )}
                  
                  <div style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>{stat.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFF' }}>{stat.value}</div>
                  {stat.sub && <div style={{ fontSize: '9px', color: '#C9A84C', fontWeight: 700, marginTop: 4 }}>{stat.sub}</div>}
                </div>
              ))}
            </div>

            {/* 탭 내비게이션 */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 20px', gap: 40, marginBottom: 35 }}>
              {['BIO', 'CLASSES', 'GALLERY'].map(tab => (
                <button key={tab} style={{ 
                  background: 'none', border: 'none', color: tab === 'BIO' ? '#FFF' : '#8E8E93', 
                  fontSize: '15px', fontWeight: 800, padding: '15px 0', cursor: 'pointer',
                  borderBottom: tab === 'BIO' ? '2.5px solid #C9A84C' : '2.5px solid transparent',
                  transition: 'all 0.3s'
                }}>{tab}</button>
              ))}
            </div>

            {/* 상세 정보 섹션 */}
            <div style={{ padding: '0 24px 140px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', margin: 0 }}>About {selectedInstructor.name}</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '14px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}><MessageCircle size={20} /></button>
                  <button style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '14px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
                </div>
              </div>

              <p style={{ fontSize: '15px', color: '#A1A1AA', lineHeight: 1.8, marginBottom: 35, fontWeight: 400 }}>
                {selectedInstructor.bio || `Passionate professional with 15+ years experience in Contemporary, Hip-Hop, Fusion. Founder of "Flow Studios". Focused on technique, expression, and artistry. Based in Los Angeles.`}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 35 }}>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Experience</div>
                    <div style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 500 }}>12 Yrs+</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Specialties</div>
                    <div style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 500 }}>Contemporary,<br/>Urban, Jazz</div>
                  </div>
                </div>

                {/* BOOK NOW 버튼 글로우 추가 */}
                <button 
                  onClick={() => selectedInstructor.kakao_link && window.open(selectedInstructor.kakao_link, '_blank')}
                  style={{ 
                    padding: '16px 32px', borderRadius: '22px', border: 'none',
                    background: 'linear-gradient(135deg, #C9A84C 0%, #FFD700 100%)',
                    color: '#000', fontSize: '15px', fontWeight: 900, cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(201, 168, 76, 0.5)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  BOOK NOW
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstructorSection;
