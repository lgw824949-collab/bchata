import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Search, MapPin, Clock, Globe, Play, MessageCircle } from 'lucide-react';
// import InstructorSection from '../components/InstructorSection';

const REGIONS = ['전국', '서울', '경기인천', '경상도', '전라도', '충청도', '강원제주'];
const GENRE_TABS = ['전체', '바차타', '살사', '쥬크', '키좀바'];

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

const getGenre = (genre) => (Array.isArray(genre) ? genre.join(' · ') : (genre || ''));

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

const getYoutubeLink = (inst) => {
  if (!inst?.youtube) return '';
  return inst.youtube.startsWith('http') ? inst.youtube : `https://${inst.youtube}`;
};

const getContactLabel = (inst) => {
  if (inst?.kakao_link) return '카카오톡 문의';
  if (inst?.phone) return inst.phone;
  if (inst?.contact) return inst.contact;
  return '';
};

const getInstructorLevel = (inst, classesByInstructor) => {
  if (inst?.level) return inst.level;
  const classes = classesByInstructor[inst?.id] || [];
  const fromClass = classes.find((c) => c.level)?.level;
  return fromClass || '';
};

const Instructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [classesByInstructor, setClassesByInstructor] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('전체');
  const [selectedCity, setSelectedCity] = useState('전국');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: instructorData } = await supabase
        .from('instructors')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      const { data: classData } = await supabase
        .from('instructor_classes')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (instructorData) setInstructors(instructorData);

      const map = {};
      (classData || []).forEach((c) => {
        if (!map[c.instructor_id]) map[c.instructor_id] = [];
        map[c.instructor_id].push(c);
      });
      setClassesByInstructor(map);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (instructors.length === 0) return;
    const targetId = localStorage.getItem('selected_instructor_id');
    if (targetId) {
      const target = instructors.find((i) => i.id === targetId);
      if (target) {
        setSelectedInstructor(target);
        localStorage.removeItem('selected_instructor_id');
      }
    }
    const targetGenre = localStorage.getItem('instructor_target_genre');
    if (targetGenre) {
      setSelectedGenre(targetGenre);
      localStorage.removeItem('instructor_target_genre');
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

  const filteredInstructors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return instructors.filter((i) => {
      const matchesGenre =
        selectedGenre === '전체' ||
        (Array.isArray(i.genre) ? i.genre.join(' ').includes(selectedGenre) : (i.genre || '').includes(selectedGenre));
      const matchesCity = matchesRegion(i, selectedCity);
      const matchesSearch =
        !query ||
        (i.name || '').toLowerCase().includes(query) ||
        getGenre(i.genre).toLowerCase().includes(query) ||
        ((i.city || '') + ' ' + (i.address || '')).toLowerCase().includes(query);
      return matchesGenre && matchesCity && matchesSearch;
    });
  }, [instructors, selectedGenre, selectedCity, searchQuery]);

  const selectedClasses = selectedInstructor ? classesByInstructor[selectedInstructor.id] || [] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh',
        background: '#0D0D0D',
        color: '#F4F4F5',
        fontFamily: "'Outfit', sans-serif",
        paddingBottom: '100px',
      }}
    >
      <motion.div style={{ padding: '28px 20px 8px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FAFAFA' }}>
          강사 찾기
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#A1A1AA', fontWeight: 500, lineHeight: 1.5 }}>
          장르·지역·수업 정보를 확인하고 연락하세요.
        </p>
      </motion.div>

      <motion.div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(13, 13, 13, 0.96)',
          backdropFilter: 'blur(16px)',
          padding: '12px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <motion.div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} color="#71717A" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            id="instructor-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(30);
            }}
            placeholder="이름, 장르, 지역으로 검색"
            style={{
              width: '100%',
              padding: '12px 14px 12px 40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#FAFAFA',
              fontSize: '14px',
              fontWeight: 500,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </motion.div>

        <motion.div className="instructor-hide-scroll" style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px' }}>
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setSelectedCity(r);
                setVisibleCount(30);
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '18px',
                whiteSpace: 'nowrap',
                background: selectedCity === r ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: selectedCity === r ? '#FAFAFA' : '#71717A',
                fontSize: '13px',
                fontWeight: selectedCity === r ? 700 : 500,
                border: selectedCity === r ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
            >
              {r}
            </button>
          ))}
        </motion.div>

        <motion.div className="instructor-hide-scroll" style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {GENRE_TABS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setSelectedGenre(g);
                setVisibleCount(30);
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '18px',
                whiteSpace: 'nowrap',
                background: selectedGenre === g ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: selectedGenre === g ? '#FAFAFA' : '#71717A',
                fontSize: '13px',
                fontWeight: selectedGenre === g ? 700 : 500,
                border: selectedGenre === g ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
            >
              {g}
            </button>
          ))}
        </motion.div>
      </motion.div>

      <style>{`.instructor-hide-scroll::-webkit-scrollbar { display: none; }`}</style>

      <motion.div style={{ padding: '16px 20px 0' }}>
        {loading ? (
          <motion.div style={{ textAlign: 'center', padding: '48px 0', color: '#71717A', fontSize: '14px' }}>불러오는 중…</motion.div>
        ) : filteredInstructors.length === 0 ? (
          <motion.div style={{ textAlign: 'center', padding: '48px 20px', color: '#71717A', fontSize: '14px', lineHeight: 1.6 }}>
            조건에 맞는 강사가 없습니다.
          </motion.div>
        ) : (
          <>
            <motion.div style={{ fontSize: '12px', color: '#71717A', marginBottom: '14px', fontWeight: 600 }}>
              {filteredInstructors.length}명
            </motion.div>
            {filteredInstructors.slice(0, visibleCount).map((instructor) => {
              const classes = classesByInstructor[instructor.id] || [];
              const nextClass = classes[0];
              const level = getInstructorLevel(instructor, classesByInstructor);
              return (
                <button
                  key={instructor.id}
                  type="button"
                  onClick={() => setSelectedInstructor(instructor)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                    padding: '16px',
                    marginBottom: '10px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <motion.div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: '#1A1A1A',
                    }}
                  >
                    {instructor.photo_url ? (
                      <img src={instructor.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <motion.div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                        💃
                      </motion.div>
                    )}
                  </motion.div>
                  <motion.div style={{ flex: 1, minWidth: 0 }}>
                    <motion.div style={{ fontSize: '17px', fontWeight: 800, color: '#FAFAFA', marginBottom: '4px' }}>{instructor.name}</motion.div>
                    <motion.div style={{ fontSize: '13px', color: '#A1A1AA', marginBottom: '6px' }}>
                      {getGenre(instructor.genre)}
                      {level ? ` · ${level}` : ''}
                    </motion.div>
                    {(instructor.city || instructor.address) && (
                      <motion.div style={{ fontSize: '12px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <MapPin size={12} />
                        {[instructor.city, instructor.address].filter(Boolean).join(' ')}
                      </motion.div>
                    )}
                    {nextClass && (nextClass.schedule || nextClass.location) && (
                      <motion.div style={{ fontSize: '12px', color: '#D4D4D8', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {nextClass.schedule && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> {nextClass.schedule}
                          </span>
                        )}
                        {nextClass.location && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={11} /> {nextClass.location}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </button>
              );
            })}
            {filteredInstructors.length > visibleCount && (
              <motion.div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    color: '#D4D4D8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  더 보기
                </button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedInstructor && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 5000,
              background: '#0D0D0D',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <motion.div
              style={{
                width: '100%',
                maxWidth: '500px',
                height: '100%',
                overflowY: 'auto',
                paddingBottom: '80px',
              }}
            >
              <motion.div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedInstructor(null)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#FAFAFA' }}>강사 정보</span>
              </motion.div>

              <motion.div style={{ padding: '24px 20px' }}>
                <motion.div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <motion.div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '14px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: '#1A1A1A',
                    }}
                  >
                    {selectedInstructor.photo_url ? (
                      <img src={selectedInstructor.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <motion.div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                        💃
                      </motion.div>
                    )}
                  </motion.div>
                  <motion.div>
                    <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#FAFAFA' }}>{selectedInstructor.name}</h2>
                    <motion.div style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '4px' }}>{getGenre(selectedInstructor.genre)}</motion.div>
                    {getInstructorLevel(selectedInstructor, classesByInstructor) && (
                      <motion.div style={{ fontSize: '13px', color: '#D4D4D8' }}>레벨 · {getInstructorLevel(selectedInstructor, classesByInstructor)}</motion.div>
                    )}
                    {(selectedInstructor.city || selectedInstructor.address) && (
                      <motion.div style={{ fontSize: '13px', color: '#71717A', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} />
                        {[selectedInstructor.city, selectedInstructor.address].filter(Boolean).join(' ')}
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>

                {selectedInstructor.bio && (
                  <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.65, margin: '0 0 24px', whiteSpace: 'pre-wrap' }}>
                    {selectedInstructor.bio}
                  </p>
                )}

                <motion.div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#FAFAFA' }}>수업 일정</h3>
                  {selectedClasses.length === 0 ? (
                    <motion.div
                      style={{
                        padding: '20px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        fontSize: '14px',
                        color: '#71717A',
                        lineHeight: 1.5,
                      }}
                    >
                      등록된 수업 일정이 없습니다.
                    </motion.div>
                  ) : (
                    selectedClasses.map((c) => (
                      <motion.div
                        key={c.id}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          marginBottom: '8px',
                        }}
                      >
                        {c.title && (
                          <motion.div style={{ fontSize: '15px', fontWeight: 700, color: '#FAFAFA', marginBottom: '8px' }}>{c.title}</motion.div>
                        )}
                        {c.schedule && (
                          <motion.div style={{ fontSize: '13px', color: '#D4D4D8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} color="#71717A" />
                            {c.schedule}
                          </motion.div>
                        )}
                        {c.location && (
                          <motion.div style={{ fontSize: '13px', color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} color="#71717A" />
                            {c.location}
                          </motion.div>
                        )}
                        {c.level && (
                          <motion.div style={{ fontSize: '12px', color: '#71717A', marginTop: '8px' }}>레벨 {c.level}</motion.div>
                        )}
                      </motion.div>
                    ))
                  )}
                </motion.div>

                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getInstaLink(selectedInstructor) && (
                    <button
                      type="button"
                      onClick={() => window.open(getInstaLink(selectedInstructor), '_blank')}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#FAFAFA',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <Globe size={18} />
                      인스타그램
                    </button>
                  )}
                  {getYoutubeLink(selectedInstructor) && (
                    <button
                      type="button"
                      onClick={() => window.open(getYoutubeLink(selectedInstructor), '_blank')}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#FAFAFA',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <Play size={18} />
                      유튜브
                    </button>
                  )}
                  {getContactLabel(selectedInstructor) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedInstructor.kakao_link) window.open(selectedInstructor.kakao_link, '_blank');
                      }}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: 'none',
                        background: selectedInstructor.kakao_link ? '#FEE500' : 'rgba(255,255,255,0.06)',
                        color: selectedInstructor.kakao_link ? '#1A1A1A' : '#D4D4D8',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: selectedInstructor.kakao_link ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <MessageCircle size={18} />
                      {getContactLabel(selectedInstructor)}
                    </button>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Instructors;

/* [OLD] InstructorSection wrapper
import React from 'react';
import InstructorSection from '../components/InstructorSection';

const Instructors = () => {
  return (
    <div style={{ paddingBottom: '100px' }}>
      <InstructorSection />
    </div>
  );
};

export default Instructors;
*/
