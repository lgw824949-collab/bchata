import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { X, Plus, Trash2, Calendar, Clock, MapPin, DollarSign, Users, Info } from 'lucide-react';

const ClassRegisterModal = ({ isOpen = true, onClose, instructorId = '' }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState(instructorId || '');
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    genre: '',
    level: '',
    date: '',
    location: '',
    fee: '',
    capacity: '',
    description: ''
  });

  // Timeslots state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeslots, setTimeslots] = useState([]);

  // 활성 강사 목록 조회 (드롭다운용)
  useEffect(() => {
    if (!isOpen) return;
    const fetchInstructors = async () => {
      try {
        const { data } = await supabase
          .from('instructors')
          .select('id, name, city')
          .eq('status', 'active')
          .order('follower_count', { ascending: false });
        if (data) setInstructors(data);
      } catch (err) {
        console.error('Instructors fetch error:', err);
      }
    };
    fetchInstructors();
  }, [isOpen]);

  // props로 넘어온 instructorId가 바뀔 경우 동기화
  useEffect(() => {
    if (instructorId) setSelectedInstId(instructorId);
  }, [instructorId]);

  if (!isOpen) return null;

  const handleAddTimeslot = () => {
    if (!startTime || !endTime) {
      alert('시작 시간과 종료 시간을 모두 입력해주세요.');
      return;
    }
    setTimeslots(prev => [...prev, { startTime, endTime }]);
    setStartTime('');
    setEndTime('');
  };

  const handleRemoveTimeslot = (index) => {
    setTimeslots(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedInstId) {
        alert('강사 프로필을 선택해주세요.');
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
      if (!form.date) {
        alert('날짜를 선택해주세요.');
        return;
      }
      
      // 모바일 편의성: 시간 입력 후 추가 버튼 누락 시 자동 추가 처리
      let currentTimeslots = [...timeslots];
      if (startTime && endTime) {
        currentTimeslots.push({ startTime, endTime });
        setTimeslots(currentTimeslots);
        setStartTime('');
        setEndTime('');
      }

      if (currentTimeslots.length === 0) {
        alert('최소 1개 이상의 시간대를 추가해주세요.');
        return;
      }
      setStep(3);
    }
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!form.location.trim()) {
      alert('장소를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      // 각 시간대별로 개별 레코드 insert
      const insertPromises = timeslots.map(t => {
        return supabase.from('instructor_classes').insert({
          instructor_id: selectedInstId || null,
          title: form.title,
          genre: form.genre,
          level: form.level,
          schedule: `${form.date} ${t.startTime} ~ ${t.endTime}`,
          location: form.location,
          fee: form.fee,
          capacity: form.capacity,
          description: form.description,
          status: 'active'
        });
      });

      const results = await Promise.all(insertPromises);
      const hasError = results.some(res => res.error);

      if (hasError) {
        throw new Error('일부 시간대 등록에 실패했습니다.');
      }

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
      position: 'fixed', inset: 0, zIndex: 7000, background: 'rgba(0,0,0,0.8)',
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
                {/* 강사 프로필 선택 (드롭다운) */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    강사 프로필 선택 *
                  </label>
                  <select
                    value={selectedInstId}
                    onChange={e => setSelectedInstId(e.target.value)}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none'
                    }}
                  >
                    <option value="" style={{ color: '#000' }}>강사를 선택하세요</option>
                    {instructors.map(inst => (
                      <option key={inst.id} value={inst.id} style={{ color: '#000' }}>
                        {inst.name} ({inst.city || '지역미상'})
                      </option>
                    ))}
                  </select>
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
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                      boxSizing: 'border-box', colorScheme: 'dark'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <Clock size={14} /> 시간대 설정 *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                        colorScheme: 'dark'
                      }}
                    />
                    <span style={{ color: '#8E8E93', fontWeight: 900 }}>~</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none',
                        colorScheme: 'dark'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTimeslot}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(201,168,76,0.15)',
                      color: '#C9A84C', border: '1px dashed #C9A84C', fontSize: '13px', fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <Plus size={16} /> + 시간 추가
                  </button>
                </div>

                {/* Added timeslots list */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px' }}>
                    추가된 시간대 목록 ({timeslots.length})
                  </div>
                  {timeslots.length === 0 ? (
                    <div style={{
                      padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)',
                      borderRadius: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '13px'
                    }}>
                      아래 다음 단계 클릭 시 입력된 시간이 자동 추가됩니다
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '130px', overflowY: 'auto' }}>
                      {timeslots.map((t, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                            ⏰ {t.startTime} ~ {t.endTime}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTimeslot(index)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
