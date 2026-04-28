// src/components/SajuModal.jsx
// 사주 분석 → 오행 → 댄스 장르 → BAR 추천
// Pretendard 폰트 + 블루 웨이브 디자인

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'

// ─── 천간 ───
const CHUN_GAN       = ['갑','을','병','정','무','기','경','신','임','계']
const CHUN_GAN_OHENG = ['木','木','火','火','土','土','金','金','水','水']
const CHUN_GAN_EMOJI = ['🌱','🌿','🔥','✨','⛰️','🌾','⚔️','💎','🌊','❄️']

// ─── 지지 ───
const JI_JI       = ['자','축','인','묘','진','사','오','미','신','유','술','해']
const JI_JI_OHENG = ['水','土','木','木','土','火','火','土','金','金','土','水']

// ─── 시지 선택 ───
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

// ─── 오행 → 댄스 ───
const OHENG_DANCE = {
  '火': {
    genre:'살사', emoji:'🔥', color:'#E53935', bg:'#FFF0F0', border:'#FFCDD2',
    reason:'불(火) 기운이 강한 당신! 폭발적인 에너지와 열정이 살사의 강렬한 비트와 완벽하게 맞아요. 플로어에서 가장 빛나는 존재가 될 거예요.',
    traits:['열정적','강렬함','카리스마','즉흥성'],
    tip:'살사는 당신의 불 기운을 완전히 발산시켜주는 춤이에요. 망설이지 말고 플로어로 나가세요!',
  },
  '水': {
    genre:'바차타', emoji:'🌊', color:'#1565C0', bg:'#E3F2FD', border:'#BBDEFB',
    reason:'물(水) 기운이 강한 당신! 깊은 감성과 유연한 흐름이 바차타의 센슈얼한 리듬과 완벽히 어울려요. 파트너와의 연결이 자연스럽게 이루어져요.',
    traits:['감성적','유연함','깊이감','섬세함'],
    tip:'바차타의 흐름은 당신의 물 기운을 그대로 표현해요. 몸의 파도를 느끼며 추세요.',
  },
  '木': {
    genre:'주크바차타', emoji:'🌿', color:'#2E7D32', bg:'#E8F5E9', border:'#C8E6C9',
    reason:'나무(木) 기운이 강한 당신! 유연하면서도 강인한 에너지가 주크바차타의 부드러운 바디무브먼트와 최고의 궁합이에요.',
    traits:['유연함','성장','창의성','균형감'],
    tip:'주크바차타의 물결치는 움직임이 당신의 나무 기운을 완벽하게 표현해줘요.',
  },
  '金': {
    genre:'키좀바', emoji:'💎', color:'#6D28D9', bg:'#F5F3FF', border:'#DDD6FE',
    reason:'쇠(金) 기운이 강한 당신! 절제된 힘과 정밀함이 키좀바의 깊고 묵직한 리듬과 완벽하게 맞아요.',
    traits:['절제','정밀함','깊이','신뢰감'],
    tip:'키좀바는 화려한 기술보다 연결과 절제가 핵심이에요. 당신의 金 기운이 빛나는 춤이에요.',
  },
  '土': {
    genre:'모든 장르', emoji:'⛰️', color:'#92400E', bg:'#FEF3C7', border:'#FDE68A',
    reason:'흙(土) 기운이 강한 당신! 안정적이고 균형 잡힌 에너지가 어떤 장르든 잘 소화해요. 파트너를 편안하게 만드는 최고의 댄서 기질이 있어요.',
    traits:['안정감','균형','포용력','신뢰'],
    tip:'당신은 모든 장르에서 빛나요! 오늘 밤 분위기에 따라 골라보세요.',
  },
}

const OHENG_NAMES  = { '木':'나무', '火':'불', '土':'흙', '金':'쇠', '水':'물' }
const OHENG_COLORS = { '木':'#2E7D32', '火':'#E53935', '土':'#92400E', '金':'#6D28D9', '水':'#1565C0' }
const OHENG_EMOJIS = { '木':'🌿', '火':'🔥', '土':'⛰️', '金':'💎', '水':'🌊' }

