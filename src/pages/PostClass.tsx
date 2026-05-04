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
    day_of_week: '',
    start_time: '19:00',
    end_time: '21:00',
    custom_duration: ''
  });

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const days = ['일','월','화','수','목','금','토'];
    return days[new Date(dateStr).getDay()] + '요일';
  };

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
  const genres = ['바차타', '살사', '키좀바', '쥬크'];
  const levels = ['입문', '초급', '중급', '상급'];
  const durations = ['4주', '6주', '8주', '12주', '기타(직접입력)'];
  const regions = ['서울', '경기,인천', '경상도', '충청도', '전라도', '강원,제주'];

  const toggleDay = (day) => {
    let currentDays = formData.day_of_week ? formData.day_of_week.split(', ').filter(d => d) : [];
    if (currentDays.includes(day)) {
      currentDays = currentDays.filter(d => d !== day);
    } else {
      currentDays = [...currentDays, day];
    }
    setFormData(p => ({ ...p, day_of_week: currentDays.join(', ') }));
  };

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
    if (!formData.day_of_week) return alert('강습 요일을 선택해주세요.');
    
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
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
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

  const cardStyle = {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    margin: '12px 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '15px',
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: '12px'
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    fontSize: '15px',
    outline: 'none',
    background: '#fff'
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '160px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px', position: 'sticky', top: 0, background: '#fff', zIndex: 10000, borderBottom: '1px solid #F1F5F9' }}>
        <button onClick={() => step > 1 ? setStep(step - 1) : onBack()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={28} /></button>
        <h2 style={{ fontSize: '18px', fontWeight: 900, marginLeft: '12px' }}>클래스 등록 신청 ({step}/{TOTAL_STEPS})</h2>
      </div>

      <div style={{ height: '4px', background: '#F1F5F9', width: '100%' }}>
        <motion.div animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} style={{ height: '100%', background: '#2ECC71' }} />
      </div>

      <div style={{ padding: '20px' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step1">
              <div style={{ padding: '10px 0 20px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '8px', color: '#1E293B' }}>📸 홍보 포스터를<br/>먼저 올려주세요</h3>
                <p style={{ color: '#64748B', fontSize: '14px' }}>전체 화면으로 깔끔하게 보입니다.</p>
              </div>
              
              <div style={{ 
                width: 'calc(100% + 40px)', 
                marginLeft: '-20px', 
                minHeight: formData.poster_url ? 'auto' : '360px', 
                background: '#fff', 
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
                      background: '#F8FAFC', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', margin: '0 auto 16px', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
                    }}>
                      <Camera size={32} color="#2ECC71" />
                    </div>
                    <span style={{ fontSize: '15px', color: '#64748B', fontWeight: 700 }}>이미지 파일을 선택해주세요</span>
                    <div style={{ fontSize: '13px', color: '#EF4444', marginTop: '10px', fontWeight: 700 }}>
                      ※ 참가비 또는 금액을 적어 주세요
                    </div>
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

              <button 
                disabled={loading || !formData.poster_url} 
                onClick={() => setStep(2)}
                style={{ 
                  width: '100%', padding: '20px', borderRadius: '16px', 
                  background: (loading || !formData.poster_url) ? '#E2E8F0' : '#2ECC71', 
                  color: '#fff', fontSize: '18px', fontWeight: 900, border: 'none', 
                  marginTop: '20px', cursor: (loading || !formData.poster_url) ? 'default' : 'pointer'
                }}
              >
                {loading ? '업로드 중...' : '다음 단계 (날짜 선택) 🗓️'}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step2">
              <div style={{ padding: '10px 0 20px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '8px', color: '#1E293B' }}>🗓️ 언제 개강하시나요?</h3>
                <p style={{ color: '#64748B', fontSize: '14px' }}>달력에서 날짜를 선택하면 요일이 자동 계산됩니다.</p>
              </div>
              
              <div style={cardStyle}>
                <label style={labelStyle}><Calendar size={16} style={{ marginRight: '6px' }}/> 개강일 선택</label>
                <input 
                  type="date" 
                  value={formData.start_date} 
                  onChange={e => {
                    const date = e.target.value;
                    setFormData(p => ({ ...p, start_date: date }));
                  }} 
                  style={{ ...inputStyle, border: '2px solid #2ECC71', padding: '16px' }} 
                />
                <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: 800, color: '#2ECC71', textAlign: 'right' }}>
                  {getDayName(formData.start_date)}
                </div>
              </div>

              {/* 강습 요일 선택 (복수 선택 가능) */}
              <div style={cardStyle}>
                <label style={labelStyle}>강습 요일 (복수 선택 가능)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {weekDays.map(day => {
                    const isSelected = formData.day_of_week.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '12px 0',
                          borderRadius: '10px',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: 800,
                          background: isSelected ? '#2ECC71' : '#F1F5F9',
                          color: isSelected ? '#fff' : '#64748B',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {formData.day_of_week && (
                  <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: 700, color: '#2ECC71', textAlign: 'right' }}>
                    선택됨: {formData.day_of_week}
                  </div>
                )}
              </div>

              {/* 강습 시간 입력 */}
              <div style={cardStyle}>
                <label style={labelStyle}>강습 시간</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="time" 
                    value={formData.start_time} 
                    onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))}
                    style={{ ...inputStyle, flex: 1, padding: '12px' }} 
                  />
                  <span style={{ fontWeight: 800, color: '#94A3B8' }}>~</span>
                  <input 
                    type="time" 
                    value={formData.end_time} 
                    onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))}
                    style={{ ...inputStyle, flex: 1, padding: '12px' }} 
                  />
                </div>
              </div>

              <button 
                onClick={() => setStep(3)}
                style={{ 
                  width: '100%', padding: '20px', borderRadius: '16px', 
                  background: '#2ECC71', color: '#fff', fontSize: '18px', fontWeight: 900, 
                  border: 'none', marginTop: '40px', cursor: 'pointer'
                }}
              >
                다음 단계 (상세 정보) ✍️
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step3">
              <div style={{ padding: '10px 0 20px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '8px', color: '#1E293B' }}>✍️ 나머지 정보를<br/>입력해주세요</h3>
              </div>
              
              <div style={{ paddingBottom: '140px' }}>
                {/* 1. 강습 제목 */}
                <div style={cardStyle}>
                  <label style={labelStyle}>강습 제목</label>
                  <input maxLength={16} value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} placeholder="예: 강남 바차타 초급반" style={inputStyle} />
                </div>

                {/* 2. 장르 선택 */}
                <div style={cardStyle}>
                  <label style={labelStyle}>장르</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {genres.map(g => (
                      <button 
                        key={g} 
                        onClick={() => setFormData(p => ({...p, genre: g}))} 
                        style={{ 
                          padding: '14px',
                          borderRadius: '12px',
                          border: 'none',
                          fontSize: '15px',
                          fontWeight: 800,
                          background: formData.genre === g ? '#2ECC71' : '#F1F5F9', 
                          color: formData.genre === g ? '#fff' : '#64748B',
                          transition: 'all 0.2s'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. 난이도 */}
                <div style={cardStyle}>
                  <label style={labelStyle}>난이도</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {levels.map(l => {
                      const colors = {
                        '입문': '#2ECC71',
                        '초급': '#3B82F6',
                        '중급': '#F59E0B',
                        '상급': '#EF4444'
                      };
                      const activeColor = colors[l] || '#2ECC71';
                      return (
                        <button 
                          key={l} 
                          onClick={() => setFormData(p => ({...p, level: l}))} 
                          style={{ 
                            padding: '12px 0',
                            borderRadius: '10px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 800,
                            background: formData.level === l ? activeColor : '#F1F5F9', 
                            color: formData.level === l ? '#fff' : '#64748B',
                            transition: 'all 0.2s'
                          }}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. 진행 지역 */}
                <div style={cardStyle}>
                  <label style={labelStyle}>진행 지역</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '10px' }}>
                    {regions.map(r => (
                      <button 
                        key={r} 
                        onClick={() => setFormData(p => ({...p, city: r}))} 
                        style={{ 
                          padding: '14px',
                          borderRadius: '12px',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: 800,
                          background: formData.city === r ? '#2ECC71' : '#F1F5F9', 
                          color: formData.city === r ? '#fff' : '#64748B',
                          transition: 'all 0.2s'
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. 강습 기간 */}
                <div style={cardStyle}>
                  <label style={labelStyle}>강습 기간</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {durations.map(d => (
                      <div key={d}>
                        <button 
                          onClick={() => setFormData(p => ({...p, duration: d}))} 
                          style={{ 
                            width: '100%',
                            textAlign: 'left',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '15px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: formData.duration === d ? '#2ECC71' : '#F8FAFC', 
                            color: formData.duration === d ? '#fff' : '#64748B',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span>{d}</span>
                          {formData.duration === d && <Check size={20} />}
                        </button>
                        {d === '기타(직접입력)' && formData.duration === d && (
                          <input 
                            type="text"
                            placeholder="기간을 직접 입력해주세요"
                            value={formData.custom_duration}
                            onChange={e => setFormData(p => ({...p, custom_duration: e.target.value}))}
                            style={{ ...inputStyle, marginTop: '10px' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. 참여비 */}
                <div style={cardStyle}>
                  <label style={labelStyle}>참여비</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input type="number" value={formData.fee} onChange={e => setFormData(p => ({...p, fee: e.target.value}))} placeholder="예: 80000" style={{ ...inputStyle, paddingRight: '40px' }} />
                    <span style={{ position: 'absolute', right: '15px', fontWeight: 800, color: '#64748B' }}>원</span>
                  </div>
                </div>
              </div>

              {/* 하단 고정 버튼 */}
              <button 
                disabled={loading} 
                onClick={handleSubmit}
                style={{ 
                  position: 'fixed',
                  bottom: '70px',
                  left: '20px',
                  width: 'calc(100% - 40px)',
                  background: '#2ECC71',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 900,
                  borderRadius: '16px',
                  padding: '18px',
                  border: 'none',
                  zIndex: 10001,
                  boxShadow: '0 8px 25px rgba(46, 204, 113, 0.3)',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'default' : 'pointer'
                }}
              >
                {loading ? '처리 중...' : '클래스 등록 신청하기'}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '-100px', paddingBottom: '40px' }}>
                <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontWeight: 700 }}>이전 단계로</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
