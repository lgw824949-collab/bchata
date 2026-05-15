import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Search, Plus, X, Calendar, MapPin, 
  Image as ImageIcon, Zap, Search as SearchIcon, 
  ChevronDown, ChevronUp, Map as MapIcon, Info, Copy, Tent,
  Share2, Bell, Heart, User, Globe, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const GENRES = ['전체', '바차타', '살사', '키좀바', '쥬크'];
const REGIONS = ['전국', '서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주', '해외'];

const Bootcamp = ({ onBack, initialView = 'list' }) => {
  const { t, i18n } = useTranslation();
  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(initialView);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전국');
  const [selectedGenre, setSelectedGenre] = useState('전체');
  const [activeTab, setActiveTab] = useState('국내');
  const [selectedBootcamp, setSelectedBootcamp] = useState(null);
  const [showBookingGuide, setShowBookingGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [visibleCount, setVisibleCount] = useState(20);
  
  const [formData, setFormData] = useState({
    title: '', instructor: '', type: 'domestic', region: '서울', country: '',
    start_date: '', end_date: '', venue: '', price_info: '', description: '',
    poster_url: '', bank_info: '', genre: '바차타', level: '초급', instagram: '', youtube: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBootcamps();
  }, [activeTab]);

  // ref 로 항상 최신 selectedBootcamp 값 유지 (stale closure 방지)
  const selectedBootcampRef = useRef(null);
  useEffect(() => {
    selectedBootcampRef.current = selectedBootcamp;
  }, [selectedBootcamp]);

  // 모달이 열릴 때 히스토리 스택에 항목 추가
  useEffect(() => {
    if (selectedBootcamp) {
      window.history.pushState({ bootcampDetail: true }, '', window.location.pathname);
    }
  }, [selectedBootcamp]);

  // 컴포넌트 마운트 시 한 번만 등록 — ref 를 읽으므로 항상 최신 상태 반영
  useEffect(() => {
    const handlePop = () => {
      if (selectedBootcampRef.current) {
        setSelectedBootcamp(null);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const fetchBootcamps = async () => {
    setLoading(true);
    try {
      const type = activeTab === '국내' ? 'domestic' : 'overseas';
      const { data, error } = await supabase
        .from('bootcamps')
        .select('*')
        .eq('type', type)
        .eq('status', 'active')
        .order('start_date', { ascending: true });
      if (error) throw error;
      setBootcamps(data || []);
    } catch (err) {
      console.error('Error fetching bootcamps:', err);
    } finally {
      setLoading(false);
    }
  };

  /* [OLD] handleImageUpload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `bootcamps/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('posters').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, poster_url: publicUrl }));
    } catch (err) {
      alert('이미지 업로드 실패');
    } finally {
      setUploading(false);
    }
  };
  */

  /* [OLD] handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bootcamps').insert({
        ...formData,
        status: 'active'
      });
      if (error) throw error;
      alert('등록되었습니다!');
      setView('list');
      fetchBootcamps();
    } catch (err) {
      alert('등록 실패');
    } finally {
      setSubmitting(false);
    }
  };
  */

  const filteredList = bootcamps.filter(item => {
    const regionMatch = selectedRegion === '전국' || item.region === selectedRegion;
    const genreMatch = selectedGenre === '전체' || (item.genre || '').includes(selectedGenre);
    const searchMatch = !searchTerm || 
      item.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return regionMatch && genreMatch && searchMatch;
  });

  const isFiltering = selectedGenre !== '전체' || selectedRegion !== '전국' || searchTerm.trim() !== '';

  /* [OLD] StatCard
  const StatCard = ({ label, value, icon }) => (
    <div style={{
      flex: 1, padding: '15px 10px', borderRadius: '16px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden'
    }}>
      {icon && <div style={{ position: 'absolute', top: 5, right: 8 }}>{icon}</div>}
      <div style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFF' }}>{value}</div>
    </div>
  );
  */

  const StatCard = ({ label, value, icon }) => (
    <div style={{
      flex: 1, padding: '15px 8px', borderRadius: '16px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      {icon && <div style={{ position: 'absolute', top: 5, right: 8 }}>{icon}</div>}
      <div style={{ fontSize: '9px', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px', textAlign: 'center' }}>{label}</div>
      <div style={{ fontSize: '12px', fontWeight: 900, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.3 }}>{value || '-'}</div>
    </div>
  );

  /* [OLD] return block — replaced with InstructorSection-style layout below
  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#fff' }}>
      
      { Header }
      <div style={{ padding: '30px 25px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={24} color="#FFF" /></button>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#FFF', margin: 0 }}>
            BOOTCAMP <span style={{ color: '#C9A84C' }}>MASTERS</span>
          </h2>
        </div>
        <button
          onClick={() => setView(view === 'register' ? 'list' : 'register')}
          style={{
            padding: '8px 14px', borderRadius: '12px', background: 'rgba(201,168,76,0.15)',
            border: '1px solid #C9A84C', color: '#C9A84C', fontSize: '12px', fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          {view === 'register' ? '취소' : '💎 캠프 등록'}
        </button>
      </div>

      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      {view === 'list' ? (
        <>
          { Filters }
          <div style={{ 
            position: 'sticky', top: 0, zIndex: 100, 
            background: 'rgba(13, 13, 13, 0.95)', backdropFilter: 'blur(20px)', 
            padding: '15px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{ position: 'relative' }}>
              <SearchIcon size={16} color="#475569" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="캠프명 또는 강사명 검색"
                style={{ 
                  width: '100%', padding: '12px 15px 12px 42px', borderRadius: '16px', 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {REGIONS.map(r => (
                <button key={r} onClick={() => setSelectedRegion(r)} style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', background: selectedRegion === r ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)', color: selectedRegion === r ? '#C9A84C' : '#8E8E93', fontSize: '13px', fontWeight: 800, border: `1px solid ${selectedRegion === r ? '#C9A84C' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer' }}>{r}</button>
              ))}
            </div>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {GENRES.map(g => (
                <button key={g} onClick={() => setSelectedGenre(g)} style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', background: selectedGenre === g ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)', color: selectedGenre === g ? '#C9A84C' : '#8E8E93', fontSize: '13px', fontWeight: 800, border: `1px solid ${selectedGenre === g ? '#C9A84C' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer' }}>{g}</button>
              ))}
            </div>
          </div>

          { List Content }
          <div style={{ padding: '20px 25px 100px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {filteredList.slice(0, visibleCount).map((item) => (
                <motion.div 
                  key={item.id}
                  onClick={() => setSelectedBootcamp(item)}
                  whileTap={{ scale: 0.98 }}
                  style={{ position: 'relative', height: '220px', borderRadius: '24px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <img src={item.poster_url || 'https://via.placeholder.com/300'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)' }} />
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 4 }}>
                    <div style={{ background: 'rgba(201,168,76,0.9)', color: '#000', padding: '3px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 900 }}>{item.genre}</div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 15, left: 15, right: 15 }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#C9A84C', marginBottom: '2px' }}>{item.instructor}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize: '10px', color: '#8E8E93', marginTop: '4px' }}>{item.start_date?.slice(5)} ~ {item.region}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            {filteredList.length > visibleCount && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button onClick={() => setVisibleCount(v => v + 20)} style={{ padding: '12px 28px', borderRadius: '16px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.1)', color: '#C9A84C', fontWeight: 800 }}>더 보기</button>
              </div>
            )}
          </div>
        </>
      ) : (
        { Register View }
        <div style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', marginBottom: '30px' }}>캠프 등록 (준비 중)</h2>
          <p style={{ color: '#8E8E93' }}>디자인 개편으로 인해 등록 폼은 추후 업데이트 예정입니다.</p>
          <button onClick={() => setView('list')} style={{ marginTop: '20px', padding: '15px 30px', borderRadius: '15px', background: '#C9A84C', color: '#000', fontWeight: 800, border: 'none' }}>목록으로</button>
        </div>
      )}

      { Detail Modal }
      <AnimatePresence>
        {selectedBootcamp && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ position: 'fixed', inset: 0, zIndex: 5000, background: '#0D0D0D', overflowY: 'auto' }}>
            <div style={{ position: 'relative', height: '450px' }}>
              <img src={selectedBootcamp.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, #0D0D0D)' }} />
              <div style={{ position: 'absolute', top: '50px', left: '25px', right: '25px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setSelectedBootcamp(null)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={22} /></button>
                <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={20} /></button>
              </div>
              <div style={{ position: 'absolute', bottom: '30px', left: '25px', right: '25px' }}>
                <div style={{ color: '#C9A84C', fontSize: '14px', fontWeight: 900, marginBottom: '8px' }}>{selectedBootcamp.instructor} · {selectedBootcamp.genre}</div>
                <h1 style={{ fontSize: '32px', fontWeight: 950, color: '#FFF', margin: 0 }}>{selectedBootcamp.title}</h1>
              </div>
            </div>

            <div style={{ padding: '0 25px 150px' }}>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <StatCard label="DATE" value={selectedBootcamp.start_date} icon={<Calendar size={12} color="#C9A84C" />} />
                <StatCard label="VENUE" value={selectedBootcamp.region} icon={<MapPin size={12} color="#C9A84C" />} />
                <StatCard label="FEE" value={selectedBootcamp.price_info} icon={<Zap size={12} color="#C9A84C" />} />
              </div>

              <div style={{ marginTop: '40px', padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '15px' }}>Description</h3>
                <p style={{ fontSize: '15px', color: '#A1A1AA', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedBootcamp.description}</p>
              </div>

              <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                {selectedBootcamp.instagram && <button onClick={() => window.open(selectedBootcamp.instagram, '_blank')} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(201,168,76,0.1)', border: '1px solid #C9A84C', color: '#C9A84C', fontWeight: 900 }}>INSTAGRAM</button>}
                {selectedBootcamp.youtube && <button onClick={() => window.open(selectedBootcamp.youtube, '_blank')} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(201,168,76,0.1)', border: '1px solid #C9A84C', color: '#C9A84C', fontWeight: 900 }}>YOUTUBE</button>}
              </div>

              <button 
                onClick={() => setShowBookingGuide(true)}
                style={{ width: '100%', marginTop: '20px', padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, #C9A84C, #A68A3D)', color: '#000', fontWeight: 1000, fontSize: '18px', border: 'none' }}
              >
                지금 예약하기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      { Booking Guide Modal }
      <AnimatePresence>
        {showBookingGuide && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
            <div style={{ width: '100%', maxWidth: '400px', background: '#1A1A1A', borderRadius: '32px', padding: '40px 30px', textAlign: 'center', border: '1px solid #C9A84C' }}>
              <Zap size={40} color="#C9A84C" style={{ marginBottom: '20px' }} />
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '15px' }}>예약 안내</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '25px' }}>입금 시 성함 뒤에 <span style={{ color: '#C9A84C', fontWeight: 900 }}>'밤빠'</span>를 꼭 적어주세요!</p>
              <div style={{ background: '#000', padding: '20px', borderRadius: '20px', marginBottom: '20px', textAlign: 'left' }}>
                <p style={{ fontSize: '11px', color: '#475569', fontWeight: 900, marginBottom: '8px' }}>ACCOUNT INFO</p>
                <p style={{ fontSize: '16px', color: '#fff', fontWeight: 800, margin: 0 }}>{selectedBootcamp?.bank_info}</p>
              </div>
              <button onClick={() => setShowBookingGuide(false)} style={{ width: '100%', padding: '18px', borderRadius: '16px', background: '#C9A84C', color: '#000', fontWeight: 900, border: 'none' }}>확인했습니다</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
  */

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#FFFFFF' }}>

      {/* Header */}
      <div style={{ padding: '30px 25px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </button>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
            BOOTCAMP <span style={{ color: '#C9A84C' }}>MASTERS</span>
          </h2>
        </div>
        <button
          onClick={() => setView(view === 'register' ? 'list' : 'register')}
          style={{
            padding: '8px 14px', borderRadius: '12px', background: 'rgba(201,168,76,0.15)',
            border: '1px solid #C9A84C', color: '#C9A84C', fontSize: '12px', fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          {view === 'register' ? '취소' : '💎 캠프 등록'}
        </button>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 1200px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 12px;
        }
        @keyframes spin-border {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning-border-wrap {
          position: relative;
          border-radius: 28px;
          padding: 2px;
          overflow: hidden;
        }
        .spinning-border-wrap::before {
          content: '';
          position: absolute;
          inset: -100%;
          background: conic-gradient(from 0deg, transparent 0%, transparent 60%, #C9A84C 72%, #FFF3C4 80%, #C9A84C 88%, transparent 100%);
          animation: spin-border 2.4s linear infinite;
        }
        .spinning-border-inner {
          position: relative;
          z-index: 1;
          border-radius: 26px;
          overflow: hidden;
          height: 100%;
        }
      `}</style>

      {/* Sticky Filter Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13, 13, 13, 0.95)', backdropFilter: 'blur(20px)',
        padding: '15px 25px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        <div style={{ position: 'relative' }}>
          <SearchIcon size={16} color="#8E8E93" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setVisibleCount(20); }}
            placeholder="캠프명 또는 강사명 검색"
            style={{
              width: '100%', padding: '12px 15px 12px 42px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#FFFFFF', fontSize: '14px', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {REGIONS.map(r => (
            <button
              key={r}
              onClick={() => { setSelectedRegion(r); setVisibleCount(20); }}
              style={{
                padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap',
                background: selectedRegion === r ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                color: selectedRegion === r ? '#C9A84C' : '#8E8E93',
                fontSize: '13px', fontWeight: selectedRegion === r ? 800 : 600,
                border: `1px solid ${selectedRegion === r ? '#C9A84C' : 'rgba(255,255,255,0.05)'}`,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >{r}</button>
          ))}
        </div>
        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => { setSelectedGenre(g); setVisibleCount(20); }}
              style={{
                padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap',
                background: selectedGenre === g ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                color: selectedGenre === g ? '#C9A84C' : '#8E8E93',
                fontSize: '13px', fontWeight: selectedGenre === g ? 800 : 600,
                border: `1px solid ${selectedGenre === g ? '#C9A84C' : 'rgba(255,255,255,0.05)'}`,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >{g}</button>
          ))}
        </div>
      </div>

      {/* TOP BOOTCAMPS Skeleton */}
      {loading && !isFiltering && (
        <div style={{ padding: '10px 25px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div className="skeleton" style={{ width: 140, height: 14 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div className="skeleton" style={{ gridColumn: 'span 2', height: '240px', borderRadius: '28px' }} />
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '24px' }} />
            ))}
          </div>
        </div>
      )}

      {/* TOP BOOTCAMPS Showcase */}
      {!loading && bootcamps.length > 0 && !isFiltering && (
        <div style={{ padding: '10px 25px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 900, color: '#C9A84C', letterSpacing: '2px', margin: 0 }}>TOP BOOTCAMPS</h3>
            <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)', marginLeft: 'auto' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {bootcamps[0] && (
              <motion.div
                onClick={() => setSelectedBootcamp(bootcamps[0])}
                whileTap={{ scale: 0.98 }}
                className="spinning-border-wrap"
                style={{ gridColumn: 'span 2', height: '244px', cursor: 'pointer' }}
              >
                <div className="spinning-border-inner" style={{ position: 'relative', height: '240px' }}>
                  <img src={bootcamps[0].poster_url || 'https://via.placeholder.com/500'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} alt={bootcamps[0].instructor} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', top: 15, left: 15, background: 'rgba(201,168,76,0.9)', color: '#000', padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 900 }}>NEXT BOOTCAMP</div>
                  <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                    <div style={{ fontSize: '24px', fontWeight: 950, color: '#FFF', marginBottom: '4px' }}>{bootcamps[0].instructor}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600 }}>{bootcamps[0].genre}</div>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#C9A84C', fontWeight: 800 }}>
                        <Calendar size={12} /> {bootcamps[0].start_date?.slice(0, 10)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {bootcamps.slice(1, 5).map((item, idx) => (
              <motion.div
                key={item.id}
                onClick={() => setSelectedBootcamp(item)}
                whileTap={{ scale: 0.96 }}
                style={{ position: 'relative', height: '180px', borderRadius: '24px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <img src={item.poster_url || 'https://via.placeholder.com/300'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} alt={item.instructor} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: '#FFF', padding: '4px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>
                    #{idx + 2}
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 15, left: 15, right: 15 }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFF', marginBottom: '2px' }}>{item.instructor}</div>
                  <div style={{ fontSize: '10px', color: '#C9A84C', fontWeight: 700 }}>{item.genre} · {item.start_date?.slice(0, 10)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Explore All */}
      <div style={{ padding: '0 25px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: isFiltering ? '#C9A84C' : '#475569', letterSpacing: '1px', margin: 0 }}>
            {isFiltering ? `검색 결과 (${filteredList.length}개)` : 'EXPLORE ALL BOOTCAMPS'}
          </h3>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {loading ? (
          <div>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px', borderRadius: '22px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '16px', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 16, width: '60%' }} />
                  <div className="skeleton" style={{ height: 12, width: '40%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div className="skeleton" style={{ height: 14, width: 36 }} />
                  <div className="skeleton" style={{ height: 10, width: 28 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8E8E93' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏕️</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>등록된 부트캠프가 없습니다</div>
          </div>
        ) : (
          <>
            {(isFiltering
              ? filteredList
              : filteredList.filter(i => !bootcamps.slice(0, 5).find(top => top.id === i.id))
            ).slice(0, visibleCount).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedBootcamp(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                  padding: '16px 20px', borderRadius: '22px',
                  background: 'rgba(255,255,255,0.03)',
                  marginBottom: '10px', border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: 60, height: 60, borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                  {item.poster_url
                    ? <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} alt={item.instructor} />
                    : <div style={{ fontSize: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>🏕️</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.instructor}</div>
                  <div style={{ fontSize: 12, color: '#8E8E93', fontWeight: 600 }}>{item.genre} · {item.venue || item.region}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#C9A84C' }}>{item.start_date?.slice(5, 10)}</div>
                  <div style={{ fontSize: 9, color: '#475569', fontWeight: 700 }}>DATE</div>
                </div>
              </motion.div>
            ))}
            {(() => {
              const list = isFiltering
                ? filteredList
                : filteredList.filter(i => !bootcamps.slice(0, 5).find(top => top.id === i.id));
              return list.length > visibleCount ? (
                <div style={{ textAlign: 'center', marginTop: '25px' }}>
                  <button
                    onClick={() => setVisibleCount(v => v + 20)}
                    style={{ padding: '12px 28px', borderRadius: '16px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.1)', color: '#C9A84C', fontSize: '13px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    더 보기 ({visibleCount} / {list.length})
                  </button>
                </div>
              ) : null;
            })()}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedBootcamp && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: '#000', display: 'flex', justifyContent: 'center' }}
          >
            <div style={{ width: '100%', maxWidth: '500px', height: '100%', background: '#0D0D0D', color: '#fff', overflowY: 'auto', position: 'relative', boxShadow: '0 0 100px rgba(0,0,0,0.8)' }}>

              {/* Hero Image */}
              <div style={{ position: 'relative', height: '480px', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: selectedBootcamp.poster_url ? `url(${selectedBootcamp.poster_url}) center top / cover` : '#1A1A1A',
                  filter: 'brightness(0.7)'
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, #0D0D0D 100%)' }} />

                {/* Top Nav */}
                <div style={{ position: 'absolute', top: '50px', left: '25px', right: '25px', display: 'flex', justifyContent: 'space-between', zIndex: 20 }}>
                  <button
                    onClick={() => window.history.back()}
                    style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  ><ChevronLeft size={22} /></button>
                  <button
                    style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  ><Share2 size={20} /></button>
                </div>

                {/* Identity overlay at bottom of hero */}
                <div style={{ position: 'absolute', bottom: '30px', left: '25px', right: '25px' }}>
                  <div style={{ color: '#C9A84C', fontSize: '14px', fontWeight: 900, marginBottom: '6px' }}>{selectedBootcamp.genre}</div>
                  <h1 style={{ fontSize: '34px', fontWeight: 950, color: '#FFF', margin: 0, letterSpacing: '-1px', textTransform: 'uppercase' }}>{selectedBootcamp.instructor}</h1>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '0 25px', marginTop: '-10px', position: 'relative', zIndex: 40 }}>

                {selectedBootcamp.title && (
                  <div style={{ fontSize: '17px', fontWeight: 700, color: '#A1A1AA', marginBottom: '20px', marginTop: '10px' }}>{selectedBootcamp.title}</div>
                )}

                {/* Stat Grid */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <StatCard label="START" value={selectedBootcamp.start_date?.slice(0, 10)} icon={<Calendar size={12} color="#C9A84C" />} />
                  <StatCard label="END" value={selectedBootcamp.end_date?.slice(0, 10)} icon={<Calendar size={12} color="#C9A84C" />} />
                  <StatCard label="VENUE" value={selectedBootcamp.venue || selectedBootcamp.region} icon={<MapPin size={12} color="#C9A84C" />} />
                  <StatCard label="FEE" value={selectedBootcamp.fee || selectedBootcamp.price_info} icon={<Zap size={12} color="#C9A84C" />} />
                </div>

                {/* Description */}
                {selectedBootcamp.description && (
                  <div style={{ marginTop: '30px', padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 12px 0' }}>Description</h3>
                    <p style={{ fontSize: '15px', color: '#A1A1AA', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{selectedBootcamp.description}</p>
                  </div>
                )}

                {/* Instagram / YouTube — shown only when values exist */}
                {(selectedBootcamp.instagram || selectedBootcamp.youtube) && (
                  <div style={{
                    marginTop: '20px', padding: '18px', borderRadius: '20px',
                    background: 'linear-gradient(145deg, rgba(24,24,24,0.7) 0%, rgba(12,12,12,0.9) 100%)',
                    border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#C9A84C', letterSpacing: '0.5px', marginBottom: '14px' }}>✨ CONNECT</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {selectedBootcamp.instagram && (
                        <button
                          onClick={() => window.open(selectedBootcamp.instagram, '_blank')}
                          style={{
                            flex: 1, padding: '14px 8px', borderRadius: '14px',
                            border: '1px solid rgba(201,168,76,0.4)',
                            background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)',
                            color: '#E5C266', fontSize: '13px', fontWeight: 900, cursor: 'pointer', textAlign: 'center'
                          }}
                        >📸 INSTAGRAM</button>
                      )}
                      {selectedBootcamp.youtube && (
                        <button
                          onClick={() => window.open(selectedBootcamp.youtube, '_blank')}
                          style={{
                            flex: 1, padding: '14px 8px', borderRadius: '14px',
                            border: '1px solid rgba(255,0,0,0.3)',
                            background: 'linear-gradient(135deg, rgba(255,0,0,0.1) 0%, rgba(255,0,0,0.05) 100%)',
                            color: '#FF4444', fontSize: '13px', fontWeight: 900, cursor: 'pointer', textAlign: 'center'
                          }}
                        >▶ YOUTUBE</button>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking Button */}
                <button
                  onClick={() => setShowBookingGuide(true)}
                  style={{ width: '100%', marginTop: '20px', marginBottom: '60px', padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, #C9A84C, #A68A3D)', color: '#000', fontWeight: 1000, fontSize: '18px', border: 'none', cursor: 'pointer' }}
                >
                  지금 예약하기
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Guide Modal */}
      <AnimatePresence>
        {showBookingGuide && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}
          >
            <div style={{ width: '100%', maxWidth: '400px', background: '#1A1A1A', borderRadius: '32px', padding: '40px 30px', textAlign: 'center', border: '1px solid #C9A84C' }}>
              <Zap size={40} color="#C9A84C" style={{ marginBottom: '20px' }} />
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '15px' }}>예약 안내</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '25px' }}>
                입금 시 성함 뒤에 <span style={{ color: '#C9A84C', fontWeight: 900 }}>'밤빠'</span>를 꼭 적어주세요!
              </p>
              <div style={{ background: '#000', padding: '20px', borderRadius: '20px', marginBottom: '20px', textAlign: 'left' }}>
                <p style={{ fontSize: '11px', color: '#475569', fontWeight: 900, marginBottom: '8px' }}>ACCOUNT INFO</p>
                <p style={{ fontSize: '16px', color: '#fff', fontWeight: 800, margin: 0 }}>{selectedBootcamp?.bank_info}</p>
              </div>
              <button
                onClick={() => setShowBookingGuide(false)}
                style={{ width: '100%', padding: '18px', borderRadius: '16px', background: '#C9A84C', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer' }}
              >확인했습니다</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Bootcamp;
