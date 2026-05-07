import React, { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { selectResult } from '../data/sajuResults'

// ─── 입문자용 데이터 (일관성 있는 문구 규칙 적용) ───
const BEGINNER_MESSAGES = [
  { cat: "첫날 공감", text: "첫 파티에서 벽에 붙어 서있던 사람이\n지금 전국 무대에서 가르치고 있어요.\n그 사람도 시작은 당신과 같았어요." },
  { cat: "첫날 공감", text: "10년 차 강사도 첫날엔\n박자 하나도 못 맞췄대요.\n그게 댄스의 시작이에요." },
  { cat: "첫날 공감", text: "모든 고수의 첫날은\n당신의 오늘과 똑같았어요.\n어색하고, 두근거리고, 설레고." },
  { cat: "용기 응원", text: "완벽하게 출 준비가 됐을 때 나가려면\n평생 못 나가요.\n지금 이 상태로 나가는 게 정답이에요." },
  { cat: "용기 응원", text: "파티에서 '처음이에요'라고 하면\n모두가 더 친절해져요.\n그 말이 마법의 주문이 될 거예요." },
  { cat: "용기 응원", text: "처음이 가장 용감한 거예요.\n지금 당신이 가장 멋진 사람이에요." },
  { cat: "커뮤니티", text: "댄스 씬에서 처음이라고 하면\n손 내밀어 주는 사람이 꼭 있어요.\n그 따뜻함을 느껴보세요." },
  { cat: "커뮤니티", text: "혼자 오는 사람도 아주 많아요.\n어색한 건 당신 혼자가 아니에요." },
  { cat: "성장 이야기", text: "댄스를 시작한 걸 후회한 사람은 없어요.\n시작 안 한 걸 후회하는 사람은 많아요.\n지금 시작하세요." },
  { cat: "성장 이야기", text: "3개월 후의 당신이\n지금과 얼마나 달라져 있을지\n기대하셔도 좋아요." },
  { cat: "감성 응원", text: "사주가 당신에게 말해요.\n지금 이 설레임이 인생의 신호예요." },
  { cat: "감성 응원", text: "춤은 몸으로 하는 게 아니에요.\n마음으로 하는 거예요.\n당신은 이미 준비됐어요." },
  { cat: "도전 유도", text: "이번 주 미션입니다.\n파티 하나만 구경 가보세요.\n춤 안 춰도 괜찮아요." },
  { cat: "도전 유도", text: "딱 한 곡만 플로어에 서보세요.\n그 한 곡이 모든 것을 바꿀 거예요." },
  { cat: "도전 유도", text: "오늘 여기까지 온 용기라면\n파티 문 하나만 더 열면 돼요.\n함께 가요." },
  { cat: "첫날 공감", text: "잘 추는 사람 옆에 서있는 게\n창피한 게 아니에요.\n그게 가장 빠른 배움의 길이에요." },
  { cat: "첫날 공감", text: "첫날 실수한 스텝이\n가장 오래 기억에 남아요.\n그게 성장의 증거가 될 거예요." },
  { cat: "첫날 공감", text: "어색한 게 당연해요.\n근육이 아직 음악을 모를 뿐이에요.\n곧 몸이 기억할 거예요." },
  { cat: "첫날 공감", text: "플로어가 무섭다면\n그 감각이 지극히 정상이에요.\n고수들도 처음엔 그랬으니까요." },
  { cat: "첫날 공감", text: "처음 파티 갔다가\n아무것도 못 하고 돌아온 사람이\n지금 제일 잘 추고 있어요." },
  { cat: "첫날 공감", text: "유튜브로만 보다 처음 나온 날,\n다들 그 떨림을 잘 알고 있어요.\n진심으로 환영해요." },
  { cat: "첫날 공감", text: "틀린 스텝은 없어요.\n아직 배우는 중인 스텝만 있을 뿐이에요.\n자신감을 가지세요." },
  { cat: "첫날 공감", text: "오늘 밤이 처음이라면\n그 설렘을 절대 잊지 마세요.\n댄스의 가장 순수한 순간이에요." },
  { cat: "용기 응원", text: "모르면 물어봐도 괜찮아요.\n댄서들은 가르쳐주길 좋아해요.\n함께 성장해요." },
  { cat: "용기 응원", text: "잘 못 춰도 리드 해보세요.\n용기가 기술보다 훨씬 앞서가요." },
  { cat: "용기 응원", text: "파티에서 앉아만 있지 마세요.\n일어서는 순간 세상이 달라져요." },
  { cat: "용기 응원", text: "한 번 거절당해도 괜찮아요.\n더 멋진 다음 사람이 기다리고 있어요." },
  { cat: "용기 응원", text: "완벽한 타이밍은 없어요.\n지금이 가장 좋은 타이밍이에요." },
  { cat: "용기 응원", text: "춤을 못 추는 게 문제가 아니에요.\n안 춰보는 게 문제일 뿐이에요." },
  { cat: "용기 응원", text: "실수하면 웃으면 돼요.\n그 웃음이 파트너를 편하게 해줄 거예요." },
  { cat: "용기 응원", text: "처음이라는 게 핸디캡이 아니에요.\n아무것도 굳어있지 않다는 뜻이에요." },
  { cat: "용기 응원", text: "두 발이 플로어에 닿는 순간\n당신은 이미 멋진 댄서예요." },
  { cat: "용기 응원", text: "못 춘다고 생각하지 마세요.\n아직 배우는 중이라고 생각하세요." },
  { cat: "커뮤니티", text: "라틴 댄스 씬은 전국이 통해요.\n부산에서 배워도 서울 파티에서\n즐겁게 출 수 있어요." },
  { cat: "커뮤니티", text: "파티에서 만난 사람들이\n나중에 여행을 같이 가는 친구가 돼요.\n정말 멋진 일이죠." },
  { cat: "커뮤니티", text: "나이와 직업은 중요하지 않아요.\n음악 앞에서는 모두가 평등해요." },
  { cat: "커뮤니티", text: "댄서들은 처음 온 사람을\n제일 반갑게 맞아줘요.\n자신의 처음이 생각나거든요." },
  { cat: "커뮤니티", text: "파티에 혼자 와도\n집에 갈 땐 혼자가 아닌 경우가 많아요.\n친구를 사귀어보세요." },
  { cat: "커뮤니티", text: "이 공간에서 만나는 사람들은\n같은 설렘으로 모인 소중한 인연이에요." },
  { cat: "커뮤니티", text: "댄스는 혼자 추는 게 아니에요.\n서로가 있어야 비로소 완성돼요." },
  { cat: "커뮤니티", text: "처음 온 사람을 외면하는 댄서는 없어요.\n그게 이 씬의 따뜻한 문화예요." },
  { cat: "성장 이야기", text: "1개월 차엔 스텝,\n3개월 차엔 리듬,\n6개월 차엔 감정이 생길 거예요." },
  { cat: "성장 이야기", text: "몸이 기억하는 데\n딱 3개월이면 충분해요.\n조금만 더 힘내세요." },
  { cat: "성장 이야기", text: "처음엔 발만 보이겠지만\n나중엔 파트너의 눈이 보여요.\n그게 성장의 증거예요." },
  { cat: "성장 이야기", text: "6개월 후 처음 온 사람을 보면\n도와주고 싶어질 거예요.\n당신도 고수가 된다는 뜻이죠." },
  { cat: "성장 이야기", text: "잘 못 춰서 창피했던 기억이\n나중엔 가장 웃긴 이야기가 돼요." },
  { cat: "성장 이야기", text: "댄스는 근육이 하는 게 아니에요.\n반복이 만드는 기적이에요." },
  { cat: "성장 이야기", text: "오늘 배운 것보다\n내일 기억에 남는 게 더 많아요.\n몸이 자는 동안 정리하거든요." },
  { cat: "성장 이야기", text: "1년 후 오늘을 돌아보면\n인생의 큰 전환점이었다고 할 거예요." },
  { cat: "감성 응원", text: "음악이 좋아서 오셨다면\n이미 절반은 댄서의 길에 들어선 거예요." },
  { cat: "감성 응원", text: "리듬에 몸을 맡기는 게\n세상에서 가장 자유로운 순간이에요." },
  { cat: "감성 응원", text: "파트너와 호흡이 맞는 그 순간을\n한 번만 느껴보면 알게 될 거예요." },
  { cat: "감성 응원", text: "춤추는 동안은 다른 걱정이 없어요.\n그게 댄스가 주는 마법 같은 휴식이에요." },
  { cat: "감성 응원", text: "음악이 들릴 때 고개가 끄덕여진다면\n몸이 이미 준비된 거예요." },
  { cat: "감성 응원", text: "첫 파티의 그 공기,\n조명, 음악, 설렘.\n평생 잊지 못할 거예요." },
  { cat: "감성 응원", text: "몸이 음악을 따라가는 순간\n머릿속이 조용해져요.\n그게 댄스의 선물이에요." },
  { cat: "감성 응원", text: "잘 추고 싶은 마음,\n그 마음 자체가 이미 댄서의 심장이에요." },
  { cat: "도전 유도", text: "지금 오늘밤빠에서\n가장 가까운 파티를 찾아보세요." },
  { cat: "도전 유도", text: "처음엔 구경만 해도 돼요.\n분위기를 익히는 것도 훌륭한 연습이에요." },
  { cat: "도전 유도", text: "입문 클래스 4주만 도전해보세요.\n그 후엔 파티가 완전히 달라 보여요." },
  { cat: "도전 유도", text: "이번 주말 파티 하나를\n캘린더에 미리 넣어보세요." },
  { cat: "도전 유도", text: "같이 갈 친구 없어도 괜찮아요.\n파티에서 새로운 친구가 생길 거예요." },
  { cat: "도전 유도", text: "딱 2시간만 있다 와보세요.\n그 2시간이 당신의 새로운 습관이 돼요." },
  { cat: "도전 유도", text: "오늘 밤에도 파티가 있어요.\n지금 바로 확인해보시겠어요?" },
  { cat: "도전 유도", text: "한 번만 용기 내어 가보세요.\n그다음은 저절로 발걸음이 옮겨질 거예요." },
  { cat: "도전 유도", text: "가장 가까운 파티라면\n거리가 조금 멀어도 가볼 가치가 있어요." },
  { cat: "도전 유도", text: "오늘 이 분석이 첫걸음이에요.\n다음 걸음은 파티 문을 여는 거예요." },
];

function getBeginnerContent() {
  const shuffled = [...BEGINNER_MESSAGES].sort(() => Math.random() - 0.5);
  const challengeMsgs = BEGINNER_MESSAGES.filter(m => m.cat === "도전 유도");
  return {
    mainMessage: shuffled[0],
    subMessages: shuffled.slice(1, 4),
    challenge: challengeMsgs[Math.floor(Math.random() * challengeMsgs.length)]
  };
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

export default function SajuModal({ onClose }) {
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
        ...getBeginnerContent(),
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

    const detailed = selectResult(dance.genre, gender, month, day, count, experience)
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
      <div style={{ width:'100%', maxWidth:'450px', maxHeight:'90vh', background:'#fff', borderRadius:'24px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.2)', position:'relative' }}>
        
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'16px 20px', position:'absolute', top:0, right:0, zIndex:10 }}>
          <button onClick={onClose} style={{ background:'rgba(0,0,0,0.05)', border:'none', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', background:'#ffffff' }}>
          
          {step === 1 && (
            <div style={{ padding:'32px 24px' }}>
              <div style={{ background:'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', padding:'24px', borderRadius:'20px', color:'white', marginBottom:'28px' }}>
                <div style={{ fontSize:20, fontWeight:900, marginBottom:8 }}>🔮 댄스 사주 분석</div>
                <div style={{ fontSize:12, opacity:0.8 }}>나에게 꼭 맞는 댄스 라이프를 찾아보세요</div>
              </div>

              {isDataLoaded ? (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ background: '#F5F3FF', padding: '20px', borderRadius: '16px', border: '1px solid #DDD6FE', marginBottom: '20px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#4C1D95', marginBottom: '12px' }}>반가워요! 기존 정보를 찾았습니다.</div>
                    <div style={{ fontSize: '13px', color: '#6D28D9', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span>{gender === '남' ? '♂ 남성' : '♀ 여성'}</span>
                      <span>•</span>
                      <span>{year}년 {month}월 {day}일</span>
                      <span>•</span>
                      <span>{experience === 'beginner' ? '입문자' : '경력자'}</span>
                    </div>
                  </div>
                  <button onClick={analyze} disabled={loading} style={{ width:'100%', padding:'18px', borderRadius:16, background:'#7C3AED', color:'#fff', border:'none', fontSize:17, fontWeight:900, cursor:'pointer', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)' }}>
                    {loading ? '🔮 분석 중...' : '🔮 오늘의 운세 바로보기'}
                  </button>
                  <button onClick={() => setIsDataLoaded(false)} style={{ width: '100%', marginTop: '16px', background: 'none', border: 'none', color: '#94A3B8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>정보 수정하기</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:700, marginBottom:8 }}>성별</label>
                    <div style={{ display:'flex', gap:10 }}>
                      {['남','여'].map(g=>(
                        <button key={g} onClick={()=>setGender(g)} style={{ flex:1, padding:'14px', borderRadius:12, border:gender===g?'2px solid #7C3AED':'1px solid #E2E8F0', background:gender===g?'#F5F3FF':'#fff', color:gender===g?'#7C3AED':'#64748B', fontWeight:700, cursor:'pointer' }}>{g==='남'?'♂ 남성':'♀ 여성'}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:700, marginBottom:8 }}>🐣 댄스 경력</label>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <button onClick={()=>setExperience('beginner')} style={{ padding:'14px', borderRadius:12, border:experience==='beginner'?'2px solid #7C3AED':'1px solid #E2E8F0', background:experience==='beginner'?'#F5F3FF':'#fff', textAlign:'left', cursor:'pointer' }}>
                        <div style={{ fontSize:14, fontWeight:700, color:experience==='beginner'?'#7C3AED':'#1E293B' }}>처음이에요 / 입문</div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>오늘 처음이거나 배운지 6개월 미만이에요.</div>
                      </button>
                      <button onClick={()=>setExperience('experienced')} style={{ padding:'14px', borderRadius:12, border:experience==='experienced'?'2px solid #7C3AED':'1px solid #E2E8F0', background:experience==='experienced'?'#F5F3FF':'#fff', textAlign:'left', cursor:'pointer' }}>
                        <div style={{ fontSize:14, fontWeight:700, color:experience==='experienced'?'#7C3AED':'#1E293B' }}>경력자예요</div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>이미 춤을 즐기고 있는 댄서예요 (6개월 이상)</div>
                      </button>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:10 }}>
                    <div style={{ flex:1 }}><label style={{ display:'block', fontSize:13, fontWeight:700, marginBottom:6 }}>생년</label><input type="number" placeholder="1995" value={year} onChange={e=>setYear(e.target.value)} style={{ width:'100%', padding:12, borderRadius:10, border:'1.5px solid #E2E8F0' }} /></div>
                    <div style={{ flex:1 }}><label style={{ display:'block', fontSize:13, fontWeight:700, marginBottom:6 }}>월</label><input type="number" placeholder="5" value={month} onChange={e=>setMonth(e.target.value)} style={{ width:'100%', padding:12, borderRadius:10, border:'1.5px solid #E2E8F0' }} /></div>
                    <div style={{ flex:1 }}><label style={{ display:'block', fontSize:13, fontWeight:700, marginBottom:6 }}>일</label><input type="number" placeholder="20" value={day} onChange={e=>setDay(e.target.value)} style={{ width:'100%', padding:12, borderRadius:10, border:'1.5px solid #E2E8F0' }} /></div>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, marginBottom:6 }}>태어난 시간 (모르면 무관)</label>
                    <select value={timeIdx} onChange={e=>setTimeIdx(e.target.value)} style={{ width:'100%', padding:12, borderRadius:10, border:'1.5px solid #E2E8F0', background:'#fff' }}>
                      <option value="">모름</option>
                      {TIME_LIST.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <button onClick={analyze} disabled={!isValid || loading} style={{ width:'100%', padding:'18px', borderRadius:16, background:isValid?'#7C3AED':'#CBD5E1', color:'#fff', border:'none', fontSize:16, fontWeight:900, cursor:isValid?'pointer':'not-allowed', marginTop:10 }}>
                    {loading ? '🔮 분석 중...' : '🔮 나의 댄스 사주 분석하기'}
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
                    <div style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>🌱 첫 발걸음이 가장 용감해요</div>
                    <div style={{ fontSize:14, opacity:0.8 }}>오늘 여기 온 것만으로 시작이에요</div>
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
                      ✨ 미션: {result.challenge?.text}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ background:'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', padding:'40px 24px', textAlign:'center', borderBottom:'1px solid #DDD6FE' }}>
                    <div style={{ fontSize:10, color:'#7C3AED', fontWeight:800, letterSpacing:4, marginBottom:16 }}>DANCE SAJU REPORT</div>
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
                      <div style={{ fontSize:13, color:'#D97706', fontWeight:800, marginBottom:12 }}>📜 오늘의 감성 가이드</div>
                      <div style={{ fontSize:15, color:'#451A03', lineHeight:1.8, whiteSpace:'pre-line', fontWeight:500 }}>{result.vibeText}</div>
                    </div>
                  </div>
                </>
              )}

              {/* 하단 추천 BAR (공통 거리순 적용) */}
              <div style={{ padding:'0 24px 40px' }}>
                <div style={{ fontSize:16, fontWeight:900, color:'#1E1B4B', marginBottom:16 }}>🎯 당신을 위한 추천 BAR</div>
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
                <button onClick={() => window.open('https://open.kakao.com/o/gP43rNri', '_blank')} style={{ width:'100%', padding:18, background:'#FEE500', color:'#3C1E1E', border:'none', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', marginBottom:12, marginTop:20 }}>💬 오픈채팅방에서 함께하기</button>
                <button onClick={reset} style={{ width:'100%', background:'none', border:'none', color:'#9CA3AF', fontSize:13, cursor:'pointer' }}>🔄 다시 분석해볼까요?</button>
              </div>
            </div>
          )}
        </div>

        {fullPoster && (
          <div onClick={()=>setFullPoster(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', padding:20 }}>
            <img src={fullPoster} style={{ maxWidth:'100%', maxHeight:'100%', borderRadius:12 }} />
            <div style={{ position:'absolute', top:20, right:20, color:'#fff', fontSize:24 }}>✕</div>
          </div>
        )}
      </div>
    </div>
  )
}
