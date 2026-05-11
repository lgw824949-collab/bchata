// updated
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronDown, Download } from 'lucide-react'
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { selectResult } from '../data/sajuResults'
import { selectResultEn } from '../data/sajuResultsEn'

// ─── 입문자용 데이터 (일관성 있는 문구 규칙 적용) ───
const BEGINNER_MESSAGES_EN = [
  { cat: "First Day Empathy", text: "The person standing against the wall at their first party\nis now teaching on national stages.\nThey started just like you." },
  { cat: "First Day Empathy", text: "Even a 10-year instructor couldn't\ncatch a single beat on their first day.\nThat's where dance begins." },
  { cat: "First Day Empathy", text: "Every master's first day\nwas exactly like your today.\nAwkward, heart-fluttering, and nervous." },
  { cat: "Courage Support", text: "If you wait until you're perfectly ready to dance,\nyou'll never go out.\nGoing out as you are now is the right answer." },
  { cat: "Courage Support", text: "When you say 'it's my first time' at a party,\neveryone becomes kinder.\nThat phrase will be your magic spell." },
  { cat: "Courage Support", text: "The first time is the bravest.\nYou are the coolest person right now." },
  { cat: "Community", text: "When you say you're new to the dance scene,\nthere's always someone who reaches out.\nFeel that warmth." },
  { cat: "Community", text: "There are many people who come alone.\nYou are not the only one feeling awkward." },
  { cat: "Growth Story", text: "No one regrets starting dance.\nMany regret not starting it.\nStart now." },
  { cat: "Growth Story", text: "You can look forward to\nhow much you'll change\n3 months from now." },
  { cat: "Emotional Support", text: "Saju tells you.\nThis excitement right now is a signal in your life." },
  { cat: "Emotional Support", text: "Dance isn't done with the body.\nIt's done with the heart.\nYou are already ready." },
  { cat: "Challenge", text: "This week's mission.\nGo check out just one party.\nYou don't even have to dance." },
  { cat: "Challenge", text: "Try standing on the floor for just one song.\nThat one song will change everything." },
  { cat: "Challenge", text: "If you have the courage to come this far today,\nyou just need to open one more party door.\nLet's go together." }
];

function getBeginnerContent() {
  const BEGINNER_MESSAGES = [
    { cat: "첫날 공감", text: "첫 파티에서 벽에 붙어 서있던 사람이\n지금 전국 무대에서 가르치고 있어요.\n그 사람도 당신이었어요." },
    { cat: "첫날 공감", text: "10년 차 강사도 첫날엔\n박자 하나도 못 맞췄대요.\n진짜예요." },
    { cat: "첫날 공감", text: "모든 고수의 첫날은\n당신의 오늘과 똑같았어요.\n어색하고, 두근거리고, 설레고." },
    { cat: "용기 응원", text: "완벽하게 출 준비가 됐을 때 나가려고 기다리면\n평생 못 나가요.\n지금 이 상태로 나가는 게 맞아요." },
    { cat: "용기 응원", text: "파티에서 '처음이에요'라고 하면\n모두가 더 친절해져요.\n그 말이 마법이에요." },
    { cat: "용기 응원", text: "처음이 가장 용감한 거예요.\n지금 당신이 그 용감한 사람이에요." },
    { cat: "커뮤니티", text: "댄스 씬에서 처음이라고 하면\n손 내밀어 주는 사람이 꼭 있어요.\n그 온기, 느껴보세요." },
    { cat: "커뮤니티", text: "혼자 오는 사람도 많아요.\n어색한 건 혼자가 아니에요." },
    { cat: "성장 이야기", text: "댄스를 시작한 걸 후회한 사람은\n거의 없어요.\n시작 안 한 걸 후회하는 사람은 많아요." },
    { cat: "성장 이야기", text: "3개월 후 자신이\n지금과 얼마나 달라질지\n아직 몰라요. 기대해도 돼요." },
    { cat: "감성 응원", text: "사주가 말해요.\n지금 이 설레임이 진짜 신호예요." },
    { cat: "감성 응원", text: "춤은 몸으로 하는 게 아니에오.\n마음으로 하는 거예요.\n마음 준비는 이미 됐잖아요." },
    { cat: "도전 유도", text: "이번 주 미션:\n파티 하나만 구경 가보세요.\n춤 안 춰도 돼요." },
    { cat: "도전 유도", text: "딱 한 곡만 플로어에 서봐요.\n그 한 곡이 모든 걸 바꿀 수 있어요." },
    { cat: "도전 유도", text: "오늘 여기까지 온 용기,\n파티 문 하나만 더 열면 돼요." },
  ]
  const shuffled = [...BEGINNER_MESSAGES].sort(() => Math.random() - 0.5)
  return {
    mainMessage: shuffled[0],
    subMessages: shuffled.slice(1, 4),
    challenge: BEGINNER_MESSAGES.find(m => m.cat === '도전 유도')
  }
}

