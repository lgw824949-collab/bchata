import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, Check, X, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'
import { findBarByName, BAR_DATABASE } from './lib/BarLib'

const METRO_REGIONS = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

const TITLE_EXAMPLES = [
  "[강남] 라틴클럽 바차타 맛집 ㅣ 오늘밤빠",
  "[홍대] 홍턴 외국인의 성지 소셜파티 ㅣ 오늘밤빠",
  "[청주] 살사사랑 화요일 정모 맛집 ㅣ 오늘밤빠",
  "[대구] 바야 구라짱이랑 놀자! 라틴 성지 ㅣ 오늘밤빠"
];

const RegisterForm = ({ onBack, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    location_name: '',
    address: '',
    date: new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '21:00',
    end_time: '02:00',
    fee: '20,000원',
    region: '',
    day_of_week: '',
    sRatio: 5,
    bRatio: 5,
    jRatio: 0,
    kRatio: 0
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(1)
  const [suggestions, setSuggestions] = useState([])
  const TOTAL_STEPS = 5

  const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토']

  useEffect(() => {
    if (formData.date) {
      const d = new Date(formData.date)
      const dayName = DAYS_KOR[d.getDay()]
      setFormData(prev => ({ ...prev, day_of_week: dayName }))
    }
  }, [formData.date])

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length <= 40) {
      setFormData(prev => ({ ...prev, title: value }));
    }
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
  }

  const classifyRegion = (address) => {
    if (!address) return ''
    if (address.includes('서울')) return '서울'
    if (address.includes('인천')) return '인천광역시'
    if (address.includes('경기') || address.includes('용인') || address.includes('수원') || address.includes('성남') || address.includes('고양')) return '경기도'
    if (address.includes('부산') || address.includes('대구') || address.includes('울산') || address.includes('경북') || address.includes('경남')) return '경상도'
    if (address.includes('광주') || address.includes('전북') || address.includes('전남')) return '전라도'
    if (address.includes('대전') || address.includes('세종') || address.includes('충북') || address.includes('충남')) return '충청도'
    if (address.includes('강원')) return '강원도'
    if (address.includes('제주')) return '제주도'
    return ''
  }

  const handleLocationNameChange = (name) => {
    setFormData(prev => ({ ...prev, location_name: name }))
    
    if (name.length >= 1) {
      const filtered = BAR_DATABASE.filter(bar => 
        bar.name.toLowerCase().includes(name.toLowerCase()) || 
        (bar.aliases && bar.aliases.some(a => a.toLowerCase().includes(name.toLowerCase())))
      ).slice(0, 5)
      setSuggestions(filtered)

      // 정확히 일치하는 경우 자동 입력
      const exactMatch = findBarByName(name)
      if (exactMatch && exactMatch.name === name) {
        setFormData(prev => ({ 
          ...prev, 
          address: exactMatch.address,
          region: exactMatch.region || classifyRegion(exactMatch.address)
        }))
        setSuggestions([])
      }
    } else {
      setSuggestions([])
    }
  }

  const selectSuggestion = (bar) => {
    setFormData(prev => ({
      ...prev,
      location_name: bar.name,
      address: bar.address,
      region: bar.region || classifyRegion(bar.address)
    }))
    setSuggestions([])
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    if (!formData.title || !formData.location_name || !formData.date || !formData.region) {
      alert('필수 정보를 모두 입력해주세요. (제목, 장소명, 날짜, 지역)')
      return
    }

    setLoading(true)
    try {
      let finalPosterUrl = ''
      if (file) {
        const fileName = `${Math.random()}.jpg`
        await supabase.storage.from('posters').upload(`posters/${fileName}`, file)
        const { data } = supabase.storage.from('posters').getPublicUrl(`posters/${fileName}`)
        finalPosterUrl = data.publicUrl
      }

      const { data: existingLoc } = await supabase
        .from('locations')
        .select('id')
        .eq('name', formData.location_name)
        .maybeSingle()

      if (!existingLoc) {
        const targetRegion = formData.region || classifyRegion(formData.address) || '서울'
        const { data: reg } = await supabase.from('regions').select('id').ilike('name', `%${targetRegion}%`).limit(1).maybeSingle()
        await supabase.from('locations').insert([{
          name: formData.location_name,
          address: formData.address,
          region_id: reg?.id || 1
        }])
      }

      let finalProcessedTitle = formData.title.trim();
      const suffix = " ㅣ 오늘밤빠";
      if (finalProcessedTitle && !finalProcessedTitle.includes("오늘밤빠")) {
        finalProcessedTitle = `${finalProcessedTitle}${suffix}`;
      }

      const { error } = await supabase.from('pending_parties').insert([{
        title: `[${formData.region}] ${finalProcessedTitle}`,
        location_name: formData.location_name,
        address: formData.address,
        fee: formData.fee,
        date: formData.date,
        time: formData.time,
        day_of_week: formData.day_of_week,
        poster_url: finalPosterUrl,
        s_ratio: formData.sRatio,
        b_ratio: formData.bRatio,
        j_ratio: formData.jRatio,
        k_ratio: formData.kRatio,
        status: 'pending'
      }])

      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      alert('등록 저장 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 18; h <= 23; h++) { slots.push({ value: `${h}:00`, label: `오후 ${h - 12}:00` }); slots.push({ value: `${h}:30`, label: `오후 ${h - 12}:30` }); }
    for (let h = 0; h <= 5; h++) { const hh = String(h).padStart(2, '0'); slots.push({ value: `${hh}:00`, label: `새벽 ${h}:00` }); slots.push({ value: `${hh}:30`, label: `새벽 ${h}:30` }); }
    return slots;
  })();

  if (submitted) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#FF1744', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Check size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>등록 신청 완료!</h2>
          <p style={{ fontSize: '16px', color: '#64748B', lineHeight: '1.6', marginBottom: '32px' }}>관리자 승인 후 즉시 노출됩니다.</p>
          <button onClick={onSuccess || onBack} style={{ width: '100%', padding: '20px', background: '#FF1744', color: 'white', borderRadius: '16px', fontWeight: 900, fontSize: '18px', border: 'none' }}>확인</button>
        </motion.div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>📸 파티 포스터 선택</label>
            <div onClick={() => document.getElementById('poster-upload').click()} style={{ height: '350px', border: '2px dashed #E2E8F0', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', overflow: 'hidden' }}>
              {file ? (
                <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <>
                  <Plus size={40} color="#FF1744" style={{ marginBottom: '16px' }} />
                  <p style={{ fontWeight: 700, color: '#64748B' }}>탭하여 사진 업로드</p>
                </>
              )}
            </div>
            <input type="file" id="poster-upload" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>✍️ 파티 제목 입력</label>
            <textarea 
              value={formData.title} 
              onChange={handleTitleChange} 
              placeholder="예: 강남 턴 바차타 정모 맛집!" 
              style={{ width: '100%', height: '120px', padding: '20px', border: '2px solid #F1F5F9', borderRadius: '20px', fontSize: '18px', fontWeight: 700, background: '#F8FAFC', outline: 'none', resize: 'none' }} 
            />
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#94A3B8' }}>* 지역과 제목을 알기 쉽게 적어주세요 (최대 40자)</p>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>📍 장소 및 지역 선택</label>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>장소 이름</p>
              <input type="text" value={formData.location_name} onChange={e => handleLocationNameChange(e.target.value)} placeholder="예: 홍대 보니따" style={{ width: '100%', padding: '18px', border: '2px solid #F1F5F9', borderRadius: '16px', fontSize: '16px', background: '#F8FAFC' }} />
              
              {/* Autocomplete Suggestions */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginTop: '8px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                    {suggestions.map((bar, i) => (
                      <div key={i} onClick={() => selectSuggestion(bar)} style={{ padding: '16px', borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#FEF2F2', padding: '8px', borderRadius: '8px' }}>
                          <MapPin size={16} color="#FF1744" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B' }}>{bar.name}</p>
                          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{bar.address}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>상세 주소</p>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="장소 선택 시 주소가 자동 입력됩니다" style={{ width: '100%', padding: '18px', border: '2px solid #F1F5F9', borderRadius: '16px', fontSize: '15px', background: '#F8FAFC' }} />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '12px' }}>대분류 지역</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['서울', '경기도', '인천광역시', '경상도', '전라도', '충청도', '강원도', '제주도'].map(r => (
                <button key={r} type="button" onClick={() => setFormData({...formData, region: r})} style={{ padding: '12px 0', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 800, background: formData.region === r ? '#FF1744' : '#F1F5F9', color: formData.region === r ? '#fff' : '#64748B' }}>{r.replace('도','').replace('광역시','')}</button>
              ))}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>🎶 음악 비율 & 입장료</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {[{l:'B',k:'bRatio'},{l:'S',k:'sRatio'},{l:'J',k:'jRatio'},{l:'K',k:'kRatio'}].map(g => (
                <div key={g.k} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#FF1744', marginBottom: '4px' }}>{g.l}</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>{formData[g.k]}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={()=>setFormData(p=>({...p,[g.k]:Math.max(0,p[g.k]-1)}))} style={{ flex: 1, border: 'none', background: '#fff', borderRadius: '6px', height: '30px' }}>-</button>
                    <button type="button" onClick={()=>setFormData(p=>({...p,[g.k]:Math.min(10,p[g.k]+1)}))} style={{ flex: 1, border: 'none', background: '#fff', borderRadius: '6px', height: '30px' }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '12px' }}>입장료 선택</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {['8,000원', '10,000원', '12,000원', '15,000원', '18,000원', '20,000원', '25,000원', '30,000원'].map(price => (
                <button 
                  key={price} 
                  type="button" 
                  onClick={() => setFormData({...formData, fee: price})} 
                  style={{ 
                    padding: '12px 0', 
                    border: 'none', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    background: formData.fee === price ? '#FF1744' : '#F1F5F9', 
                    color: formData.fee === price ? '#fff' : '#64748B',
                    transition: 'all 0.2s'
                  }}
                >
                  {price.replace(',000원', '천').replace('0,000원', '만').replace('20,000원', '2만').replace('25,000원', '2.5만').replace('30,000원', '3만')}
                  {price === '8,000원' ? '8천' : price === '10,000원' ? '1만' : price === '12,000원' ? '1.2만' : price === '15,000원' ? '1.5만' : price === '18,000원' ? '1.8만' : ''}
                </button>
              ))}
            </div>
            <input 
              type="text" 
              value={formData.fee} 
              onChange={e => setFormData({...formData, fee: e.target.value})} 
              placeholder="또는 직접 입력 (예: 2만원)" 
              style={{ width: '100%', padding: '18px', border: '2px solid #F1F5F9', borderRadius: '16px', fontSize: '16px', background: '#F8FAFC', fontWeight: 700 }} 
            />
          </motion.div>
        );
      case 5:
        return (
          <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>📅 파티 일정 확인</label>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>파티 날짜</p>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '20px', border: '2px solid #F1F5F9', borderRadius: '16px', fontSize: '18px', fontWeight: 900, background: '#F8FAFC' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>시작 시간</p>
                <select value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={{ width: '100%', padding: '18px', border: '2px solid #F1F5F9', borderRadius: '16px', background: '#F8FAFC' }}>{TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>종료 시간</p>
                <select value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} style={{ width: '100%', padding: '18px', border: '2px solid #F1F5F9', borderRadius: '16px', background: '#F8FAFC' }}>{TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
              </div>
            </div>
          </motion.div>
        );
      default: return null;
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onBack} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} />
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }} 
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '32px 32px 0 0', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => { if(step > 1) setStep(step - 1); else onBack(); }} style={{ border: 'none', background: 'none', color: '#1E293B' }}><ChevronLeft size={24} /></button>
          <span style={{ fontWeight: 900, fontSize: '18px' }}>파티 등록 신청 ({step}/{TOTAL_STEPS})</span>
          <button onClick={onBack} style={{ border: 'none', background: 'none', color: '#94A3B8' }}><X size={24} /></button>
        </div>

        <div style={{ height: '4px', background: '#F1F5F9', width: '100%' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} style={{ height: '100%', background: '#FF1744' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '12px' }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, height: '60px', borderRadius: '18px', background: '#F1F5F9', color: '#64748B', fontWeight: 900, border: 'none' }}>이전</button>}
          <button 
            onClick={() => { if(step < TOTAL_STEPS) setStep(step + 1); else handleSubmit(); }} 
            disabled={loading}
            style={{ flex: 2, height: '60px', borderRadius: '18px', background: '#FF1744', color: 'white', fontWeight: 900, fontSize: '18px', border: 'none', boxShadow: '0 8px 20px rgba(255, 23, 68, 0.2)' }}
          >
            {loading ? '처리 중...' : (step === TOTAL_STEPS ? '등록 완료' : '다음 단계')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default RegisterForm
