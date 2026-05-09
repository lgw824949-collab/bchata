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
              background: selectedGenre === g ? 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)' : 'rgba(255,255,255,0.05)',
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
            whileHover={{ scale: 1.02, border: '1px solid rgba(218,165,32,0.3)' }}
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

      {/* 강사 상세 페이지 (프리미엄 시안 구현) */}
      {selectedInstructor && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ 
            position: 'fixed', 
            top: 0, bottom: 0, 
            left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px', 
            zIndex: 5000, background: '#050505', color: '#fff', 
            overflowY: 'auto', fontFamily: 'Pretendard, -apple-system, sans-serif' 
          }}
        >
          {/* 1. 프리미엄 히어로 섹션 (강화된 입체 음영) */}
          <div style={{ position: 'relative', height: '420px', overflow: 'hidden', background: '#050505' }}>
            {/* 메인 포스터 이미지 */}
            <div style={{ 
              position: 'absolute', inset: 0, 
              background: selectedInstructor.photo_url ? `url(${selectedInstructor.photo_url}) center/cover` : '#1A1A1A',
              filter: 'brightness(0.7) contrast(1.1)',
              transform: 'scale(1.02)',
              zIndex: 0
            }} />

            {/* [음영 레이어 1] 상단 내비게이션 보호 음영 */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '140px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', zIndex: 1 }} />

            {/* [음영 레이어 2] 하단 콘텐츠 연결 딥 페이드 */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '220px', background: 'linear-gradient(to bottom, transparent, #050505)', zIndex: 2 }} />

            {/* [음영 레이어 3] 프리미엄 골드 포인트 글로우 (분위기 조율) */}
            <div style={{ position: 'absolute', top: '20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(218, 165, 32, 0.08) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 1 }} />

            {/* 상단 내비게이션 버튼 */}
            <div style={{ position: 'absolute', top: '50px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 50 }}>
              <button onClick={() => setSelectedInstructor(null)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronLeft size={22} />
              </button>
              <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Sparkles size={18} />
              </button>
            </div>

            {/* 오버랩 프로필 이미지 */}
            <div style={{ position: 'absolute', bottom: '20px', left: '25px', zIndex: 60 }}>
              <div style={{ 
                width: '110px', height: '110px', borderRadius: '50%', 
                border: '3px solid #DAA520', padding: '4px',
                background: '#050505',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <img src={selectedInstructor.photo_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
            </div>

            {/* 알림 및 좋아요 버튼 */}
            <div style={{ position: 'absolute', bottom: '35px', right: '25px', display: 'flex', gap: 12, zIndex: 60 }}>
              <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} />
              </button>
              <button 
                onClick={(e) => toggleLike(e, selectedInstructor.id)}
                style={{ width: 44, height: 44, borderRadius: '50%', background: likes[selectedInstructor.id] ? 'rgba(139,69,19,0.2)' : 'rgba(255,255,255,0.05)', border: likes[selectedInstructor.id] ? '1px solid #DAA520' : '1px solid rgba(255,255,255,0.1)', color: likes[selectedInstructor.id] ? '#DAA520' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <motion.div animate={{ scale: likes[selectedInstructor.id] ? 1.2 : 1 }}>❤️</motion.div>
              </button>
            </div>
          </div>

          {/* 2. 이름 및 스탯 그리드 섹션 */}
          <div style={{ padding: '0 25px' }}>
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 950, color: '#FFF', margin: '0 0 4px 0', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>{selectedInstructor.name}</h1>
              <p style={{ fontSize: '15px', color: '#8E8E93', fontWeight: 600, letterSpacing: '0.5px' }}>
                Professional Dancer | {getGenre(selectedInstructor.genre)} | Instructor
              </p>
            </div>

            {/* 4구역 입체 골드 스탯 카드 (모바일 최적화 버전) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '40px' }}>
              {[
                { label: 'Followers', value: (selectedInstructor.follower_count || 0) >= 1000 ? (selectedInstructor.follower_count / 1000).toFixed(1) + 'K' : selectedInstructor.follower_count, icon: <User size={13} />, sub: 'New' },
                { label: 'Likes', value: (selectedInstructor.likes_count || 0) >= 1000 ? (selectedInstructor.likes_count / 1000).toFixed(1) + 'K' : selectedInstructor.likes_count, icon: '❤️', sub: 'New' },
                { label: 'Classes', value: '190', icon: <Camera size={13} /> },
                { label: 'Bookings', value: '75+', icon: <Check size={13} /> }
              ].map((item, i) => (
                <div key={i} style={{ 
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(139,69,19,0.15) 100%)', 
                  border: '1px solid rgba(218,165,32,0.2)',
                  borderRadius: '16px', 
                  padding: '15px 4px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4), inset 0 0 10px rgba(139,69,19,0.1)'
                }}>
                  {/* 하단 골드 음영 효과 */}
                  <div style={{ 
                    position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)',
                    width: '100%', height: '40%', background: 'radial-gradient(circle, rgba(139,69,19,0.3) 0%, transparent 75%)',
                    filter: 'blur(10px)', zIndex: 0
                  }} />

                  {/* 하단 빛 반사 실선 */}
                  <div style={{ 
                    position: 'absolute', bottom: 0, left: '15%', right: '15%', height: '1.2px',
                    background: 'linear-gradient(90deg, transparent 0%, #DAA520 50%, transparent 100%)',
                    boxShadow: '0 0 6px rgba(218,165,32,0.5)',
                    zIndex: 2
                  }} />

                  <div style={{ position: 'absolute', top: '6px', right: '6px', opacity: 0.8, color: '#DAA520', zIndex: 1 }}>{item.icon}</div>
                  
                  {/* 항목 이름 (폰트 축소 및 자간 조정으로 잘림 방지) */}
                  <div style={{ fontSize: '8.5px', color: '#FFF', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2px', marginBottom: 4, position: 'relative', zIndex: 1 }}>{item.label}</div>
                  
                  {/* 숫자 (모바일 비율에 맞게 크기 미세 조정) */}
                  <div style={{ fontSize: '22px', fontWeight: 950, color: '#FFF', position: 'relative', zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{item.value}</div>
                  
                  {item.sub && <div style={{ fontSize: '8px', color: '#DAA520', fontWeight: 900, marginTop: 2, position: 'relative', zIndex: 1 }}>{item.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* 3. 콘텐츠 영역 (Tabs & Details) */}
          <div style={{ padding: '0 20px 150px' }}>
            {/* 커스텀 탭 내비게이션 */}
            <div style={{ display: 'flex', gap: 30, marginBottom: 35, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['BIO', 'CLASSES', 'GALLERY'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    background: 'none', border: 'none', color: activeTab === tab ? '#DAA520' : 'rgba(255,255,255,0.3)', 
                    fontSize: '15px', fontWeight: 900, cursor: 'pointer', position: 'relative', padding: '0 0 12px 0',
                    transition: 'all 0.3s', letterSpacing: '0.5px'
                  }}
                >
                  {tab}
                  {activeTab === tab && <motion.div layoutId="tabUnderline" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: '#DAA520', borderRadius: '2px' }} />}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'BIO' && (
                <motion.div 
                  key="bio"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                      <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF' }}>About {selectedInstructor.name}</h3>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MessageCircle size={16} />
                        </button>
                        <button style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Sparkles size={16} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '15px', color: '#A1A1AA', lineHeight: 1.8, fontWeight: 500 }}>
                      {selectedInstructor.bio || `Passionate professional with 15+ years experience in the international dance scene. Focused on technique, expression, and artistry. Based in ${selectedInstructor.city || 'Seoul'}.`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 40, marginBottom: 40 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '18px', fontWeight: 900, color: '#FFF', marginBottom: 10 }}>Experience</h4>
                      <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600 }}>12 Yrs+</p>
                    </div>
                    <div style={{ flex: 2 }}>
                      <h4 style={{ fontSize: '18px', fontWeight: 900, color: '#FFF', marginBottom: 10 }}>Specialties</h4>
                      <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600 }}>{getGenre(selectedInstructor.genre)}</p>
                    </div>
                  </div>

                  {/* 시안의 주인공: BOOK NOW 버튼 (Imperial Gold with SaddleBrown Base) */}
                  <button 
                    onClick={() => selectedInstructor.kakao_link && window.open(selectedInstructor.kakao_link, '_blank')}
                    style={{ 
                      width: '100%', padding: '20px', borderRadius: '18px', 
                      background: 'linear-gradient(135deg, #8b4513 0%, #DAA520 50%, #B8860B 100%)', 
                      color: '#000', fontSize: '16px', fontWeight: 950, 
                      border: 'none', cursor: 'pointer',
                      boxShadow: '0 10px 25px rgba(139, 69, 19, 0.4)',
                      textTransform: 'uppercase', letterSpacing: '1px',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10
                    }}
                  >
                    BOOK NOW
                  </button>
                </motion.div>
              )}

              {activeTab === 'GALLERY' && (
                <motion.div 
                  key="gallery"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}
                >
                  {posts.map((post, idx) => (
                    <div key={idx} style={{ aspectRatio: '1/1', background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {post.media_url && <img src={post.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                  ))}
                  {posts.length === 0 && <div style={{ gridColumn: 'span 2', textAlign: 'center', color: '#444', padding: '60px 0', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Premium Portfolio Coming Soon</div>}
                </motion.div>
              )}

              {activeTab === 'CLASSES' && (
                <motion.div 
                  key="classes"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ textAlign: 'center', padding: '60px 20px', color: '#8E8E93' }}
                >
                  <MapPin size={48} style={{ marginBottom: 20, opacity: 0.2 }} />
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>Upcoming Classes & Workshops</div>
                  <div style={{ fontSize: '13px', marginTop: 8 }}>Stay tuned for the latest schedule</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default InstructorSection
