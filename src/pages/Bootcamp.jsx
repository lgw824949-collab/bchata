import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Plus, X, Calendar, MapPin, 
  CreditCard, Image as ImageIcon, 
  Loader2, Tent, Globe, Award, CheckCircle, Download, Home, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const GENRES = ['바차타', '살사', '키좀바', '쥬크'];
const LEVELS = ['입문', '초급', '중급', '상급'];
const REGIONS = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];

const Bootcamp = ({ onBack, initialView = 'list' }) => {
  const { t } = useTranslation();
  const [view, setView] = useState(initialView); 
  const [activeTab, setActiveTab] = useState('국내'); 
  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('전체');
  const [selectedLevel, setSelectedLevel] = useState('전체');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [selectedBootcamp, setSelectedBootcamp] = useState(null);
  const [showBookingGuide, setShowBookingGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'domestic',
    title: '',
    instructor: '',
    nationality: '',
    genre: '바차타',
    level: '입문',
    start_date: '',
    end_date: '',
    venue: '',
    region: '서울',
    country: '', 
    fee: '',
    accommodation_included: false,
    description: '',
    poster_url: '',
    bank_info: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    fetchBootcamps();
  }, [activeTab]);

  const fetchBootcamps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bootcamps')
        .select('*')
        .eq('status', 'active')
        .in('type', activeTab === '국내' ? ['국내', 'domestic'] : ['국외', 'overseas'])
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      setBootcamps(data || []);
    } catch (err) {
      console.error('Error fetching bootcamps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.length > 16) return alert('제목은 16자 이내여야 합니다.');
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bootcamps').insert([{ ...formData, status: 'pending' }]);
      if (error) throw error;
      alert('등록되었습니다. 승인 후 노출됩니다');
      setView('list');
    } catch (err) {
      console.error('bootcamp insert error:', err);
      alert('등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingClick = async (item) => {
    try {
      // 1. Log the click for business data
      await supabase.from('bootcamp_booking_logs').insert([{
        bootcamp_id: item.id,
        bootcamp_title: item.title
      }]);
      
      // 2. Show the guide overlay
      setShowBookingGuide(true);
    } catch (err) {
      console.error('Booking log error:', err);
      setShowBookingGuide(true); // Still show guide even if logging fails
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredList = bootcamps.filter(b => {
    const typeMatch = activeTab === '국내' ? ['국내','domestic'].includes(b.type) : ['국외','overseas'].includes(b.type)
    if (!typeMatch) return false;
    
    if (selectedGenre !== '전체' && b.genre !== selectedGenre) return false;
    if (selectedLevel !== '전체' && b.level !== selectedLevel) return false;
    if (activeTab === '국내' && selectedRegion !== '전체' && b.region !== selectedRegion) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchInstructor = b.instructor?.toLowerCase().includes(term);
      const matchTitle = b.title?.toLowerCase().includes(term);
      if (!matchInstructor && !matchTitle) return false;
    }

    return true;
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: "'Pretendard', sans-serif", paddingBottom: '80px', position: 'relative' }}>
      
      {/* Background Glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15 }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Header */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 2000, background: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={24} color="#f8fafc" /></button>
          <h1 style={{ fontSize: '18px', fontWeight: 950, color: '#f8fafc', margin: 0, letterSpacing: '1px' }}>
            <span style={{ color: '#F59E0B' }}>PREMIUM</span> BOOTCAMP
          </h1>
        </div>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {view === 'list' ? (
          <>
            {/* Search Bar */}
            <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <ImageIcon size={18} color="#64748b" style={{ position: 'absolute', left: '16px' }} />
                <input 
                  type="text"
                  placeholder="강사명 또는 캠프 제목 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px 14px 44px', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            {/* Region Filter Chips (Domestic Only) */}
            {activeTab === '국내' && (
              <div style={{ marginTop: '15px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none', position: 'relative', zIndex: 1 }}>
                {['전체', ...REGIONS].map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(r)}
                    style={{
                      flexShrink: 0,
                      padding: '8px 16px',
                      borderRadius: '12px',
                      background: selectedRegion === r ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: selectedRegion === r ? '#F59E0B' : '#94a3b8',
                      border: `1px solid ${selectedRegion === r ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`,
                      fontSize: '12px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* 국내/국외 탭 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', marginBottom: '15px', position: 'relative', zIndex: 1 }}>
              <div style={{ flex: 1, display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => setActiveTab('국내')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: activeTab === '국내' ? '#7C3AED' : 'transparent', color: activeTab === '국내' ? 'white' : '#94a3b8', fontSize: '13px', fontWeight: 900 }}>국내</button>
                <button onClick={() => setActiveTab('국외')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: activeTab === '국외' ? '#7C3AED' : 'transparent', color: activeTab === '국외' ? 'white' : '#94a3b8', fontSize: '13px', fontWeight: 900 }}>국외</button>
              </div>

              <button 
                onClick={() => setIsGridView(!isGridView)}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '10px 16px', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isGridView ? '카드형' : '전체보기'}
              </button>

              <button 
                onClick={() => setShowFilter(!showFilter)}
                style={{ background: showFilter ? '#7C3AED' : 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                필터 {showFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showFilter && (
              <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1px' }}>장르</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {['전체', '바차타', '살사', '키좀바', '쥬크'].map(g => (
                    <button 
                      key={g}
                      onClick={() => setSelectedGenre(g)}
                      style={{ background: selectedGenre === g ? '#7C3AED' : 'rgba(255,255,255,0.05)', color: selectedGenre === g ? 'white' : '#94a3b8', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 900 }}>
                      {g}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1px' }}>레벨</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['전체', '입문', '초급', '중급', '상급'].map(l => (
                    <button 
                      key={l}
                      onClick={() => setSelectedLevel(l)}
                      style={{ background: selectedLevel === l ? '#7C3AED' : 'rgba(255,255,255,0.05)', color: selectedLevel === l ? 'white' : '#94a3b8', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 900 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><Loader2 size={40} color="#F59E0B" className="animate-spin" /></div>
            ) : filteredList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}><Tent size={60} style={{ marginBottom: '20px', opacity: 0.1 }} /><p style={{ fontWeight: 800, fontSize: '16px' }}>등록된 부트캠프가 없습니다.</p></div>
            ) : isGridView ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', position: 'relative', zIndex: 1 }}>
                {filteredList.map(item => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelectedBootcamp(item)}
                    style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', background: '#1e293b' }}
                  >
                    <div style={{ aspectRatio: '2/3', background: '#000' }}>
                      {item.poster_url ? <img src={item.poster_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><ImageIcon size={24} /></div>}
                    </div>
                    <div style={{ padding: '8px', background: '#1e293b' }}>
                      <div style={{ fontSize: '11px', fontWeight: 950, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.instructor}</div>
                      <div style={{ fontSize: '9px', color: '#F59E0B', fontWeight: 800 }}>{item.genre}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', position: 'relative', zIndex: 1 }}>
                {filteredList.map(item => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    onClick={() => setSelectedBootcamp(item)}
                    style={{ 
                      background: '#1e293b', 
                      borderRadius: '24px', 
                      overflow: 'hidden', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ position: 'relative', height: '240px', background: '#000', overflow: 'hidden' }}>
                      <div style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        backgroundImage: `url(${item.poster_url})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center', 
                        filter: 'blur(20px) brightness(0.4)',
                        transform: 'scale(1.1)' 
                      }} />
                      
                      {item.poster_url ? (
                        <img src={item.poster_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', position: 'relative', zIndex: 1 }}>
                          <ImageIcon size={48} strokeWidth={1} />
                        </div>
                      )}
                      
                      <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 2, display: 'flex', gap: '8px' }}>
                        <div style={{ background: '#7C3AED', color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 950 }}>{item.type === 'domestic' ? '국내' : '국외'}</div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.8)', color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 950, backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)' }}>{item.genre}</div>
                      </div>
                    </div>

                    <div style={{ padding: '20px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ color: '#F59E0B', fontSize: '12px', fontWeight: 900, marginBottom: '6px', letterSpacing: '0.5px' }}>
                          {item.nationality ? `${item.nationality} · ` : ''}{item.genre}
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#f8fafc', margin: '0 0 4px' }}>{item.instructor}</h3>
                        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, fontWeight: 700 }}>{item.title}</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {[
                          { label: '일정', value: `${item.start_date.slice(5)} - ${item.end_date.slice(5)}`, icon: <Calendar size={12} color="#F59E0B" /> },
                          { label: '참가비', value: item.fee ? (parseInt(item.fee.toString().replace(/[^0-9]/g, ''))?.toLocaleString() || item.fee) : '0', icon: <CreditCard size={12} color="#7C3AED" />, isPrice: true },
                          { label: '레벨', value: item.level, icon: <Award size={12} color="#F59E0B" /> },
                          { label: '장소', value: item.venue || item.region, icon: <MapPin size={12} color="#E53935" /> }
                        ].map((cell, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', fontWeight: 900, marginBottom: '4px' }}>
                              {cell.icon} {cell.label}
                            </div>
                            <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 800 }}>
                              {cell.isPrice && cell.value !== '0' ? `₩${cell.value}` : cell.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#0f172a', padding: '30px', position: 'relative', z_index: 3000, minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 950, color: '#f8fafc', margin: 0 }}>부트캠프 신청 ({currentStep}/4)</h2>
              <button onClick={() => { setView('list'); setCurrentStep(1); }} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} color="#94a3b8" /></button>
            </div>

            {/* Step Progress Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= currentStep ? '#7C3AED' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>1. 캠프 유형</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['domestic', 'overseas'].map(t => <button key={t} type="button" onClick={() => setFormData(prev => ({ ...prev, type: t }))} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: formData.type === t ? '#7C3AED' : '#1e293b', color: formData.type === t ? '#fff' : '#94a3b8', fontWeight: 950, border: '1px solid rgba(255,255,255,0.05)' }}>{t === 'domestic' ? '국내' : '국외'}</button>)}
                    </div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>2. 캠프 이름 (최대 16자)</label><input required maxLength={16} value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="캠프 이름을 입력하세요" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>3. 대표 강사</label><input required value={formData.instructor} onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))} placeholder="강사명" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>4. 국적/출신</label><input value={formData.nationality} onChange={e => setFormData(prev => ({ ...prev, nationality: e.target.value }))} placeholder="예: 스페인" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>5. 장르</label><select value={formData.genre} onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }}>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>6. 레벨</label><select value={formData.level} onChange={e => setFormData(prev => ({ ...prev, level: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>7. 시작 날짜</label><input type="date" required value={formData.start_date} onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>종료 날짜</label><input type="date" required value={formData.end_date} onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>8. 상세 장소/주소</label><input required value={formData.venue} onChange={e => setFormData(prev => ({ ...prev, venue: e.target.value }))} placeholder="상세 장소를 입력하세요" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>9. {formData.type === 'domestic' ? '지역' : '국가명'}</label>{formData.type === 'domestic' ? <select value={formData.region} onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }}>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select> : <input required value={formData.country} onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))} placeholder="국가명 입력" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} />}</div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>10. 참가비</label><input required value={formData.fee} onChange={e => setFormData(prev => ({ ...prev, fee: e.target.value }))} placeholder="예: 250,000" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>11. 숙박 포함 여부</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, accommodation_included: true }))} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: formData.accommodation_included ? '#16a34a' : '#1e293b', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 900 }}>포함</button>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, accommodation_included: false }))} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: !formData.accommodation_included ? '#e11d48' : '#1e293b', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 900 }}>미포함</button>
                      </div>
                    </div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>12. 입금 계좌 정보 (필수)</label><input required value={formData.bank_info} onChange={e => setFormData(prev => ({ ...prev, bank_info: e.target.value }))} placeholder="예: 카카오뱅크 3333-01-1234567 홍길동" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>13. 포스터 이미지</label>
                    <div style={{ width: '100%', height: '180px', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e293b', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                      {formData.poster_url ? <img src={formData.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><ImageIcon color="#F59E0B" size={40} /><span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>{uploading ? '업로드 중...' : '포스터 선택'}</span></>}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0 }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>14. 상세 설명</label><textarea rows={6} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="소개 및 특이사항 입력" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none', resize: 'none' }} /></div>
                </motion.div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                {currentStep > 1 && (
                  <button type="button" onClick={() => setCurrentStep(s => s - 1)} style={{ flex: 1, padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)' }}>이전</button>
                )}
                
                {currentStep < 4 ? (
                  <button type="button" onClick={() => setCurrentStep(s => s + 1)} style={{ flex: 2, padding: '20px', borderRadius: '18px', background: '#7C3AED', color: '#fff', fontWeight: 900, border: 'none' }}>다음 단계</button>
                ) : (
                  <button type="submit" disabled={submitting} style={{ flex: 2, padding: '24px', borderRadius: '20px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', fontWeight: 1000, fontSize: '18px', border: 'none' }}>{submitting ? '등록 중...' : '신청 완료'}</button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </div>
      
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedBootcamp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: '#0f172a', zIndex: 6000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', color: '#f8fafc' }}>
              <X size={32} onClick={() => setSelectedBootcamp(null)} style={{ cursor: 'pointer' }} />
              <span style={{ fontSize: '16px', fontWeight: 950, letterSpacing: '1px' }}>BOOTCAMP DETAIL</span>
              <div style={{ width: '32px' }}></div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ position: 'relative', background: '#000', minHeight: '300px', display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  backgroundImage: `url(${selectedBootcamp.poster_url})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center', 
                  filter: 'blur(30px) brightness(0.3)',
                  transform: 'scale(1.2)' 
                }} />

                <img src={selectedBootcamp.poster_url} style={{ width: '100%', height: 'auto', display: 'block', position: 'relative', zIndex: 1 }} />
              </div>

              <div style={{ padding: '30px' }}>
                <div style={{ color: '#F59E0B', fontSize: '14px', fontWeight: 900, marginBottom: '8px' }}>{selectedBootcamp.genre} · {selectedBootcamp.level}</div>
                <h2 style={{ fontSize: '28px', fontWeight: 950, marginBottom: '10px', color: '#f8fafc' }}>{selectedBootcamp.instructor}</h2>
                <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '30px', fontWeight: 700 }}>{selectedBootcamp.title}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                  {[
                    { label: '기간', value: `${selectedBootcamp.start_date} - ${selectedBootcamp.end_date}`, icon: <Calendar size={18} color="#F59E0B" /> },
                    { label: '장소', value: selectedBootcamp.venue || selectedBootcamp.region, icon: <MapPin size={18} color="#E53935" /> },
                    { label: '레벨', value: selectedBootcamp.level, icon: <Award size={18} color="#F59E0B" /> },
                    { label: '숙박', value: selectedBootcamp.accommodation_included ? '포함' : '미포함', icon: <Tent size={18} color="#7C3AED" /> }
                  ].map((cell, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 900, marginBottom: '6px' }}>
                        {cell.icon} {cell.label}
                      </div>
                      <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 800 }}>{cell.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ 
                  background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', 
                  padding: '24px', 
                  borderRadius: '24px', 
                  marginBottom: '30px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)' 
                }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 800, marginBottom: '4px', letterSpacing: '1px' }}>참가비</p>
                    <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#fff' }}>₩{parseInt(selectedBootcamp.fee.toString().replace(/[^0-9]/g, ''))?.toLocaleString() || selectedBootcamp.fee}</h3>
                  </div>
                  <button 
                    onClick={() => handleBookingClick(selectedBootcamp)}
                    style={{ background: '#fff', border: 'none', padding: '14px 24px', borderRadius: '16px', color: '#7C3AED', fontWeight: 1000, fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                  >
                    예매하기
                  </button>
                </div>
                
                {selectedBootcamp.description && (
                  <div style={{ padding: '24px', background: '#1e293b', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#f8fafc', lineHeight: 1.8, fontSize: '16px', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedBootcamp.description}</p>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showBookingGuide && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{ 
                    position: 'absolute', inset: 0, zIndex: 7000, 
                    background: 'rgba(15, 23, 42, 0.95)', 
                    backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '30px'
                  }}
                >
                  <div style={{ width: '100%', background: '#1e293b', borderRadius: '32px', padding: '40px 30px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ width: '70px', height: '70px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <Zap size={32} color="#F59E0B" fill="#F59E0B" />
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#fff', marginBottom: '15px' }}>잠깐! 확인해 주세요</h3>
                    <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '30px' }}>
                      입금 시 입금자명 뒤에 <br />
                      <span style={{ color: '#F59E0B', fontWeight: 900 }}>'밤빠'</span>를 꼭 기재해 주세요!<br />
                      (예: 홍길동 밤빠)
                    </p>
                    
                    <div 
                      onClick={() => copyToClipboard(selectedBootcamp.bank_info)}
                      style={{ 
                        background: 'rgba(0,0,0,0.4)', 
                        padding: '24px', 
                        borderRadius: '24px', 
                        marginBottom: '20px', 
                        textAlign: 'left',
                        border: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 900, letterSpacing: '1.5px' }}>RESERVATION INFO</p>
                        <span style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 900 }}>{copied ? '복사 완료!' : '클릭하여 복사'}</span>
                      </div>
                      <p style={{ fontSize: '18px', color: '#fff', fontWeight: 850, lineHeight: 1.5, margin: 0 }}>
                        {selectedBootcamp.bank_info || '계좌 정보가 없습니다.'}
                      </p>
                      {copied && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }} />}
                    </div>

                    <p style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 800, marginBottom: '25px', letterSpacing: '-0.2px' }}>
                      ✨ 복사하기로 송금할 수 있습니다
                    </p>

                    <button 
                      onClick={() => setShowBookingGuide(false)}
                      style={{ width: '100%', padding: '22px', borderRadius: '20px', background: '#F59E0B', color: '#000', fontWeight: 1000, fontSize: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)' }}
                    >
                      확인했습니다
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bootcamp;
