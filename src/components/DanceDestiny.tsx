// src/components/DanceDestiny.tsx
// 전면 재작성: 모달 기반 / Gemini API 전용 분석 / 내비게이션 최적화
// parties, BAR, 강사 라인업 등 모든 외부 데이터 렌더링 삭제

import React, { useState } from 'react'
import { X, ChevronDown, Sparkles, ChevronLeft } from 'lucide-react'

// ─── 사주 상수 (Gemini 프롬프트용 데이터 추출) ───
const CHUN_GAN = ['갑','을','병','정','무','기','경','신','임','계']
const CHUN_GAN_OHENG = ['木','木','火','火','土','土','金','金','水','水']
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

const OHENG_NAMES: Record<string, string> = { '木':'나무', '火':'불', '土':'흙', '金':'쇠', '水':'물' }

// ─── 사주 계산 함수 ───
function getYearGJ(y: number) {
  const g = ((y-4)%10+10)%10, j = ((y-4)%12+12)%12
  return { gan:CHUN_GAN[g], ji:JI_JI[j], ganOheng:CHUN_GAN_OHENG[g], jiOheng:JI_JI_OHENG[j] }
}
function getMonthJi(m: number) {
  const idx = [2,3,4,5,6,7,8,9,10,11,0,1][m-1]
  return { ji:JI_JI[idx], jiOheng:JI_JI_OHENG[idx] }
}
function getDayGJ(y: number, m: number, d: number) {
  const base = new Date(2000,0,7), target = new Date(y,m-1,d)
  const diff = Math.floor((target.getTime() - base.getTime())/(1000*60*60*24))
  const g = ((diff%10)+10)%10, j = ((diff%12)+12)%12
  return { gan:CHUN_GAN[g], ji:JI_JI[j], ganOheng:CHUN_GAN_OHENG[g], jiOheng:JI_JI_OHENG[j] }
}
function calcMainOheng(saju: any[]) {
  const cnt: Record<string, number> = { '木':0,'火':0,'土':0,'金':0,'水':0 }
  saju.forEach(s => {
    if (s.ganOheng) cnt[s.ganOheng]++
    if (s.jiOheng)  cnt[s.jiOheng]++
  })
  return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0][0]
}

// ─── 공통 스타일 ───
const INP: React.CSSProperties = {
  padding:'12px 14px', borderRadius:12, border:'1.5px solid #E2E8F0',
  fontSize:14, outline:'none', background:'#FAFBFF', color:'#111', width:'100%',
  fontFamily:"'Pretendard',sans-serif",
}

