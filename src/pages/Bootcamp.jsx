import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Plus, X, Search, Filter, Calendar, MapPin, 
  Users, CreditCard, Home, Image as ImageIcon, CheckCircle, AlertCircle,
  Loader2, Tent, Award, Globe, Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const GENRES = ['바차타', '살사', '키좀바', '쥬크'];
const LEVELS = ['입문', '초급', '중급', '상급'];
const REGIONS = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];

const Bootcamp = ({ onBack }) => {
  const { t } = useTranslation();
  const [view, setView] = useState('list'); // 'list' | 'register'
  const [activeTab, setActiveTab] = useState('domestic'); // 'domestic' | 'overseas'
  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  
  // Registration form state
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
    country: '', // for overseas
    fee: '',
    accommodation_included: false,
    description: '',
    poster_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        .eq('type', activeTab)
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
      const filePath = `posters/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posters')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, poster_url: publicUrl }));
    } catch (err) {
      console.error('Upload error:', err);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.length > 16) {
      alert('제목은 16자 이내여야 합니다.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('bootcamps')
        .insert([{
          ...formData,
          status: 'pending'
        }]);

      if (error) throw error;

      alert('등록되었습니다. 승인 후 노출됩니다');
      setView('list');
      // Reset form
      setFormData({
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
        poster_url: ''
      });
    } catch (err) {
      console.error('Submit error:', err);
      alert('등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = bootcamps.filter(b => {
    if (filterGenre && b.genre !== filterGenre) return false;
    if (filterLevel && b.level !== filterLevel) return false;
    return true;
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#0a0a0a', position: 'relative', color: '#fff' }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: 'calc(20px + env(safe-area-inset-top)) 20px 15px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={24} color="#fff" />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>PREMIUM BOOTCAMP</h1>
        </div>
        <button 
          onClick={() => setView('register')}
          style={{ 
            background: '#7C3AED', color: '#fff', border: 'none', 
            borderRadius: '12px', padding: '8px 16px', fontSize: '14px', fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
          }}
        >
          <Plus size={18} /> 등록
        </button>
      </div>

      <div style={{ padding: '0 20px 40px' }}>
        {view === 'list' ? (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '25px', padding: '4px', background: '#1a1a1a', borderRadius: '14px' }}>
              <button 
                onClick={() => setActiveTab('domestic')}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                  background: activeTab === 'domestic' ? '#7C3AED' : 'transparent',
                  color: activeTab === 'domestic' ? '#fff' : '#666',
                  fontWeight: 800, fontSize: '14px', transition: 'all 0.3s'
                }}
              >
                국내
              </button>
              <button 
                onClick={() => setActiveTab('overseas')}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                  background: activeTab === 'overseas' ? '#7C3AED' : 'transparent',
                  color: activeTab === 'overseas' ? '#fff' : '#666',
                  fontWeight: 800, fontSize: '14px', transition: 'all 0.3s'
                }}
              >
                국외
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                <button 
                  onClick={() => setFilterGenre('')}
                  style={{ 
                    flexShrink: 0, padding: '8px 16px', borderRadius: '50px',
                    background: filterGenre === '' ? '#7C3AED' : '#1a1a1a',
                    color: filterGenre === '' ? '#fff' : '#999',
                    fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  전체 장르
                </button>
                {GENRES.map(g => (
                  <button 
                    key={g}
                    onClick={() => setFilterGenre(g)}
                    style={{ 
                      flexShrink: 0, padding: '8px 16px', borderRadius: '50px',
                      background: filterGenre === g ? '#7C3AED' : '#1a1a1a',
                      color: filterGenre === g ? '#fff' : '#999',
                      fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                <button 
                  onClick={() => setFilterLevel('')}
                  style={{ 
                    flexShrink: 0, padding: '8px 16px', borderRadius: '50px',
                    background: filterLevel === '' ? '#7C3AED' : '#1a1a1a',
                    color: filterLevel === '' ? '#fff' : '#999',
                    fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  전체 레벨
                </button>
                {LEVELS.map(l => (
                  <button 
                    key={l}
                    onClick={() => setFilterLevel(l)}
                    style={{ 
                      flexShrink: 0, padding: '8px 16px', borderRadius: '50px',
                      background: filterLevel === l ? '#7C3AED' : '#1a1a1a',
                      color: filterLevel === l ? '#fff' : '#999',
                      fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Loader2 size={32} color="#7C3AED" className="animate-spin" />
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#666' }}>
                <Tent size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                <p style={{ fontWeight: 700, fontSize: '15px' }}>등록된 부트캠프가 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
                {filteredList.map(item => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                      background: '#111', borderRadius: '30px', overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.05)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div style={{ position: 'relative', height: '240px', background: '#1a1a1a' }}>
                      {item.poster_url ? (
                        <img src={item.poster_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                          <ImageIcon size={64} />
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '8px' }}>
                        <div style={{ 
                          background: item.type === 'domestic' ? '#39FF14' : '#7C3AED', 
                          color: item.type === 'domestic' ? '#000' : '#fff', 
                          padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                          {item.type === 'domestic' ? 'DOMESTIC' : 'OVERSEAS'}
                        </div>
                      </div>

                      <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '100px', background: 'linear-gradient(to top, #111, transparent)' }} />
                    </div>

                    <div style={{ padding: '24px', marginTop: '-20px', position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                        <div>
                          <div style={{ color: '#7C3AED', fontSize: '12px', fontWeight: 800, marginBottom: '4px', letterSpacing: '1px' }}>
                            {item.nationality ? `${item.nationality} · ` : ''}{item.genre}
                          </div>
                          <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{item.instructor}</h3>
                          <p style={{ fontSize: '14px', color: '#999', margin: '4px 0 0', fontWeight: 600 }}>{item.title}</p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px', background: '#1a1a1a', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#666', fontWeight: 800, letterSpacing: '0.5px' }}>PERIOD</span>
                          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>{item.start_date.slice(5)} - {item.end_date.slice(5)}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#666', fontWeight: 800, letterSpacing: '0.5px' }}>FEE</span>
                          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 800 }}>{item.fee}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#666', fontWeight: 800, letterSpacing: '0.5px' }}>LEVEL</span>
                          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>{item.level}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#666', fontWeight: 800, letterSpacing: '0.5px' }}>HOTEL</span>
                          <span style={{ fontSize: '13px', color: item.accommodation_included ? '#39FF14' : '#FF1744', fontWeight: 800 }}>
                            {item.accommodation_included ? 'INCLUDED' : 'NOT INCLUDED'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: '#111', borderRadius: '30px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0 }}>캠프 등록 신청</h2>
              <button onClick={() => setView('list')} style={{ background: '#1a1a1a', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={24} color="#666" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>TYPE (REQUIRED)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['domestic', 'overseas'].map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                      style={{ 
                        flex: 1, padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)',
                        background: formData.type === t ? '#7C3AED' : '#1a1a1a',
                        color: formData.type === t ? '#fff' : '#666',
                        fontWeight: 800, fontSize: '14px'
                      }}
                    >
                      {t === 'domestic' ? '국내' : '국외'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>BOOTCAMP TITLE (MAX 16)</label>
                <input 
                  required
                  maxLength={16}
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="캠프 이름을 입력하세요"
                  style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>INSTRUCTOR</label>
                  <input 
                    required
                    value={formData.instructor}
                    onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                    placeholder="대표 강사명"
                    style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>NATIONALITY</label>
                  <input 
                    value={formData.nationality}
                    onChange={e => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                    placeholder="국적/출신"
                    style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>GENRE</label>
                  <select 
                    value={formData.genre}
                    onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                    style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                  >
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>LEVEL</label>
                  <select 
                    value={formData.level}
                    onChange={e => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>START DATE</label>
                  <input 
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>END DATE</label>
                  <input 
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>VENUE / ADDRESS</label>
                <input 
                  required
                  value={formData.venue}
                  onChange={e => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="상세 장소를 입력하세요"
                  style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>
                    {formData.type === 'domestic' ? 'REGION' : 'COUNTRY NAME'}
                  </label>
                  {formData.type === 'domestic' ? (
                    <select 
                      value={formData.region}
                      onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
                      style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                    >
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <input 
                      required
                      value={formData.country}
                      onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="국가명 입력"
                      style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                    />
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>FEE</label>
                  <input 
                    required
                    value={formData.fee}
                    onChange={e => setFormData(prev => ({ ...prev, fee: e.target.value }))}
                    placeholder="예: 250,000원"
                    style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>ACCOMMODATION</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, accommodation_included: true }))}
                    style={{ 
                      flex: 1, padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)',
                      background: formData.accommodation_included ? '#39FF14' : '#1a1a1a',
                      color: formData.accommodation_included ? '#000' : '#666',
                      fontWeight: 800, fontSize: '14px'
                    }}
                  >
                    포함
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, accommodation_included: false }))}
                    style={{ 
                      flex: 1, padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)',
                      background: !formData.accommodation_included ? '#FF1744' : '#1a1a1a',
                      color: !formData.accommodation_included ? '#fff' : '#666',
                      fontWeight: 800, fontSize: '14px'
                    }}
                  >
                    미포함
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>POSTER IMAGE</label>
                <div style={{ 
                  width: '100%', height: '160px', borderRadius: '20px', border: '2px dashed rgba(255,255,255,0.1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: '#1a1a1a', cursor: 'pointer', overflow: 'hidden', position: 'relative'
                }}>
                  {formData.poster_url ? (
                    <img src={formData.poster_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      {uploading ? <Loader2 className="animate-spin" color="#7C3AED" /> : <ImageIcon color="#333" size={32} />}
                      <span style={{ fontSize: '12px', color: '#333', marginTop: '12px', fontWeight: 700 }}>{uploading ? 'UPLOADING...' : 'SELECT IMAGE'}</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>DESCRIPTION</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="일정, 프로그램 등 상세 내용을 입력하세요"
                  style={{ width: '100%', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '15px', color: '#fff', minHeight: '150px', resize: 'none' }}
                />
              </div>

              <button 
                type="submit"
                disabled={submitting || uploading}
                style={{ 
                  width: '100%', padding: '22px', borderRadius: '20px', background: '#7C3AED',
                  color: '#fff', fontSize: '18px', fontWeight: 900, border: 'none',
                  boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)', cursor: 'pointer',
                  marginTop: '15px', letterSpacing: '1px'
                }}
              >
                {submitting ? 'PROCESSING...' : 'APPLY BOOTCAMP'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Bootcamp;
