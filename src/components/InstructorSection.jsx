import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Share2, Bell, Heart, User, MapPin, Globe, ShieldCheck, Zap, MessageCircle, Star, Info, Plus, Check, Search } from 'lucide-react'

const GENRES = ['전체', '바차타', '살사', '키좀바', '쥬크', '⭐ 내 팔로잉']
const CITIES = ['전국', '서울', '경기/인천', '부산', '대구', '대전', '광주']

const SESSION_KEY = 'oneulbam_session'
const getSession = () => {
  let s = localStorage.getItem(SESSION_KEY)
  if (!s) { s = crypto.randomUUID(); localStorage.setItem(SESSION_KEY, s) }
  return s
}

const InstructorSection = () => {
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [follows, setFollows] = useState({})
  const [likes, setLikes] = useState({})
  const [selectedGenre, setSelectedGenre] = useState('전체')
  const [selectedCity, setSelectedCity] = useState('전국')
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('BIO')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMoreCities, setShowMoreCities] = useState(false)
  const [showMoreGenres, setShowMoreGenres] = useState(false)
  const [processing, setProcessing] = useState({})
  const [classes, setClasses] = useState([])

  useEffect(() => {
    fetchInstructors()
  }, [])

  const fetchInstructors = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('instructors')
      .select('*')
      .eq('status', 'active')
      .order('follower_count', { ascending: false })
    if (data) setInstructors(data)
    setLoading(false)

    const session = getSession()
    const { data: followData } = await supabase
      .from('instructor_follows')
      .select('instructor_id')
      .eq('user_session', session)
    if (followData) {
      const map = {}
      followData.forEach(f => { map[f.instructor_id] = true })
      setFollows(map)
      localStorage.setItem('instructor_follows', JSON.stringify(map))
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
    if (instructors.length > 0) {
      const targetId = localStorage.getItem('selected_instructor_id');
      if (targetId) {
        const target = instructors.find(i => i.id === targetId);
        if (target) {
          setSelectedInstructor(target);
          localStorage.removeItem('selected_instructor_id');
        }
      }

      // 햄버거 메뉴를 통한 장르 필터 초기 적용 확인
      const targetGenre = localStorage.getItem('instructor_target_genre');
      if (targetGenre) {
        setSelectedGenre(targetGenre);
        localStorage.removeItem('instructor_target_genre');
      }
    }
  }, [instructors]);

  useEffect(() => {
    const handleApplyFilter = () => {
      const targetGenre = localStorage.getItem('instructor_target_genre');
      if (targetGenre) {
        setSelectedGenre(targetGenre);
        localStorage.removeItem('instructor_target_genre');
      }
    };

    const handleFocusSearch = () => {
      const input = document.getElementById('instructor-search-input');
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
      }
    };

    window.addEventListener('apply-instructor-filter', handleApplyFilter);
    window.addEventListener('focus-instructor-search', handleFocusSearch);

    return () => {
      window.removeEventListener('apply-instructor-filter', handleApplyFilter);
      window.removeEventListener('focus-instructor-search', handleFocusSearch);
    };
  }, []);

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

  useEffect(() => {
    if (activeTab !== 'CLASSES' || !selectedInstructor) return
    const fetchClasses = async () => {
      const { data } = await supabase
        .from('instructor_classes')
        .select('*')
        .eq('instructor_id', selectedInstructor.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      if (data) setClasses(data)
    }
    fetchClasses()
  }, [activeTab, selectedInstructor])

  const toggleFollow = async (e, instructorId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Immediate Visual Feedback
    console.log(`[FOLLOW CLICK] Instructor ID: ${instructorId}`);
    
    if (processing[instructorId]) return;

    const session = getSession();
    const isFollowing = !!follows[instructorId];
    const instructor = instructors.find(i => i.id === instructorId);
    
    setProcessing(prev => ({ ...prev, [instructorId]: true }));
    
    try {
      if (isFollowing) {
        const { error } = await supabase.from('instructor_follows').delete().eq('instructor_id', instructorId).eq('user_session', session);
        if (error) throw error;
        await supabase.from('instructors').update({ follower_count: Math.max(0, (instructor?.follower_count || 1) - 1) }).eq('id', instructorId);
      } else {
        const { error } = await supabase.from('instructor_follows').insert({ instructor_id: instructorId, user_session: session });
        if (error) throw error;
        await supabase.from('instructors').update({ follower_count: (instructor?.follower_count || 0) + 1 }).eq('id', instructorId);
      }
      
      const newFollows = { ...follows, [instructorId]: !isFollowing };
      setFollows(newFollows);
      localStorage.setItem('instructor_follows', JSON.stringify(newFollows));
      
      setInstructors(prev => prev.map(i => i.id === instructorId
        ? { ...i, follower_count: Math.max(0, (i.follower_count || 0) + (isFollowing ? -1 : 1)) }
        : i
      ));
      
      // Trigger a refresh event for the sidebar if needed (via window event)
      window.dispatchEvent(new CustomEvent('refresh-sidebar')); 
      
      alert(isFollowing ? '팔로우가 취소되었습니다.' : '마스터를 팔로우했습니다! 사이드바에서 확인하세요.');
    } catch (err) {
      console.error('Follow error:', err);
      alert('처리 중 오류가 발생했습니다: ' + (err.message || '잠시 후 다시 시도해주세요.'));
    } finally {
      setProcessing(prev => ({ ...prev, [instructorId]: false }));
    }
  }

  const toggleLike = async (e, instructorId) => {
    if (e) e.stopPropagation()
    if (processing[`like_${instructorId}`]) return

    const session = getSession()
    const today = new Date().toISOString().split('T')[0]
    const lastLiked = localStorage.getItem(`last_liked_${instructorId}`)
    
    if (lastLiked === today) {
      alert('이미 오늘 좋아요를 누르셨습니다. 내일 다시 응원해주세요!')
      return
    }

    setProcessing(prev => ({ ...prev, [`like_${instructorId}`]: true }))
    try {
      const instructor = instructors.find(i => i.id === instructorId)
      
      const { error } = await supabase
        .from('instructors')
        .update({ likes_count: (instructor?.likes_count || 0) + 1 })
        .eq('id', instructorId)

      if (error) throw error

      localStorage.setItem(`last_liked_${instructorId}`, today)
      setLikes(prev => ({ ...prev, [instructorId]: true }))
      setInstructors(prev => prev.map(i => i.id === instructorId
        ? { ...i, likes_count: (i.likes_count || 0) + 1 }
        : i
      ))
      
      alert('응원이 전달되었습니다! (내일 또 눌러주세요)')
    } catch (err) {
      alert('좋아요 실패: ' + err.message)
    } finally {
      setProcessing(prev => ({ ...prev, [`like_${instructorId}`]: false }))
    }
  }

  // Debugging function for development
  const handleActionClick = (type, id, e) => {
    console.log(`[ACTION] ${type} clicked for ID: ${id}`);
    if (type === 'follow') toggleFollow(e, id);
    else if (type === 'like') toggleLike(e, id);
  }

  const filteredInstructors = instructors.filter(i => {
    const matchesGenre = selectedGenre === '전체' || 
                        (selectedGenre === '⭐ 내 팔로잉' ? follows[i.id] : 
                        (Array.isArray(i.genre) ? i.genre.join(' ').includes(selectedGenre) : (i.genre || '').includes(selectedGenre)));
    const matchesCity = selectedCity === '전국' || (i.city || '').includes(selectedCity);
    const matchesSearch = !searchQuery || 
                         i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (i.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesCity && matchesSearch;
  });

  const getGenre = (genre) => Array.isArray(genre) ? genre.join(' · ') : (genre || '')

  const formatStat = (num) => {
    if (!num) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getDynamicStat = (instructor, type) => {
    if (type === 'followers') return formatStat(instructor.follower_count || 0)
    if (type === 'likes') return formatStat(instructor.likes_count || 0)
    if (type === 'classes') return '0'
    if (type === 'bookings') return '0'
    return '0'
  }

  const StatCard = ({ label, value, subValue, icon }) => (
    <div style={{
      flex: 1, padding: '15px 10px', borderRadius: '16px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      {icon && <div style={{ position: 'absolute', top: 5, right: 8 }}>{icon}</div>}
      <div style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFF' }}>{value}</div>
      <div style={{ fontSize: '9px', color: '#C9A84C', fontWeight: 700, marginTop: '2px' }}>{subValue}</div>
      <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', width: '40px', height: '20px', background: 'rgba(201,168,76,0.1)', filter: 'blur(10px)', borderRadius: '50%' }} />
    </div>
  )

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#fff' }}>
      
      {/* List Header */}
      <div style={{ padding: '30px 25px 10px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#FFF', margin: 0, letterSpacing: '-1px' }}>
          DANCE <span style={{ color: '#C9A84C' }}>MASTERS</span>
        </h2>
      </div>

      {/* Filters & Search - Single Row Design */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(13, 13, 13, 0.95)', backdropFilter: 'blur(20px)', padding: '15px 25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          
          {/* Location Chip (Folder Style) */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => { setShowMoreCities(!showMoreCities); setShowMoreGenres(false); }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: '14px',
                background: selectedCity !== '전국' || showMoreCities ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                border: selectedCity !== '전국' || showMoreCities ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.1)',
                color: selectedCity !== '전국' || showMoreCities ? '#C9A84C' : '#8E8E93',
                cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 800
              }}
            >
              {selectedCity === '전국' ? '전국' : selectedCity}
              <Plus size={14} style={{ transform: showMoreCities ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            
            <AnimatePresence>
              {showMoreCities && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 5, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ 
                    position: 'absolute', top: '100%', left: 0, minWidth: '140px',
                    background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px',
                    padding: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 1000
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {CITIES.map(c => (
                      <button 
                        key={c} 
                        onClick={() => { setSelectedCity(c); setShowMoreCities(false); }}
                        style={{ 
                          padding: '12px 16px', borderRadius: '12px', border: 'none', textAlign: 'left',
                          background: selectedCity === c ? 'rgba(201,168,76,0.1)' : 'transparent',
                          color: selectedCity === c ? '#C9A84C' : '#A1A1AA',
                          fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Genre Chip (Folder Style) */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => { setShowMoreGenres(!showMoreGenres); setShowMoreCities(false); }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: '14px',
                background: selectedGenre !== '전체' || showMoreGenres ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                border: selectedGenre !== '전체' || showMoreGenres ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.1)',
                color: selectedGenre !== '전체' || showMoreGenres ? '#C9A84C' : '#8E8E93',
                cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 800
              }}
            >
              {selectedGenre === '전체' ? '전체' : selectedGenre}
              <Plus size={14} style={{ transform: showMoreGenres ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            
            <AnimatePresence>
              {showMoreGenres && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 5, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ 
                    position: 'absolute', top: '100%', left: 0, minWidth: '160px',
                    background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px',
                    padding: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 1000
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '300px', overflowY: 'auto' }}>
                    {GENRES.map(g => (
                      <button 
                        key={g} 
                        onClick={() => { setSelectedGenre(g); setShowMoreGenres(false); }}
                        style={{ 
                          padding: '12px 16px', borderRadius: '12px', border: 'none', textAlign: 'left',
                          background: selectedGenre === g ? 'rgba(201,168,76,0.1)' : 'transparent',
                          color: selectedGenre === g ? '#C9A84C' : '#A1A1AA',
                          fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color="#475569" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              id="instructor-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="마스터 검색"
              style={{ 
                width: '100%', padding: '12px 15px 12px 42px', borderRadius: '16px', 
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                color: '#FFF', fontSize: '14px', fontWeight: 600, outline: 'none' 
              }}
            />
          </div>

        </div>
      </div>

      {/* TOP 5 MASTERS - High Impact Showcase */}
      {!loading && instructors.length > 0 && (
        <div style={{ padding: '10px 25px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 900, color: '#C9A84C', letterSpacing: '2px', margin: 0 }}>TOP 5 MASTERS</h3>
            <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {/* Rank 1 - Hero Card */}
            {instructors[0] && (
              <motion.div 
                onClick={() => setSelectedInstructor(instructors[0])}
                whileTap={{ scale: 0.98 }}
                style={{ gridColumn: 'span 2', position: 'relative', height: '240px', borderRadius: '28px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(201,168,76,0.2)' }}
              >
                <img src={instructors[0].photo_url || 'https://via.placeholder.com/500'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', top: 15, left: 15, background: 'rgba(201,168,76,0.9)', color: '#000', padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 900 }}>TOP RANK #1</div>
                <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                  <div style={{ fontSize: '24px', fontWeight: 950, color: '#FFF', marginBottom: '4px' }}>{instructors[0].name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600 }}>{getGenre(instructors[0].genre)}</div>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#C9A84C', fontWeight: 800 }}>
                      <Star size={12} fill="#C9A84C" /> {instructors[0].follower_count?.toLocaleString()} Followers
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rank 2-5 - Premium Mini Cards */}
            {instructors.slice(1, 5).map((inst, idx) => (
              <motion.div 
                key={inst.id}
                onClick={() => setSelectedInstructor(inst)}
                whileTap={{ scale: 0.96 }}
                style={{ position: 'relative', height: '180px', borderRadius: '24px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <img src={inst.photo_url || 'https://via.placeholder.com/300'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
                  <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: '#FFF', padding: '4px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>
                    #{idx + 2}
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 15, left: 15, right: 15 }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFF', marginBottom: '2px' }}>{inst.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '10px', color: '#C9A84C', fontWeight: 700 }}>
                    <Heart size={10} fill="#C9A84C" /> {inst.likes_count?.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* List View - Others */}
      <div style={{ padding: '0 25px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '1px', margin: 0 }}>EXPLORE ALL MASTERS</h3>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        </div>
        {filteredInstructors.filter(i => !instructors.slice(0, 5).find(top => top.id === i.id)).map((instructor) => (
          <motion.div
            key={instructor.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedInstructor(instructor)}
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '16px 20px', borderRadius: '22px', 
              background: 'rgba(255,255,255,0.02)',
              marginBottom: '10px', border: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: 60, height: 60, borderRadius: '16px', overflow: 'hidden', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.05)' }}>
              {instructor.photo_url ? <img src={instructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /> : <div style={{ fontSize: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>💃</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF' }}>{instructor.name}</div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{getGenre(instructor.genre)} · {instructor.city}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#C9A84C' }}>{instructor.follower_count}</div>
              <div style={{ fontSize: 9, color: '#475569', fontWeight: 700 }}>FOLLOWS</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail View (Pixel Perfect to Mockup) */}
      <AnimatePresence>
        {selectedInstructor && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 5000, background: '#000',
              display: 'flex', justifyContent: 'center'
            }}
          >
            <div style={{ 
              width: '100%', maxWidth: '500px', height: '100%', 
              background: '#0D0D0D', color: '#fff', overflowY: 'auto',
              position: 'relative', boxShadow: '0 0 100px rgba(0,0,0,0.8)'
            }}>
              {/* 1. Immersive Hero */}
              <div style={{ position: 'relative', height: '480px', overflow: 'hidden' }}>
                <div style={{ 
                  position: 'absolute', inset: 0, 
                  background: selectedInstructor.photo_url ? `url(${selectedInstructor.photo_url}) center/cover` : '#1A1A1A',
                  filter: 'brightness(0.7)' 
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, #0D0D0D 100%)' }} />
                
                {/* Top Navigation */}
                <div style={{ position: 'absolute', top: '50px', left: '25px', right: '25px', display: 'flex', justifyContent: 'space-between', zIndex: 20 }}>
                  <button onClick={() => setSelectedInstructor(null)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={22} /></button>
                  <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Share2 size={20} /></button>
                </div>

                {/* Overlapping Profile Pic */}
                <div style={{ position: 'absolute', bottom: '150px', left: '25px', zIndex: 30 }}>
                  <div style={{ width: 110, height: 110, borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                    <img src={selectedInstructor.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  </div>
                </div>

                {/* Action Buttons (Right Bottom of Hero) - Maximum Z-Index to ensure clickability */}
                <div style={{ position: 'absolute', bottom: '170px', right: '25px', display: 'flex', gap: '12px', zIndex: 99999, pointerEvents: 'auto' }}>
                  <button 
                    onClick={(e) => toggleFollow(e, selectedInstructor.id)}
                    disabled={processing[selectedInstructor.id]}
                    style={{ 
                      width: 54, height: 54, borderRadius: '50%', 
                      background: follows[selectedInstructor.id] ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.2)', 
                      backdropFilter: 'blur(20px)', 
                      border: follows[selectedInstructor.id] ? '2px solid #C9A84C' : '1px solid rgba(255,255,255,0.3)', 
                      color: follows[selectedInstructor.id] ? '#C9A84C' : '#fff', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', transition: 'all 0.3s',
                      opacity: processing[selectedInstructor.id] ? 0.6 : 1,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}
                  >
                    <Bell size={24} fill={follows[selectedInstructor.id] ? '#C9A84C' : 'none'} style={{ pointerEvents: 'none' }} />
                  </button>
                  <button 
                    onClick={(e) => toggleLike(e, selectedInstructor.id)}
                    disabled={processing[`like_${selectedInstructor.id}`]}
                    style={{ 
                      width: 54, height: 54, borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)', 
                      backdropFilter: 'blur(20px)', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      color: likes[selectedInstructor.id] ? '#FF1744' : '#fff', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer',
                      opacity: processing[`like_${selectedInstructor.id}`] ? 0.6 : 1,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}
                  >
                    <Heart size={24} fill={likes[selectedInstructor.id] ? '#FF1744' : 'none'} style={{ pointerEvents: 'none' }} />
                  </button>
                </div>
              </div>

              {/* 2. Identity Section */}
              <div style={{ padding: '0 25px', marginTop: '-120px', position: 'relative', zIndex: 40 }}>
                <h1 style={{ fontSize: '38px', fontWeight: 950, color: '#FFF', margin: '0 0 4px 0', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>{selectedInstructor.name}</h1>
                <div style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, letterSpacing: '0.2px' }}>
                  Professional Dancer | Choreographer | Instructor
                </div>

                {/* 3. Stat Grid */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                  <StatCard 
                    label="Followers" 
                    value={getDynamicStat(selectedInstructor, 'followers')} 
                    subValue="0 new" 
                    icon={<User size={12} color="#C9A84C" />} 
                  />
                  <StatCard 
                    label="Likes" 
                    value={getDynamicStat(selectedInstructor, 'likes')} 
                    subValue="0 new" 
                    icon={<Heart size={10} fill="#C9A84C" color="#C9A84C" />} 
                  />
                  <StatCard label="Classes" value={getDynamicStat(selectedInstructor, 'classes')} />
                  <StatCard label="Bookings" value={getDynamicStat(selectedInstructor, 'bookings')} />
                </div>

                {/* 4. Tabs */}
                <div style={{ marginTop: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
                    {['BIO', 'CLASSES', 'GALLERY'].map(tab => (
                      <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        style={{ 
                          background: 'none', border: 'none', color: activeTab === tab ? '#FFF' : '#64748B', 
                          fontSize: '14px', fontWeight: 900, cursor: 'pointer', padding: '15px 0',
                          position: 'relative', transition: 'all 0.3s'
                        }}
                      >
                        {tab}
                        {activeTab === tab && <motion.div layoutId="tab-underline" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#C9A84C' }} />}
                      </button>
                    ))}
                  </div>
                  {/* Reflection Line */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
                </div>

                {/* 5. Content */}
                <div style={{ padding: '30px 5px 150px' }}>
                  <AnimatePresence mode="wait">
                    {activeTab === 'BIO' && (
                      <motion.div 
                        key="bio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ padding: '0 20px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#FFF', margin: 0 }}>About {selectedInstructor.name.split(' ')[0]}</h3>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => window.open(`https://www.instagram.com/${selectedInstructor.instagram}`, '_blank')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><Globe size={20} color="#8E8E93" /></button>
                            <button onClick={() => { navigator.share?.({ title: selectedInstructor.name, url: window.location.href }); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><Share2 size={20} color="#8E8E93" /></button>
                          </div>
                        </div>
                        <p style={{ fontSize: '15px', color: '#A1A1AA', lineHeight: 1.6, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                          {selectedInstructor.bio || `Passionate professional professional with years of experience. Focused on technique, expression, and artistry. Based in ${selectedInstructor.city}.`}
                        </p>

                        <div style={{ display: 'flex', marginTop: '30px', gap: '40px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFF', marginBottom: '8px' }}>Specialties</div>
                            <div style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {getGenre(selectedInstructor.genre).split(' · ').map(g => <span key={g} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '8px' }}>{g}</span>)}
                            </div>
                          </div>
                        <div style={{ display:'flex', gap:8, marginTop:16 }}>
                          {selectedInstructor.kakao_link && (
                            <button
                              onClick={() => window.open(selectedInstructor.kakao_link, '_blank')}
                              style={{ flex:1, padding:'12px', borderRadius:14, border:'none', background:'#FEE500', color:'#000', fontSize:14, fontWeight:800, cursor:'pointer' }}
                            >💬 카카오 문의</button>
                          )}
                          {selectedInstructor.instagram && (
                            <button
                              onClick={() => window.open(`https://instagram.com/${selectedInstructor.instagram}`, '_blank')}
                              style={{ flex:1, padding:'12px', borderRadius:14, border:'1px solid #E5E7EB', background:'#fff', color:'#111', fontSize:14, fontWeight:800, cursor:'pointer' }}
                            >📸 인스타그램</button>
                          )}
                        </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'CLASSES' && (
                      <div style={{ padding:'16px' }}>
                        {classes.length === 0 ? (
                          <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.3)' }}>
                            <div style={{ fontSize:40, marginBottom:12 }}>📚</div>
                            <div style={{ fontSize:14 }}>등록된 클래스가 없어요</div>
                          </div>
                        ) : (
                          classes.map(c => (
                            <div key={c.id} style={{ background:'#1a1a1a', borderRadius:20, overflow:'hidden', marginBottom:20, border:'1px solid rgba(255,255,255,0.05)' }}>
                              {c.poster_url && (
                                <img src={c.poster_url} style={{ width:'100%', height:'200px', objectFit:'cover' }} alt={c.title} />
                              )}
                              <div style={{ padding:16 }}>
                                <div style={{ fontSize:17, fontWeight:900, color:'#fff', marginBottom:8 }}>{c.title}</div>
                                <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:12 }}>{c.description}</div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                                  {c.schedule && <div style={{ fontSize:12, color:'#FFD700', background:'rgba(255,215,0,0.1)', padding:'4px 10px', borderRadius:8 }}>⏰ {c.schedule}</div>}
                                  {c.location && <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.05)', padding:'4px 10px', borderRadius:8 }}>📍 {c.location}</div>}
                                  {c.fee && <div style={{ fontSize:12, color:'#E53935', fontWeight:800, background:'rgba(229,57,53,0.1)', padding:'4px 10px', borderRadius:8 }}>{c.fee}</div>}
                                </div>
                                
                                {selectedInstructor.kakao_link && (
                                  <button
                                    onClick={() => window.open(selectedInstructor.kakao_link, '_blank')}
                                    style={{ width:'100%', marginTop:16, padding:'12px', borderRadius:14, border:'none', background:'#FEE500', color:'#000', fontSize:13, fontWeight:900, cursor:'pointer' }}
                                  >문의 및 신청하기</button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'GALLERY' && (
                      <motion.div 
                        key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}
                      >
                        {posts && posts.length > 0 ? posts.map((post, i) => (
                          <div key={post.id || i} style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <img src={post.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )) : (
                          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
                            <div style={{ fontSize: 14 }}>아직 게시물이 없어요</div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InstructorSection
