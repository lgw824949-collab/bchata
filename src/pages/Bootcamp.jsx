import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Plus, X, Calendar, MapPin, 
  CreditCard, Image as ImageIcon, 
  Loader2, Tent, Globe, Award, CheckCircle, Download, Home
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
  const [showFilter, setShowFilter] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState(null);
  
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
      const { data, error } = await supabase.from('bootcamps').insert([{ ...formData, status: 'pending' }]);
      if (error) { console.error('bootcamp insert error:', error); alert('등록 실패: ' + error.message); return; }
      alert('등록되었습니다. 승인 후 노출됩니다');
      setView('list');
    } catch (err) {
      alert('등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = bootcamps.filter(b => {
    const typeMatch = activeTab === '국내' ? ['국내','domestic'].includes(b.type) : ['국외','overseas'].includes(b.type)
    if (!typeMatch) return false;
    if (selectedGenre !== '전체' && b.genre !== selectedGenre) return false;
    if (selectedLevel !== '전체' && b.level !== selectedLevel) return false;
    return true;
  });

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename}_poster.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('다운로드에 실패했습니다.');
    }
  };

  const PosterModal = ({ item, onClose }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: '80px',
        background: 'rgba(0,0,0,0.98)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div style={{ position: 'absolute', top: 'calc(20px + env(safe-area-inset-top))', right: '20px', display: 'flex', gap: '10px', zIndex: 2001 }}>
        <button 
          onClick={() => handleDownload(item.poster_url, item.instructor)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
        >
          <Download size={24} color="#fff" />
        </button>
        <button 
          onClick={onClose}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
        >
          <X size={24} color="#fff" />
        </button>
      </div>
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <img 
          src={item.poster_url} 
          alt={item.title} 
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} 
        />
      </motion.div>
      
      <div style={{ position: 'absolute', bottom: '30px', left: '20px', right: '20px', textAlign: 'center' }}>
        <div style={{ color: '#F59E0B', fontSize: '12px', fontWeight: 900, marginBottom: '4px' }}>{item.genre} · {item.level}</div>
        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, margin: 0 }}>{item.instructor}</h3>
        <p style={{ color: '#999', fontSize: '14px', margin: '4px 0 0' }}>{item.title}</p>
      </div>
    </motion.div>
  );

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#ffffff', color: '#111111', fontFamily: "'Pretendard', sans-serif", paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(20px)', borderBottom: '1px solid #eeeeee',
        padding: 'calc(20px + env(safe-area-inset-top)) 20px 15px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={24} color="#111" /></button>
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '1px' }}>PREMIUM BOOTCAMP</h1>
        </div>
      </div>


      <div style={{ padding: '0 20px 100px' }}>
        {view === 'list' ? (
          <>
            {/* 국내/국외 탭 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', marginBottom: '15px' }}>
              <div style={{ flex: 1, display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                <button onClick={() => setActiveTab('국내')} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', background: activeTab === '국내' ? '#7C3AED' : 'transparent', color: activeTab === '국내' ? 'white' : '#999', fontSize: '11px', fontWeight: 600 }}>국내</button>
                <button onClick={() => setActiveTab('국외')} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', background: activeTab === '국외' ? '#7C3AED' : 'transparent', color: activeTab === '국외' ? 'white' : '#999', fontSize: '11px', fontWeight: 600 }}>국외</button>
              </div>

              {/* 그리드 토글 버튼 */}
              <button 
                onClick={() => setIsGridView(!isGridView)}
                style={{ background: isGridView ? '#F59E0B' : '#f1f5f9', color: isGridView ? 'white' : '#F59E0B', border: '1px solid #F59E0B', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {isGridView ? '카드형' : '전체보기'}
              </button>

              {/* 필터 버튼 */}
              <button 
                onClick={() => setShowFilter(!showFilter)}
                style={{ background: showFilter ? '#7C3AED' : '#f1f5f9', color: showFilter ? 'white' : '#7C3AED', border: '1px solid #7C3AED', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
              >
                필터 {showFilter ? '▲' : '▾'}
              </button>
            </div>

            {/* 필터 패널 - showFilter true일때만 표시 */}
            {showFilter && (
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #eeeeee' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#999', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>장르</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' }}>
                  {['전체', '바차타', '살사', '키좀바', '쥬크'].map(g => (
                    <button 
                      key={g}
                      onClick={() => setSelectedGenre(g)}
                      style={{ background: selectedGenre === g ? '#7C3AED' : '#f1f5f9', color: selectedGenre === g ? 'white' : '#999', border: 'none', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: selectedGenre === g ? 700 : 400 }}>
                      {g}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: '#999', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>레벨</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['전체', '입문', '초급', '중급', '상급'].map(l => (
                    <button 
                      key={l}
                      onClick={() => setSelectedLevel(l)}
                      style={{ background: selectedLevel === l ? '#7C3AED' : '#f1f5f9', color: selectedLevel === l ? 'white' : '#999', border: 'none', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: selectedLevel === l ? 700 : 400 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List / Grid View */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><Loader2 size={40} color="#F59E0B" className="animate-spin" /></div>
            ) : filteredList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', color: '#666' }}><Tent size={60} style={{ marginBottom: '20px', opacity: 0.1 }} /><p style={{ fontWeight: 800, fontSize: '16px' }}>등록된 부트캠프가 없습니다.</p></div>
            ) : isGridView ? (
              /* 3열 그리드 전체보기 모드 */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {filteredList.map(item => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelectedPoster(item)}
                    style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eeeeee', cursor: 'pointer' }}
                  >
                    <div style={{ aspectRatio: '2/3', background: '#f0f0f0' }}>
                      {item.poster_url ? <img src={item.poster_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><ImageIcon size={24} /></div>}
                    </div>
                    <div style={{ padding: '8px', background: '#fff' }}>
                      <div style={{ fontSize: '11px', fontWeight: 900, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.instructor}</div>
                      <div style={{ fontSize: '9px', color: '#7C3AED', fontWeight: 700 }}>{item.genre}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* 기존 카드 리스트 모드 */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                {filteredList.map(item => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    style={{ 
                      background: '#ffffff', 
                      borderRadius: '16px', 
                      overflow: 'hidden', 
                      border: '0.5px solid #e8e0f5', 
                      boxShadow: '0 15px 35px rgba(30, 41, 59, 0.04)',
                      transition: 'transform 0.3s ease'
                    }}
                    whileHover={{ y: -5 }}
                  >
                    <div 
                      onClick={() => setSelectedPoster(item)}
                      style={{ 
                        position: 'relative', 
                        aspectRatio: '3/4', 
                        background: '#1a0a2e', 
                        cursor: 'pointer',
                        width: '100%',
                        height: 'auto',
                        overflow: 'hidden'
                      }}
                    >
                      {item.poster_url ? (
                        <img src={item.poster_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                          <ImageIcon size={48} strokeWidth={1} />
                        </div>
                      )}
                      
                      {/* Redesigned Badges */}
                      <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 2, display: 'flex', gap: '6px' }}>
                        <div style={{ 
                          background: item.type === 'domestic' ? '#b39ddb' : 'rgba(179,157,219,0.2)', 
                          color: item.type === 'domestic' ? 'white' : '#b39ddb', 
                          padding: '3px 10px', 
                          borderRadius: '20px', 
                          fontSize: '10px', 
                          fontWeight: 900, 
                          border: item.type === 'domestic' ? 'none' : '1px solid #b39ddb'
                        }}>
                          {item.type === 'domestic' ? '국내' : '국외'}
                        </div>
                        <div style={{ 
                          background: 'rgba(255,255,255,0.15)', 
                          color: 'white', 
                          padding: '3px 10px', 
                          borderRadius: '20px', 
                          fontSize: '10px', 
                          fontWeight: 900, 
                          border: '1px solid rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(4px)'
                        }}>
                          {item.genre}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '14px', borderTop: '1px solid #e8e0f5' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ color: '#7C3AED', fontSize: '11px', fontWeight: 800, marginBottom: '3px' }}>
                          {item.nationality ? `${item.nationality} · ` : ''}{item.genre}
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a1a1a', margin: '0 0 2px' }}>{item.instructor}</h3>
                        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{item.title}</p>
                      </div>

                      {/* 2x2 Info Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '6px', 
                        marginBottom: '12px'
                      }}>
                        {[
                          { label: '기간', value: `${item.start_date.slice(5)} - ${item.end_date.slice(5)}` },
                          { label: '참가비', value: item.fee ? (parseInt(item.fee.toString().replace(/[^0-9]/g, ''))?.toLocaleString() || item.fee) : '0' },
                          { label: '레벨', value: item.level },
                          { label: '숙박', value: item.accommodation_included ? '포함' : '미포함', isSpecial: true }
                        ].map((cell, idx) => (
                          <div key={idx} style={{ background: '#f5f0ff', borderRadius: '8px', padding: '8px 10px' }}>
                            <div style={{ fontSize: '10px', color: '#7C3AED', fontWeight: 600, marginBottom: '2px' }}>{cell.label}</div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: cell.isSpecial ? (item.accommodation_included ? '#16a34a' : '#e11d48') : '#1a1a1a', 
                              fontWeight: 500 
                            }}>
                              {cell.label === '참가비' && cell.value !== '0' ? `₩${cell.value}` : cell.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Description Section */}
                      {item.description && (
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '10px 12px', 
                          background: '#f5f0ff', 
                          borderRadius: '8px', 
                          borderLeft: '3px solid #7C3AED' 
                        }}>
                          <div style={{ fontSize: '10px', color: '#7C3AED', fontWeight: 600, marginBottom: '4px' }}>📝 강사 소개</div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#111111', 
                            fontWeight: 600,
                            lineHeight: '1.7',
                            textAlign: 'justify',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#ffffff', borderRadius: '32px', padding: '30px', border: '1px solid #eeeeee', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111', margin: 0 }}>캠프 등록 신청</h2>
              <button onClick={() => setView('list')} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={24} color="#999" /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>1. TYPE (REQUIRED)</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['domestic', 'overseas'].map(t => <button key={t} type="button" onClick={() => setFormData(prev => ({ ...prev, type: t }))} style={{ flex: 1, padding: '18px', borderRadius: '16px', border: 'none', background: formData.type === t ? '#F59E0B' : '#f1f5f9', color: formData.type === t ? '#fff' : '#999', fontWeight: 900, fontSize: '15px' }}>{t === 'domestic' ? '국내' : '국외'}</button>)}
                </div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>2. BOOTCAMP TITLE (MAX 16)</label><input required maxLength={16} value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="캠프 이름을 입력하세요" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>3. INSTRUCTOR</label><input required value={formData.instructor} onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))} placeholder="대표 강사명" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>4. NATIONALITY</label><input value={formData.nationality} onChange={e => setFormData(prev => ({ ...prev, nationality: e.target.value }))} placeholder="국적/출신" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>5. GENRE</label><select value={formData.genre} onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }}>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>6. LEVEL</label><select value={formData.level} onChange={e => setFormData(prev => ({ ...prev, level: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>7. START DATE</label><input type="date" required value={formData.start_date} onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>END DATE</label><input type="date" required value={formData.end_date} onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>8. VENUE / ADDRESS</label><input required value={formData.venue} onChange={e => setFormData(prev => ({ ...prev, venue: e.target.value }))} placeholder="상세 장소를 입력하세요" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>9. {formData.type === 'domestic' ? 'REGION' : 'COUNTRY NAME'}</label>{formData.type === 'domestic' ? <select value={formData.region} onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }}>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select> : <input required value={formData.country} onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))} placeholder="국가명 입력" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }} />}</div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>10. FEE</label><input required value={formData.fee} onChange={e => setFormData(prev => ({ ...prev, fee: e.target.value }))} placeholder="예: 250,000원" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #eeeeee', background: '#ffffff', fontSize: '16px', color: '#111' }} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>11. ACCOMMODATION</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, accommodation_included: true }))} style={{ flex: 1, padding: '18px', borderRadius: '16px', border: 'none', background: formData.accommodation_included ? '#16a34a' : '#f1f5f9', color: formData.accommodation_included ? '#fff' : '#999', fontWeight: 900, fontSize: '15px' }}>포함</button>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, accommodation_included: false }))} style={{ flex: 1, padding: '18px', borderRadius: '16px', border: 'none', background: !formData.accommodation_included ? '#E11D48' : '#f1f5f9', color: !formData.accommodation_included ? '#fff' : '#999', fontWeight: 900, fontSize: '15px' }}>미포함</button>
                </div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>12. POSTER IMAGE</label>
                <div style={{ width: '100%', height: '180px', borderRadius: '24px', border: '2px dashed #eeeeee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                  {formData.poster_url ? <img src={formData.poster_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <> {uploading ? <Loader2 className="animate-spin" color="#F59E0B" /> : <ImageIcon color="#ccc" size={40} />} <span style={{ fontSize: '13px', color: '#999', marginTop: '15px', fontWeight: 900 }}>{uploading ? 'UPLOADING...' : 'SELECT POSTER IMAGE'}</span> </>}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>13. 강사 소개 / 부트캠프 설명</label>
                <textarea 
                  maxLength={200} 
                  rows={4}
                  value={formData.description} 
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="강사 소개, 커리큘럼, 특이사항 등을 입력해주세요 (최대 200자)" 
                  style={{ 
                    width: '100%', 
                    padding: '20px', 
                    borderRadius: '10px', 
                    border: '1px solid #e8e0f5', 
                    background: '#ffffff', 
                    fontSize: '16px', 
                    color: '#111', 
                    minHeight: '120px', 
                    resize: 'none' 
                  }} 
                />
              </div>
              <button type="submit" disabled={submitting || uploading} style={{ width: '100%', padding: '24px', borderRadius: '24px', background: '#F59E0B', color: '#fff', fontSize: '18px', fontWeight: 1000, border: 'none', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', cursor: 'pointer', marginTop: '20px' }}>{submitting ? 'PROCESSING...' : 'APPLY BOOTCAMP'}</button>
            </form>
          </motion.div>
        )}
      </div>
      
      {/* 포스터 상세보기 모달 */}
      <AnimatePresence>
        {selectedPoster && (
          <PosterModal 
            item={selectedPoster} 
            onClose={() => setSelectedPoster(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bootcamp;
