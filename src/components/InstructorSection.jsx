import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Share2, Bell, Heart, User, MapPin, Globe, ShieldCheck, Zap, MessageCircle, Star, Info, Plus, Check, Search } from 'lucide-react'
import ClassRegisterModal from './ClassRegisterModal'
import InstructorRegister from './InstructorRegister'

const REGIONS = ['전국', '서울', '경기인천', '경상도', '전라도', '충청도', '강원제주']
const GENRE_TABS = ['전체', '바차타', '살사', '쥬크', '키좀바']

const matchesRegion = (instructor, region) => {
  if (region === '전국') return true;
  const targetStr = ((instructor.city || '') + ' ' + (instructor.address || '')).toLowerCase();
  if (!targetStr.trim()) return false;
  
  switch (region) {
    case '서울':
      return targetStr.includes('서울');
    case '경기인천':
      return targetStr.includes('경기') || targetStr.includes('인천');
    case '경상도':
      return targetStr.includes('부산') || targetStr.includes('대구') || targetStr.includes('울산') || targetStr.includes('경남') || targetStr.includes('경상남') || targetStr.includes('경북') || targetStr.includes('경상북');
    case '전라도':
      return targetStr.includes('광주') || targetStr.includes('전남') || targetStr.includes('전라남') || targetStr.includes('전북') || targetStr.includes('전라북');
    case '충청도':
      return targetStr.includes('대전') || targetStr.includes('세종') || targetStr.includes('충남') || targetStr.includes('충청남') || targetStr.includes('충북') || targetStr.includes('충청북');
    case '강원제주':
      return targetStr.includes('강원') || targetStr.includes('제주');
    default:
      return targetStr.includes(region.toLowerCase());
  }
};

