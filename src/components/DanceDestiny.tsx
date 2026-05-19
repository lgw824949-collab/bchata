import { Z } from '../constants/zLayers';
﻿// src/components/DanceDestiny.tsx
// 최종 완성본: 강사 매칭 최적화 / Gemini API 연동 / 404 에러 방지 및 로컬 롤백 포함
// 추천 클래스 & 강사 라인업 복구 완료

import React, { useState } from 'react'
import { X, ChevronDown, Sparkles, ChevronLeft } from 'lucide-react'

// --- 사주 상수 ---
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
const OHENG_DANCE: Record<string, any> = {
  '火': { genre:'살사', emoji:'🔥', color:'#E53935', bg:'#FFF0F0', border:'#FFCDD2', traits:['열정적','강렬함','카리스마'] },
  '水': { genre:'바차타', emoji:'🌊', color:'#1565C0', bg:'#E3F2FD', border:'#BBDEFB', traits:['감성적','유연함','섬세함'] },
  '木': { genre:'주크바차타', emoji:'🌿', color:'#2E7D32', bg:'#E8F5E9', border:'#C8E6C9', traits:['유연함','창의성','균형감'] },
  '金': { genre:'키좀바', emoji:'💎', color:'#6D28D9', bg:'#F5F3FF', border:'#DDD6FE', traits:['절제','정밀함','신뢰감'] },
  '土': { genre:'모든 장르', emoji:'⛰️', color:'#92400E', bg:'#FEF3C7', border:'#FDE68A', traits:['안정감','포용력','신뢰'] },
}

// --- 유틸 함수 ---
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

const INP: React.CSSProperties = {
  padding:'12px 14px', borderRadius:12, border:'1.5px solid #E2E8F0',
  fontSize:14, outline:'none', background:'#FAFBFF', color:'#111', width:'100%',
  fontFamily:"inherit",
}

