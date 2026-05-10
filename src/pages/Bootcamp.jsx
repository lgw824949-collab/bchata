import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Search, Plus, X, Calendar, MapPin, 
  Image as ImageIcon, Loader2, Zap, Search as SearchIcon, 
  ChevronDown, ChevronUp, Map as MapIcon, Info, Copy, Tent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const GENRES = ['전체', '바차타', '살사', '키좀바', '쥬크'];
const LEVELS = ['입문', '초급', '중급', '상급'];
const REGIONS = ['전체', '서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주', '해외'];

const Bootcamp = ({ onBack, initialView = 'list' }) => {
  const { t } = useTranslation();
  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(initialView);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedGenre, setSelectedGenre] = useState('전체');
  const [selectedLevel, setSelectedLevel] = useState('전체');
  const [activeTab, setActiveTab] = useState('국내');
  const [selectedBootcamp, setSelectedBootcamp] = useState(null);
  const [showBookingGuide, setShowBookingGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    type: 'domestic',
    region: '서울',
    country: '',
    start_date: '',
    end_date: '',
    venue: '',
    price_info: '',
    description: '',
    poster_url: '',
    bank_info: '',
    genre: '바차타',
    level: '초급'
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBootcamps();
  }, [activeTab]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bootcamps').insert([{ ...formData, status: 'pending' }]);
      if (error) throw error;
      alert('등록 신청되었습니다. 승인 후 노출됩니다.');
      setView('list');
      setCurrentStep(1);
    } catch (err) {
      console.error('Bootcamp insert error:', err);
      alert('등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingClick = async (item) => {
    try {
      await supabase.from('bootcamp_booking_logs').insert([{
        bootcamp_id: item.id,
        bootcamp_title: item.title
      }]);
      setShowBookingGuide(true);
    } catch (err) {
      console.error('Booking log error:', err);
      setShowBookingGuide(true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredList = bootcamps.filter(item => {
    const regionMatch = selectedRegion === '전체' || item.region === selectedRegion;
    const genreMatch = selectedGenre === '전체' || item.genre === selectedGenre;
    const levelMatch = selectedLevel === '전체' || item.level === selectedLevel;
    const searchMatch = !searchTerm || 
      item.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return regionMatch && genreMatch && levelMatch && searchMatch;
  });

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '0 0 100px', color: '#f8fafc', fontFamily: "'Pretendard', sans-serif", position: 'relative' }}>
      
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15 }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Header */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 2000, background: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={24} color="#f8fafc" /></button>
          <h1 style={{ fontSize: '18px', fontWeight: 950, color: '#f8fafc', margin: 0, letterSpacing: '1px' }}>
            <span style={{ color: '#F59E0B' }}>PREMIUM</span> BOOTCAMP
          </h1>
        </div>
        <button 
          onClick={() => setView(view === 'register' ? 'list' : 'register')}
          style={{ 
            background: 'linear-gradient(135deg, #F59E0B, #D97706)', 
            color: '#000', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '12px', 
            fontSize: '12px', 
            fontWeight: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
          }}
        >
          <Plus size={14} strokeWidth={3} /> {view === 'register' ? '취소' : '등록'}
        </button>
      </div>

      {view === 'list' && (
        <div style={{ 
          position: 'sticky', 
          top: '56px', 
          zIndex: 100, 
          background: 'rgba(15, 23, 42, 0.95)', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '15px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', maxWidth: '200px' }}>
              <button onClick={() => setActiveTab('국내')} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: activeTab === '국내' ? '#7C3AED' : 'transparent', color: activeTab === '국내' ? 'white' : '#64748b', fontSize: '12px', fontWeight: 900 }}>국내</button>
              <button onClick={() => setActiveTab('국외')} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: activeTab === '국외' ? '#7C3AED' : 'transparent', color: activeTab === '국외' ? 'white' : '#64748b', fontSize: '12px', fontWeight: 900 }}>국외</button>
            </div>
            
            <div style={{ position: 'relative', flex: 2 }}>
              <SearchIcon size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="강사명 또는 캠프 제목 검색"
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 38px', 
                  borderRadius: '12px', 
                  background: '#1e293b', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#f8fafc', 
                  fontSize: '14px', 
                  outline: 'none'
                }} 
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '10px 0 100px' }}>
        {view === 'list' ? (
          <>
            <div style={{ display: 'flex', gap: '10px', padding: '10px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {GENRES.map(g => (
                <button key={g} onClick={() => setSelectedGenre(g)} style={{ padding: '8px 15px', borderRadius: '10px', background: selectedGenre === g ? 'rgba(124, 58, 237, 0.2)' : 'transparent', border: '1px solid', borderColor: selectedGenre === g ? '#7C3AED' : 'rgba(255,255,255,0.1)', color: selectedGenre === g ? '#fff' : '#64748b', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>{g}</button>
              ))}
            </div>

            <div style={{ padding: '0 15px', marginTop: '20px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}><Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 20px' }} />로딩 중..</div>
              ) : filteredList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}><Tent size={60} style={{ margin: '0 auto 20px', opacity: 0.1 }} /><p style={{ fontWeight: 800 }}>등록된 부트캠프가 없습니다.</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {filteredList.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }} 
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      onClick={() => setSelectedBootcamp(item)}
                      style={{ 
                        background: '#1e293b', 
                        borderRadius: '24px', 
                        overflow: 'hidden', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                      }}
                    >
                      {/* Wide Poster Area */}
                      <div style={{ width: '100%', position: 'relative', height: '260px', overflow: 'hidden', background: '#000' }}>
                        <div style={{ 
                          position: 'absolute', 
                          inset: 0, 
                          backgroundImage: `url(${item.poster_url})`, 
                          backgroundSize: 'cover', 
                          backgroundPosition: 'center', 
                          filter: 'blur(20px) brightness(0.4)',
                          transform: 'scale(1.1)' 
                        }} />
                        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(245, 158, 11, 0.95)', color: '#000', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 1000, zIndex: 2 }}>{item.genre}</div>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(15,23,42,0.9) 100%)', zIndex: 1 }} />
                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 2 }}>
                          <div style={{ fontSize: '14px', color: '#F59E0B', fontWeight: 900, marginBottom: '4px' }}>{item.instructor}</div>
                          <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#fff', margin: 0 }}>{item.title}</h3>
                        </div>
                      </div>

                      {/* Info Area */}
                      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px', fontWeight: 800 }}>
                            <Calendar size={14} color="#F59E0B" />
                            <span>{item.start_date?.slice(5)} ~ {item.end_date?.slice(5)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px', fontWeight: 800 }}>
                            <MapPin size={14} color="#E53935" />
                            <span>{item.region} {item.venue}</span>
                          </div>
                        </div>
                        <div style={{ background: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <span style={{ fontSize: '14px', fontWeight: 1000, color: '#F59E0B' }}>자세히 보기</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#0f172a', padding: '30px', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 950, color: '#f8fafc', margin: 0 }}>캠프 등록 신청 ({currentStep}/4)</h2>
              <button onClick={() => { setView('list'); setCurrentStep(1); }} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} color="#94a3b8" /></button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= currentStep ? '#F59E0B' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>1. 부트캠프 제목</label><input required value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="예: 바차타 인텐시브 코스" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>2. 강사명</label><input required value={formData.instructor} onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))} placeholder="예: K-Dancer & Jay" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>3. 장르</label><select value={formData.genre} onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }}><option value="바차타">바차타</option><option value="살사">살사</option><option value="키좀바">키좀바</option><option value="쥬크">쥬크</option></select></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>4. 레벨</label><select value={formData.level} onChange={e => setFormData(prev => ({ ...prev, level: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }}><option value="입문">입문</option><option value="초급">초급</option><option value="중급">중급</option><option value="상급">상급</option></select></div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>5. 시작 날짜</label><input type="date" required value={formData.start_date} onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>6. 종료 날짜</label><input type="date" required value={formData.end_date} onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>7. 상세 장소</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input required value={formData.venue} onChange={e => setFormData(prev => ({ ...prev, venue: e.target.value }))} placeholder="상세 장소 (미정 시 우측 버튼)" style={{ flex: 1, padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, venue: '추후 공지' }))} style={{ padding: '0 20px', borderRadius: '18px', background: formData.venue === '추후 공지' ? '#F59E0B' : 'rgba(255,255,255,0.05)', color: formData.venue === '추후 공지' ? '#000' : '#94a3b8', fontSize: '13px', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>추후 공지</button>
                    </div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>8. 지역</label><select value={formData.region} onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }}>{REGIONS.filter(r => r !== '전체').map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>9. 가격 정보</label><input required value={formData.price_info} onChange={e => setFormData(prev => ({ ...prev, price_info: e.target.value }))} placeholder="예: 얼리버드 15만원 / 현장구매 18만원" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>10. 포스터 이미지</label>
                    <div style={{ width: '100%', height: '220px', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e293b', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                      {formData.poster_url ? <img src={formData.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><ImageIcon color="#F59E0B" size={40} /><span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>{uploading ? '업로드 중...' : '포스터 선택'}</span></>}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0 }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>11. 상세 설명</label><textarea rows={6} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="워크샵 상세 커리큘럼 등 입력" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none', resize: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>12. 입금 계좌 정보</label><input required value={formData.bank_info} onChange={e => setFormData(prev => ({ ...prev, bank_info: e.target.value }))} placeholder="예: 카카오뱅크 3333-01-1234567 홍길동" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                </motion.div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingBottom: '30px' }}>
                {currentStep > 1 && <button type="button" onClick={() => setCurrentStep(s => s - 1)} style={{ flex: 1, padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)' }}>이전</button>}
                {currentStep < 4 ? <button type="button" onClick={() => setCurrentStep(s => s + 1)} style={{ flex: 2, padding: '20px', borderRadius: '18px', background: '#F59E0B', color: '#000', fontWeight: 900, border: 'none' }}>다음 단계</button> : <button type="submit" disabled={submitting} style={{ flex: 2, padding: '24px', borderRadius: '20px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', fontWeight: 1000, fontSize: '18px', border: 'none' }}>{submitting ? '등록 중...' : '신청 완료'}</button>}
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
              <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>BOOTCAMP DETAIL</span>
              <div style={{ width: '32px' }}></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ position: 'relative', background: '#000', minHeight: '300px', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedBootcamp.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(0.3)', transform: 'scale(1.2)' }} />
                <img src={selectedBootcamp.poster_url} style={{ width: '100%', height: 'auto', display: 'block', position: 'relative', zIndex: 1 }} />
              </div>
              <div style={{ padding: '30px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 950, marginBottom: '8px', color: '#f8fafc' }}>{selectedBootcamp.title}</h2>
                <div style={{ color: '#F59E0B', fontSize: '14px', fontWeight: 900, marginBottom: '25px' }}>{selectedBootcamp.instructor} · {selectedBootcamp.genre} · {selectedBootcamp.level}</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                  {[
                    { label: '일정', value: `${selectedBootcamp.start_date} ~ ${selectedBootcamp.end_date}`, icon: <Calendar size={18} color="#F59E0B" /> },
                    { label: '장소', value: selectedBootcamp.venue, icon: <MapPin size={18} color="#E53935" /> },
                    { label: '장르', value: selectedBootcamp.genre, icon: <Zap size={18} color="#F59E0B" /> },
                    { label: '레벨', value: selectedBootcamp.level, icon: <Info size={18} color="#7C3AED" /> }
                  ].map((cell, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 900, marginBottom: '6px' }}>{cell.icon} {cell.label}</div>
                      <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 800 }}>{cell.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', padding: '24px', borderRadius: '24px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(0,0,0,0.6)', fontWeight: 800, marginBottom: '4px', letterSpacing: '1px' }}>참가 비용</p>
                    <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#000' }}>{selectedBootcamp.price_info}</h3>
                  </div>
                  <button onClick={() => handleBookingClick(selectedBootcamp)} style={{ background: '#000', border: 'none', padding: '14px 24px', borderRadius: '16px', color: '#F59E0B', fontWeight: 1000, fontSize: '16px', cursor: 'pointer' }}>예매하기</button>
                </div>

                <div style={{ padding: '24px', background: '#1e293b', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ color: '#f8fafc', lineHeight: 1.8, fontSize: '16px', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedBootcamp.description}</p>
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {showBookingGuide && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: 'absolute', inset: 0, zIndex: 7000, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
                  <div style={{ width: '100%', background: '#1e293b', borderRadius: '32px', padding: '40px 30px', textAlign: 'center', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ width: '70px', height: '70px', background: 'rgba(245,158,11,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Zap size={32} color="#F59E0B" fill="#F59E0B" /></div>
                    <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#fff', marginBottom: '15px' }}>잠깐! 확인해 주세요</h3>
                    <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '30px' }}>입금 시 입금자명 뒤에 <br /><span style={{ color: '#F59E0B', fontWeight: 900 }}>'밤빠'</span>를 꼭 기재해 주세요!<br />(예: 홍길동 밤빠)</p>
                    <div onClick={() => copyToClipboard(selectedBootcamp.bank_info)} style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '24px', marginBottom: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}><p style={{ fontSize: '11px', color: '#64748b', fontWeight: 900, letterSpacing: '1.5px' }}>RESERVATION INFO</p><span style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 900 }}>{copied ? '복사 완료!' : '클릭하여 복사'}</span></div>
                      <p style={{ fontSize: '18px', color: '#fff', fontWeight: 850, lineHeight: 1.5, margin: 0 }}>{selectedBootcamp.bank_info}</p>
                      {copied && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }} />}
                    </div>
                    <button onClick={() => setShowBookingGuide(false)} style={{ width: '100%', padding: '22px', borderRadius: '20px', background: '#F59E0B', color: '#000', fontWeight: 1000, fontSize: '16px', border: 'none', cursor: 'pointer' }}>확인했습니다</button>
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