const getInstaLink = (inst) => {
  if (!inst) return '';
  if (inst.instagram_url) {
    return inst.instagram_url.startsWith('http') ? inst.instagram_url : `https://${inst.instagram_url}`;
  }
  if (inst.instagram) {
    return inst.instagram.startsWith('http') ? inst.instagram : `https://www.instagram.com/${inst.instagram.replace(/^@/, '')}`;
  }
  return '';
};

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
  const [visibleCount, setVisibleCount] = useState(20)
  const [showMasterMenu, setShowMasterMenu] = useState(false)
  const [showInstructorRegister, setShowInstructorRegister] = useState(false)
  const [classForm, setClassForm] = useState({
    instructor_id: '', title: '', schedule: '', location: '', fee: '', level: '', capacity: '', description: ''
  })
  const [submittingClass, setSubmittingClass] = useState(false)

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

  useEffect(() => {
    if (showMasterMenu) {
      setClassForm(prev => ({
        ...prev,
        instructor_id: selectedInstructor ? selectedInstructor.id : (instructors[0]?.id || '')
      }))
    }
  }, [showMasterMenu, selectedInstructor, instructors])

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    const targetInstructorId = classForm.instructor_id || (instructors[0]?.id);
    if (!targetInstructorId) {
      alert('강사를 선택해주세요.');
      return;
    }
    if (!classForm.schedule) {
      alert('날짜/시간을 입력해주세요.');
      return;
    }

    setSubmittingClass(true);
    try {
      const { error } = await supabase.from('instructor_classes').insert({
        instructor_id: targetInstructorId,
        title: classForm.title || '스페셜 클래스',
        schedule: classForm.schedule,
        location: classForm.location,
        fee: classForm.fee,
        level: classForm.level,
        capacity: classForm.capacity,
        description: classForm.description,
        status: 'active'
      });

      if (error) throw error;

      alert('클래스가 성공적으로 등록되었습니다!');
      setShowMasterMenu(false);
      setClassForm({
        instructor_id: '', title: '', schedule: '', location: '', fee: '', level: '', capacity: '', description: ''
      });
      if (selectedInstructor && selectedInstructor.id === targetInstructorId && activeTab === 'CLASSES') {
        const { data } = await supabase
          .from('instructor_classes')
          .select('*')
          .eq('instructor_id', selectedInstructor.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        if (data) setClasses(data);
      }
    } catch (err) {
      console.error('Class insert error:', err);
      alert('클래스 등록에 실패했습니다: ' + (err.message || err));
    } finally {
      setSubmittingClass(false);
    }
  };

  const toggleFollow = async (e, instructorId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (localStorage.getItem(`followed_${instructorId}`)) {
      alert("이미 팔로우한 강사입니다");
      return;
    }

    if (processing[instructorId]) return;

    const session = getSession();
    const instructor = instructors.find(i => i.id === instructorId);
    
    setProcessing(prev => ({ ...prev, [instructorId]: true }));
    
    try {
      // Always insert, never delete (unfollow disabled)
      const { error } = await supabase.from('instructor_follows').insert({ instructor_id: instructorId, user_session: session });
      if (error) throw error;
      await supabase.from('instructors').update({ follower_count: (instructor?.follower_count || 0) + 1 }).eq('id', instructorId);
      
      localStorage.setItem(`followed_${instructorId}`, "true");
      
      const newFollows = { ...follows, [instructorId]: true };
      setFollows(newFollows);
      localStorage.setItem('instructor_follows', JSON.stringify(newFollows));
      
      setInstructors(prev => prev.map(i => i.id === instructorId
        ? { ...i, follower_count: (i.follower_count || 0) + 1 }
        : i
      ));
      
      window.dispatchEvent(new CustomEvent('refresh-sidebar')); 
      alert('즐겁고 행복한 수업 되세요! 🎶');
    } catch (err) {
      console.error('Follow error:', err);
      // If error is duplicate key, it means already followed in DB but maybe not in localStorage
      if (err.code === '23505') {
        localStorage.setItem(`followed_${instructorId}`, "true");
        alert("이미 팔로우한 강사입니다");
      } else {
        alert('처리 중 오류가 발생했습니다: ' + (err.message || '잠시 후 다시 시도해주세요.'));
      }
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

  const isFiltering = selectedGenre !== '전체' || selectedCity !== '전국' || searchQuery.trim() !== '';

  const filteredInstructors = instructors.filter(i => {
    const matchesGenre = selectedGenre === '전체' || 
                        (selectedGenre === '⭐ 내 팔로잉' ? follows[i.id] : 
                        (Array.isArray(i.genre) ? i.genre.join(' ').includes(selectedGenre) : (i.genre || '').includes(selectedGenre)));
    const matchesCity = matchesRegion(i, selectedCity);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
                         (i.name || '').toLowerCase().includes(query) || 
                         (Array.isArray(i.genre) ? i.genre.join(' ') : (i.genre || '')).toLowerCase().includes(query) ||
                         ((i.city || '') + ' ' + (i.address || '')).toLowerCase().includes(query);
    return matchesGenre && matchesCity && matchesSearch;
  });

  const currentList = isFiltering 
    ? filteredInstructors 
    : filteredInstructors.filter(i => !instructors.slice(0, 5).find(top => top.id === i.id));

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
      <div style={{ padding: '30px 25px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#FFF', margin: 0, letterSpacing: '-1px' }}>
          DANCE <span style={{ color: '#C9A84C' }}>MASTERS</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowInstructorRegister((prev) => !prev)}
            style={{
              border: '1px solid #C9A84C',
              color: '#C9A84C',
              background: 'rgba(201,168,76,0.1)',
              borderRadius: '12px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            강사 등록
          </button>
          <button
            onClick={() => setShowMasterMenu(true)}
            style={{
              padding: '8px 14px', borderRadius: '12px', background: 'rgba(201,168,76,0.15)',
              border: '1px solid #C9A84C', color: '#C9A84C', fontSize: '12px', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
            }}
          >
            👑 강사 전용
          </button>
        </div>
      </div>

      {/* 스타일 삽입 (스크롤바 숨김) */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Filters & Search - 3-Step Header */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 100, 
        background: 'rgba(13, 13, 13, 0.95)', backdropFilter: 'blur(20px)', 
        padding: '15px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        {/* 3. 검색창 (상단 고정) */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#475569" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            id="instructor-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(20); }}
            placeholder="이름, 장르, 지역으로 검색"
            style={{ 
              width: '100%', padding: '12px 15px 12px 42px', borderRadius: '16px', 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              color: '#FFF', fontSize: '14px', fontWeight: 600, outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 1. 지역 탭 (가로 스크롤) */}
        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '2px' }}>
          {REGIONS.map(r => (
            <button
              key={r}
              onClick={() => { setSelectedCity(r); setVisibleCount(20); }}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: 'none', whiteSpace: 'nowrap',
                background: selectedCity === r ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                color: selectedCity === r ? '#C9A84C' : '#8E8E93',
                fontSize: '13px', fontWeight: selectedCity === r ? 800 : 600,
                border: selectedCity === r ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {/* 2. 장르 탭 (가로 스크롤) */}
        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '2px' }}>
          {GENRE_TABS.map(g => (
            <button
              key={g}
              onClick={() => { setSelectedGenre(g); setVisibleCount(20); }}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: 'none', whiteSpace: 'nowrap',
                background: selectedGenre === g ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                color: selectedGenre === g ? '#C9A84C' : '#8E8E93',
                fontSize: '13px', fontWeight: selectedGenre === g ? 800 : 600,
                border: selectedGenre === g ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {g}
            </button>
          ))}
          {selectedGenre === '⭐ 내 팔로잉' && (
            <button
              onClick={() => { setSelectedGenre('⭐ 내 팔로잉'); setVisibleCount(20); }}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: 'none', whiteSpace: 'nowrap',
                background: 'rgba(201,168,76,0.15)', color: '#C9A84C', fontSize: '13px', fontWeight: 800,
                border: '1px solid #C9A84C', cursor: 'pointer'
              }}
            >
              ⭐ 내 팔로잉
            </button>
          )}
        </div>
      </div>

      {/* TOP 5 MASTERS - High Impact Showcase */}
      {!loading && instructors.length > 0 && !isFiltering && (
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
                    {/* <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#C9A84C', fontWeight: 800 }}>
                      <Star size={12} fill="#C9A84C" /> {instructors[0].follower_count?.toLocaleString()} Followers
                    </div> */}
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

      {/* List View - Others / Search Results */}
      <div style={{ padding: '0 25px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: isFiltering ? '#C9A84C' : '#475569', letterSpacing: '1px', margin: 0 }}>
            {isFiltering ? `검색 결과 (${currentList.length}명)` : 'EXPLORE ALL MASTERS'}
          </h3>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        </div>
        {currentList.slice(0, visibleCount).map((instructor) => (
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

        {/* 더 보기 버튼 */}
        {currentList.length > visibleCount && (
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button
              onClick={() => setVisibleCount(prev => prev + 20)}
              style={{
                padding: '12px 28px', borderRadius: '16px', border: '1px solid rgba(201,168,76,0.3)',
                background: 'rgba(201,168,76,0.1)', color: '#C9A84C', fontSize: '13px', fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              더 보기 ({visibleCount} / {currentList.length})
            </button>
          </div>
        )}
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

                <motion.div style={{ position: 'absolute', bottom: '170px', right: '25px', display: 'flex', gap: '12px', zIndex: 99999, pointerEvents: 'auto' }}>
                  <button
                    type="button"
                    onClick={(e) => toggleFollow(e, selectedInstructor.id)}
                    disabled={processing[selectedInstructor.id]}
                    style={{
                      background: follows[selectedInstructor.id] ? '#888' : '#FF1744',
                      color: '#fff',
                      borderRadius: '20px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 900,
                      border: 'none',
                      cursor: 'pointer',
                      opacity: processing[selectedInstructor.id] ? 0.6 : 1,
                    }}
                  >
                    {follows[selectedInstructor.id] ? '내 찐강사 ✅' : '내 찐강사 ❤️‍🔥'}
                  </button>
                  {/* 좋아요 UI 숨김
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
                  */}
                </motion.div>
              </div>

              {/* 2. Identity Section */}
              <div style={{ padding: '0 25px', marginTop: '-120px', position: 'relative', zIndex: 40 }}>
                <h1 style={{ fontSize: '38px', fontWeight: 950, color: '#FFF', margin: '0 0 4px 0', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>{selectedInstructor.name}</h1>
                <div style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, letterSpacing: '0.2px' }}>
                  Professional Dancer | Choreographer | Instructor
                </div>

                {/* 3. Stat Grid */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                  {/* <StatCard 
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
                  /> */}
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

                        <div style={{ marginTop: '30px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFF', marginBottom: '8px' }}>Specialties</div>
                          <div style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {getGenre(selectedInstructor.genre).split(' · ').map(g => <span key={g} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>{g}</span>)}
                          </div>
                        </div>

                        {/* 고품격 문의/예약 전용 프리미엄 박스 영역 */}
                        <div style={{ 
                          marginTop: '24px', padding: '18px', borderRadius: '20px', 
                          background: 'linear-gradient(145deg, rgba(24,24,24,0.7) 0%, rgba(12,12,12,0.9) 100%)',
                          border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#C9A84C', letterSpacing: '0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>✨ DIRECT INQUIRY & BOOKING</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            {selectedInstructor.kakao_link && (
                              <button
                                onClick={() => window.open(selectedInstructor.kakao_link, '_blank')}
                                style={{ 
                                  flex: 1, padding: '14px 8px', borderRadius: '14px', border: 'none', 
                                  background: 'linear-gradient(135deg, #FEE500 0%, #E6CF00 100%)', color: '#111', 
                                  fontSize: '13px', fontWeight: 900, cursor: 'pointer', textAlign: 'center',
                                  boxShadow: '0 6px 16px rgba(254, 229, 0, 0.2)', transition: 'all 0.2s'
                                }}
                              >💬 수업·레슨 문의</button>
                            )}
                            {getInstaLink(selectedInstructor) && (
                              <button
                                onClick={() => window.open(getInstaLink(selectedInstructor), '_blank')}
                                style={{ 
                                  flex: 1, padding: '14px 8px', borderRadius: '14px', 
                                  border: '1px solid rgba(201,168,76,0.4)', 
                                  background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)', 
                                  color: '#E5C266', fontSize: '13px', fontWeight: 900, cursor: 'pointer', textAlign: 'center',
                                  boxShadow: '0 6px 16px rgba(201, 168, 76, 0.1)', backdropFilter: 'blur(8px)',
                                  transition: 'all 0.2s'
                                }}
                              >📅 부킹·예약 문의</button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'CLASSES' && (
                      <div style={{ padding:'16px' }}>
                        {classes.length === 0 ? (
                          <div style={{ textAlign:'center', padding:'50px 20px', background:'rgba(255,255,255,0.02)', borderRadius:'20px', border:'1px dashed rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize:15, color:'#E4E4E7', lineHeight:1.6, fontWeight:600, whiteSpace:'pre-wrap', marginBottom:20 }}>
                              {`🎓 아직 등록된 클래스가 없습니다.\n강사님께서 직접 마스터 메뉴에서 등록해 주세요!`}
                            </div>
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent('open-class-register'))}
                              style={{
                                padding:'12px 24px', borderRadius:'14px', background:'#C9A84C', color:'#000',
                                border:'none', fontSize:14, fontWeight:900, cursor:'pointer',
                                boxShadow:'0 4px 12px rgba(201,168,76,0.3)'
                              }}
                            >
                              클래스 등록하기 →
                            </button>
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
                                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                  {c.schedule && <div style={{ fontSize:12, color:'#FFD700', background:'rgba(255,215,0,0.1)', padding:'4px 10px', borderRadius:8 }}>⏰ {c.schedule}</div>}
                                  {c.location && <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.05)', padding:'4px 10px', borderRadius:8 }}>📍 {c.location}</div>}
                                  {c.fee && <div style={{ fontSize:12, color:'#E53935', fontWeight:800, background:'rgba(229,57,53,0.1)', padding:'4px 10px', borderRadius:8 }}>💰 {c.fee}</div>}
                                  {c.level && <div style={{ fontSize:12, color:'#4ADE80', background:'rgba(74,222,128,0.1)', padding:'4px 10px', borderRadius:8 }}>⭐ {c.level}</div>}
                                  {c.capacity && <div style={{ fontSize:12, color:'#60A5FA', background:'rgba(96,165,250,0.1)', padding:'4px 10px', borderRadius:8 }}>👥 {c.capacity}</div>}
                                </div>
                                
                                <button
                                  onClick={() => {
                                    if (selectedInstructor.kakao_link) window.open(selectedInstructor.kakao_link, '_blank');
                                    else alert('등록된 카카오 문의 링크가 없습니다.');
                                  }}
                                  style={{ width:'100%', marginTop:16, padding:'12px', borderRadius:14, border:'none', background:'#FEE500', color:'#000', fontSize:13, fontWeight:900, cursor:'pointer' }}
                                >수강신청 (카카오톡 문의)</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'GALLERY' && (
                      <motion.div 
                        key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ padding: '40px 20px', textAlign: 'center' }}
                      >
                        {getInstaLink(selectedInstructor) ? (
                          <div>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
                            <div style={{ fontSize: 14, color: '#A1A1AA', marginBottom: 24, fontWeight: 600 }}>
                              강사의 최신 활동과 갤러리를 인스타그램에서 확인하세요
                            </div>
                            <button
                              onClick={() => window.open(getInstaLink(selectedInstructor), '_blank')}
                              style={{
                                padding: '14px 32px', borderRadius: '16px', background: 'linear-gradient(135deg, #E1306C, #833AB4)',
                                color: '#fff', border: 'none', fontSize: '14px', fontWeight: 900, cursor: 'pointer',
                                boxShadow: '0 10px 20px rgba(225, 48, 108, 0.3)'
                              }}
                            >
                              인스타그램 갤러리 보기
                            </button>
                          </div>
                        ) : (
                          <div style={{ color: 'rgba(255,255,255,0.3)', padding: '40px 0' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>갤러리가 없습니다</div>
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

      {/* 마스터 전용 클래스 등록 모달 (단계별 3단계 모달 연동) */}
      {showMasterMenu && (
        <ClassRegisterModal 
          isOpen={showMasterMenu} 
          onClose={() => setShowMasterMenu(false)} 
          instructorId={selectedInstructor?.id || ''} 
        />
      )}
      {showInstructorRegister && (
        <motion.div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 6000,
            background: '#fff',
            overflowY: 'auto',
          }}
        >
          <InstructorRegister onBack={() => setShowInstructorRegister(false)} />
        </motion.div>
      )}
    </div>
  )
}

export default InstructorSection