export default function DanceDestiny({ onClose, lessons=[] }: { onClose: () => void, lessons?: any[] }) {
  const [step, setStep]       = useState(1)
  const [gender, setGender]   = useState('')
  const [year, setYear]       = useState('')
  const [month, setMonth]     = useState('')
  const [day, setDay]         = useState('')
  const [timeIdx, setTimeIdx] = useState('')
  const [region, setRegion]   = useState('')
  
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q3, setQ3] = useState('')
  const [q4, setQ4] = useState('')

  const [result, setResult]   = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const isBasicValid = gender && year && month && day && timeIdx !== '' && region
  const isQuestionsValid = q1 && q2 && q3 && q4

  const analyze = async () => {
    if (!isBasicValid || !isQuestionsValid) return
    setLoading(true)

    const y=parseInt(year), m=parseInt(month), d=parseInt(day), t=parseInt(timeIdx)
    const saju = [getYearGJ(y), getMonthJi(m), getDayGJ(y,m,d), { ji:JI_JI[t], jiOheng:JI_JI_OHENG[t] }]
    const main = calcMainOheng(saju)
    const dance = { ...OHENG_DANCE[main] }

    // 추천 클래스 매칭 로직 (선택 장르 + 지역 필터링 엄격 적용)
    const now = new Date()
    const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    const todayStr = kstDate.toISOString().split('T')[0]

    const genreMatch = (l: any, targetGenre: string) => {
      const title = (l.title || '').toLowerCase()
      const genre = (l.genre || '').toLowerCase()
      // 사용자가 선택한 장르가 제목이나 장르 필드에 반드시 포함되어야 함
      if (targetGenre === '살사') return title.includes('살사') || genre.includes('살사')
      if (targetGenre === '바차타') return title.includes('바차타') || genre.includes('바차타')
      if (targetGenre === '쥬크') return title.includes('쥬크') || title.includes('주크') || genre.includes('주크') || genre.includes('쥬크')
      if (targetGenre === '키좀바') return title.includes('키좀바') || genre.includes('키좀바')
      return false
    }

    const matchedClasses = lessons
      .filter(l => {
        const isFuture = l.start_date >= todayStr;
        // 사주 기반이 아닌, 사용자가 직접 선택한 장르(q4)를 최우선으로 매칭
        const isGenreMatch = genreMatch(l, q4);
        const isRegionMatch = !region || l.broadRegion === region;
        return isFuture && isGenreMatch && isRegionMatch;
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 3)
      .map(l => ({
        title: l.title,
        instructor: l.instructor || l.teacher || '전문 강사',
        location: l.studio_name || l.location_name || '댄스 스튜디오',
        date: l.start_date,
        poster_url: l.poster_url
      }))

    // 로컬 분석 Fallback (AI 실패 시 대비)
    let instructorType = ""
    let instructorStyle = ""
    if (q2 === '체계적이고 꼼꼼하게') {
      instructorType = "체계형 (기초/원리 중심)"; instructorStyle = `기초부터 탄탄하게 잡아주는 정석적인 강사 스타일이 맞아요. ${OHENG_NAMES[main]}의 기운을 가진 당신은 정확한 원리를 이해할 때 큰 성취감을 느낍니다.`
    } else if (q2 === '쉽고 재미있게') {
      instructorType = "소통형 (파트너십/즐거움 중심)"; instructorStyle = `유머러스하고 유쾌한 분위기를 만드는 강사 스타일이 어울려요. 즐거운 분위기 속에서 당신의 잠재력이 가장 잘 발휘됩니다.`
    } else if (q2 === '다 같이 친해지는 분위기') {
      instructorType = "감성형 (음악/느낌 중심)"; instructorStyle = `커뮤니티와 소통을 중시하는 외향적인 강사 스타일이 맞아요. 사람들과 교류하며 에너지를 얻는 당신에게 최고의 환경입니다.`
    } else {
      instructorType = "에너지형 (열정/퍼포먼스 중심)"; instructorStyle = `에너지가 넘치고 강렬한 카리스마를 가진 강사 스타일이 어울려요. 당신의 열정을 자극하는 피드백이 성장의 원동력이 됩니다.`
    }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (apiKey) {
        const prompt = `당신은 댄스 강사 유형 분석 전문가입니다. 아래 정보를 바탕으로 이 사람에게 맞는 댄스 강사 유형을 분석해주세요.
- 사주 오행: ${OHENG_NAMES[main]}
- 춤 배우는 목적: ${q1}
- 선호 분위기: ${q2}
- 춤 실력: ${q3}
- 선호 가치: ${q4}

결과 형식(JSON):
{
  "type": "체계형/감성형/에너지형/소통형 중 하나",
  "title": "한줄 요약 타이틀",
  "analysis": "사주와 연계된 상세 분석 내용 (3-4줄)",
  "keywords": ["키워드1", "키워드2", "키워드3"]
}
반드시 JSON 형식으로만 답변하세요.`

        const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        const response = await fetch(`${endpoint}?key=${apiKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        
        if (jsonMatch) {
          const ai = JSON.parse(jsonMatch[0])
          setResult({
            dance, mainOheng: main, gender, today: todayStr,
            instructorType: `${ai.type} (${ai.title})`,
            instructorStyle: ai.analysis,
            aiKeywords: ai.keywords,
            matchedClasses
          })
          setStep(3); setLoading(false); return
        }
      }
    } catch (err) {
      console.error('Gemini API Error, falling back to local analysis:', err)
    }

    // AI 실패 시 로컬 결과 적용
    setResult({
      dance, mainOheng: main, gender, today: todayStr,
      instructorType, instructorStyle, matchedClasses
    })
    setStep(3); setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex: Z.modal, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)' }} />

      <div style={{
        position:'relative', width:'100%', maxWidth:'500px', background:'#fff',
        borderRadius:'32px 32px 0 0', maxHeight:'94vh', overflowY:'auto',
        boxShadow:'0 -10px 40px rgba(0,0,0,0.2)'
      }}>
        
        {/* 헤더 */}
        <div style={{
          position:'sticky', top:0, zIndex:10, background:'linear-gradient(135deg,#0D47A1 0%,#1565C0 100%)',
          padding:'20px 20px 40px', color:'#fff', borderRadius:'32px 32px 0 0'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
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
          <svg style={{ position:'absolute', bottom:0, left:0, width:'100%' }} viewBox="0 0 400 50" preserveAspectRatio="none">
            <path d="M0,50 C110,20 210,60 400,50 L400,50 L0,50 Z" fill="#ffffff"/>
          </svg>
        </div>

        <div style={{ padding:'10px 20px 40px' }}>
          {step === 1 && (
            <div style={{ animation:'fadeIn 0.3s' }}>
              <h3 style={{ fontSize:16, fontWeight:800, marginBottom:20, color:'#1e293b' }}>정보를 입력해주세요</h3>
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
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <select value={timeIdx} onChange={e=>setTimeIdx(e.target.value)} style={{ ...INP, appearance:'none' }}>
                  <option value="">태어난 시간 선택</option>
                  {TIME_LIST.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown size={18} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }} />
              </div>

              <div style={{ position: 'relative', marginBottom: 30 }}>
                <select value={region} onChange={e=>setRegion(e.target.value)} style={{ ...INP, appearance:'none' }}>
                  <option value="">활동 지역 선택</option>
                  {['서울', '경인', '경상도', '전라도', '충청도', '강원/제주'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown size={18} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }} />
              </div>
              <button onClick={()=>setStep(2)} disabled={!isBasicValid} style={{
                width:'100%', padding:18, borderRadius:16, border:'none', fontSize:17, fontWeight:900,
                background: isBasicValid ? 'linear-gradient(135deg,#1565C0,#42A5F5)' : '#E2E8F0',
                color:'#fff', cursor:isBasicValid?'pointer':'not-allowed'
              }}>다음 단계로 (1/2)</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation:'fadeIn 0.3s' }}>
              <h3 style={{ fontSize:16, fontWeight:800, marginBottom:20, color:'#1e293b' }}>당신의 성향은?</h3>
              {[
                { label:'Q1. 배우는 목적', val:q1, set:setQ1, opts:['소셜파티','퍼포먼스/대회','취미','다이어트'] },
                { label:'Q2. 선호 분위기', val:q2, set:setQ2, opts:['체계적/꼼꼼','쉽고 재미있게','다 같이 친목','열정/빡센'] },
                { label:'Q3. 춤 실력', val:q3, set:setQ3, opts:['왕초보','기본기 초보','중급','고수'] },
                { label:'Q4. 선호 장르', val:q4, set:setQ4, opts:['바차타', '살사', '쥬크', '키좀바'] },
              ].map((q, idx) => (
                <div key={idx} style={{ marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#64748b', marginBottom:10 }}>{q.label}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {q.opts.map(opt => (
                      <button key={opt} onClick={()=>q.set(opt)} style={{
                        padding:12, borderRadius:10, fontSize:12, fontWeight:600,
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
              }}>{loading ? '🔮 분석 중...' : '🔮 강사 유형 확인하기'}</button>
            </div>
          )}

          {step === 3 && result && (
            <div style={{ animation:'fadeIn 0.5s' }}>
              <div style={{ textAlign:'center', marginBottom:24, padding:24, borderRadius:24, background:result.dance.bg, border:`2px solid ${result.dance.border}` }}>
                <div style={{ fontSize:40, marginBottom:16 }}>{result.dance.emoji}</div>
                <div style={{ fontSize:22, fontWeight:900, color:'#1e293b', marginBottom:8 }}>{result.instructorType}</div>
                <div style={{ fontSize:14, color:result.dance.color, fontWeight:700 }}>{result.gender}성 · {OHENG_NAMES[result.mainOheng]} 기운 분석</div>
              </div>
              
              <div style={{ marginBottom:30 }}>
                <h4 style={{ fontSize:15, fontWeight:900, color:'#1e293b', marginBottom:12 }}>👨‍🏫 나에게 맞는 강사 스타일</h4>
                <div style={{ padding:20, borderRadius:20, background:'#f8fafc', border:'1.5px solid #E2E8F0', lineHeight:1.6, color:'#334155', fontSize:15 }}>
                  {result.instructorStyle}
                </div>
              </div>

              <div style={{ marginBottom:30 }}>
                <h4 style={{ fontSize:15, fontWeight:900, color:'#1e293b', marginBottom:12 }}>✨ 추천 클래스 & 강사 라인업</h4>
                {result.matchedClasses && result.matchedClasses.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {result.matchedClasses.map((cls: any, i: number)=>(
                      <div key={i} style={{ padding:16, borderRadius:16, background:'#fff', border:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 8px rgba(0,0,0,0.03)' }}>
                        <div style={{ width:56, height:56, borderRadius:12, background:'#f8fafc', border:'1px solid #e2e8f0', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {cls.poster_url ? <img src={cls.poster_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:20 }}>👤</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>{cls.title}</div>
                          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{cls.instructor} | {cls.location}</div>
                          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{cls.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '30px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>
                      선택하신 '{q4}' 수업이<br />현재 지역에 준비 중입니다.
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                      다른 지역이나 장르를 선택해 보세요!
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => { setStep(1); setResult(null); }} style={{ width:'100%', padding:16, borderRadius:14, background:'#f1f5f9', color:'#64748b', border:'none', fontSize:15, fontWeight:700, cursor:'pointer' }}>
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
