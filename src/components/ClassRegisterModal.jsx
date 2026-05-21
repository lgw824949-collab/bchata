import React, { useState, useEffect } from 'react';
import { Z } from '../constants/zLayers';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { X, Calendar, Clock, MapPin, DollarSign, Users, Info, User } from 'lucide-react';

const ClassRegisterModal = ({ isOpen = true, onClose, instructorId = '' }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  
  // 직관적이고 매우 단순화된 Form state (강사명 직접 입력 필드 탑재)
  const [form, setForm] = useState({
    instructorName: '', // 강사가 고정이 아니라 직접 자유롭게 텍스트로 적을 수 있도록 지원
    title: '',
    genre: '',
    level: '',
    startDate: '',
    endDate: '',
    startTime: '20:00', // 강사들이 가장 많이 쓰는 저녁 8시 기본 세팅
    endTime: '22:00',   // 2시간 코스 기본 세팅
    location: '',
    fee: '',
    capacity: '',
    description: ''
  });

  // 활성 강사 목록 조회 (자동 매칭 및 기본 기입용)
  useEffect(() => {
    if (!isOpen) return;
    const fetchInstructors = async () => {
      try {
        const { data } = await supabase
          .from('instructors')
          .select('id, name, city')
          .eq('status', 'active')
          .order('follower_count', { ascending: false });
        if (data && data.length > 0) {
          setInstructors(data);
          
          // 특정 강사 프로필 탭에서 진입한 경우 해당 강사명을 입력란에 기본으로 기입해두어 클릭/입력 최소화
          if (instructorId) {
            const target = data.find(i => i.id === instructorId);
            if (target) {
              setForm(prev => ({ ...prev, instructorName: target.name }));
            }
          } else if (!form.instructorName) {
            // 전달된 계정이 없다면 목록 최상단 마스터 이름을 추천 기입
            setForm(prev => ({ ...prev, instructorName: data[0].name }));
          }
        }
      } catch (err) {
        console.error('Instructors fetch error:', err);
      }
    };
    fetchInstructors();
  }, [isOpen, instructorId]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!form.instructorName.trim()) {
        alert('강사명을 입력해주세요.');
        return;
      }
      if (!form.title.trim()) {
        alert('수업명을 입력해주세요.');
        return;
      }
      if (!form.genre) {
        alert('장르를 선택해주세요.');
        return;
      }
      if (!form.level) {
        alert('레벨을 선택해주세요.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.startDate || !form.endDate) {
        alert('시작일과 마치는 날을 선택해주세요.');
        return;
      }
      if (form.endDate < form.startDate) {
        alert('마치는 날은 시작일과 같거나 이후여야 합니다.');
        return;
      }
      if (!form.startTime || !form.endTime) {
        alert('시작 시간과 종료 시간을 설정해주세요.');
        return;
      }
      setStep(3);
    }
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.location.trim()) {
      alert('장소를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      // 강사가 직접 적은 이름과 기존 DB의 강사 계정을 스마트하게 매칭하여, 프로필 탭에서도 정상 연동되도록 지원
      const cleanTypedName = form.instructorName.trim().toLowerCase().replace(/\s+/g, '');
      const matchedInst = instructors.find(i => i.name.toLowerCase().replace(/\s+/g, '') === cleanTypedName) ||
                          instructors.find(i => cleanTypedName.includes(i.name.toLowerCase().replace(/\s+/g, '')));
      
      const targetInstId = matchedInst ? matchedInst.id : (instructorId || null);

      let posterUrl = null;
      if (posterFile) {
        const ext = posterFile.name.split('.').pop();
        const fileName = `classes/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(fileName, posterFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('posters')
          .getPublicUrl(fileName);
        posterUrl = urlData.publicUrl;
      }

      const scheduleText =
        form.startDate === form.endDate
          ? `${form.startDate} ${form.startTime}~${form.endTime}`
          : `${form.startDate} ~ ${form.endDate} ${form.startTime}~${form.endTime}`;

      const { error } = await supabase.from('instructor_classes').insert({
        instructor_id: targetInstId,
        instructor_name: form.instructorName.trim(), // 직접 입력한 텍스트 원본 별도 보존
        title: form.title,
        genre: form.genre,
        level: form.level,
        schedule: scheduleText,
        location: form.location,
        fee: form.fee,
        capacity: form.capacity,
        description: form.description,
        poster_url: posterUrl,
        status: 'active'
      });

      if (error) throw error;

      alert('클래스가 성공적으로 등록되었습니다!');
      if (onClose) onClose();
      
      // 등록 후 리스트 갱신 이벤트 트리거
      window.dispatchEvent(new CustomEvent('apply-instructor-filter'));
    } catch (err) {
      console.error('Class insert error:', err);
      alert('등록 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: Z.modal, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Outfit', sans-serif"
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          background: '#121212', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '24px',
          width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          color: '#fff', display: 'flex', flexDirection: 'column', maxHeight: '85vh', boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>클래스 등록 모달 👑</div>
            {/* 상단 단계 표시 ① ② ③ */}
            <div style={{ fontSize: '13px', color: '#C9A84C', fontWeight: 800, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ opacity: step === 1 ? 1 : 0.3 }}>① 기본 정보</span>
              <span style={{ color: '#444' }}>›</span>
              <span style={{ opacity: step === 2 ? 1 : 0.3 }}>② 일정</span>
              <span style={{ color: '#444' }}>›</span>
              <span style={{ opacity: step === 3 ? 1 : 0.3 }}>③ 장소/가격</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8E8E93', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: '#C9A84C' }}
          />
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* 강사명 자유 직접 입력 필드 (고정 드롭다운 방식 제거) */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <User size={14} /> 강사명 (직접 입력) *
                  </label>
                  <input
                    type="text"
                    value={form.instructorName}
                    onChange={e => setForm({ ...form, instructorName: e.target.value })}
                    placeholder="예: 남궁건 & 클레어"
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '6px' }}>
                    💡 자유롭게 팀명이나 파트너 이름을 함께 적으실 수 있습니다.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    수업명 *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="예: 바차타 센슈얼 기초반"
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    장르 선택 *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['바차타', '살사', '쥬크', '키좀바'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm({ ...form, genre: g })}
                        style={{
                          padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                          background: form.genre === g ? '#C9A84C' : 'rgba(255,255,255,0.03)',
                          color: form.genre === g ? '#000' : '#A1A1AA',
                          border: `1px solid ${form.genre === g ? '#C9A84C' : 'rgba(255,255,255,0.08)'}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    레벨 선택 *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {['초급', '중급', '상급'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setForm({ ...form, level: lvl })}
                        style={{
                          padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                          background: form.level === lvl ? '#C9A84C' : 'rgba(255,255,255,0.03)',
                          color: form.level === lvl ? '#000' : '#A1A1AA',
                          border: `1px solid ${form.level === lvl ? '#C9A84C' : 'rgba(255,255,255,0.08)'}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <Calendar size={14} /> 날짜 선택 *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700, marginBottom: '6px' }}>시작날</div>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => {
                          const startDate = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            startDate,
                            endDate: !prev.endDate || prev.endDate < startDate ? startDate : prev.endDate,
                          }));
                        }}
                        style={{
                          width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                          boxSizing: 'border-box', colorScheme: 'dark'
                        }}
                      />
                    </div>
                    <span style={{ color: '#8E8E93', fontWeight: 900, marginTop: '18px' }}>~</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700, marginBottom: '6px' }}>마치는날</div>
                      <input
                        type="date"
                        value={form.endDate}
                        min={form.startDate || undefined}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        style={{
                          width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                          boxSizing: 'border-box', colorScheme: 'dark'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <Clock size={14} /> 시간대 설정 *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={e => setForm({ ...form, startTime: e.target.value })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                        colorScheme: 'dark'
                      }}
                    />
                    <span style={{ color: '#8E8E93', fontWeight: 900 }}>~</span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={e => setForm({ ...form, endTime: e.target.value })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                        colorScheme: 'dark'
                      }}
                    />
                  </div>

                  {/* 모바일 강사들을 배려한 황금시간대 원터치 프리셋 버튼 */}
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700, marginBottom: '6px' }}>
                      ⚡ 원터치 시간대 자동 입력 (스크롤 조작 없이 클릭 한 번으로 세팅)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: '🌞 주말 오후반 (14:00~16:00)', start: '14:00', end: '16:00' },
                        { label: '🌆 퇴근 직후반 (19:00~21:00)', start: '19:00', end: '21:00' },
                        { label: '⭐ 황금 시간대 (20:00~22:00)', start: '20:00', end: '22:00' },
                        { label: '🌙 심야 집중반 (21:00~23:00)', start: '21:00', end: '23:00' }
                      ].map(preset => {
                        const isSelected = form.startTime === preset.start && form.endTime === preset.end;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setForm({ ...form, startTime: preset.start, endTime: preset.end })}
                            style={{
                              padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                              background: isSelected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.02)',
                              color: isSelected ? '#C9A84C' : '#A1A1AA',
                              border: `1px solid ${isSelected ? '#C9A84C' : 'rgba(255,255,255,0.05)'}`,
                              transition: 'all 0.2s', textAlign: 'center', lineHeight: 1.3
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <MapPin size={14} /> 장소 입력 *
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="예: 서울 강남구 댄스스튜디오"
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <DollarSign size={14} /> 가격 입력
                  </label>
                  <input
                    type="text"
                    value={form.fee}
                    onChange={e => setForm({ ...form, fee: e.target.value })}
                    placeholder="예: 4회 12만원"
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <Users size={14} /> 정원 입력
                  </label>
                  <input
                    type="text"
                    value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: e.target.value })}
                    placeholder="예: 20명 선착순"
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <Info size={14} /> 설명 입력
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="커리큘럼, 준비물 및 안내사항"
                    rows={3}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                      resize: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    포스터 이미지 (선택)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {posterPreview && (
                    <img
                      src={posterPreview}
                      alt="포스터 미리보기"
                      style={{ width: '100%', marginTop: '10px', borderRadius: '12px', maxHeight: '200px', objectFit: 'cover' }}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#171717',
          display: 'flex', gap: '12px'
        }}>
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                color: '#fff', border: 'none', fontSize: '14px', fontWeight: 800, cursor: 'pointer'
              }}
            >
              이전
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                flex: 2, padding: '14px', borderRadius: '12px', background: '#C9A84C',
                color: '#000', border: 'none', fontSize: '14px', fontWeight: 900, cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(201, 168, 76, 0.2)'
              }}
            >
              다음 단계
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 2, padding: '14px', borderRadius: '12px', background: '#C9A84C',
                color: '#000', border: 'none', fontSize: '14px', fontWeight: 900, cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(201, 168, 76, 0.2)', opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '등록 중...' : '클래스 최종 등록 🚀'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ClassRegisterModal;
