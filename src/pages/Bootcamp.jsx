import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Search, Plus, X, Calendar, MapPin, 
  Image as ImageIcon, Loader2, Zap, Search as SearchIcon, 
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

  const filteredList = bootcamps.filter(item => {
    const regionMatch = selectedRegion === '전국' || item.region === selectedRegion;
    const genreMatch = selectedGenre === '전체' || (item.genre || '').includes(selectedGenre);
    const searchMatch = !searchTerm || 
      item.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return regionMatch && genreMatch && searchMatch;
  });

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

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#fff' }}>
      
      {/* Header */}
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
          {/* Filters */}
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

          {/* List Content */}
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
        /* Register View */
        <div style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', marginBottom: '30px' }}>캠프 등록 (준비 중)</h2>
          <p style={{ color: '#8E8E93' }}>디자인 개편으로 인해 등록 폼은 추후 업데이트 예정입니다.</p>
          <button onClick={() => setView('list')} style={{ marginTop: '20px', padding: '15px 30px', borderRadius: '15px', background: '#C9A84C', color: '#000', fontWeight: 800, border: 'none' }}>목록으로</button>
        </div>
      )}

      {/* Detail Modal */}
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

      {/* Booking Guide Modal */}
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
};

export default Bootcamp;
