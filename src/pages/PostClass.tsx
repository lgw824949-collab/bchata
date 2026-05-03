import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Camera, Check, Upload, MapPin, Tag, Clock, Award, DollarSign, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostClass({ onBack }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    level: '',
    duration: '',
    fee: '',
    city: '',
    poster_url: '',
    category_type: 'class',
    status: 'pending'
  });

  const genres = ['바차타', '살사', '키좀바', '쥬크'];
  const levels = ['입문', '초급', '중급', '상급'];
  const durations = ['4주', '6주', '8주', '12주', '기타(직접입력)'];
  const regions = ['서울', '경기,인천', '경상도', '충청도', '전라도', '강원,제주'];

  // 포스터 업로드 로직 (Step 1)
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `class_posters/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posters')
        .getPublicUrl(filePath);

      setFormData({ ...formData, poster_url: publicUrl });
    } catch (error) {
      alert('업로드 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 최종 등록 로직
  const handleSubmit = async () => {
    if (!formData.city) return alert('지역을 선택해주세요.');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('classes_info')
        .insert([formData]);

      if (error) throw error;

      alert('등록 신청이 완료되었습니다.\n관리자 승인 후 게시됩니다.');
      onBack();
    } catch (error) {
      alert('등록 오류: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', paddingBottom: '50px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={28} /></button>
        <h2 style={{ fontSize: '18px', fontWeight: 900, marginLeft: '12px' }}>클래스 등록 신청</h2>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: '#F1F5F9', width: '100%' }}>
        <motion.div animate={{ width: `${(step / 3) * 100}%` }} style={{ height: '100%', background: '#2ECC71' }} />
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

              <button 
                disabled={!formData.poster_url || loading} 
                onClick={() => setStep(2)}
                style={{ width: '100%', padding: '20px', borderRadius: '18px', background: formData.poster_url ? '#2ECC71' : '#E2E8F0', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', marginTop: '40px', cursor: 'pointer' }}
              >
                다음 단계로
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step2">
              <h3 style={{ fontSize: '22px', fontWeight: 950, marginBottom: '30px' }}>강습 상세 정보를<br/>입력해주세요 ✍️</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 제목 */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><Tag size={14}/> 강습 제목 (최대 16자)</label>
                  <input maxLength={16} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="예: 바차타 입문반 1기 모집" style={inputStyle} />
                </div>

                {/* 장르 */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><Music size={14}/> 장르 선택</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {genres.map(g => (
                      <button key={g} onClick={() => setFormData({...formData, genre: g})} style={{ ...chipStyle, background: formData.genre === g ? '#2ECC71' : '#F1F5F9', color: formData.genre === g ? '#fff' : '#64748B' }}>{g}</button>
                    ))}
                  </div>
                </div>

                {/* 레벨 */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><Award size={14}/> 난이도</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {levels.map(l => (
                      <button key={l} onClick={() => setFormData({...formData, level: l})} style={{ ...chipStyle, background: formData.level === l ? '#1E293B' : '#F1F5F9', color: formData.level === l ? '#fff' : '#64748B', fontSize: '12px' }}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* 기간 */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><Clock size={14}/> 강습 기간</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {durations.map(d => (
                      <button key={d} onClick={() => setFormData({...formData, duration: d})} style={{ ...chipStyle, padding: '10px 16px', background: formData.duration === d ? '#FF8C00' : '#F1F5F9', color: formData.duration === d ? '#fff' : '#64748B' }}>{d}</button>
                    ))}
                  </div>
                </div>

                {/* 참여비 */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><DollarSign size={14}/> 참여비 (원 단위)</label>
                  <input type="number" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} placeholder="예: 80000" style={inputStyle} />
                </div>
              </div>

              <button 
                disabled={!formData.title || !formData.genre || !formData.level || !formData.duration || !formData.fee} 
                onClick={() => setStep(3)}
                style={{ width: '100%', padding: '20px', borderRadius: '18px', background: '#2ECC71', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', marginTop: '40px', cursor: 'pointer', opacity: (!formData.title || !formData.genre || !formData.level || !formData.duration || !formData.fee) ? 0.5 : 1 }}
              >
                마지막 지역 선택으로
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step3">
              <h3 style={{ fontSize: '22px', fontWeight: 950, marginBottom: '30px' }}>어느 지역에서<br/>진행되나요? 📍</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {regions.map(r => (
                  <button key={r} onClick={() => setFormData({...formData, city: r})} style={{ ...chipStyle, padding: '24px 10px', background: formData.city === r ? '#2ECC71' : '#F8FAFC', color: formData.city === r ? '#fff' : '#1E293B', fontSize: '16px', border: formData.city === r ? 'none' : '1px solid #E2E8F0' }}>{r}</button>
                ))}
              </div>

              <div style={{ marginTop: '50px', padding: '20px', background: '#F0FFF4', borderRadius: '18px', border: '1px solid #C6F6D5' }}>
                <p style={{ color: '#276749', fontSize: '13px', fontWeight: 700, lineHeight: '1.6' }}>
                  ✅ 등록하신 내용은 관리자의 승인을 거쳐 24시간 이내에 게시됩니다. 부적절한 홍보 내용은 승인이 거절될 수 있습니다.
                </p>
              </div>

              <button 
                disabled={!formData.city || loading} 
                onClick={handleSubmit}
                style={{ width: '100%', padding: '20px', borderRadius: '18px', background: '#2ECC71', color: '#fff', fontSize: '16px', fontWeight: 900, border: 'none', marginTop: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {loading ? '신청 중...' : <><Check size={20}/> 신청 완료하기</>}
              </button>
              <button onClick={() => setStep(2)} style={{ width: '100%', marginTop: '16px', background: 'none', border: 'none', color: '#94A3B8', fontWeight: 700, cursor: 'pointer' }}>이전 정보 수정</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '16px 20px',
  borderRadius: '14px',
  border: '1.5px solid #E2E8F0',
  fontSize: '16px',
  fontWeight: 600,
  outline: 'none',
  transition: 'border-color 0.2s'
};

const chipStyle = {
  padding: '12px',
  borderRadius: '12px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.2s'
};