// ─── 상수 ───
const CHUN_GAN = ['갑','을','병','정','무','기','경','신','임','계']
const JI_JI     = ['자','축','인','묘','진','사','오','미','신','유','술','해']
const CHUN_GAN_OHENG = ['목','목','화','화','토','토','금','금','물','물']
const JI_JI_OHENG     = ['물','토','목','목','토','화','화','토','금','금','토','물']
const CHUN_GAN_EMOJI = ['🌲','🌿','🔥','🕯️','⛰️','🪴','💎','💍','🌊','💧']

const TIME_LIST = [
  { label:'자시 (23:30~01:30)', value:0 }, { label:'축시 (01:30~03:30)', value:1 },
  { label:'인시 (03:30~05:30)', value:2 }, { label:'묘시 (05:30~07:30)', value:3 },
  { label:'진시 (07:30~09:30)', value:4 }, { label:'사시 (09:30~11:30)', value:5 },
  { label:'오시 (11:30~13:30)', value:6 }, { label:'미시 (13:30~15:30)', value:7 },
  { label:'신시 (15:30~17:30)', value:8 }, { label:'유시 (17:30~19:30)', value:9 },
  { label:'술시 (19:30~21:30)', value:10 }, { label:'해시 (21:30~23:30)', value:11 }
]

const OHENG_DANCE = {
  '목': { genre:'바차타', emoji:'🌊', color:'#1565C0', bg:'#E3F2FD', border:'#BBDEFB' },
  '화': { genre:'살사', emoji:'💃', color:'#C62828', bg:'#FFEBEE', border:'#FFCDD2' },
  '토': { genre:'키좀바', emoji:'🕯️', color:'#4E342E', bg:'#EFEBE9', border:'#D7CCC8' },
  '금': { genre:'쥬크', emoji:'🌊', color:'#2E7D32', bg:'#E8F5E9', border:'#C8E6C9' },
  '물': { genre:'바차타', emoji:'🌊', color:'#1565C0', bg:'#E3F2FD', border:'#BBDEFB' },
  '木': { genre:'바차타', emoji:'🌊', color:'#1565C0', bg:'#E3F2FD', border:'#BBDEFB' },
  '火': { genre:'살사', emoji:'💃', color:'#C62828', bg:'#FFEBEE', border:'#FFCDD2' },
  '土': { genre:'키좀바', emoji:'🕯️', color:'#4E342E', bg:'#EFEBE9', border:'#D7CCC8' },
  '金': { genre:'쥬크', emoji:'🌊', color:'#2E7D32', bg:'#E8F5E9', border:'#C8E6C9' },
  '水': { genre:'바차타', emoji:'🌊', color:'#1565C0', bg:'#E3F2FD', border:'#BBDEFB' }
}

const OHENG_HANJA_MAP = { '목': '木', '화': '火', '토': '土', '금': '金', '물': '수' }

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