// ─── 사주 계산 ───
function getYearGanJi(y) {
  const g = ((y-4)%10+10)%10, j = ((y-4)%12+12)%12
  return { gan:CHUN_GAN[g], ji:JI_JI[j], ganOheng:CHUN_GAN_OHENG[g], jiOheng:JI_JI_OHENG[j], emoji:CHUN_GAN_EMOJI[g] }
}
function getMonthJi(m) {
  const idx = [2,3,4,5,6,7,8,9,10,11,0,1][m-1]
  return { gan:'', ji:JI_JI[idx], ganOheng:'', jiOheng:JI_JI_OHENG[idx], emoji:'📅' }
}
function getDayGanJi(y, m, d) {
  const base = new Date(2000,0,7), target = new Date(y,m-1,d)
  const diff = Math.floor((target-base)/(1000*60*60*24))
  const g = ((diff%10)+10)%10, j = ((diff%12)+12)%12
  return { gan:CHUN_GAN[g], ji:JI_JI[j], ganOheng:CHUN_GAN_OHENG[g], jiOheng:JI_JI_OHENG[j], emoji:CHUN_GAN_EMOJI[g] }
}
function calcOheng(saju) {
  const cnt = { '木':0,'火':0,'土':0,'金':0,'水':0 }
  saju.forEach(s => {
    if (s.ganOheng) cnt[s.ganOheng]++
    if (s.jiOheng)  cnt[s.jiOheng]++
  })
  const main = Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0][0]
  return { count:cnt, main }
}

// ─── 공통 인풋 스타일 ───
const INP = {
  padding:'12px 14px', borderRadius:10,
  border:'1.5px solid #E2E8F0', fontSize:14,
  outline:'none', background:'#FAFBFF', color:'#111',
  fontFamily:"'Pretendard',-apple-system,sans-serif",
}

