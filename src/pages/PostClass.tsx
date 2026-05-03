import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Camera, Check, Upload, MapPin, Tag, Clock, Award, DollarSign, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostClass({ onBack }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: '바차타',
    level: '입문',
    duration: '기간 미지정',
    fee: '',
    city: '서울',
    poster_url: '',
    category_type: 'class',
    status: 'pending'
  });

  const genres = ['바차타', '살사', '키좀바', '쥬크'];
  const levels = ['입문', '초급', '중급', '상급'];
  const durations = ['4주', '6주', '8주', '12주', '기타(직접입력)'];
  const regions = ['서울', '경기,인천', '경상도', '충청도', '전라도', '강원,제주'];

  // 포스터 업로드 로직
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileName = `${Date.now()}_class.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(`lessons/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posters')
        .getPublicUrl(`lessons/${fileName}`);

      console.log('✅ POSTER UPLOAD SUCCESS:', publicUrl);
      setFormData(prev => ({ ...prev, poster_url: publicUrl }));
    } catch (error) {
      console.error('❌ UPLOAD ERROR:', error);
      alert('업로드 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const insertData = {
        title: formData.title,
        genre: formData.genre,
        level: formData.level,
        duration: formData.duration || '기간 미지정',
        fee: formData.fee ? String(formData.fee) : '문의',
        city: formData.city,
        poster_url: formData.poster_url,
        category_type: 'class',
        status: 'pending',
        day_of_week: '요일 미지정',
        start_time: '19:00',
        end_time: '21:00',
        start_date: new Date().toISOString().split('T')[0],
        studio_name: '장소 미지정',
        address: '상세주소 미지정'
      };
      const { error } = await supabase
        .from('classes_info')
        .insert([insertData]);
      if (error) throw error;
      alert('등록 신청이 완료되었습니다.\n관리자 승인 후 게시됩니다.');
      onBack();
    } catch (error) {
      alert('등록 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', paddingBottom: '180px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px', position: 'sticky', top: 0, background: '#fff', zIndex: 10000 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={28} /></button>
        <h2 style={{ fontSize: '18px', fontWeight: 900, marginLeft: '12px' }}>클래스 등록 신청</h2>
      </div>

      <div style={{ height: '4px', background: '#F1F5F9', width: '100%' }}>
        <motion.div animate={{ width: `${(step / 2) * 100}%` }} style={{ height: '100%', background: '#2ECC71' }} />
      </div>

      <div style={{ padding: '30px 20px' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step1">
              <h3 style={{ fontSize: '22px', fontWeight: 950, marginBottom: '8px' }}>홍보 포스터를<br/>업로드해주세요 📸</h3>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '30px' }}>멋진 포스터는 수강생의 시선을 사로잡습니다.</p>
              
              <div style={{ width: '100%', aspectRatio: '4/5', background: '#F8FAFC', borderRadius: '24px', border: '2px dashed #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {formData.poster_url ? (
                  <img src={formData.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                ) : (
                  <>
                    <Camera size={48} color="#CBD5E1" style={{ marginBottom: '12px' }} />
                    <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 700 }}>탭하여 파일 선택</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>업로드 중...</div>}
              </div>

              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={loading} 
                onClick={() => setStep(2)}
                style={{ 
                  width: '100%', padding: '20px', borderRadius: '18px', 
                  background: loading ? '#E2E8F0' : '#2ECC71', 
                  color: '#fff', fontSize: '18px', fontWeight: 900, border: 'none', 
                  marginTop: '40px', cursor: loading ? 'default' : 'pointer' 
                }}
              >
                {loading ? '업로드 중...' : '다음 단계로'}
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step2">
              <h3 style={{ fontSize: '22px', fontWeight: 950, marginBottom: '30px' }}>강습 정보를<br/>입력해주세요 ✍️</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Tag size={14}/> 강습 제목 (최대 16자)</label>
                  <input maxLength={16} value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} placeholder="예: 바차타 입문반 1기 모집" style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Music size={14}/> 장르 선택</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {genres.map(g => (
                      <motion.button key={g} whileTap={{ scale: 0.95 }} onClick={() => setFormData(p => ({...p, genre: g}))} style={{ ...chipStyle, background: formData.genre === g ? '#2ECC71' : '#F1F5F9', color: formData.genre === g ? '#fff' : '#64748B' }}>{g}</motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><MapPin size={14}/> 진행 지역</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {regions.map(r => (
                      <motion.button key={r} whileTap={{ scale: 0.95 }} onClick={() => setFormData(p => ({...p, city: r}))} style={{ ...chipStyle, fontSize: '12px', padding: '12px 4px', background: formData.city === r ? '#2ECC71' : '#F1F5F9', color: formData.city === r ? '#fff' : '#64748B' }}>{r}</motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Award size={14}/> 난이도</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {levels.map(l => (
                      <motion.button key={l} whileTap={{ scale: 0.95 }} onClick={() => setFormData(p => ({...p, level: l}))} style={{ ...chipStyle, background: formData.level === l ? '#1E293B' : '#F1F5F9', color: formData.level === l ? '#fff' : '#64748B', fontSize: '12px' }}>{l}</motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Clock size={14}/> 강습 기간</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {durations.map(d => (
                      <motion.button key={d} whileTap={{ scale: 0.95 }} onClick={() => setFormData(p => ({...p, duration: d}))} style={{ ...chipStyle, padding: '12px 20px', background: formData.duration === d ? '#FF8C00' : '#F1F5F9', color: formData.duration === d ? '#fff' : '#64748B' }}>{d}</motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><DollarSign size={14}/> 참여비 (원 단위)</label>
                  <input type="number" value={formData.fee} onChange={e => setFormData(p => ({...p, fee: e.target.value}))} placeholder="예: 80000" style={inputStyle} />
                </div>
              </div>

              <button 
                disabled={loading} 
                onClick={handleSubmit}
                style={{ 
                  width: '100%', padding: '22px', borderRadius: '18px', 
                  background: '#2ECC71', color: '#fff', fontSize: '18px', fontWeight: 900, 
                  border: 'none', marginTop: '30px', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  opacity: loading ? 0.5 : 1,
                  position: 'relative', zIndex: 9999
                }}
              >
                {loading ? '처리 중...' : <><Check size={22}/> 신청 완료하기</>}
              </button>
              
              <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: '24px', background: 'none', border: 'none', color: '#94A3B8', fontWeight: 700, cursor: 'pointer', paddingBottom: '40px' }}>이전 단계로</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '18px 20px',
  borderRadius: '16px',
  border: '2px solid #E2E8F0',
  fontSize: '16px',
  fontWeight: 600,
  outline: 'none',
  transition: 'all 0.2s'
};

const chipStyle = {
  padding: '14px',
  borderRadius: '14px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.2s'
};
