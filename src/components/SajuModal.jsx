import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Moon, Sun, Star, MapPin, Calendar, Heart, X, User, Lightbulb } from 'lucide-react';
import { ALL_RESULTS, selectResult, OHENG_GENRE } from '../data/sajuResults'

const SajuModal = ({ onClose, parties }) => {
  const [step, setStep] = useState('input'); // 'input' | 'loading' | 'result'
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('모름'); // 태어난 시간 추가
  const [gender, setGender] = useState(''); // 'male' | 'female'
  const [result, setResult] = useState(null);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    setStep('input');
    setResult(null);
  }, []);

  const handleAnalysis = () => {
    if (!birthDate || !gender) {
      alert('생년월일과 성별을 모두 선택해주세요!');
      return;
    }
    setStep('loading');
    
    setTimeout(() => {
      // 생년월일에서 월/일 추출
      const [y, m, d] = birthDate.split('-').map(Number);
      
      // 오행 기반 행운의 장르 결정 (월 기준 예시)
      const ohengKeys = Object.keys(OHENG_GENRE);
      const luckyOheng = ohengKeys[m % ohengKeys.length];
      const luckyGenre = OHENG_GENRE[luckyOheng];
      
      const luckyMoods = ['로맨틱한', '열정적인', '우아한', '파워풀한'];
      const randomMood = luckyMoods[d % luckyMoods.length];
      
      // 데이터 기반 상세 결과 도출
      const specificResult = selectResult(luckyGenre, gender, m, d, parties.length);
      
      let luckyParty = null;
      if (parties && parties.length > 0) {
        luckyParty = parties[d % parties.length];
      }

      setResult({
        ...specificResult,
        mood: randomMood,
        party: luckyParty
      });
      setStep('result');
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '30px',
          padding: '30px',
          position: 'relative',
          color: '#fff',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, background: 'linear-gradient(to right, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            오늘의 댄스 사주
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '5px', color: '#fff' }}>
            <X size={20} />
          </button>
        </div>

        {step === 'input' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px', fontWeight: 600 }}>생년월일</p>
              <input 
                type="date" 
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={{ 
                  width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px', outline: 'none'
                }}
              />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px', fontWeight: 600 }}>태어난 시간</p>
              <select 
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                style={{ 
                  width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '16px', outline: 'none', appearance: 'none'
                }}
              >
                <option value="모름">시간 모름</option>
                <option value="자시">자시 (23:30 ~ 01:29)</option>
                <option value="축시">축시 (01:30 ~ 03:29)</option>
                <option value="인시">인시 (03:30 ~ 05:29)</option>
                <option value="묘시">묘시 (05:30 ~ 07:29)</option>
                <option value="진시">진시 (07:30 ~ 09:29)</option>
                <option value="사시">사시 (09:30 ~ 11:29)</option>
                <option value="오시">오시 (11:30 ~ 13:29)</option>
                <option value="미시">미시 (13:30 ~ 15:29)</option>
                <option value="신시">신시 (15:30 ~ 17:29)</option>
                <option value="유시">유시 (17:30 ~ 19:29)</option>
                <option value="술시">술시 (19:30 ~ 21:29)</option>
                <option value="해시">해시 (21:30 ~ 23:29)</option>
              </select>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px', fontWeight: 600 }}>성별</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  onClick={() => setGender('male')}
                  style={{ 
                    padding: '15px', borderRadius: '15px', border: gender === 'male' ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.1)',
                    background: gender === 'male' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
                    color: gender === 'male' ? '#FFD700' : '#fff', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  남성
                </button>
                <button 
                  onClick={() => setGender('female')}
                  style={{ 
                    padding: '15px', borderRadius: '15px', border: gender === 'female' ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.1)',
                    background: gender === 'female' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
                    color: gender === 'female' ? '#FFD700' : '#fff', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  여성
                </button>
              </div>
            </div>
            <button 
              onClick={handleAnalysis}
              style={{ 
                marginTop: '10px', width: '100%', padding: '16px', borderRadius: '15px', border: 'none',
                background: 'linear-gradient(to right, #FFD700, #FFA500)', color: '#000', fontSize: '17px', fontWeight: 900, cursor: 'pointer'
              }}
            >
              사주 분석하기
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <Moon size={60} color="#FFD700" fill="#FFD700" />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#aaa', letterSpacing: '2px' }}>우주의 흐름을 분석 중...</p>
          </div>
        )}

        {step === 'result' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '5px' }}>
              <p style={{ fontSize: '13px', color: '#FFD700', fontWeight: 800, marginBottom: '8px', letterSpacing: '2px' }}>[ {result.title} ]</p>
              <h3 style={{ fontSize: '15px', color: '#fff', fontWeight: 900, lineHeight: '1.5' }}>{result.desc}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>행운의 종목</p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#FFD700' }}>{result.genre}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>오늘의 기운</p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#FFD700' }}>{result.mood}</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,215,0,0.05)', padding: '18px', borderRadius: '18px', border: '1px dashed rgba(255,215,0,0.2)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Lightbulb size={20} color="#FFD700" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#e0e0e0' }}>
                <span style={{ color: '#FFD700', fontWeight: 800 }}>DANCE TIP:</span> {result.tip}
              </p>
            </div>
            {result.party && (
              <div>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '10px', fontWeight: 700 }}>우주가 점지한 파티 🌠</p>
                <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px' }}>
                  <img src={result.party.poster_url} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ fontSize: '13px', fontWeight: 900, marginBottom: '2px' }}>{result.party.title?.split('|')[0]}</p>
                    <p style={{ fontSize: '11px', color: '#888' }}>{result.party.locationName} · {result.party.date.slice(5)}</p>
                  </div>
                </div>
              </div>
            )}
            <div style={{ 
              marginTop: '10px', 
              padding: '20px', 
              borderRadius: '24px', 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.2) 100%)', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '13px', 
                color: '#93c5fd', 
                lineHeight: '1.6', 
                fontWeight: 800,
                marginBottom: '15px' 
              }}>
                🔮 당신의 댄스 운세가 우주에 등록되었습니다.<br/>
                오늘의 행운을 놓치지 마세요!
              </p>
              <button 
                onClick={onClose}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  borderRadius: '16px', 
                  border: 'none',
                  background: '#2563eb', 
                  color: '#fff', 
                  fontSize: '15px', 
                  fontWeight: 900, 
                  cursor: 'pointer'
                }}
              >
                운세 확인 완료
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SajuModal;