const SajuModal = ({ parties, onClose, lang = 'ko' }) => {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language === 'en'

  const [step, setStep]       = useState(1)
  const [gender, setGender]   = useState('')
  const [year, setYear]       = useState('')
  const [month, setMonth]     = useState('')
  const [day, setDay]         = useState('')
  const [timeIdx, setTimeIdx] = useState('')
  const [experience, setExperience] = useState('beginner')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [recommendedBars, setRecommendedBars] = useState([])
  const [fullPoster, setFullPoster] = useState(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const imgRef = React.useRef()

  // 데이터 불러오기 및 자동 분석 시도
  useEffect(() => {
    const saved = localStorage.getItem('saju_user_data')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setGender(data.gender || '')
        setYear(data.year || '')
        setMonth(data.month || '')
        setDay(data.day || '')
        setTimeIdx(data.timeIdx !== undefined ? data.timeIdx : '')
        setExperience(data.experience || 'beginner')
        setIsDataLoaded(true)
      } catch (e) { console.error('Failed to parse saju data', e) }
    }
  }, [])

  const isValid = gender && year && month && day && timeIdx !== ''
  const todayStr = new Date().toISOString().split('T')[0]

  const analyze = async () => {
    if (!isValid) return
    setLoading(true)

    // 1. GPS 위치 획득 및 거리순 파티 조회 (공통 로직)
    let userLat = null, userLon = null
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000, maximumAge: 60000 })
      })
      userLat = position.coords.latitude; userLon = position.coords.longitude
    } catch (e) { console.log('GPS Skip') }

    const { data: bars } = await supabase
      .from('parties')
      .select('title, fee, date, b_ratio, s_ratio, k_ratio, j_ratio, poster_url, locations(name, address, latitude, longitude)')
      .eq('status', 'approved').gte('date', todayStr).limit(100)

    const calcDist = (lat1, lon1, lat2, lon2) => {
      const R = 6371; const dLat = (lat2-lat1)*Math.PI/180; const dLon = (lon2-lon1)*Math.PI/180
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    }

    const sortedByDist = (bars || []).map(b => ({
      ...b,
      distance: (userLat && userLon && b.locations) ? calcDist(userLat, userLon, b.locations.latitude, b.locations.longitude) : 9999
    })).sort((a,b)=>a.distance - b.distance)

    // 입문자 분기
    if (experience === 'beginner') {
      const top3 = sortedByDist.slice(0, 3)
      setResult({
        isBeginner: true,
        ...getBeginnerContent(isEn),
        recommendedBars: top3
      })
      setRecommendedBars(top3)
      setLoading(false)
      setStep(2)
      return
    }

    // 기존 오행 로직 (경력자용)
    const y=parseInt(year), m=parseInt(month), d=parseInt(day), t=parseInt(timeIdx)
    const yGJ = getYearGanJi(y), mGJ = getMonthJi(m), dGJ = getDayGanJi(y,m,d)
    const tGJ = { gan:'', ji:JI_JI[t], ganOheng:'', jiOheng:JI_JI_OHENG[t], emoji:'🕐' }

    const count = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
    const list = [yGJ, mGJ, dGJ, tGJ]
    list.forEach(item => {
      const gO = OHENG_HANJA_MAP[item.ganOheng] || item.ganOheng
      const jO = OHENG_HANJA_MAP[item.jiOheng] || item.jiOheng
      if (gO) count[gO]++
      if (jO) count[jO]++
    })
    const main = Object.entries(count).sort((a,b)=>b[1]-a[1])[0][0]
    const dance = OHENG_DANCE[main]

    const ratioKey = { '바차타':'b_ratio', '살사':'s_ratio', '키좀바':'k_ratio', '쥬크':'j_ratio' }[dance.genre] || 'b_ratio'
    const filtered = sortedByDist.filter(b => b[ratioKey] > 0)
    const finalBars = filtered.slice(0, 3)
    setRecommendedBars(finalBars)

    const detailed = isEn 
      ? selectResultEn(dance.genre, gender, month, day, count, experience)
      : selectResult(dance.genre, gender, month, day, count, experience)
      
    const resultData = { ...detailed, dance, recommendedBars: finalBars, gender, today: todayStr, mainOheng: main }
    
    // 데이터 저장
    localStorage.setItem('saju_user_data', JSON.stringify({
      gender, year, month, day, timeIdx, experience
    }))

    setResult(resultData)
    setLoading(false)
    setStep(2)
  }

  const reset = () => {
    setStep(1); setResult(null); setYear(''); setMonth(''); setDay(''); setTimeIdx(''); setGender(''); setExperience('beginner')
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'450px', maxHeight:'94vh', background:'#fff', borderRadius:'24px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.2)', position:'relative' }}>
        
        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #F1F5F9', background:'#fff', zIndex:10 }}>
          <button onClick={onClose} style={{ background:'#F1F5F9', border:'none', width:'40px', height:'40px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginRight:'12px' }}>
            <ChevronLeft size={24} color="#64748B" />
          </button>
          <div style={{ fontSize:18, fontWeight:900, color:'#1E293B' }}>{t('nav_saju')}</div>
        </div>

        <div style={{ flex:1, overflowY:'auto', background:'#ffffff' }}>
          
          {step === 1 && (
            <div style={{ padding:'32px 24px' }}>
              <div style={{ background:'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', padding:'24px', borderRadius:'20px', color:'white', marginBottom:'28px' }}>
                <div style={{ fontSize:20, fontWeight:900, marginBottom:8 }}>{lang === 'ko' ? '댄스 분석' : 'Dance Analysis'}</div>
                <div style={{ fontSize:12, opacity:0.8 }}>{t('saju_desc')}</div>
              </div>

              {isDataLoaded ? (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ background: '#F5F3FF', padding: '20px', borderRadius: '16px', border: '1px solid #DDD6FE', marginBottom: '20px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#4C1D95', marginBottom: '12px' }}>{t('saju_info_found')}</div>
                    <div style={{ fontSize: '13px', color: '#6D28D9', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span>{gender === '남' ? t('saju_male') : t('saju_female')}</span>
                      <span>•</span>
                      <span>{year}{isEn ? '' : '년'} {month}{isEn ? '' : '월'} {day}{isEn ? '' : '일'}</span>
                      <span>•</span>
                      <span>{experience === 'beginner' ? t('saju_beginner') : t('saju_experienced')}</span>
                    </div>
                  </div>
                  <button onClick={analyze} disabled={loading} style={{ width:'100%', padding:'18px', borderRadius:16, background:'#7C3AED', color:'#fff', border:'none', fontSize:17, fontWeight:900, cursor:'pointer', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)' }}>
                    {loading ? t('saju_analyzing') : t('saju_view_today')}
                  </button>
                  <button onClick={() => setIsDataLoaded(false)} style={{ width: '100%', marginTop: '16px', background: 'none', border: 'none', color: '#94A3B8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{t('saju_edit_info')}</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:700, marginBottom:8 }}>{lang === 'ko' ? '성별' : 'Gender'}</label>
                    <div style={{ display:'flex', gap:10 }}>
                      {['남','여'].map(g=>(
                        <button key={g} onClick={()=>setGender(g)} style={{ flex:1, padding:'14px', borderRadius:12, border:gender===g?'2px solid #7C3AED':'1px solid #E2E8F0', background:gender===g?'#F5F3FF':'#fff', color:gender===g?'#7C3AED':'#64748B', fontWeight:700, cursor:'pointer' }}>{g==='남'?(lang==='ko'?'남성':'Male'):(lang==='ko'?'여성':'Female')}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:700, marginBottom:8 }}>{lang === 'ko' ? '댄스 경력' : 'Dance Experience'}</label>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <button onClick={()=>setExperience('beginner')} style={{ padding:'14px', borderRadius:12, border:experience==='beginner'?'2px solid #7C3AED':'1px solid #E2E8F0', background:experience==='beginner'?'#F5F3FF':'#fff', textAlign:'left', cursor:'pointer' }}>
                        <div style={{ fontSize:14, fontWeight:700, color:experience==='beginner'?'#7C3AED':'#1E293B' }}>{lang === 'ko' ? '처음이에요 / 입문' : 'Beginner'}</div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{t('saju_beginner_desc')}</div>
                      </button>
                      <button onClick={()=>setExperience('experienced')} style={{ padding:'14px', borderRadius:12, border:experience==='experienced'?'2px solid #7C3AED':'1px solid #E2E8F0', background:experience==='experienced'?'#F5F3FF':'#fff', textAlign:'left', cursor:'pointer' }}>
                        <div style={{ fontSize:14, fontWeight:700, color:experience==='experienced'?'#7C3AED':'#1E293B' }}>{lang === 'ko' ? '경력자예요' : 'Experienced'}</div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{t('saju_experienced_desc')}</div>
                      </button>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:10 }}>
                    <div style={{ flex:1 }}><label style={{ display:'block', fontSize:13, fontWeight:700, marginBottom:6 }}>{lang === 'ko' ? '생년' : 'Year'}</label><input type="number" placeholder="1995" value={year} onChange={e=>setYear(e.target.value)} style={{ width:'100%', padding:12, borderRadius:10, border:'1.5px solid #E2E8F0' }} /></div>
                    <div style={{ flex:1 }}><label style={{ display:'block', fontSize:13, fontWeight:700, marginBottom:6 }}>{lang === 'ko' ? '월' : 'Month'}</label><input type="number" placeholder="5" value={month} onChange={e=>setMonth(e.target.value)} style={{ width:'100%', padding:12, borderRadius:10, border:'1.5px solid #E2E8F0' }} /></div>
                    <div style={{ flex:1 }}><label style={{ display:'block', fontSize:13, fontWeight:700, marginBottom:6 }}>{lang === 'ko' ? '일' : 'Day'}</label><input type="number" placeholder="20" value={day} onChange={e=>setDay(e.target.value)} style={{ width:'100%', padding:12, borderRadius:10, border:'1.5px solid #E2E8F0' }} /></div>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, marginBottom:6 }}>{lang === 'ko' ? '태어난 시간 (모르면 무관)' : 'Birth Time (optional)'}</label>
                    <select value={timeIdx} onChange={e=>setTimeIdx(e.target.value)} style={{ width:'100%', padding:12, borderRadius:10, border:'1.5px solid #E2E8F0', background:'#fff' }}>
                      <option value="">{t('saju_birth_time_unknown')}</option>
                      {TIME_LIST.map(t=><option key={t.value} value={t.value}>{isEn ? t.label.replace('시', '').replace('오후', 'PM').replace('새벽', 'AM') : t.label}</option>)}
                    </select>
                  </div>

                  <button onClick={analyze} disabled={!isValid || loading} style={{ width:'100%', padding:'18px', borderRadius:16, background:isValid?'#7C3AED':'#CBD5E1', color:'#fff', border:'none', fontSize:16, fontWeight:900, cursor:isValid?'pointer':'not-allowed', marginTop:10 }}>
                    {loading ? t('saju_analyzing') : (lang === 'ko' ? '나의 댄스 분석하기' : 'Analyze My Dance')}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && result && (
            <div style={{ background:'#fff' }}>
              {result.isBeginner ? (
                <div style={{ padding:'0 0 32px' }}>
                  <div style={{ background:'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', padding:'48px 24px', textAlign:'center', color:'white' }}>
                    <div style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>{t('saju_first_step')}</div>
                    <div style={{ fontSize:14, opacity:0.8 }}>{t('saju_start_today')}</div>
                  </div>

                  <div style={{ padding:'32px 24px' }}>
                    <div style={{ background:'#1a1a2e', border:'1px solid #7F77DD', borderRadius:12, padding:24, marginBottom:24, color:'white', lineHeight:1.8, whiteSpace:'pre-line', fontSize:15 }}>
                      {result.mainMessage?.text}
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:0, marginBottom:32 }}>
                      {result.subMessages?.map((msg, i) => (
                        <div key={i} style={{ display:'flex', gap:12, marginBottom:16 }}>
                          <div style={{ width:6, height:6, background:'#7C3AED', borderRadius:'50%', marginTop:'10px', flexShrink:0 }} />
                          <div style={{ flex:1, fontSize:15, color:'#4B5563', lineHeight:1.7, whiteSpace:'pre-line', textAlign:'left' }}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ border:'1px solid #FFD700', background:'rgba(255,215,0,0.07)', borderRadius:12, padding:20, color:'#D97706', fontSize:14, fontWeight:700, textAlign:'center', lineHeight:1.6 }}>
                      {t('saju_mission')}: {result.challenge?.text}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ background:'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', padding:'40px 24px', textAlign:'center', borderBottom:'1px solid #DDD6FE' }}>
                    <div style={{ fontSize:10, color:'#7C3AED', fontWeight:800, letterSpacing:4, marginBottom:16 }}>DANCE ANALYSIS REPORT</div>
                    <div style={{ fontSize:56, marginBottom:10 }}>{result.selectedType?.type?.split(' ')[0]}</div>
                    <div style={{ fontSize:24, fontWeight:900, color:'#1E1B4B', marginBottom:8 }}>{result.selectedType?.type}</div>
                    <div style={{ fontSize:14, color:'#4338CA', lineHeight:1.6, marginBottom:24 }}>{result.selectedType?.typeDesc}</div>
                    <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
                      <span style={{ background:'#7C3AED', color:'#fff', fontSize:12, padding:'6px 16px', borderRadius:24, fontWeight:700 }}>✨ {result.mainOheng} 기운</span>
                      <span style={{ background:'#fff', color:'#7C3AED', fontSize:12, padding:'6px 16px', borderRadius:24, fontWeight:700, border:'1px solid #DDD6FE' }}>💃 {result.genre} · {result.levelLabel}</span>
                    </div>
                  </div>

                  <div style={{ padding:'32px 24px' }}>
                    <div style={{ background:'#FDFCF7', borderRadius:24, padding:24, marginBottom:24, border:'1px solid #FEF3C7' }}>
                      <div style={{ fontSize:13, color:'#D97706', fontWeight:800, marginBottom:12 }}>{t('saju_vibe_guide')}</div>
                      <div style={{ fontSize:15, color:'#451A03', lineHeight:1.8, whiteSpace:'pre-line', fontWeight:500 }}>{result.vibeText}</div>
                    </div>
                  </div>
                </>
              )}

              {/* 하단 추천 BAR (공통 거리순 적용) */}
              <div style={{ padding:'0 24px 40px' }}>
                <div style={{ fontSize:16, fontWeight:900, color:'#1E1B4B', marginBottom:16 }}>{t('saju_recommend_bar')}</div>
                {recommendedBars.map((bar, i) => (
                  <div key={i} onClick={()=>bar.poster_url && setFullPoster(bar.poster_url)} style={{ background:i===0?'linear-gradient(to right, #fff, #F5F3FF)':'#fff', borderRadius:20, border:i===0?'2px solid #C4B5FD':'1px solid #F3F4F6', padding:18, marginBottom:12, display:'flex', gap:16, alignItems:'center', cursor:bar.poster_url?'pointer':'default' }}>
                    <div style={{ width:64, height:86, borderRadius:12, overflow:'hidden', background:'#F3F4F6', flexShrink:0 }}>
                      {bar.poster_url ? <img src={bar.poster_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#999' }}>NO IMG</div>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <div style={{ fontSize:16, fontWeight:800, color:'#1E1B4B' }}>{bar.locations?.name || bar.title}</div>
                        {bar.distance < 9999 && <div style={{ fontSize:11, color:'#7C3AED', fontWeight:800 }}>📍 {bar.distance < 1 ? `${Math.round(bar.distance*1000)}m` : `${bar.distance.toFixed(1)}km`}</div>}
                      </div>
                      <div style={{ fontSize:12, color:'#6B7280', marginBottom:4 }}>{bar.locations?.address?.substring(0, 18)}...</div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <div style={{ fontSize:14, color:'#7C3AED', fontWeight:700 }}>{bar.fee || '무료'}</div>
                        <div style={{ fontSize:11, color:'#9CA3AF' }}>{bar.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => window.open('https://open.kakao.com/o/gP43rNri', '_blank')} style={{ width:'100%', padding:18, background:'#FEE500', color:'#3C1E1E', border:'none', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', marginBottom:12, marginTop:20 }}>{t('saju_join_chat')}</button>
                <button onClick={reset} style={{ width:'100%', background:'none', border:'none', color:'#9CA3AF', fontSize:13, cursor:'pointer' }}>{t('saju_retry')}</button>
              </div>
            </div>
          )}
        </div>

        {fullPoster && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.98)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
            <button onClick={()=>setFullPoster(null)} style={{ position:'absolute', top:'40px', left:'20px', zIndex:3010, background:'rgba(255,255,255,0.2)', border:'none', width:'44px', height:'44px', borderRadius:'50%', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)' }}>
              <ChevronLeft size={28} />
            </button>
            <QuickPinchZoom onUpdate={({ x, y, scale }) => {
              if (imgRef.current) imgRef.current.style.transform = make3dTransformValue({ x, y, scale });
            }}>
              <img ref={imgRef} src={fullPoster} style={{ width:'100%', height:'auto', borderRadius:0, display:'block', willChange:'transform' }} alt="Full Poster" />
            </QuickPinchZoom>
          </div>
        )}
      </div>
    </div>
  )
}

export default SajuModal;
