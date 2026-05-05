import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Plus, X, Calendar, MapPin, 
  CreditCard, Image as ImageIcon, 
  Loader2, Tent, Globe, Award, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const GENRES = ['바차타', '살사', '키좀바', '쥬크'];
const LEVELS = ['입문', '초급', '중급', '상급'];
const REGIONS = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];

const Bootcamp = ({ onBack }) => {
  const { t } = useTranslation();
  const [view, setView] = useState('list'); 
  const [activeTab, setActiveTab] = useState('domestic'); 
  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  
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
      alert('등록 실패');
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
    <div style={{ width: '100%', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'Pretendard', sans-serif" }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10, 10, 10, 0.8)', 
        backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: 'calc(20px + env(safe-area-inset-top)) 20px 15px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={24} color="#fff" /></button>
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '1px' }}>PREMIUM BOOTCAMP</h1>
        </div>
        <button onClick={() => setView('register')} style={{ background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '12px', padding: '8px 16px', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)' }}><Plus size={18} /> 등록</button>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {view === 'list' ? (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '25px', padding: '5px', background: '#1a1a1a', borderRadius: '16px' }}>
              <button onClick={() => setActiveTab('domestic')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'domestic' ? '#F59E0B' : 'transparent', color: activeTab === 'domestic' ? '#fff' : '#666', fontWeight: 800, fontSize: '14px', transition: 'all 0.3s' }}>국내</button>
              <button onClick={() => setActiveTab('overseas')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'overseas' ? '#F59E0B' : 'transparent', color: activeTab === 'overseas' ? '#fff' : '#666', fontWeight: 800, fontSize: '14px', transition: 'all 0.3s' }}>국외</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
                <button onClick={() => setFilterGenre('')} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '50px', background: filterGenre === '' ? '#F59E0B' : '#1a1a1a', color: filterGenre === '' ? '#fff' : '#999', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)' }}>전체 장르</button>
                {GENRES.map(g => <button key={g} onClick={() => setFilterGenre(g)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '50px', background: filterGenre === g ? '#F59E0B' : '#1a1a1a', color: filterGenre === g ? '#fff' : '#999', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)' }}>{g}</button>)}
              </div>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
                <button onClick={() => setFilterLevel('')} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '50px', background: filterLevel === '' ? '#F59E0B' : '#1a1a1a', color: filterLevel === '' ? '#fff' : '#999', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)' }}>전체 레벨</button>
                {LEVELS.map(l => <button key={l} onClick={() => setFilterLevel(l)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '50px', background: filterLevel === l ? '#F59E0B' : '#1a1a1a', color: filterLevel === l ? '#fff' : '#999', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)' }}>{l}</button>)}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><Loader2 size={40} color="#F59E0B" className="animate-spin" /></div>
            ) : filteredList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', color: '#666' }}><Tent size={60} style={{ marginBottom: '20px', opacity: 0.1 }} /><p style={{ fontWeight: 800, fontSize: '16px' }}>등록된 부트캠프가 없습니다.</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                {filteredList.map(item => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#111', borderRadius: '32px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                    <div style={{ position: 'relative', height: '260px', background: '#1a1a1a' }}>
                      {item.poster_url ? <img src={item.poster_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#222' }}><ImageIcon size={64} /></div>}
                      <div style={{ position: 'absolute', top: '24px', left: '24px' }}><div style={{ background: item.type === 'domestic' ? '#39FF14' : '#F59E0B', color: item.type === 'domestic' ? '#000' : '#fff', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 900, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>{item.type === 'domestic' ? 'DOMESTIC' : 'OVERSEAS'}</div></div>
                      <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '120px', background: 'linear-gradient(to top, #111, transparent)' }} />
                    </div>
                    <div style={{ padding: '28px', marginTop: '-30px', position: 'relative', zIndex: 1 }}>
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ color: '#F59E0B', fontSize: '13px', fontWeight: 900, marginBottom: '6px', letterSpacing: '1px' }}>{item.nationality ? `${item.nationality} · ` : ''}{item.genre}</div>
                        <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{item.instructor}</h3>
                        <p style={{ fontSize: '15px', color: '#888', margin: '6px 0 0', fontWeight: 600 }}>{item.title}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ fontSize: '11px', color: '#555', fontWeight: 900, letterSpacing: '0.5px' }}>PERIOD</span><span style={{ fontSize: '14px', color: '#fff', fontWeight: 700 }}>{item.start_date.slice(5)} ~ {item.end_date.slice(5)}</span></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ fontSize: '11px', color: '#555', fontWeight: 900, letterSpacing: '0.5px' }}>FEE</span><span style={{ fontSize: '14px', color: '#fff', fontWeight: 900 }}>{item.fee}</span></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ fontSize: '11px', color: '#555', fontWeight: 900, letterSpacing: '0.5px' }}>LEVEL</span><span style={{ fontSize: '14px', color: '#fff', fontWeight: 700 }}>{item.level}</span></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ fontSize: '11px', color: '#555', fontWeight: 900, letterSpacing: '0.5px' }}>HOTEL</span><span style={{ fontSize: '14px', color: item.accommodation_included ? '#39FF14' : '#FF1744', fontWeight: 900 }}>{item.accommodation_included ? 'INCLUDED' : 'NOT INCLUDED'}</span></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#111', borderRadius: '32px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0 }}>캠프 등록 신청</h2>
              <button onClick={() => setView('list')} style={{ background: '#1a1a1a', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={24} color="#666" /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>1. TYPE (REQUIRED)</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['domestic', 'overseas'].map(t => <button key={t} type="button" onClick={() => setFormData(prev => ({ ...prev, type: t }))} style={{ flex: 1, padding: '18px', borderRadius: '16px', border: 'none', background: formData.type === t ? '#F59E0B' : '#1a1a1a', color: formData.type === t ? '#fff' : '#666', fontWeight: 900, fontSize: '15px' }}>{t === 'domestic' ? '국내' : '국외'}</button>)}
                </div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>2. BOOTCAMP TITLE (MAX 16)</label><input required maxLength={16} value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="캠프 이름을 입력하세요" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>3. INSTRUCTOR</label><input required value={formData.instructor} onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))} placeholder="대표 강사명" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>4. NATIONALITY</label><input value={formData.nationality} onChange={e => setFormData(prev => ({ ...prev, nationality: e.target.value }))} placeholder="국적/출신" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>5. GENRE</label><select value={formData.genre} onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }}>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>6. LEVEL</label><select value={formData.level} onChange={e => setFormData(prev => ({ ...prev, level: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>7. START DATE</label><input type="date" required value={formData.start_date} onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>END DATE</label><input type="date" required value={formData.end_date} onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>8. VENUE / ADDRESS</label><input required value={formData.venue} onChange={e => setFormData(prev => ({ ...prev, venue: e.target.value }))} placeholder="상세 장소를 입력하세요" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>9. {formData.type === 'domestic' ? 'REGION' : 'COUNTRY NAME'}</label>{formData.type === 'domestic' ? <select value={formData.region} onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }}>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select> : <input required value={formData.country} onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))} placeholder="국가명 입력" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }} />}</div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>10. FEE</label><input required value={formData.fee} onChange={e => setFormData(prev => ({ ...prev, fee: e.target.value }))} placeholder="예: 250,000원" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff' }} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>11. ACCOMMODATION</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, accommodation_included: true }))} style={{ flex: 1, padding: '18px', borderRadius: '16px', border: 'none', background: formData.accommodation_included ? '#39FF14' : '#1a1a1a', color: formData.accommodation_included ? '#000' : '#666', fontWeight: 900, fontSize: '15px' }}>포함</button>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, accommodation_included: false }))} style={{ flex: 1, padding: '18px', borderRadius: '16px', border: 'none', background: !formData.accommodation_included ? '#FF1744' : '#1a1a1a', color: !formData.accommodation_included ? '#fff' : '#666', fontWeight: 900, fontSize: '15px' }}>미포함</button>
                </div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>12. POSTER IMAGE</label>
                <div style={{ width: '100%', height: '180px', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                  {formData.poster_url ? <img src={formData.poster_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <> {uploading ? <Loader2 className="animate-spin" color="#F59E0B" /> : <ImageIcon color="#222" size={40} />} <span style={{ fontSize: '13px', color: '#333', marginTop: '15px', fontWeight: 900 }}>{uploading ? 'UPLOADING...' : 'SELECT POSTER IMAGE'}</span> </>}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: '#555', marginBottom: '12px', letterSpacing: '1px' }}>13. DESCRIPTION</label><textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="상세 내용을 입력하세요" style={{ width: '100%', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', background: '#1a1a1a', fontSize: '16px', color: '#fff', minHeight: '180px', resize: 'none' }} /></div>
              <button type="submit" disabled={submitting || uploading} style={{ width: '100%', padding: '24px', borderRadius: '24px', background: '#F59E0B', color: '#fff', fontSize: '18px', fontWeight: 1000, border: 'none', boxShadow: '0 15px 40px rgba(124, 58, 237, 0.4)', cursor: 'pointer', marginTop: '20px' }}>{submitting ? 'PROCESSING...' : 'APPLY BOOTCAMP'}</button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Bootcamp;
