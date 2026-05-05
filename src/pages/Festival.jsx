import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Calendar, Plus, X, Upload, Check, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Festival = ({ onBack }) => {
  const [view, setView] = useState('list'); // 'list', 'all', 'register'
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('전체');
  const [selectedRegion, setSelectedRegion] = useState('전체');

  const [registerForm, setRegisterForm] = useState({
    title: '', genre: '바차타', start_date: '', end_date: '',
    location: '', region: '서울', price: '', organizer: '', description: ''
  });
  const [file, setFile] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const genres = ['전체', '바차타', '살사', '키좀바', '쥬크'];
  const regions_list = ['전체', '서울', '경기', '강원/제주', '충청', '전라', '경상'];

  useEffect(() => {
    fetchFestivals();
  }, [filter, selectedRegion, view]);

  const fetchFestivals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('festivals')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true });

      if (filter !== '전체') {
        query = query.eq('genre', filter);
      }
      
      if (selectedRegion !== '전체') {
        if (selectedRegion === '강원/제주') {
          query = query.in('region', ['강원', '제주']);
        } else {
          query = query.eq('region', selectedRegion);
        }
      }

      if (view === 'list') query = query.limit(3);

      const { data, error } = await query;
      if (error) throw error;
      setFestivals(data || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      let poster_url = '';
      if (file) {
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('posters').upload(`festivals/${fileName}`, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('posters').getPublicUrl(`festivals/${fileName}`);
        poster_url = data.publicUrl;
      }

      const { error } = await supabase.from('festivals').insert([{
        ...registerForm,
        poster_url,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setView('list'); }, 2000);
    } catch (err) {
      alert('등록 중 오류 발생: ' + err.message);
    } finally {
      setRegistering(false);
    }
  };

  const getDDay = (startDate) => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = start - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'D-Day';
    return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
  };

  const renderCard = (fest) => (
    <motion.div
      key={fest.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#FFF',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
        border: '1px solid #F1F5F9',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '16px'
      }}
    >
      <div style={{ 
        height: '180px', 
        background: fest.poster_url ? `url(${fest.poster_url}) center/cover` : '#1A1A1A',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '16px', left: '16px', background: '#F97316', color: '#FFF', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>
          {getDDay(fest.start_date)}
        </div>
        <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', color: '#FFF', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}>
          {fest.genre}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 900 }}>{fest.title}</h3>
        </div>
      </div>
      
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>
            <MapPin size={16} color="#F97316" /> <span>{fest.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>
            <Calendar size={16} /> <span>{fest.start_date} ~ {fest.end_date}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#F97316' }}>₩{fest.price?.toLocaleString()}</div>
          <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>1일권</div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ background: '#FFF', minHeight: '100vh', padding: '20px 20px 100px', color: '#1E293B', fontFamily: "'Pretendard', sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#F97316', letterSpacing: '1px' }}>LATIN DANCE</span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0, color: '#000' }}>FESTIVAL</h1>
        </div>
        {view === 'list' && (
          <button onClick={() => setView('register')} style={{ background: '#F97316', color: '#FFF', border: 'none', padding: '12px 20px', borderRadius: '16px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(249, 115, 22, 0.3)' }}>
            <Plus size={20} strokeWidth={3} /> 등록
          </button>
        )}
      </div>

      {view === 'register' ? (
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>행사명 (20자 이내)</label>
            <input maxLength={20} required value={registerForm.title} onChange={e => setRegisterForm({...registerForm, title: e.target.value})} style={{ padding: '18px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', fontSize: '16px', fontWeight: 700 }} placeholder="페스티벌 이름을 입력하세요" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>장르</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['바차타', '살사', '키좀바', '쥬크', '전장르'].map(g => (
                <button key={g} type="button" onClick={() => setRegisterForm({...registerForm, genre: g})} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: registerForm.genre === g ? '#F97316' : '#FFF', color: registerForm.genre === g ? '#FFF' : '#64748B', fontWeight: 800, fontSize: '14px' }}>{g}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>시작일</label>
              <input type="date" required value={registerForm.start_date} onChange={e => setRegisterForm({...registerForm, start_date: e.target.value})} style={{ padding: '18px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', fontWeight: 700 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>종료일</label>
              <input type="date" required value={registerForm.end_date} onChange={e => setRegisterForm({...registerForm, end_date: e.target.value})} style={{ padding: '18px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', fontWeight: 700 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>장소 (주소)</label>
            <input required value={registerForm.location} onChange={e => setRegisterForm({...registerForm, location: e.target.value})} style={{ padding: '18px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', fontSize: '16px', fontWeight: 700 }} placeholder="정확한 장소명을 입력하세요" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>지역</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {regions_list.slice(1).map(r => (
                <button key={r} type="button" onClick={() => setRegisterForm({...registerForm, region: r})} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: registerForm.region === r ? '#F97316' : '#FFF', color: registerForm.region === r ? '#FFF' : '#64748B', fontWeight: 800, fontSize: '14px' }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>참가비</label>
            <input type="number" value={registerForm.price} onChange={e => setRegisterForm({...registerForm, price: e.target.value})} style={{ padding: '18px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', fontSize: '16px', fontWeight: 700 }} placeholder="숫자만 입력 (예: 50000)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>포스터 이미지</label>
            <div onClick={() => document.getElementById('poster-input').click()} style={{ height: '160px', borderRadius: '16px', border: '2px dashed #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: file ? '#F8FAFC' : 'transparent' }}>
              {file ? <span style={{ fontSize: '14px', fontWeight: 800, color: '#F97316' }}>{file.name}</span> : <><Upload size={32} color="#CBD5E1" /><span style={{ fontSize: '14px', marginTop: '8px', color: '#94A3B8', fontWeight: 700 }}>이미지 업로드</span></>}
              <input id="poster-input" type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
            </div>
          </div>
          <button type="submit" disabled={registering} style={{ padding: '20px', borderRadius: '20px', border: 'none', background: '#F97316', color: '#FFF', fontWeight: 900, fontSize: '18px', cursor: 'pointer', marginTop: '20px', boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)' }}>
            {registering ? '등록 중...' : '페스티벌 등록 신청'}
          </button>
        </motion.form>
      ) : (
        <>
          {/* Genre Filter */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {genres.map(g => (
              <button key={g} onClick={() => setFilter(g)} style={{ padding: '12px 24px', borderRadius: '50px', border: 'none', fontSize: '15px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', background: filter === g ? '#F97316' : '#F1F5F9', color: filter === g ? '#FFF' : '#94A3B8', transition: 'all 0.2s' }}>{g}</button>
            ))}
          </div>

          {/* Region Filter */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#999', marginBottom: '10px', textAlign: 'left' }}>지역</p>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {regions_list.map(r => (
                <button 
                  key={r} 
                  onClick={() => setSelectedRegion(r)} 
                  style={{ 
                    padding: '5px 14px', 
                    borderRadius: '20px', 
                    border: selectedRegion === r ? 'none' : '1px solid #eee', 
                    fontSize: '11px', 
                    fontWeight: selectedRegion === r ? 700 : 500, 
                    cursor: 'pointer', 
                    whiteSpace: 'nowrap', 
                    background: selectedRegion === r ? '#F97316' : '#f5f5f5', 
                    color: selectedRegion === r ? '#FFF' : '#888', 
                    transition: 'all 0.2s' 
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {view === 'list' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '1px' }}>UPCOMING</span>
                <button onClick={() => setView('all')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#F97316', fontWeight: 900, fontSize: '14px', cursor: 'pointer' }}>전체보기 <ChevronRight size={16} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {loading ? <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div> : festivals.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', fontWeight: 800, color: '#CBD5E1' }}>등록된 페스티벌이 없습니다</div> : festivals.map(renderCard)}
              </div>
            </>
          )}
          {view === 'all' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {festivals.map(fest => (
                <motion.div
                  key={fest.id}
                  style={{ 
                    aspectRatio: '1', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    position: 'relative', 
                    background: fest.poster_url ? `url(${fest.poster_url}) center/cover` : '#1A1A1A'
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fest.title}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontWeight: 700 }}>{fest.region}</div>
                  </div>
                </motion.div>
              ))}
              <button style={{ gridColumn: 'span 2', padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', color: '#64748B', fontWeight: 800, marginTop: '20px' }}>더보기</button>
            </div>
          )}
        </>
      )}

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ background: '#fff', padding: '40px', borderRadius: '32px', textAlign: 'center', color: '#1E293B' }}>
              <div style={{ background: '#4ADE80', width: '64px', height: '64px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Check color="white" size={32} strokeWidth={3} /></div>
              <div style={{ fontSize: '22px', fontWeight: 900 }}>등록 신청 완료</div>
              <div style={{ fontSize: '15px', marginTop: '12px', color: '#94A3B8', fontWeight: 600 }}>관리자 승인 후 즉시 노출됩니다</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Festival;
