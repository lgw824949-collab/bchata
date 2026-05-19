import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../constants/zLayers';
import { X, Search, PlusCircle, MapPin, Star, MessageCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

const REGIONS = ['서울', '경인', '부산', '대구', '대전', '광주', '기타'];
const LEVELS = ['처음이에요', '초급', '중급', '고수'];

export default function PartnerModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('find'); // 'find' | 'register'
  
  // Register State
  const [date, setDate] = useState(() => {
    return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [region, setRegion] = useState('서울');
  const [level, setLevel] = useState('초급');
  const [intro, setIntro] = useState('');
  const [kakaoId, setKakaoId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find State
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRegion, setFilterRegion] = useState('전체');
  const [filterLevel, setFilterLevel] = useState('전체');

  useEffect(() => {
    if (activeTab === 'find') {
      fetchPartners();
    }
  }, [activeTab, filterRegion, filterLevel]);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('partner_requests')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (filterRegion !== '전체') {
        query = query.eq('region', filterRegion);
      }
      if (filterLevel !== '전체') {
        query = query.eq('level', filterLevel);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error('파트너 목록을 불러오는 중 오류 발생:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!intro.trim()) return alert('한줄 소개를 입력해주세요.');
    if (!kakaoId.trim()) return alert('카카오톡 링크 또는 ID를 입력해주세요.');
    
    setIsSubmitting(true);
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase.from('partner_requests').insert([{
        date,
        region,
        level,
        intro: intro.trim(),
        kakao_id: kakaoId.trim(),
        expires_at: expiresAt
      }]);

      if (error) throw error;
      
      alert('등록이 완료되었습니다. 24시간 동안 유지됩니다.');
      setActiveTab('find');
      setIntro('');
      setKakaoId('');
    } catch (err) {
      console.error('등록 중 오류 발생:', err);
      alert('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContact = (idOrLink) => {
    if (idOrLink.startsWith('http')) {
      window.open(idOrLink, '_blank');
    } else if (idOrLink.includes('open.kakao.com')) {
      window.open('https://' + idOrLink.replace(/^https?:\/\//, ''), '_blank');
    } else {
      // 일반 ID인 경우 클립보드 복사 후 안내
      navigator.clipboard.writeText(idOrLink).then(() => {
        alert(`카카오톡 ID(${idOrLink})가 복사되었습니다.\n카카오톡에서 친구 추가 후 연락해보세요!`);
      }).catch(() => {
        alert(`카카오톡 ID: ${idOrLink}`);
      });
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        transition={{ duration: 0.15 }}
        style={{ 
          position: 'fixed', inset: 0, background: 'var(--color-bg, #ffffff)', zIndex: Z.modal, 
          display: 'flex', flexDirection: 'column', height: '100dvh',
          paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <img
          src="/Photo/파트너1.png"
          alt="파트너 배너"
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
        />

        {/* 헤더 */}
        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--color-border, #e2e8f0)', background: 'var(--color-bg, #ffffff)', flexShrink: 0 }}>
          <div style={{ color: 'var(--color-text-main, #1e293b)', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E53935' }} />
            파트너 구하기
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'var(--color-border, #e2e8f0)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main, #1e293b)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div style={{ display: 'flex', padding: '15px 20px 5px', gap: '15px', flexShrink: 0 }}>
          <div 
            onClick={() => setActiveTab('find')}
            style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderBottom: activeTab === 'find' ? '3px solid #E53935' : '3px solid transparent', color: activeTab === 'find' ? '#E53935' : '#94A3B8', fontWeight: 800, fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            파트너 찾기
          </div>
          <div 
            onClick={() => setActiveTab('register')}
            style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderBottom: activeTab === 'register' ? '3px solid #E53935' : '3px solid transparent', color: activeTab === 'register' ? '#E53935' : '#94A3B8', fontWeight: 800, fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            파트너 등록
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F8FAFC' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'find' ? (
              <motion.div key="find" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 필터 영역 */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    value={filterRegion} 
                    onChange={(e) => setFilterRegion(e.target.value)}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 700, color: '#1E293B', appearance: 'none', background: '#fff' }}
                  >
                    <option value="전체">지역 전체</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select 
                    value={filterLevel} 
                    onChange={(e) => setFilterLevel(e.target.value)}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 700, color: '#1E293B', appearance: 'none', background: '#fff' }}
                  >
                    <option value="전체">레벨 전체</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* 목록 영역 */}
                {isLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>목록을 불러오는 중...</div>
                ) : partners.length === 0 ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Search size={28} color="#94A3B8" />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 5px', color: '#1E293B', fontSize: '16px', fontWeight: 800 }}>조건에 맞는 파트너가 없습니다</p>
                      <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>가장 먼저 파트너를 등록해보세요!</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('register')}
                      style={{ marginTop: '10px', padding: '10px 20px', background: '#E53935', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                    >
                      파트너 등록하기
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {partners.map(p => (
                      <div key={p.id} style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ background: '#FEF2F2', color: '#E53935', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
                              {p.region}
                            </span>
                            <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                              {p.level}
                            </span>
                            <span style={{ background: '#F8FAFC', color: '#64748B', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} /> {p.date}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p style={{ margin: '0 0 20px', fontSize: '16px', color: '#1E293B', fontWeight: 700, lineHeight: 1.5, wordBreak: 'keep-all' }}>
                          "{p.intro}"
                        </p>
                        
                        <button 
                          onClick={() => handleContact(p.kakao_id)}
                          style={{ width: '100%', padding: '14px', background: '#1E293B', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <MessageCircle size={18} /> 연락하기
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 800, color: '#475569' }}>희망 날짜</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', fontWeight: 700, color: '#1E293B', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 800, color: '#475569' }}>지역</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {REGIONS.map(r => (
                      <button 
                        key={r}
                        onClick={() => setRegion(r)}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: region === r ? 'none' : '1px solid #E2E8F0', background: region === r ? '#E53935' : '#fff', color: region === r ? '#fff' : '#64748B', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 800, color: '#475569' }}>본인 레벨</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {LEVELS.map(l => (
                      <button 
                        key={l}
                        onClick={() => setLevel(l)}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: level === l ? 'none' : '1px solid #E2E8F0', background: level === l ? '#1E293B' : '#fff', color: level === l ? '#fff' : '#64748B', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 800, color: '#475569' }}>한줄 소개 (최대 30자)</label>
                  <input 
                    type="text" 
                    placeholder="예: 편하게 즐기실 파트너 구해요!"
                    maxLength={30}
                    value={intro} 
                    onChange={(e) => setIntro(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', fontWeight: 600, color: '#1E293B', boxSizing: 'border-box' }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#94A3B8', marginTop: '6px', fontWeight: 600 }}>{intro.length}/30</div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 800, color: '#475569' }}>카카오톡 오픈채팅 링크 (또는 ID)</label>
                  <input 
                    type="text" 
                    placeholder="상대방이 연락할 수 있는 수단 입력"
                    value={kakaoId} 
                    onChange={(e) => setKakaoId(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', fontWeight: 600, color: '#1E293B', boxSizing: 'border-box' }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#F97316', fontWeight: 600, lineHeight: 1.4 }}>
                    * 입력하신 연락처는 등록 후 24시간이 지나면 자동 삭제됩니다.
                  </p>
                </div>

                <button 
                  onClick={handleRegister}
                  disabled={isSubmitting}
                  style={{ marginTop: '10px', width: '100%', padding: '16px', background: isSubmitting ? '#94A3B8' : '#E53935', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: isSubmitting ? 'none' : '0 8px 16px rgba(229, 57, 53, 0.2)' }}
                >
                  {isSubmitting ? '등록 중...' : <><PlusCircle size={20} /> 구하기 등록</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div style={{ height: '40px' }} />
        </div>
      </motion.div>
    </>
  );
}