export default function SajuModal({ onClose, parties=[] }) {
  const [step, setStep]       = useState(1)
  const [calType, setCalType] = useState('solar')
  const [gender, setGender]   = useState('')
  const [year, setYear]       = useState('')
  const [month, setMonth]     = useState('')
  const [day, setDay]         = useState('')
  const [timeIdx, setTimeIdx] = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  const isValid = gender && year && month && day && timeIdx !== ''

  const analyze = () => {
    if (!isValid) return
    setLoading(true)
    setTimeout(() => {
      const y=parseInt(year), m=parseInt(month), d=parseInt(day), t=parseInt(timeIdx)
      const yGJ = getYearGanJi(y)
      const mGJ = getMonthJi(m)
      const dGJ = getDayGanJi(y,m,d)
      const tGJ = { gan:'', ji:JI_JI[t], ganOheng:'', jiOheng:JI_JI_OHENG[t], emoji:'🕐' }
      const { count, main } = calcOheng([yGJ,mGJ,dGJ,tGJ])
      const dance = OHENG_DANCE[main]
      const bars = parties.filter(p => {
        if (dance.genre==='살사')       return (p.s_ratio||0)>=5
        if (dance.genre==='바차타')     return (p.b_ratio||0)>=5
        if (dance.genre==='주크바차타') return (p.j_ratio||0)>=3
        if (dance.genre==='키좀바')     return (p.k_ratio||0)>=3
        return true
      }).slice(0,3)
      setResult({ yearGJ:yGJ, monthGJ:mGJ, dayGJ:dGJ, timeGJ:tGJ, ohengCount:count, mainOheng:main, dance, recommendedBars:bars, gender })
      setLoading(false)
      setStep(2)
    }, 1500)
  }

  const reset = () => {
    setStep(1); setResult(null)
    setYear(''); setMonth(''); setDay(''); setTimeIdx(''); setGender('')
  }

  return (
    <>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .saju-wrap * { font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif !important; }
        .saju-inp:focus { border-color:#1976D2 !important; background:#fff !important; box-shadow:0 0 0 3px rgba(25,118,210,0.1) !important; }
      `}</style>

      {/* 오버레이 */}
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:10010 }} />

      {/* 모달 */}
      <div className="saju-wrap" style={{
        position:'fixed', bottom:0, left:0, width:'100%',
        maxHeight:'92vh', overflowY:'auto',
        background:'#fff', zIndex:10011,
        borderRadius:'24px 24px 0 0',
        fontFamily:"'Pretendard',-apple-system,sans-serif",
      }}>

        {/* ══ 헤더 블루 웨이브 ══ */}
        <div style={{
          position:'sticky', top:0, zIndex:2,
          background:'linear-gradient(135deg,#0D47A1 0%,#1565C0 35%,#1976D2 65%,#42A5F5 100%)',
          padding:'22px 20px 40px',
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          overflow:'hidden',
        }}>
          {/* 장식 원 */}
          <div style={{ position:'absolute',top:-30,right:-30,width:130,height:130,borderRadius:'50%',background:'rgba(255,255,255,0.07)' }}/>
          <div style={{ position:'absolute',top:18,right:75,width:75,height:75,borderRadius:'50%',background:'rgba(255,255,255,0.05)' }}/>
          <div style={{ position:'absolute',bottom:25,left:-25,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.05)' }}/>

          {/* 웨이브 */}
          <svg style={{ position:'absolute',bottom:0,left:0,width:'100%' }} viewBox="0 0 400 50" preserveAspectRatio="none">
            <path d="M0,22 C70,44 140,6 210,24 C270,38 330,12 400,26 L400,50 L0,50 Z" fill="rgba(255,255,255,0.13)"/>
            <path d="M0,32 C90,14 170,42 250,30 C310,20 360,38 400,32 L400,50 L0,50 Z" fill="rgba(255,255,255,0.08)"/>
            <path d="M0,50 C110,30 210,50 310,40 C355,35 382,44 400,50 L400,50 L0,50 Z" fill="#ffffff"/>
          </svg>

          <div style={{ position:'relative',zIndex:2 }}>
            <div style={{ fontSize:20,fontWeight:900,color:'#fff',letterSpacing:'-0.3px' }}>🔮 댄스 사주 분석</div>
            <div style={{ fontSize:11,color:'rgba(255,255,255,0.72)',marginTop:5,letterSpacing:'0.2px' }}>🔒 입력 정보는 분석 후 즉시 삭제됩니다</div>
          </div>
          <button onClick={onClose} style={{
            position:'relative',zIndex:2,
            background:'rgba(255,255,255,0.18)',border:'1px solid rgba(255,255,255,0.3)',
            borderRadius:'50%',width:34,height:34,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            <X size={16} color="#fff"/>
          </button>
        </div>

        {/* ══ STEP 1: 입력 ══ */}
        {step===1 && (
          <div style={{ padding:'24px 20px 36px' }}>

            {/* 성별 */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'#334155',marginBottom:8 }}>성별</div>
              <div style={{ display:'flex',gap:10 }}>
                {['남','여'].map(g=>(
                  <button key={g} onClick={()=>setGender(g)} style={{
                    flex:1,padding:'13px',borderRadius:12,fontSize:15,fontWeight:700,
                    border:gender===g?'2px solid #1565C0':'1.5px solid #E2E8F0',
                    background:gender===g?'#1565C0':'#FAFBFF',
                    color:gender===g?'#fff':'#94A3B8',cursor:'pointer',transition:'all 0.15s',
                  }}>{g==='남'?'👨 남성':'👩 여성'}</button>
                ))}
              </div>
            </div>

            {/* 양력/음력 */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'#334155',marginBottom:8 }}>양력 / 음력</div>
              <div style={{ display:'flex',gap:10 }}>
                {[{v:'solar',l:'🌞 양력'},{v:'lunar',l:'🌙 음력'}].map(({v,l})=>(
                  <button key={v} onClick={()=>setCalType(v)} style={{
                    flex:1,padding:'13px',borderRadius:12,fontSize:14,fontWeight:700,
                    border:calType===v?'2px solid #1976D2':'1.5px solid #E2E8F0',
                    background:calType===v?'#E3F2FD':'#FAFBFF',
                    color:calType===v?'#1565C0':'#94A3B8',cursor:'pointer',transition:'all 0.15s',
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {/* 생년월일 */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'#334155',marginBottom:8 }}>생년월일</div>
              <div style={{ display:'flex',gap:8 }}>
                <input className="saju-inp" type="number" placeholder="년도 (1990)" value={year} onChange={e=>setYear(e.target.value)} style={{...INP,flex:2}}/>
                <input className="saju-inp" type="number" placeholder="월" min="1" max="12" value={month} onChange={e=>setMonth(e.target.value)} style={{...INP,flex:1}}/>
                <input className="saju-inp" type="number" placeholder="일" min="1" max="31" value={day} onChange={e=>setDay(e.target.value)} style={{...INP,flex:1}}/>
              </div>
            </div>

            {/* 태어난 시간 */}
            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'#334155',marginBottom:8 }}>태어난 시간</div>
              <div style={{ position:'relative' }}>
                <select value={timeIdx} onChange={e=>setTimeIdx(e.target.value)} style={{
                  ...INP, width:'100%', padding:'12px 40px 12px 14px',
                  appearance:'none', cursor:'pointer',
                  color:timeIdx!==''?'#111':'#94A3B8',
                }}>
                  <option value="">시간을 선택하세요</option>
                  {TIME_LIST.map(t=>(
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#94A3B8',pointerEvents:'none' }}/>
              </div>
            </div>

            {/* 분석 버튼 */}
            <button onClick={analyze} disabled={!isValid} style={{
              width:'100%', padding:'16px', borderRadius:14,
              background: isValid ? 'linear-gradient(135deg,#1565C0,#42A5F5)' : '#E2E8F0',
              color: isValid ? '#fff' : '#94A3B8',
              border:'none', fontSize:16, fontWeight:900, cursor:isValid?'pointer':'not-allowed',
              letterSpacing:'-0.2px', transition:'all 0.2s',
              boxShadow: isValid ? '0 4px 15px rgba(21,101,192,0.3)' : 'none',
            }}>
              {loading ? '🔮 분석 중...' : '🔮 나의 댄스 사주 분석하기'}
            </button>
          </div>
        )}

        {/* ══ STEP 2: 결과 ══ */}
        {step===2 && result && (
          <div style={{ padding:'24px 20px 36px' }}>

            {/* 사주 8자 */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'#94A3B8',marginBottom:10,textAlign:'center',letterSpacing:'0.5px' }}>나의 사주 8자</div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                {[
                  { label:'년주',...result.yearGJ },
                  { label:'월주',...result.monthGJ },
                  { label:'일주',...result.dayGJ },
                  { label:'시주',...result.timeGJ },
                ].map((s,i)=>(
                  <div key={i} style={{
                    background:i===2?'linear-gradient(135deg,#E3F2FD,#BBDEFB)':'#F8FAFC',
                    borderRadius:12, padding:'12px 6px', textAlign:'center',
                    border:i===2?'1.5px solid #90CAF9':'1px solid #E2E8F0',
                  }}>
                    <div style={{ fontSize:10,color:'#94A3B8',marginBottom:4,fontWeight:600 }}>{s.label}</div>
                    <div style={{ fontSize:18,marginBottom:2 }}>{s.emoji}</div>
                    {s.gan && <div style={{ fontSize:17,fontWeight:900,color:'#1E293B' }}>{s.gan}</div>}
                    <div style={{ fontSize:17,fontWeight:900,color:'#334155' }}>{s.ji}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 오행 분포 */}
            <div style={{ marginBottom:20,background:'#F8FAFC',borderRadius:14,padding:16 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'#64748B',marginBottom:10,letterSpacing:'0.3px' }}>오행 분포</div>
              <div style={{ display:'flex',gap:6 }}>
                {Object.entries(result.ohengCount).map(([o,c])=>{
                  const isMain = o===result.mainOheng
                  return (
                    <div key={o} style={{
                      flex:1,textAlign:'center',padding:'10px 4px',borderRadius:10,
                      background:isMain?OHENG_COLORS[o]:'#fff',
                      border:`1.5px solid ${isMain?OHENG_COLORS[o]:'#E2E8F0'}`,
                    }}>
                      <div style={{ fontSize:15 }}>{OHENG_EMOJIS[o]}</div>
                      <div style={{ fontSize:13,fontWeight:900,color:isMain?'#fff':OHENG_COLORS[o],marginTop:2 }}>{o}</div>
                      <div style={{ fontSize:11,color:isMain?'rgba(255,255,255,0.75)':'#CBD5E1',marginTop:1 }}>{c}개</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 메인 결과 카드 */}
            <div style={{
              marginBottom:20,
              background:result.dance.bg,
              border:`1.5px solid ${result.dance.border}`,
              borderRadius:18, padding:20, position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:`${result.dance.color}12` }}/>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
                <div style={{
                  width:52,height:52,borderRadius:16,
                  background:result.dance.color,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:26,flexShrink:0,
                  boxShadow:`0 4px 12px ${result.dance.color}40`,
                }}>{result.dance.emoji}</div>
                <div>
                  <div style={{ fontSize:12,color:result.dance.color,fontWeight:700,marginBottom:2 }}>
                    {result.gender}성 · {result.mainOheng}({OHENG_NAMES[result.mainOheng]}) 기운
                  </div>
                  <div style={{ fontSize:22,fontWeight:900,color:'#111',letterSpacing:'-0.5px' }}>
                    {result.dance.genre} 추천!
                  </div>
                </div>
              </div>
              <p style={{ fontSize:14,color:'#444',lineHeight:'1.7',marginBottom:14 }}>{result.dance.reason}</p>
              <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:14 }}>
                {result.dance.traits.map(t=>(
                  <span key={t} style={{ padding:'4px 12px',borderRadius:99,background:result.dance.color,color:'#fff',fontSize:12,fontWeight:700 }}>{t}</span>
                ))}
              </div>
              <div style={{ background:'rgba(255,255,255,0.75)',borderRadius:12,padding:'12px 14px',fontSize:13,color:'#555',lineHeight:'1.6' }}>
                💡 {result.dance.tip}
              </div>
            </div>

            {/* BAR 추천 */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:15,fontWeight:900,marginBottom:10,color:'#1E293B',letterSpacing:'-0.2px' }}>🎯 추천 BAR</div>
              {result.recommendedBars.length > 0 ? (
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {result.recommendedBars.map((bar,i)=>(
                    <div key={i} style={{ padding:'12px 14px',borderRadius:12,background:'#F8FAFC',border:'1px solid #E2E8F0',display:'flex',alignItems:'center',gap:10 }}>
                      {bar.poster_url
                        ? <img src={bar.poster_url} style={{ width:48,height:48,borderRadius:8,objectFit:'cover',flexShrink:0 }}/>
                        : <div style={{ width:48,height:48,borderRadius:8,background:result.dance.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{result.dance.emoji}</div>
                      }
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:14,fontWeight:700,color:'#1E293B' }}>{bar.title}</div>
                        <div style={{ fontSize:12,color:'#94A3B8',marginTop:2 }}>{bar.locationName} · {bar.date}</div>
                      </div>
                      <span style={{ fontSize:11,padding:'3px 9px',borderRadius:99,background:result.dance.bg,color:result.dance.color,fontWeight:700,flexShrink:0,border:`1px solid ${result.dance.border}` }}>
                        {result.dance.emoji} 추천
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:20,background:'#F8FAFC',borderRadius:12,textAlign:'center' }}>
                  <div style={{ fontSize:24,marginBottom:6 }}>🔜</div>
                  <div style={{ fontSize:13,color:'#94A3B8' }}>오늘 {result.dance.genre} 파티 정보를 준비 중이에요!</div>
                </div>
              )}
            </div>

            {/* 다시 하기 */}
            <button onClick={reset} style={{
              width:'100%',padding:'14px',borderRadius:12,
              background:'#F1F5F9',color:'#64748B',
              border:'none',fontSize:14,fontWeight:700,cursor:'pointer',
            }}>🔄 다시 분석하기</button>

            <div style={{ textAlign:'center',marginTop:12,fontSize:11,color:'#CBD5E1' }}>
              🔒 입력하신 정보는 저장되지 않습니다
            </div>
          </div>
        )}
      </div>
    </>
  )
}
