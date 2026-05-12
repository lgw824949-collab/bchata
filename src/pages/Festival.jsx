import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Plus, X, Calendar, MapPin, 
  Image as ImageIcon, Loader2, Camera, Zap, ChevronDown, ChevronUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const Festival = ({ onBack, initialView = 'list' }) => {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [showBookingGuide, setShowBookingGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegistering, setIsRegistering] = useState(initialView === 'register');
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    region: '서울',
    venue: '',
    price_info: '',
    description: '',
    poster_url: '',
    organizer: '',
    genre: '바차타',
    bank_info: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const regions = ['전체', '서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];

  useEffect(() => {
    fetchFestivals();
  }, [selectedRegion]);

  useEffect(() => {
    if (initialView === 'register') {
      setIsRegistering(true);
    }
  }, [initialView]);

  const fetchFestivals = async () => {
    setLoading(true);
    try {
      let query = supabase.from('festivals').select('*').eq('status', 'active');
      if (selectedRegion !== '전체') {
        query = query.eq('region', selectedRegion);
      }
      const { data, error } = await query.order('start_date', { ascending: true });
      if (error) throw error;
      setFestivals(data || []);
    } catch (err) {
      console.error('Error fetching festivals:', err);
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
      const filePath = `festivals/${fileName}`;
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
      const { error } = await supabase.from('festivals').insert([{ ...formData, status: 'active' }]);
      if (error) throw error;
      alert('등록되었습니다! 지금 즉시 리스트에서 확인하실 수 있습니다.');
      setIsRegistering(false);
      setCurrentStep(1);
    } catch (err) {
      console.error('festival insert error:', err);
      alert('등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingClick = async (fest) => {
    try {
      await supabase.from('festival_booking_logs').insert([{
        festival_id: fest.id,
        festival_title: fest.title
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

  const getDDay = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'D-DAY';
    return days > 0 ? `D-${days}` : `종료`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.slice(5).replace('-', '.');
  };

  return (
    <>
      <div style={{ background: '#0f172a', minHeight: '100vh', paddingBottom: '100px', color: '#f8fafc', fontFamily: "'Pretendard', sans-serif", position: 'relative' }}>
        
        {/* Background Glow */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(229, 57, 53, 0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        {/* Header */}
        {!isRegistering && (
          <div style={{ 
            position: 'sticky', top: 0, zIndex: 2000, background: 'rgba(15, 23, 42, 0.95)', 
            backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={24} color="#f8fafc" /></button>
              <h1 style={{ fontSize: '18px', fontWeight: 950, color: '#f8fafc', margin: 0, letterSpacing: '1px' }}>
                <span style={{ color: '#E53935' }}>PREMIUM</span> FESTIVAL
              </h1>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  color: '#C9A84C', 
                  border: '1px solid rgba(201,168,76,0.3)', 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontWeight: 1000, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px'
                }}
              >
                {selectedRegion} <ChevronDown size={14} color="#C9A84C" />
              </button>
              <button 
                onClick={() => setIsRegistering(true)}
                style={{ 
                  background: 'linear-gradient(135deg, #E53935, #C62828)', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontWeight: 1000, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  boxShadow: '0 8px 20px rgba(229, 57, 53, 0.3)'
                }}
              >
                <Plus size={14} strokeWidth={3} /> 등록
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {!isRegistering && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', background: '#1e293b' }}>
                  <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {regions.map(r => (
                      <button key={r} onClick={() => { setSelectedRegion(r); setShowFilters(false); }} style={{ padding: '14px 0', borderRadius: '12px', background: selectedRegion === r ? '#E53935' : 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: selectedRegion === r ? '#E53935' : 'rgba(255,255,255,0.1)', color: selectedRegion === r ? '#ffffff' : '#94a3b8', fontSize: '13px', fontWeight: 900 }}>{r}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>로딩 중..</div>
              ) : festivals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}>
                  <p style={{ fontWeight: 800, marginBottom: '20px' }}>준비 중인 일정이 없습니다.</p>
                  <button 
                    onClick={() => setIsRegistering(true)}
                    style={{
                      background: 'rgba(229, 57, 53, 0.1)',
                      color: '#E53935',
                      border: '1px solid rgba(229, 57, 53, 0.2)',
                      padding: '12px 24px',
                      borderRadius: '15px',
                      fontSize: '14px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    직접 등록하기
                  </button>
                </div>
              ) : (
                festivals.map((fest) => (
                  <motion.div 
                    key={fest.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onClick={() => setSelectedFestival(fest)}
                    style={{ width: '100%', cursor: 'pointer', background: '#1e293b', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                  >
                    <div style={{ width: '100%', position: 'relative', height: '240px', overflow: 'hidden', background: '#000' }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${fest.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.4)', transform: 'scale(1.1)' }} />
                      <img src={fest.poster_url} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', position: 'relative', zIndex: 1 }} />
                      <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(229, 57, 53, 0.95)', color: '#fff', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 950, boxShadow: '0 4px 15px rgba(229, 57, 53, 0.4)', backdropFilter: 'blur(5px)', zIndex: 2 }}>{getDDay(fest.start_date)}</div>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8) 100%)', zIndex: 2 }} />
                      <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 3 }}><h3 style={{ fontSize: '20px', fontWeight: 950, color: '#fff', margin: 0, lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{fest.title}</h3></div>
                    </div>
                    <div style={{ padding: '20px', background: '#1e293b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px', fontWeight: 800 }}><Calendar size={14} color="#C9A84C" /><span>{formatDate(fest.start_date)} - {formatDate(fest.end_date)}</span></div>
                        <div style={{ background: 'rgba(201,168,76,0.2)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.4)' }}><span style={{ fontSize: '14px', fontWeight: 1000, color: '#C9A84C' }}>₩{fest.price_info?.split('/')[0]?.replace(/[^0-9]/g, '')?.toLocaleString() || '0'}</span></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}><MapPin size={14} color="#E53935" /><span>{fest.region} {fest.venue || fest.location}</span></div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {isRegistering && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: '100%' }}
            style={{ 
              background: '#0f172a', 
              padding: '30px', 
              position: 'fixed', 
              inset: 0, 
              zIndex: 9999999, 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 950, color: '#f8fafc', margin: 0 }}>페스티벌 신청 ({currentStep}/4)</h2>
              <button onClick={() => { setIsRegistering(false); setCurrentStep(1); }} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} color="#94a3b8" /></button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= currentStep ? '#E53935' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>1. 페스티벌 이름 (최대 18자)</label><input required maxLength={18} value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="축제 이름을 입력하세요" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>2. 주최/주관</label><input required value={formData.organizer} onChange={e => setFormData(prev => ({ ...prev, organizer: e.target.value }))} placeholder="단체 또는 이름" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>3. 주요 장르</label><select value={formData.genre} onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }}><option value="바차타">바차타</option><option value="살사">살사</option><option value="키좀바">키좀바</option><option value="쥬크">쥬크</option></select></div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>4. 시작 날짜</label><input type="date" required value={formData.start_date} onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>5. 종료 날짜</label><input type="date" required value={formData.end_date} onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>6. 상세 장소/주소</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input required value={formData.venue} onChange={e => setFormData(prev => ({ ...prev, venue: e.target.value }))} placeholder="상세 장소 입력 (미정 시 우측 버튼)" style={{ flex: 1, padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, venue: '추후 공지' }))} style={{ padding: '0 20px', borderRadius: '18px', background: formData.venue === '추후 공지' ? '#F59E0B' : 'rgba(255,255,255,0.05)', color: formData.venue === '추후 공지' ? '#000' : '#94a3b8', fontSize: '13px', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>추후 공지</button>
                    </div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>7. 지역</label><select value={formData.region} onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }}>{regions.filter(r => r !== '전체').map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>8. 티켓 가격 정보</label><input required value={formData.price_info} onChange={e => setFormData(prev => ({ ...prev, price_info: e.target.value }))} placeholder="예: 풀패스 250,000 / 파티패스 50,000" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>9. 포스터 이미지</label>
                    <div style={{ width: '100%', height: '220px', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e293b', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                      {formData.poster_url ? <img src={formData.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><ImageIcon color="#F59E0B" size={40} /><span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>{uploading ? '업로드 중...' : '포스터 선택'}</span></>}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0 }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>10. 상세 설명</label><textarea rows={6} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="상세 내용 입력" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none', resize: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginBottom: '12px', letterSpacing: '1.5px' }}>11. 입금 계좌 정보 (필수)</label><input required value={formData.bank_info} onChange={e => setFormData(prev => ({ ...prev, bank_info: e.target.value }))} placeholder="예: 카카오뱅크 3333-01-1234567 홍길동" style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', fontSize: '16px', color: '#f8fafc', outline: 'none' }} /></div>
                </motion.div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingBottom: '30px' }}>
                {currentStep > 1 && <button type="button" onClick={() => setCurrentStep(s => s - 1)} style={{ flex: 1, padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)' }}>이전</button>}
                {currentStep < 4 ? <button type="button" onClick={() => setCurrentStep(s => s + 1)} style={{ flex: 2, padding: '20px', borderRadius: '18px', background: '#E53935', color: '#fff', fontWeight: 900, border: 'none' }}>다음 단계</button> : <button type="submit" disabled={submitting} style={{ flex: 2, padding: '24px', borderRadius: '20px', background: 'linear-gradient(135deg, #E53935, #C62828)', color: '#fff', fontWeight: 1000, fontSize: '18px', border: 'none' }}>{submitting ? '등록 중...' : '신청 완료'}</button>}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFestival && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: '#0f172a', zIndex: 9999999, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', color: '#f8fafc' }}>
              <X size={32} onClick={() => setSelectedFestival(null)} style={{ cursor: 'pointer' }} />
              <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>FESTIVAL DETAIL</span>
              <div style={{ width: '32px' }}></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ position: 'relative', background: '#000', minHeight: '300px', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedFestival.poster_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(0.3)', transform: 'scale(1.2)' }} />
                <img src={selectedFestival.poster_url} style={{ width: '100%', height: 'auto', display: 'block', position: 'relative', zIndex: 1 }} />
              </div>
              <div style={{ padding: '30px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 950, marginBottom: '8px', color: '#f8fafc' }}>{selectedFestival.title}</h2>
                <div style={{ color: '#C9A84C', fontSize: '14px', fontWeight: 900, marginBottom: '25px' }}>{selectedFestival.organizer} · {selectedFestival.genre}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                  {[
                    { label: '기간', value: `${selectedFestival.start_date} - ${selectedFestival.end_date}`, icon: <Calendar size={18} color="#C9A84C" /> },
                    { label: '장소', value: selectedFestival.venue || selectedFestival.location, icon: <MapPin size={18} color="#E53935" /> },
                    { label: '장르', value: selectedFestival.genre, icon: <Zap size={18} color="#C9A84C" /> },
                    { label: '지역', value: selectedFestival.region, icon: <ImageIcon size={18} color="#7C3AED" /> }
                  ].map((cell, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 900, marginBottom: '6px' }}>{cell.icon} {cell.label}</div>
                      <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 800 }}>{cell.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', padding: '24px', borderRadius: '24px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(229, 57, 53, 0.4)' }}>
                  <div><p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 800, marginBottom: '4px', letterSpacing: '1px' }}>티켓 가격</p><h3 style={{ fontSize: '20px', fontWeight: 950, color: '#fff' }}>{selectedFestival.price_info}</h3></div>
                  <button onClick={() => handleBookingClick(selectedFestival)} style={{ background: '#fff', border: 'none', padding: '14px 24px', borderRadius: '16px', color: '#E53935', fontWeight: 1000, fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>예매하기</button>
                </div>
                {selectedFestival.description && (<div style={{ padding: '24px', background: '#1e293b', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}><p style={{ color: '#f8fafc', lineHeight: 1.8, fontSize: '16px', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedFestival.description}</p></div>)}
              </div>
            </div>
            <AnimatePresence>
              {showBookingGuide && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: 'absolute', inset: 0, zIndex: 11000000, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
                  <div style={{ width: '100%', background: '#1e293b', borderRadius: '32px', padding: '40px 30px', textAlign: 'center', border: '1px solid rgba(201,168,76,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ width: '70px', height: '70px', background: 'rgba(201,168,76,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Zap size={32} color="#C9A84C" fill="#C9A84C" /></div>
                    <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#fff', marginBottom: '15px' }}>잠깐! 확인해 주세요</h3>
                    <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '30px' }}>입금 시 입금자명 뒤에 <br /><span style={{ color: '#C9A84C', fontWeight: 900 }}>'밤빠'</span>를 꼭 기재해 주세요!<br />(예: 홍길동 밤빠)</p>
                    <div onClick={() => copyToClipboard(selectedFestival.bank_info || '3333149146368')} style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '24px', marginBottom: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}><p style={{ fontSize: '11px', color: '#64748b', fontWeight: 900, letterSpacing: '1.5px' }}>RESERVATION INFO</p><span style={{ fontSize: '10px', color: '#C9A84C', fontWeight: 900 }}>{copied ? '복사 완료!' : '클릭하여 복사'}</span></div>
                      <p style={{ fontSize: '18px', color: '#fff', fontWeight: 850, lineHeight: 1.5, margin: 0 }}>{selectedFestival.bank_info || '카카오 3333-14-9146368\n이상규'}</p>
                      {copied && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }} />}
                    </div>
                    <p style={{ fontSize: '13px', color: '#C9A84C', fontWeight: 800, marginBottom: '25px', letterSpacing: '-0.2px' }}>✨ 복사하기로 송금할 수 있습니다</p>
                    <button onClick={() => setShowBookingGuide(false)} style={{ width: '100%', padding: '22px', borderRadius: '20px', background: '#C9A84C', color: '#000', fontWeight: 1000, fontSize: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(201, 168, 76, 0.3)' }}>확인했습니다</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Festival;
