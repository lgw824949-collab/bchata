import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Plus, X, Search, Filter, Calendar, MapPin, 
  Users, CreditCard, Home, Image as ImageIcon, CheckCircle, AlertCircle,
  Loader2, Tent, Award
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
  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  
  // Registration form state
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    genre: '바차타',
    level: '입문',
    start_date: '',
    end_date: '',
    venue: '',
    region: '서울',
    fee: '',
    accommodation_included: false,
    description: '',
    poster_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBootcamps();
  }, []);

  const fetchBootcamps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bootcamps')
        .select('*')
        .neq('status', 'pending') // Only show non-pending bootcamps in list
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

      alert('등록 신청이 완료되었습니다. 관리자 승인 후 노출됩니다.');
      setView('list');
      // Reset form
      setFormData({
        title: '',
        instructor: '',
        genre: '바차타',
        level: '입문',
        start_date: '',
        end_date: '',
        venue: '',
        region: '서울',
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
    <div style={{ width: '100%', minHeight: '100vh', background: '#F8FAFC', position: 'relative' }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 100,
        background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
        padding: 'env(safe-area-inset-top) 20px 15px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={24} color="#1E293B" />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', margin: 0 }}>🏕️ 부트캠프</h1>
        </div>
        <button 
          onClick={() => setView('register')}
          style={{ 
            background: '#FF1744', color: '#fff', border: 'none', 
            borderRadius: '12px', padding: '8px 16px', fontSize: '14px', fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
          }}
        >
          <Plus size={18} /> 등록
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {view === 'list' ? (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
                <button 
                  onClick={() => setFilterGenre('')}
                  style={{ 
                    flexShrink: 0, padding: '8px 16px', borderRadius: '10px',
                    background: filterGenre === '' ? '#1E293B' : '#FFFFFF',
                    color: filterGenre === '' ? '#FFFFFF' : '#64748B',
                    fontSize: '13px', fontWeight: 700, border: '1px solid #E2E8F0'
                  }}
                >
                  전체 장르
                </button>
                {GENRES.map(g => (
                  <button 
                    key={g}
                    onClick={() => setFilterGenre(g)}
                    style={{ 
                      flexShrink: 0, padding: '8px 16px', borderRadius: '10px',
                      background: filterGenre === g ? '#1E293B' : '#FFFFFF',
                      color: filterGenre === g ? '#FFFFFF' : '#64748B',
                      fontSize: '13px', fontWeight: 700, border: '1px solid #E2E8F0'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
                <button 
                  onClick={() => setFilterLevel('')}
                  style={{ 
                    flexShrink: 0, padding: '8px 16px', borderRadius: '10px',
                    background: filterLevel === '' ? '#FF1744' : '#FFFFFF',
                    color: filterLevel === '' ? '#FFFFFF' : '#64748B',
                    fontSize: '13px', fontWeight: 700, border: '1px solid #E2E8F0'
                  }}
                >
                  전체 레벨
                </button>
                {LEVELS.map(l => (
                  <button 
                    key={l}
                    onClick={() => setFilterLevel(l)}
                    style={{ 
                      flexShrink: 0, padding: '8px 16px', borderRadius: '10px',
                      background: filterLevel === l ? '#FF1744' : '#FFFFFF',
                      color: filterLevel === l ? '#FFFFFF' : '#64748B',
                      fontSize: '13px', fontWeight: 700, border: '1px solid #E2E8F0'
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
                <Loader2 size={32} color="#FF1744" className="animate-spin" />
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8' }}>
                <Tent size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontWeight: 700 }}>등록된 부트캠프가 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {filteredList.map(item => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                      background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ position: 'relative', height: '200px', background: '#F1F5F9' }}>
                      {item.poster_url ? (
                        <img src={item.poster_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                          <ImageIcon size={48} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: '#fff', padding: '4px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: 800 }}>
                        {item.genre}
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', margin: 0 }}>{item.title}</h3>
                          <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Award size={14} color="#FF1744" /> {item.instructor}
                          </p>
                        </div>
                        <div style={{ background: '#FEF2F2', color: '#FF1744', fontSize: '12px', fontWeight: 900, padding: '4px 10px', borderRadius: '8px' }}>
                          {item.level}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', padding: '15px', background: '#F8FAFC', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={14} color="#64748B" />
                          <span style={{ fontSize: '12px', color: '#1E293B', fontWeight: 700 }}>{item.start_date} ~ {item.end_date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} color="#64748B" />
                          <span style={{ fontSize: '12px', color: '#1E293B', fontWeight: 700 }}>{item.region}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CreditCard size={14} color="#64748B" />
                          <span style={{ fontSize: '12px', color: '#FF1744', fontWeight: 800 }}>{item.fee}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Home size={14} color="#64748B" />
                          <span style={{ fontSize: '12px', color: '#1E293B', fontWeight: 700 }}>{item.accommodation_included ? '숙박포함' : '숙박미포함'}</span>
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B', margin: 0 }}>캠프 등록 신청</h2>
              <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>캠프 제목 (16자 이내)</label>
                <input 
                  required
                  maxLength={16}
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="캠프 이름을 입력하세요"
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>강사명</label>
                  <input 
                    required
                    value={formData.instructor}
                    onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                    placeholder="대표 강사"
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>참가비</label>
                  <input 
                    required
                    value={formData.fee}
                    onChange={e => setFormData(prev => ({ ...prev, fee: e.target.value }))}
                    placeholder="예: 250,000원"
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>장르</label>
                  <select 
                    value={formData.genre}
                    onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px' }}
                  >
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>권장 레벨</label>
                  <select 
                    value={formData.level}
                    onChange={e => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px' }}
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>시작일</label>
                  <input 
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>종료일</label>
                  <input 
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>장소 (주소)</label>
                <input 
                  required
                  value={formData.venue}
                  onChange={e => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="정확한 장소명을 입력하세요"
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>지역</label>
                  <select 
                    value={formData.region}
                    onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px' }}
                  >
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>숙박 포함</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, accommodation_included: true }))}
                      style={{ 
                        flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0',
                        background: formData.accommodation_included ? '#FF1744' : '#F8FAFC',
                        color: formData.accommodation_included ? '#fff' : '#64748B',
                        fontWeight: 700, fontSize: '13px'
                      }}
                    >
                      포함
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, accommodation_included: false }))}
                      style={{ 
                        flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0',
                        background: !formData.accommodation_included ? '#1E293B' : '#F8FAFC',
                        color: !formData.accommodation_included ? '#fff' : '#64748B',
                        fontWeight: 700, fontSize: '13px'
                      }}
                    >
                      미포함
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>포스터 이미지</label>
                <div style={{ 
                  width: '100%', height: '120px', borderRadius: '14px', border: '2px dashed #E2E8F0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: '#F8FAFC', cursor: 'pointer', overflow: 'hidden', position: 'relative'
                }}>
                  {formData.poster_url ? (
                    <img src={formData.poster_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      {uploading ? <Loader2 className="animate-spin" /> : <ImageIcon color="#94A3B8" />}
                      <span style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>{uploading ? '업로드 중...' : '이미지 선택'}</span>
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
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>상세 내용</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="일정, 프로그램 등 상세 내용을 입력하세요"
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px', minHeight: '120px', resize: 'none' }}
                />
              </div>

              <button 
                type="submit"
                disabled={submitting || uploading}
                style={{ 
                  width: '100%', padding: '20px', borderRadius: '16px', background: '#FF1744',
                  color: '#fff', fontSize: '18px', fontWeight: 900, border: 'none',
                  boxShadow: '0 8px 25px rgba(255, 23, 68, 0.3)', cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                {submitting ? '신청 처리 중...' : '캠프 등록 신청하기'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Bootcamp;
