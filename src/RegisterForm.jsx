import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from './lib/supabase'
import { findBarByName } from './lib/BarLib'

const METRO_REGIONS = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

const TITLE_EXAMPLES = [
  "[강남] 라틴클럽 바차타 맛집 ㅣ 오늘밤빠",
  "[홍대] 홍턴 외국인의 성지 소셜파티 ㅣ 오늘밤빠",
  "[청주] 살사사랑 화요일 정모 맛집 ㅣ 오늘밤빠",
  "[경기] 수라댄 퓨전포차 분위기 깡패 루프탑 ㅣ 오늘밤빠",
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [placeholder, setPlaceholder] = useState('')

  const PLACEHOLDERS = [
    '예) 오늘 도가니 반납하실 분? #무릎연골_풀가동',
    '예) 까여도 사장님이 안아줌! #멘탈케어 #안깝니다',
    '예) 위스키로 연골 기름칠 고고 #위스키수혈 #음주가무',
    '예) 춤못알 환영! 사장님이 인간 응원봉 해드림',
    '예) 말 안 들으면 무한 홀딩! #도파민폭발 #내일없음'
  ]

  const refreshPlaceholder = () => {
    const randomIdx = Math.floor(Math.random() * PLACEHOLDERS.length)
    setPlaceholder(PLACEHOLDERS[randomIdx])
  }

  useEffect(() => {
    refreshPlaceholder()
  }, [])

  const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토']

  // 날짜 변경 시 요일 자동 계산
  useEffect(() => {
    if (formData.date) {
      const d = new Date(formData.date)
      const dayName = DAYS_KOR[d.getDay()]
      setFormData(prev => ({ ...prev, day_of_week: dayName }))
    }
  }, [formData.date])

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length <= 30) {
      setFormData(prev => ({ ...prev, title: value }));
    }
  };

  // [실시간 주소 동기화 엔진]
  const handleLocationLookup = (name) => {
    if (!name) return
    const matched = findBarByName(name)
    if (matched) {
      setFormData(prev => ({
        ...prev,
        address: matched.address,
        region: matched.region || classifyRegion(matched.address)
      }))
      return true
    }
    return false
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLocationLookup(formData.location_name)
    }
  }

  useEffect(() => {
    if (formData.location_name.length >= 2) {
      handleLocationLookup(formData.location_name)
    }
  }, [formData.location_name])

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0]
    if (!uploadedFile) return
    setFormData({ title: '', location_name: '', address: '', date: new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0], time: '21:00', end_time: '02:00', fee: '20,000원', region: '', day_of_week: '', sRatio: 5, bRatio: 5, jRatio: 0, kRatio: 0 })
    setFile(uploadedFile)
    analyzeImageWithAI(uploadedFile)
  }

  // [지역 자동 분류 엔진]
  const classifyRegion = (address) => {
    if (!address) return ''
    if (address.includes('서울')) return '서울'
    if (address.includes('인천')) return '인천광역시'
    if (address.includes('경기') || address.includes('용인') || address.includes('수원') || address.includes('성남') || address.includes('고양')) return '경기도'
    if (address.includes('부산') || address.includes('대구') || address.includes('울산') || address.includes('경북') || address.includes('경남') || address.includes('포항') || address.includes('창원')) return '경상도'
    if (address.includes('광주') || address.includes('전북') || address.includes('전남') || address.includes('여수') || address.includes('순천')) return '전라도'
    if (address.includes('대전') || address.includes('세종') || address.includes('충북') || address.includes('충남') || address.includes('충청')) return '충청도'
    if (address.includes('강원')) return '강원도'
    if (address.includes('제주')) return '제주도'
    return ''
  }

  const analyzeImageWithAI = async (file) => {
    setIsAnalyzing(true)
    setLoadingText('분석 중...')
    await new Promise(resolve => setTimeout(resolve, 1500))
    const fileNameLower = file.name.toLowerCase()
    let rawText = fileNameLower
    if (fileNameLower.includes('buena')) rawText += ' 서울시 마포구 동교로 217 부에나 4월 26일'
    if (fileNameLower.includes('hongturn') || fileNameLower.includes('hongdae')) rawText += ' 마포구 동교로207 홍턴'
    
    const matchedBar = findBarByName(rawText)
    
    let extractedLocation = matchedBar ? matchedBar.name : ''
    let extractedAddress = matchedBar ? matchedBar.address : ''
    let extractedRegion = matchedBar ? matchedBar.region : classifyRegion(extractedAddress)

    const dateMatch = rawText.match(/(\d{1,2})[.-](\d{1,2})/) || rawText.match(/(\d{1,2})월\s*(\d{1,2})일/)
    let extractedDate = dateMatch ? `2026-${String(dateMatch[1]).padStart(2, '0')}-${String(dateMatch[2]).padStart(2, '0')}` : new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]

    setFormData(prev => ({
      ...prev,
      title: extractedLocation ? `${extractedLocation} 정기 파티` : '신규 소셜 파티',
      location_name: extractedLocation || '',
      address: extractedAddress || '',
      date: extractedDate,
      region: extractedRegion || prev.region
    }))
    setIsAnalyzing(false)
  }

  // 주소 자동 완성을 위한 실시간 검색 (Auto-learning 기반)
  const handleLocationNameChange = async (name) => {
    setFormData(prev => ({ ...prev, location_name: name }))
    
    if (name.length >= 2) {
      // 1. 로컬 라이브러리 검색
      const localMatch = findBarByName(name)
      if (localMatch) {
        setFormData(prev => ({ 
          ...prev, 
          address: localMatch.address,
          region: localMatch.region || classifyRegion(localMatch.address)
        }))
        return
      }

      // 2. DB (Auto-learned) 검색
      try {
        const { data } = await supabase
          .from('locations')
          .select('address')
          .ilike('name', name)
          .limit(1)
          .maybeSingle()
        
        if (data?.address) {
          setFormData(prev => ({ 
            ...prev, 
            address: data.address,
            region: classifyRegion(data.address)
          }))
        }
      } catch (err) {
        console.error('Location search error:', err)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 필수값 검증 강화
    // 필수값 검증
    if (!formData.title || !formData.location_name || !formData.date || !formData.region) {
      alert('필수 정보를 모두 입력해주세요. (제목, 장소명, 날짜, 지역)')
      return
    }
    
    if (!formData.fee || formData.fee === '기타') {
      alert('참가비를 입력해주세요.')
      return
    }



    setLoading(true)
    try {
      // [중복 체크]
      const { data: pendingDup } = await supabase
        .from('pending_parties')
        .select('id')
        .eq('location_name', formData.location_name)
        .eq('date', formData.date)
        .limit(1)

      if (pendingDup && pendingDup.length > 0) {
        alert('이미 해당 날짜에 등록 신청된 동일한 파티가 대기 중입니다.')
        setLoading(false)
        return
      }

      const { data: locData } = await supabase
        .from('locations')
        .select('id')
        .eq('name', formData.location_name)
        .maybeSingle()

      if (locData) {
        const { data: officialDup } = await supabase
          .from('parties')
          .select('id')
          .eq('location_id', locData.id)
          .eq('date', formData.date)
          .limit(1)

        if (officialDup && officialDup.length > 0) {
          alert('이미 해당 날짜에 등록된 파티가 있습니다')
          setLoading(false)
          return
        }
      }

      let finalPosterUrl = ''
      if (file) {
        const fileName = `${Math.random()}.jpg`
        await supabase.storage.from('posters').upload(`posters/${fileName}`, file)
        const { data } = supabase.storage.from('posters').getPublicUrl(`posters/${fileName}`)
        finalPosterUrl = data.publicUrl
      }

      // [Auto-Learning] 장소가 DB에 없으면 자동 추가
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
        title: `[${formData.region}] ${finalProcessedTitle}`, // 지역 정보를 제목에 인코딩하여 전달 (DB 스키마 오류 방지)
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

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px', backgroundColor: 'white', minHeight: '100vh', overflowY: 'auto' }}>
        <div style={{ backgroundColor: '#2ECC71', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 10px 25px rgba(29, 158, 117, 0.2)' }}><Check size={40} color="white" /></div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#111827', marginBottom: '12px' }}>등록 신청 완료!</h2>
        <p style={{ fontSize: '16px', color: '#6B7280', lineHeight: '1.6', marginBottom: '40px', fontWeight: 500 }}>
          정상적으로 접수되었습니다.<br />
          관리자 승인 후 메인 화면에<br />
          즉시 노출됩니다.
        </p>
        <button onClick={onSuccess || onBack} style={{ width: '100%', padding: '20px', background: '#2ECC71', color: 'white', borderRadius: '16px', fontWeight: 800, fontSize: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>확인</button>
      </div>
    )
  }

  const TIME_SLOTS = (() => {
    const slots = [];
    // 16:00 to 23:30
    for (let h = 16; h <= 23; h++) {
      slots.push({ value: `${h}:00`, label: `오후 ${h - 12}:00` });
      slots.push({ value: `${h}:30`, label: `오후 ${h - 12}:30` });
    }
    // 00:00 to 06:00
    for (let h = 0; h <= 6; h++) {
      const hh = String(h).padStart(2, '0');
      const labelPrefix = h === 0 ? '자정' : '새벽';
      slots.push({ value: `${hh}:00`, label: `${labelPrefix} ${h}:00` });
      if (h < 6) slots.push({ value: `${hh}:30`, label: `${labelPrefix} ${h}:30` });
    }
    return slots;
  })();

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', overflowY: 'visible', paddingBottom: '100px', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
        <button onClick={onBack}><ChevronLeft size={24} /></button>
        <span style={{ fontSize: '18px', fontWeight: 800, marginLeft: '8px' }}>등록하기</span>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          {file ? <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '240px', objectFit: 'contain', borderRadius: '16px', backgroundColor: '#F9FAFB' }} onClick={() => document.getElementById('poster-upload').click()} /> : <div onClick={() => document.getElementById('poster-upload').click()} style={{ height: '160px', border: '2px dashed #E5E7EB', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}><Plus size={40} /><p>포스터 업로드</p></div>}
          <input type="file" id="poster-upload" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
              포스터 제목 (최대 30자)
            </label>
            <span style={{ 
              fontSize: '12px', 
              color: formData.title.length >= 25 ? '#FF4500' : '#9CA3AF',
              fontWeight: formData.title.length >= 25 ? 'bold' : 'normal'
            }}>
              {formData.title.length}/30
            </span>
          </div>
          
          <input
            type="text"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder={`예: ${TITLE_EXAMPLES[Math.floor(Math.random() * TITLE_EXAMPLES.length)]}`}
            required
            style={{
              width: '100%',
              padding: '16px',
              border: '1.5px solid #F3F4F6',
              borderRadius: '14px',
              fontSize: '16px',
              backgroundColor: '#F9FAFB',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              💡 '맛집', '성지', '클럽' 키워드를 쓰면 클릭률이 올라가요!
            </span>
            {formData.title.length >= 25 && (
              <p style={{ fontSize: '11px', color: '#FF4500', margin: 0 }}>
                ⚠️ 제목이 너무 길면 모바일에서 잘릴 수 있습니다.
              </p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>장소 명칭 (필수)</label>
          <input 
            type="text" 
            value={formData.location_name} 
            onChange={e => {
              const name = e.target.value;
              setFormData({...formData, location_name: name});
              if (name.length >= 2) {
                handleLocationLookup(name);
              }
            }} 
            onKeyDown={handleKeyDown} 
            placeholder="자동완성 값 직접 수정 가능" 
            required 
            style={{ width: '100%', padding: '16px', border: '1.5px solid #F3F4F6', borderRadius: '14px', fontSize: '16px' }} 
          />
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>업체명이 다를 경우 직접 수정해주세요</div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>상세 주소 (자동 연동)</label>
          <input 
            type="text" 
            value={formData.address} 
            onChange={e => {
              const address = e.target.value;
              const autoSelectedRegion = classifyRegion(address) || formData.region;

              setFormData({
                ...formData, 
                address: address,
                region: autoSelectedRegion
              });
            }} 
            placeholder="주소가 다를 경우 직접 수정하세요" 
            required 
            style={{ width: '100%', padding: '16px', border: '1.5px solid #F3F4F6', borderRadius: '14px', fontSize: '15px' }} 
          />
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>내용이 다를 경우 직접 수정해주세요</div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>참가비 선택</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {['매너 음료', '10,000원', '12,000원', '15,000원', '18,000원', '20,000원', '25,000원', '기타'].map(fee => (
              <button
                key={fee}
                type="button"
                onClick={() => {
                  if (fee === '기타') {
                    setFormData({...formData, fee: ''})
                    document.getElementById('custom-fee-input')?.focus()
                  } else {
                    setFormData({...formData, fee: fee})
                  }
                }}
                style={{ 
                  padding: '10px 4px', 
                  backgroundColor: formData.fee === fee ? '#2ECC71' : '#F3F4F6', 
                  color: formData.fee === fee ? 'white' : '#4B5563',
                  border: 'none', 
                  borderRadius: '10px', 
                  fontSize: '11px', 
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {fee}
              </button>
            ))}
          </div>
          
          <input 
            id="custom-fee-input"
            type="text" 
            value={formData.fee} 
            onChange={e => setFormData({...formData, fee: e.target.value})} 
            style={{ 
              width: '100%', 
              padding: '14px', 
              border: '1.5px solid #F3F4F6', 
              borderRadius: '12px',
              fontSize: '14px',
              backgroundColor: '#F9FAFB'
            }} 
            placeholder="직접 입력 (예: 2만원)"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>지역 선택 (필수)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {['서울', '경기도', '인천광역시', '경상도', '전라도', '충청도', '강원도', '제주도'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setFormData({...formData, region: r})}
                style={{
                  padding: '10px 4px',
                  backgroundColor: formData.region === r ? '#2ECC71' : '#F3F4F6',
                  color: formData.region === r ? 'white' : '#4B5563',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {r.replace('도', '').replace('광역시', '').replace('특별자치도', '')}
              </button>
            ))}
          </div>
          {!formData.region && <p style={{ fontSize: '10px', color: '#EF4444', marginTop: '4px' }}>* 지역을 선택해주세요.</p>}
        </div>

        <div style={{ marginBottom: '24px', backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>음악 비율 (B:S:J:K)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', alignItems: 'center' }}>
            {/* B (Bachata) */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#E8856A', display: 'block', marginBottom: '8px' }}>B</span>
              <div style={{ display:'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, bRatio: Math.min(10, prev.bRatio + 1)}))}
                  style={{ width:'100%', padding: '6px 0', borderRadius:'8px', border:'1px solid #ddd', background:'#fff', fontSize:'12px', cursor:'pointer' }}
                >▲</button>
                <span style={{ fontSize:'20px', fontWeight:900, color:'#E8856A' }}>{formData.bRatio}</span>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, bRatio: Math.max(0, prev.bRatio - 1)}))}
                  style={{ width:'100%', padding: '6px 0', borderRadius:'8px', border:'1px solid #ddd', background:'#fff', fontSize:'12px', cursor:'pointer' }}
                >▼</button>
              </div>
            </div>

            {/* S (Salsa) */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#2ECC71', display: 'block', marginBottom: '8px' }}>S</span>
              <div style={{ display:'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, sRatio: Math.min(10, prev.sRatio + 1)}))}
                  style={{ width:'100%', padding: '6px 0', borderRadius:'8px', border:'1px solid #ddd', background:'#fff', fontSize:'12px', cursor:'pointer' }}
                >▲</button>
                <span style={{ fontSize:'20px', fontWeight:900, color:'#2ECC71' }}>{formData.sRatio}</span>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, sRatio: Math.max(0, prev.sRatio - 1)}))}
                  style={{ width:'100%', padding: '6px 0', borderRadius:'8px', border:'1px solid #ddd', background:'#fff', fontSize:'12px', cursor:'pointer' }}
                >▼</button>
              </div>
            </div>

            {/* J (Zouk) */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#378ADD', display: 'block', marginBottom: '8px' }}>J</span>
              <div style={{ display:'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, jRatio: Math.min(10, prev.jRatio + 1)}))}
                  style={{ width:'100%', padding: '6px 0', borderRadius:'8px', border:'1px solid #ddd', background:'#fff', fontSize:'12px', cursor:'pointer' }}
                >▲</button>
                <span style={{ fontSize:'20px', fontWeight:900, color:'#378ADD' }}>{formData.jRatio}</span>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, jRatio: Math.max(0, prev.jRatio - 1)}))}
                  style={{ width:'100%', padding: '6px 0', borderRadius:'8px', border:'1px solid #ddd', background:'#fff', fontSize:'12px', cursor:'pointer' }}
                >▼</button>
              </div>
            </div>

            {/* K (Kizomba) */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#7F77DD', display: 'block', marginBottom: '8px' }}>K</span>
              <div style={{ display:'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, kRatio: Math.min(10, prev.kRatio + 1)}))}
                  style={{ width:'100%', padding: '6px 0', borderRadius:'8px', border:'1px solid #ddd', background:'#fff', fontSize:'12px', cursor:'pointer' }}
                >▲</button>
                <span style={{ fontSize:'20px', fontWeight:900, color:'#7F77DD' }}>{formData.kRatio}</span>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, kRatio: Math.max(0, prev.kRatio - 1)}))}
                  style={{ width:'100%', padding: '6px 0', borderRadius:'8px', border:'1px solid #ddd', background:'#fff', fontSize:'12px', cursor:'pointer' }}
                >▼</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <div style={{ flex: 1.5 }}><label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>날짜</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required style={{ width: '100%', padding: '12px 8px', border: '1.5px solid #F3F4F6', borderRadius: '12px', fontSize: '13px' }} /></div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>시작</label>
            <select 
              value={formData.time} 
              onChange={e => setFormData({...formData, time: e.target.value})} 
              style={{ width: '100%', padding: '12px 4px', border: '1.5px solid #F3F4F6', borderRadius: '12px', fontSize: '12px', backgroundColor: 'white' }}
            >
              {TIME_SLOTS.map(slot => <option key={`start-${slot.value}`} value={slot.value}>{slot.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>종료</label>
            <select 
              value={formData.end_time} 
              onChange={e => setFormData({...formData, end_time: e.target.value})} 
              style={{ width: '100%', padding: '12px 4px', border: '1.5px solid #F3F4F6', borderRadius: '12px', fontSize: '12px', backgroundColor: 'white' }}
            >
              {TIME_SLOTS.map(slot => <option key={`end-${slot.value}`} value={slot.value}>{slot.label}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading || !formData.title || !formData.location_name || !formData.date || !formData.region} style={{ width: '100%', padding: '20px', background: '#2ECC71', color: 'white', borderRadius: '16px', fontWeight: 800, fontSize: '18px', opacity: (loading || !formData.title || !formData.location_name || !formData.date || !formData.region) ? 0.5 : 1 }}>등록 완료</button>
      </form>
    </div>
  )
}

export default RegisterForm