export default function DanceDestiny({ onClose }: { onClose: () => void }) {
  const [step, setStep]       = useState(1)
  const [gender, setGender]   = useState('')
  const [year, setYear]       = useState('')
  const [month, setMonth]     = useState('')
  const [day, setDay]         = useState('')
  const [timeIdx, setTimeIdx] = useState('')
  
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q3, setQ3] = useState('')
  const [q4, setQ4] = useState('')

  const [result, setResult]   = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const isBasicValid = gender && year && month && day && timeIdx !== ''
  const isQuestionsValid = q1 && q2 && q3 && q4

  const analyze = async () => {
    if (!isBasicValid || !isQuestionsValid) return
    setLoading(true)

    try {
      const y=parseInt(year), m=parseInt(month), d=parseInt(day), t=parseInt(timeIdx)
      const saju = [getYearGJ(y), getMonthJi(m), getDayGJ(y,m,d), { ji:JI_JI[t], jiOheng:JI_JI_OHENG[t] }]
      const main = calcMainOheng(saju)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      console.log('API KEY:', apiKey)

      const prompt = `당신은 댄스 강사 유형 분석 전문가입니다.
아래 정보를 바탕으로 이 사람에게 맞는 댄스 강사 유형을 분석해주세요.

- 사주 오행: ${OHENG_NAMES[main]} (${main})
- 태어난 시: ${JI_JI[t]}시
- 춤을 배우는 목적: ${q1}
- 선호하는 수업 분위기: ${q2}
- 현재 댄스 실력: ${q3}
- 선호 장르: ${q4}

결과 형식(JSON):
{
  "type": "체계형/감성형/에너지형/소통형 중 하나",
  "title": "한줄 요약 타이틀",
  "analysis": "사주와 연계된 상세 분석 내용 (3-4줄)",
  "keywords": ["키워드1", "키워드2", "키워드3"]
}

반드시 JSON 형식으로만 답변하세요.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })

      const data = await response.json()
      console.log('API 응답:', data)
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[0])
        setResult(aiData)
        setStep(3)
      } else {
        alert('분석 결과를 불러오지 못했습니다. 다시 시도해주세요.')
      }
    } catch (err) {
      console.error(err)
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1); setResult(null);
    setYear(''); setMonth(''); setDay(''); setTimeIdx(''); setGender('');
    setQ1(''); setQ2(''); setQ3(''); setQ4('');
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:10000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      {/* 배경 딤처리 */}
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} />

      {/* 모달 바디 */}
      <div style={{
        position:'relative', width:'100%', maxWidth:'500px', background:'#fff',
        borderRadius:'32px 32px 0 0', maxHeight:'92vh', overflowY:'auto',
        boxShadow:'0 -10px 40px rgba(0,0,0,0.2)', transition:'transform 0.3s ease-out'
      }}>
        
        {/* 공통 헤더 */}
        <div style={{
          position:'sticky', top:0, zIndex:10, background:'linear-gradient(135deg,#0D47A1 0%,#1565C0 100%)',
          padding:'20px', color:'#fff', borderRadius:'32px 32px 0 0'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button onClick={() => step === 1 ? onClose() : setStep(step - 1)} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', padding:8 }}>
              <ChevronLeft size={24} />
            </button>
            <div style={{ fontSize:18, fontWeight:900, display:'flex', alignItems:'center', gap:6 }}>
              <Sparkles size={20} /> 나의 댄스 강사 유형 찾기
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:32, height:32, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding:'24px 20px 40px' }}>
          {/* STEP 1: 기본 정보 */}
          {step === 1 && (
            <div style={{ animation:'fadeIn 0.3s' }}>
              <h3 style={{ fontSize:18, fontWeight:800, marginBottom:20, color:'#1e293b' }}>정보를 입력해주세요</h3>
              <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                {['남','여'].map(g => (
                  <button key={g} onClick={()=>setGender(g)} style={{
                    flex:1, padding:14, borderRadius:12, fontWeight:700,
                    background: gender===g ? '#1565C0' : '#fff',
                    color: gender===g ? '#fff' : '#94A3B8',
                    border: gender===g ? '2px solid #1565C0' : '1.5px solid #E2E8F0'
                  }}>{g==='남'?'👨 남성':'👩 여성'}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <input type="number" placeholder="년(1995)" value={year} onChange={e=>setYear(e.target.value)} style={INP} />
                <input type="number" placeholder="월" value={month} onChange={e=>setMonth(e.target.value)} style={INP} />
                <input type="number" placeholder="일" value={day} onChange={e=>setDay(e.target.value)} style={INP} />
              </div>
              <div style={{ position:'relative', marginBottom:30 }}>
                <select value={timeIdx} onChange={e=>setTimeIdx(e.target.value)} style={{ ...INP, appearance:'none' }}>
                  <option value="">태어난 시간 선택</option>
                  {TIME_LIST.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown size={18} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }} />
              </div>
              <button onClick={()=>setStep(2)} disabled={!isBasicValid} style={{
                width:'100%', padding:18, borderRadius:16, border:'none', fontSize:17, fontWeight:900,
                background: isBasicValid ? 'linear-gradient(135deg,#1565C0,#42A5F5)' : '#E2E8F0',
                color:'#fff', cursor:isBasicValid?'pointer':'not-allowed'
              }}>다음 단계로</button>
            </div>
          )}

          {/* STEP 2: 질문 */}
          {step === 2 && (
            <div style={{ animation:'fadeIn 0.3s' }}>
              <h3 style={{ fontSize:18, fontWeight:800, marginBottom:20, color:'#1e293b' }}>당신의 성향은?</h3>
              {[
                { label:'Q1. 배우는 목적', val:q1, set:setQ1, opts:['소셜파티','퍼포먼스/대회','취미','다이어트'] },
                { label:'Q2. 선호 분위기', val:q2, set:setQ2, opts:['체계적/꼼꼼','쉽고 재미있게','다 같이 친목','열정/빡센'] },
                { label:'Q3. 춤 실력', val:q3, set:setQ3, opts:['왕초보','기본기 초보','중급','고수'] },
                { label:'Q4. 중요 가치', val:q4, set:setQ4, opts:['기술/베이직','음악/감성','소통/연결','패턴/무대'] },
              ].map((q, idx) => (
                <div key={idx} style={{ marginBottom:20 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#64748b', marginBottom:10 }}>{q.label}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {q.opts.map(opt => (
                      <button key={opt} onClick={()=>q.set(opt)} style={{
                        padding:12, borderRadius:10, fontSize:13, fontWeight:600,
                        border: q.val===opt ? '1.5px solid #1565C0' : '1px solid #E2E8F0',
                        background: q.val===opt ? '#F0F7FF' : '#fff',
                        color: q.val===opt ? '#1565C0' : '#64748b',
                      }}>{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={analyze} disabled={!isQuestionsValid || loading} style={{
                width:'100%', padding:18, borderRadius:16, border:'none', fontSize:17, fontWeight:900,
                background: isQuestionsValid ? 'linear-gradient(135deg,#1565C0,#42A5F5)' : '#E2E8F0',
                color:'#fff', cursor:isQuestionsValid?'pointer':'not-allowed'
              }}>{loading ? '🔮 운명 분석 중...' : '🔮 나의 댄스 운명 확인하기'}</button>
            </div>
          )}

          {/* STEP 3: 결과 */}
          {step === 3 && result && (
            <div style={{ animation:'fadeIn 0.5s' }}>
              <div style={{ textAlign:'center', marginBottom:30, padding:24, borderRadius:24, background:'#F8FAFC', border:'2px solid #E2E8F0' }}>
                <div style={{ fontSize:40, marginBottom:16 }}>✨</div>
                <div style={{ fontSize:22, fontWeight:900, color:'#1e293b', marginBottom:8 }}>{result.type}</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#1565C0' }}>"{result.title}"</div>
              </div>
              
              <div style={{ marginBottom:30 }}>
                <h4 style={{ fontSize:16, fontWeight:900, color:'#1e293b', marginBottom:12 }}>👨‍🏫 나에게 맞는 강사 스타일</h4>
                <div style={{ padding:20, borderRadius:20, background:'#fff', border:'1.5px solid #E2E8F0', lineHeight:1.6, color:'#334155', fontSize:15 }}>
                  {result.analysis}
                </div>
              </div>

              <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginBottom:30 }}>
                {result.keywords?.map((k:string) => (
                  <span key={k} style={{ padding:'8px 16px', borderRadius:99, background:'#F1F5F9', color:'#475569', fontSize:13, fontWeight:700 }}>#{k}</span>
                ))}
              </div>

              <button onClick={reset} style={{ width:'100%', padding:16, borderRadius:14, background:'#F1F5F9', color:'#64748b', border:'none', fontSize:15, fontWeight:700, cursor:'pointer' }}>
                🔄 다시 분석하기
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        input[type="number"]::-webkit-inner-spin-button { display:none; }
      `}</style>
    </div>
  )
}
