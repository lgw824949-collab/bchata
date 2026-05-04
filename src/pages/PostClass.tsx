import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Camera, Check, Upload, MapPin, Tag, Clock, Award, DollarSign, Music, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostClass({ onBack }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: '바차타',
    level: '입문',
    duration: '4주',
    fee: '',
    city: '서울',
    poster_url: '',
    category_type: 'class',
    status: 'pending',
    start_date: new Date().toISOString().split('T')[0],
    day_of_week: (['일', '월', '화', '수', '목', '금', '토'])[new Date().getDay()] + '요일',
    custom_duration: ''
  });

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const days = ['일','월','화','수','목','금','토'];
    return days[new Date(dateStr).getDay()] + '요일';
  };

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

      setFormData(prev => ({ ...prev, poster_url: publicUrl }));
    } catch (error) {
      alert('업로드 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) return alert('강습 제목을 입력해주세요.');
    setLoading(true);
    try {
      const insertData = {
        title: formData.title,
        genre: formData.genre,
        level: formData.level,
        duration: formData.duration === '기타(직접입력)' ? formData.custom_duration : (formData.duration || '기간 미지정'),
        fee: formData.fee ? String(formData.fee) : '문의',
        city: String(formData.city),
        poster_url: formData.poster_url,
        category_type: 'class',
        status: 'pending',
        day_of_week: formData.day_of_week || '요일 미지정',
        start_time: '19:00',
        end_time: '21:00',
        start_date: formData.start_date,
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

  const TOTAL_STEPS = 3;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px', position: 'sticky', top: 0, background: '#fff', zIndex: 10000 }}>
        <button onClick={() => step > 1 ? setStep(step - 1) : onBack()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={28} /></button>
        <h2 style={{ fontSize: '18px', fontWeight: 900, marginLeft: '12px' }}>클래스 등록 신청 ({step}/{TOTAL_STEPS})</h2>
      </div>

      <div style={{ height: '4px', background: '#F1F5F9', width: '100%' }}>
        <motion.div animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} style={{ height: '100%', background: '#2ECC71' }} />
      </div>

      <div style={{ padding: '30px 20px' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step1">
              <h3 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '8px', color: '#1E293B' }}>📸 홍보 포스터를<br/>먼저 올려주세요</h3>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '30px' }}>전체 화면으로 깔끔하게 보입니다.</p>
              
              <div style={{ 
                width: 'calc(100% + 40px)', 
                marginLeft: '-20px', 
                minHeight: formData.poster_url ? 'auto' : '360px', 
                background: '#F8FAFC', 
                borderTop: '1px solid #F1F5F9',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                position: 'relative', 
                overflow: 'hidden',
                marginBottom: '20px'
              }}>
                {formData.poster_url ? (
                  <div style={{ width: '100%', position: 'relative' }}>
                    <img 
                      src={formData.poster_url} 
                      style={{ width: '100%', height: 'auto', display: 'block' }} 
                      alt="Preview" 
                    />
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, poster_url: '' }))}
                      style={{ 
                        position: 'absolute', top: '16px', right: '16px', 
                        background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', 
                        borderRadius: '50%', width: '36px', height: '36px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)'
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <div style={{ 
                      width: '80px', height: '80px', borderRadius: '40px', 
                      background: 'white', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', margin: '0 auto 16px', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
                    }}>
                      <Camera size={32} color="#2ECC71" />
                    </div>
                    <span style={{ fontSize: '15px', color: '#64748B', fontWeight: 700 }}>이미지 파일을 선택해주세요</span>
                    <input 
                      type="file" accept="image/*" onChange={handleUpload} 
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                    />
                  </div>
                )}
                {loading && (
                  <div style={{ 
                    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 900, color: '#2ECC71', zIndex: 20 
                  }}>
                    업로드 중...
                  </div>
                )}
              </div>

              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={loading || !formData.poster_url} 
                onClick={() => setStep(2)}
                style={{ 
                  width: '100%', padding: '22px', borderRadius: '18px', 
                  background: (loading || !formData.poster_url) ? '#E2E8F0' : '#2ECC71', 
                  color: '#fff', fontSize: '18px', fontWeight: 900, border: 'none', 
                  marginTop: '40px', cursor: (loading || !formData.poster_url) ? 'default' : 'pointer',
                  boxShadow: '0 8px 20px rgba(46, 204, 113, 0.2)'
                }}
              >
                {loading ? '업로드 중...' : '다음 단계 (날짜 선택) 🗓️'}
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step2">
              <h3 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '8px', color: '#1E293B' }}>🗓️ 언제 개강하시나요?</h3>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '40px' }}>달력에서 날짜를 선택하면 요일이 자동 계산됩니다.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
                <div style={{ width: '100%', background: '#F8FAFC', padding: '30px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px' }}><Calendar size={14}/> 개강일 선택</label>
                  <input 
                    type="date" 
                    value={formData.start_date} 
                    onChange={e => {
                      const date = e.target.value;
                      setFormData(p => ({ ...p, start_date: date, day_of_week: getDayName(date) }));
                    }} 
                    style={{ 
                      width: '100%', padding: '20px', border: '2px solid #2ECC71', 
                      borderRadius: '16px', fontSize: '18px', fontWeight: 900, 
                      color: '#1E293B', outline: 'none', background: '#fff' 
                    }} 
                  />
                  <div style={{ marginTop: '10px', fontSize: '16px', fontWeight: 700, color: '#2ECC71', textAlign: 'right' }}>
                    {formData.day_of_week}
                  </div>
                </div>

                <div style={{ 
                  width: '100%', padding: '24px', background: '#F0FFF4', 
                  borderRadius: '20px', border: '2.5px solid #2ECC71', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  gap: '12px', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.1)' 
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#27AE60' }}>자동 계산된 요일:</div>
                  <div style={{ fontSize: '28px', fontWeight: 950, color: '#2ECC71' }}>{formData.day_of_week}</div>
                </div>
              </div>

              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(3)}
                style={{ 
                  width: '100%', padding: '22px', borderRadius: '18px', 
                  background: '#2ECC71', color: '#fff', fontSize: '18px', fontWeight: 900, 
                  border: 'none', marginTop: '60px', cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(46, 204, 113, 0.2)'
                }}
              >
                다음 단계 (상세 정보) ✍️
              </motion.button>
              <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: '20px', background: 'none', border: 'none', color: '#94A3B8', fontWeight: 700 }}>이전 단계로</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step3">
              <h3 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '30px', color: '#1E293B' }}>✍️ 나머지 정보를<br/>입력해주세요</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Tag size={14}/> 강습 제목 (최대 16자)</label>
                  <input maxLength={16} value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} placeholder="예: 바차타 입문반 1기 모집" style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Music size={14}/> 장르</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {genres.map(g => (
                        <button key={g} onClick={() => setFormData(p => ({...p, genre: g}))} style={{ ...chipStyle, background: formData.genre === g ? '#2ECC71' : '#F1F5F9', color: formData.genre === g ? '#fff' : '#64748B' }}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Award size={14}/> 난이도</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {levels.map(l => (
                        <button key={l} onClick={() => setFormData(p => ({...p, level: l}))} style={{ ...chipStyle, background: formData.level === l ? '#1E293B' : '#F1F5F9', color: formData.level === l ? '#fff' : '#64748B' }}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><MapPin size={14}/> 진행 지역</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {regions.map(r => (
                      <button key={r} onClick={() => setFormData(p => ({...p, city: r}))} style={{ ...chipStyle, fontSize: '12px', background: formData.city === r ? '#2ECC71' : '#F1F5F9', color: formData.city === r ? '#fff' : '#64748B' }}>{r}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Clock size={14}/> 강습 기간 선택 (세로형)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {durations.map(d => (
                      <div key={d}>
                        <button 
                          onClick={() => setFormData(p => ({...p, duration: d}))} 
                          style={{ 
                            ...chipStyle, 
                            width: '100%',
                            textAlign: 'left',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: formData.duration === d ? '#FF8C00' : '#F8FAFC', 
                            color: formData.duration === d ? '#fff' : '#64748B',
                            border: formData.duration === d ? 'none' : '2px solid #F1F5F9'
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>{d}</span>
                          {formData.duration === d && <Check size={20} />}
                        </button>
                        {d === '기타(직접입력)' && formData.duration === d && (
                          <input 
                            type="text"
                            placeholder="기간을 직접 입력해주세요"
                            value={formData.custom_duration}
                            onChange={e => setFormData(p => ({...p, custom_duration: e.target.value}))}
                            style={{ ...inputStyle, marginTop: '8px', padding: '12px' }}
                          />
                        )}
                      </div>
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
                  width: '100%', padding: '22px', borderRadius: '20px', 
                  background: '#2ECC71', color: '#fff', fontSize: '18px', fontWeight: 900, 
                  border: 'none', marginTop: '40px', cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(46, 204, 113, 0.3)'
                }}
              >
                {loading ? '처리 중...' : <><Check size={24}/> 클래스 등록 신청하기</>}
              </button>
              
              <button onClick={() => setStep(2)} style={{ width: '100%', marginTop: '24px', background: 'none', border: 'none', color: '#94A3B8', fontWeight: 700, cursor: 'pointer', paddingBottom: '40px' }}>이전 단계로</button>
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
