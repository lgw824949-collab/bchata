// src/components/DanceDestiny.tsx
// 사주 분석(오행) + 댄스 성향(4가지 질문) → 댄스 운명 좌표 분석
// 기존 SajuModal.jsx 로직을 기반으로 질문 4개를 추가함

import React, { useState } from 'react'
import { X, ChevronDown, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { BAR_DATABASE } from '../lib/BarLib'

// ─── 거리 계산 (Haversine Formula) ───
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371 
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const matchesGenre = (barName: string, genre: string) => {
  const name = barName.toLowerCase()
  if (genre === '살사') return name.includes('살사') || name.includes('턴') || name.includes('보니따') || name.includes('까리베') || name.includes('맘보') || name.includes('라틴')
  if (genre === '바차타') return name.includes('바차타') || name.includes('엘마르') || name.includes('센슈얼') || name.includes('바바루') || name.includes('보니따')
  if (genre === '주크바차타') return name.includes('주크') || name.includes('바차타')
  if (genre === '키좀바') return name.includes('키좀바')
  return true
}

// ─── 사주 상수 ───
const CHUN_GAN = ['갑','을','병','정','무','기','경','신','임','계']
const CHUN_GAN_OHENG = ['木','木','火','火','土','土','金','金','水','水']
const CHUN_GAN_EMOJI = ['🌱','🌿','🔥','✨','⛰️','🌾','⚔️','💎','🌊','❄️']
const JI_JI = ['자','축','인','묘','진','사','오','미','신','유','술','해']
const JI_JI_OHENG = ['水','土','木','木','土','火','火','土','金','金','土','水']

const TIME_LIST = [
  { label:'자시 (23:00~01:00) 🐭', value:0 },
  { label:'축시 (01:00~03:00) 🐮', value:1 },
  { label:'인시 (03:00~05:00) 🐯', value:2 },
  { label:'묘시 (05:00~07:00) 🐰', value:3 },
  { label:'진시 (07:00~09:00) 🐲', value:4 },
  { label:'사시 (09:00~11:00) 🐍', value:5 },
  { label:'오시 (11:00~13:00) 🐴', value:6 },
  { label:'미시 (13:00~15:00) 🐑', value:7 },
  { label:'신시 (15:00~17:00) 🐒', value:8 },
  { label:'유시 (17:00~19:00) 🐓', value:9 },
  { label:'술시 (19:00~21:00) 🐶', value:10 },
  { label:'해시 (21:00~23:00) 🐷', value:11 },
]

const OHENG_DANCE: Record<string, any> = {
  '火': { genre:'살사', emoji:'🔥', color:'#E53935', bg:'#FFF0F0', border:'#FFCDD2',
    reason:'불(火) 기운이 강한 당신! 폭발적인 에너지와 열정이 살사의 강렬한 비트와 완벽하게 맞아요.',
    traits:['열정적','강렬함','카리스마','즉흥성'],
    tip:'살사는 당신의 불 기운을 완전히 발산시켜주는 춤이에요.' },
  '水': { genre:'바차타', emoji:'🌊', color:'#1565C0', bg:'#E3F2FD', border:'#BBDEFB',
    reason:'물(水) 기운이 강한 당신! 깊은 감성과 유연한 흐름이 바차타의 센슈얼한 리듬과 어울려요.',
    traits:['감성적','유연함','깊이감','섬세함'],
    tip:'바차타의 흐름은 당신의 물 기운을 그대로 표현해요.' },
  '木': { genre:'주크바차타', emoji:'🌿', color:'#2E7D32', bg:'#E8F5E9', border:'#C8E6C9',
    reason:'나무(木) 기운이 강한 당신! 유연하면서도 강인한 에너지가 주크바차타의 움직임과 최고의 궁합이에요.',
    traits:['유연함','성장','창의성','균형감'],
    tip:'주크바차타의 물결치는 무브먼트가 당신의 나무 기운을 표현해줘요.' },
  '金': { genre:'키좀바', emoji:'💎', color:'#6D28D9', bg:'#F5F3FF', border:'#DDD6FE',
    reason:'쇠(金) 기운이 강한 당신! 절제된 힘과 정밀함이 키좀바의 깊고 묵직한 리듬과 맞아요.',
    traits:['절제','정밀함','깊이','신뢰감'],
    tip:'키좀바는 화려한 기술보다 연결과 절제가 핵심이에요.' },
  '土': { genre:'모든 장르', emoji:'⛰️', color:'#92400E', bg:'#FEF3C7', border:'#FDE68A',
    reason:'흙(土) 기운이 강한 당신! 안정적이고 균형 잡힌 에너지가 어떤 장르든 잘 소화해요.',
    traits:['안정감','균형','포용력','신뢰'],
    tip:'당신은 모든 장르에서 빛나요! 오늘 밤 분위기에 따라 골라보세요.' },
}

const OHENG_NAMES: Record<string, string>  = { '木':'나무', '火':'불', '土':'흙', '金':'쇠', '水':'물' }
const OHENG_COLORS: Record<string, string> = { '木':'#2E7D32', '火':'#E53935', '土':'#92400E', '金':'#6D28D9', '水':'#1565C0' }
const OHENG_EMOJIS: Record<string, string> = { '木':'🌿', '火':'🔥', '土':'⛰️', '金':'💎', '水':'🌊' }

// ─── 사주 계산 함수 ───
function getYearGanJi(y: number) {
  const g = ((y-4)%10+10)%10, j = ((y-4)%12+12)%12
  return { gan:CHUN_GAN[g], ji:JI_JI[j], ganOheng:CHUN_GAN_OHENG[g], jiOheng:JI_JI_OHENG[j], emoji:CHUN_GAN_EMOJI[g] }
}
function getMonthJi(m: number) {
  const idx = [2,3,4,5,6,7,8,9,10,11,0,1][m-1]
  return { gan:'', ji:JI_JI[idx], ganOheng:'', jiOheng:JI_JI_OHENG[idx], emoji:'📅' }
}
function getDayGanJi(y: number, m: number, d: number) {
  const base = new Date(2000,0,7), target = new Date(y,m-1,d)
  const diff = Math.floor((target.getTime() - base.getTime())/(1000*60*60*24))
  const g = ((diff%10)+10)%10, j = ((diff%12)+12)%12
  return { gan:CHUN_GAN[g], ji:JI_JI[j], ganOheng:CHUN_GAN_OHENG[g], jiOheng:JI_JI_OHENG[j], emoji:CHUN_GAN_EMOJI[g] }
}
function calcOheng(saju: any[]) {
  const cnt: Record<string, number> = { '木':0,'火':0,'土':0,'金':0,'水':0 }
  saju.forEach(s => {
    if (s.ganOheng) cnt[s.ganOheng]++
    if (s.jiOheng)  cnt[s.jiOheng]++
  })
  const sorted = Object.entries(cnt).sort((a,b)=>b[1]-a[1])
  const main = sorted[0][0]
  return { count:cnt, main }
}

// ─── 공통 인풋 스타일 ───
const INP: React.CSSProperties = {
  padding:'12px 14px', borderRadius:10,
  border:'1.5px solid #E2E8F0', fontSize:14,
  outline:'none', background:'#FAFBFF', color:'#111',
  fontFamily:"'Pretendard',-apple-system,sans-serif",
}

export default function DanceDestiny({ onClose, parties=[] }: { onClose: () => void, parties?: any[] }) {
  const [step, setStep]       = useState(1)
  const [calType, setCalType] = useState('solar')
  const [gender, setGender]   = useState('')
  const [year, setYear]       = useState('')
  const [month, setMonth]     = useState('')
  const [day, setDay]         = useState('')
  const [timeIdx, setTimeIdx] = useState('')
  
  // ─── 추가 질문 4개 ───
  const [q1, setQ1] = useState('') // 목적
  const [q2, setQ2] = useState('') // 분위기
  const [q3, setQ3] = useState('') // 실력
  const [q4, setQ4] = useState('') // 중요 가치

  const [result, setResult]   = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const isBasicValid = gender && year && month && day && timeIdx !== ''
  const isQuestionsValid = q1 && q2 && q3 && q4
  const isValid = isBasicValid && isQuestionsValid

  const analyze = async () => {
    if (!isValid) return
    setLoading(true)

    // 1. 사주 데이터 계산
    const y=parseInt(year), m=parseInt(month), d=parseInt(day), t=parseInt(timeIdx)
    const yGJ = getYearGanJi(y)
    const mGJ = getMonthJi(m)
    const dGJ = getDayGanJi(y,m,d)
    const tGJ = { gan:'', ji:JI_JI[t], ganOheng:'', jiOheng:JI_JI_OHENG[t], emoji:'🕐' }
    const { count, main } = calcOheng([yGJ,mGJ,dGJ,tGJ])
    const dance = { ...OHENG_DANCE[main] }

    // 2. 질문 답변에 따른 개인화 (AI 프롬프트 대신 로컬 로직 반영)
    if (q1 === '퍼포먼스/대회 나가고 싶어') dance.traits.push('목표지향')
    if (q2 === '열정적이고 빡센 분위기') dance.tip = '오늘은 에너지를 120% 쏟아낼 수 있는 파티를 추천해요!'
    if (q3 === '이제 막 시작한 왕초보') dance.tip = '초보자를 위한 베이직 수업이 있는 곳부터 시작해보세요.'
    if (q4 === '음악과의 교감과 감성') dance.traits.push('예술가적 감성')

    // 3. 추천 BAR 로직
    const now = new Date()
    const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    const todayStr = kstDate.toISOString().split('T')[0]

    const genreMatch = (p: any, targetGenre: string) => {
      if (targetGenre === '모든 장르') return true
      if (targetGenre === '살사')       return (p.s_ratio||0)>=1
      if (targetGenre === '바차타')     return (p.b_ratio||0)>=1
      if (targetGenre === '주크바차타') return (p.j_ratio||0)>=1
      if (targetGenre === '키좀바')     return (p.k_ratio||0)>=1
      return false
    }

    const matchedParties = parties
      .filter(p => p.date >= todayStr && genreMatch(p, dance.genre))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)

    let recommendedBars = matchedParties.map(p => ({
      title: p.title,
      address: p.locations?.address || '',
      date: p.date,
      type: p.date === todayStr ? 'today' : 'future',
      poster_url: p.poster_url
    }))

    if (recommendedBars.length === 0) {
      recommendedBars = BAR_DATABASE
        .filter(b => matchesGenre(b.name, dance.genre))
        .slice(0, 3)
        .map(b => ({
          title: b.name,
          address: b.address,
          type: 'db',
          poster_url: null
        }))
    }

    setResult({ 
      yearGJ:yGJ, monthGJ:mGJ, dayGJ:dGJ, timeGJ:tGJ, 
      ohengCount:count, mainOheng:main, dance, 
      recommendedBars, gender, today: todayStr,
      answers: { q1, q2, q3, q4 }
    })
    setStep(3)
  }

  const reset = () => {
    setStep(1); setResult(null)
    setYear(''); setMonth(''); setDay(''); setTimeIdx(''); setGender('')
    setQ1(''); setQ2(''); setQ3(''); setQ4('')
  }

  return (
    <>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .destiny-wrap * { font-family:'Pretendard',-apple-system,sans-serif !important; }
        .destiny-inp:focus { border-color:#1565C0 !important; background:#fff !important; box-shadow:0 0 0 3px rgba(21,101,192,0.1) !important; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:10010, backdropFilter: 'blur(4px)' }} />

      <div className="destiny-wrap" style={{
        position:'fixed', bottom:0, left:0, width:'100%',
        maxHeight:'94vh', overflowY:'auto',
        background:'#fff', zIndex:10011,
        borderRadius:'32px 32px 0 0',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
      }}>

        {/* ══ 헤더 ══ */}
        <div style={{
          position:'sticky', top:0, zIndex:2,
          background:'linear-gradient(135deg,#0D47A1 0%,#1565C0 100%)',
          padding:'24px 20px 45px',
          color: '#fff'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:22,fontWeight:900,letterSpacing:'-0.5px', display:'flex', alignItems:'center', gap:8 }}>
                <Sparkles size={24} /> 댄스 운명 좌표
              </div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.7)',marginTop:6 }}>사주와 성향을 결합한 정밀 분석</div>
            </div>
            <button onClick={onClose} style={{
              background:'rgba(255,255,255,0.2)',border:'none',
              borderRadius:'50%',width:36,height:36,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <X size={20} color="#fff"/>
            </button>
          </div>
          <svg style={{ position:'absolute',bottom:0,left:0,width:'100%' }} viewBox="0 0 400 50" preserveAspectRatio="none">
            <path d="M0,50 C110,20 210,60 400,50 L400,50 L0,50 Z" fill="#ffffff"/>
          </svg>
        </div>

        {/* ══ STEP 1: 기본 정보 입력 ══ */}
        {step===1 && (
          <div style={{ padding:'10px 20px 40px' }}>
            
            {/* 기본 정보 */}
            <div style={{ marginBottom:30 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#1e293b', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:4, height:16, background:'#1565C0', borderRadius:2 }}></div>
                기본 정보 입력
              </div>
              
              <div style={{ display:'flex',gap:10, marginBottom:16 }}>
                {['남','여'].map(g=>(
                  <button key={g} onClick={()=>setGender(g)} style={{
                    flex:1,padding:'14px',borderRadius:12,fontSize:15,fontWeight:700,
                    border:gender===g?'2px solid #1565C0':'1.5px solid #E2E8F0',
                    background:gender===g?'#1565C0':'#fff',
                    color:gender===g?'#fff':'#94A3B8', transition:'all 0.2s',
                  }}>{g==='남'?'👨 남성':'👩 여성'}</button>
                ))}
              </div>

              <div style={{ display:'flex',gap:8, marginBottom:16 }}>
                <input className="destiny-inp" type="number" placeholder="년도(1995)" value={year} onChange={e=>setYear(e.target.value)} style={{...INP, flex: 2}}/>
                <input className="destiny-inp" type="number" placeholder="월" value={month} onChange={e=>setMonth(e.target.value)} style={{...INP, flex: 1}}/>
                <input className="destiny-inp" type="number" placeholder="일" value={day} onChange={e=>setDay(e.target.value)} style={{...INP, flex: 1}}/>
              </div>

              <div style={{ position:'relative' }}>
                <select value={timeIdx} onChange={e=>setTimeIdx(e.target.value)} style={{
                  ...INP, width:'100%', padding:'14px 40px 14px 14px',
                  appearance:'none', cursor:'pointer',
                  color:timeIdx!==''?'#111':'#94A3B8',
                }}>
                  <option value="">태어난 시간 선택</option>
                  {TIME_LIST.map(t=>(
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown size={18} style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#94A3B8',pointerEvents:'none' }}/>
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!isBasicValid} style={{
              width:'100%', padding:'18px', borderRadius:16,
              background: isBasicValid ? 'linear-gradient(135deg,#1565C0,#42A5F5)' : '#E2E8F0',
              color: '#fff', border:'none', fontSize:17, fontWeight:900, cursor:isBasicValid?'pointer':'not-allowed',
              boxShadow: isBasicValid ? '0 8px 25px rgba(21,101,192,0.3)' : 'none',
            }}>
              다음 단계로 (1/2)
            </button>
          </div>
        )}

        {/* ══ STEP 2: 댄스 성향 질문 ══ */}
        {step===2 && (
          <div style={{ padding:'10px 20px 40px' }}>
            <div style={{ marginBottom:40 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#1e293b', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:4, height:16, background:'#1565C0', borderRadius:2 }}></div>
                댄스 성향 분석 (Q1~Q4)
              </div>

              {/* Q1 */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#64748b', marginBottom:10 }}>Q1. 춤을 배우는 목적은?</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {['소셜파티에서 추고 싶어', '퍼포먼스/대회 나가고 싶어', '그냥 취미로 즐기고 싶어', '다이어트/운동 목적'].map(opt => (
                    <button key={opt} onClick={()=>setQ1(opt)} style={{
                      padding:'12px 8px', borderRadius:10, fontSize:12, fontWeight:600,
                      border: q1===opt ? '1.5px solid #1565C0' : '1px solid #E2E8F0',
                      background: q1===opt ? '#F0F7FF' : '#fff',
                      color: q1===opt ? '#1565C0' : '#64748b',
                    }}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#64748b', marginBottom:10 }}>Q2. 선호하는 수업 분위기는?</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {['체계적이고 꼼꼼하게', '쉽고 재미있게', '다 같이 친해지는 분위기', '열정적이고 빡센 분위기'].map(opt => (
                    <button key={opt} onClick={()=>setQ2(opt)} style={{
                      padding:'12px 8px', borderRadius:10, fontSize:12, fontWeight:600,
                      border: q2===opt ? '1.5px solid #1565C0' : '1px solid #E2E8F0',
                      background: q2===opt ? '#F0F7FF' : '#fff',
                      color: q2===opt ? '#1565C0' : '#64748b',
                    }}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#64748b', marginBottom:10 }}>Q3. 본인이 생각하는 춤 실력은?</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {['이제 막 시작한 왕초보', '기본기는 좀 있는 초보', '어디서든 출 수 있는 중급', '다들 쳐다보는 고수'].map(opt => (
                    <button key={opt} onClick={()=>setQ3(opt)} style={{
                      padding:'12px 8px', borderRadius:10, fontSize:12, fontWeight:600,
                      border: q3===opt ? '1.5px solid #1565C0' : '1px solid #E2E8F0',
                      background: q3===opt ? '#F0F7FF' : '#fff',
                      color: q3===opt ? '#1565C0' : '#64748b',
                    }}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Q4 */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#64748b', marginBottom:10 }}>Q4. 가장 중요하게 생각하는 것은?</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {['정확한 기술과 베이직', '음악과의 교감과 감성', '파트너와의 소통과 연결', '화려한 패턴과 무대매너'].map(opt => (
                    <button key={opt} onClick={()=>setQ4(opt)} style={{
                      padding:'12px 8px', borderRadius:10, fontSize:12, fontWeight:600,
                      border: q4===opt ? '1.5px solid #1565C0' : '1px solid #E2E8F0',
                      background: q4===opt ? '#F0F7FF' : '#fff',
                      color: q4===opt ? '#1565C0' : '#64748b',
                    }}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={analyze} disabled={!isValid} style={{
              width:'100%', padding:'18px', borderRadius:16,
              background: isValid ? 'linear-gradient(135deg,#1565C0,#42A5F5)' : '#E2E8F0',
              color: '#fff', border:'none', fontSize:17, fontWeight:900, cursor:isValid?'pointer':'not-allowed',
              boxShadow: isValid ? '0 8px 25px rgba(21,101,192,0.3)' : 'none',
            }}>
              {loading ? '🔮 운명의 좌표 계산 중...' : '🔮 나의 댄스 운명 확인하기'}
            </button>

            <button onClick={() => setStep(1)} style={{
              width:'100%', marginTop:12, padding:'12px', background:'none', border:'none', color:'#94A3B8', fontSize:14, fontWeight:600, cursor:'pointer'
            }}>이전 단계로</button>
          </div>
        )}

        {/* ══ STEP 3: 결과 ══ */}
        {step===3 && result && (
          <div style={{ padding:'10px 20px 50px' }}>
            
            {/* 결과 카드 */}
            <div style={{
              marginBottom:24, background:result.dance.bg, border:`2px solid ${result.dance.border}`,
              borderRadius:24, padding:24, textAlign:'center'
            }}>
              <div style={{ fontSize:40, marginBottom:16 }}>{result.dance.emoji}</div>
              <div style={{ fontSize:14, color:result.dance.color, fontWeight:800, marginBottom:4 }}>
                {result.gender}성 · {result.mainOheng} 기운 분석
              </div>
              <div style={{ fontSize:26, fontWeight:900, color:'#111', marginBottom:16 }}>
                추천 장르: {result.dance.genre}
              </div>
              <p style={{ fontSize:15, color:'#444', lineHeight:1.6, marginBottom:20 }}>{result.dance.reason}</p>
              
              <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
                {result.dance.traits.map((t: string)=>(
                  <span key={t} style={{ padding:'6px 14px', borderRadius:99, background:result.dance.color, color:'#fff', fontSize:13, fontWeight:700 }}>#{t}</span>
                ))}
              </div>
            </div>

            {/* 추천 BAR */}
            <div style={{ marginBottom:30 }}>
              <div style={{ fontSize:16, fontWeight:900, marginBottom:12, color:'#1e293b' }}>🎯 당신을 기다리는 장소</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {result.recommendedBars.map((bar: any, i: number)=>(
                  <div key={i} style={{ padding:16, borderRadius:16, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:50, height:50, borderRadius:12, background:result.dance.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                      {bar.poster_url ? <img src={bar.poster_url} style={{width:'100%', height:'100%', borderRadius:12, objectFit:'cover'}} /> : result.dance.emoji}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:800, color:'#1e293b' }}>{bar.title}</div>
                      <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{bar.address}</div>
                    </div>
                    {bar.type === 'today' && <span style={{ fontSize:11, padding:'4px 8px', borderRadius:6, background:'#fee2e2', color:'#ef4444', fontWeight:800 }}>HOT</span>}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={reset} style={{
              width:'100%', padding:16, borderRadius:14, background:'#f1f5f9', color:'#64748b',
              border:'none', fontSize:15, fontWeight:700, cursor:'pointer'
            }}>🔄 다시 분석하기</button>
          </div>
        )}
      </div>
    </>
  )
}
