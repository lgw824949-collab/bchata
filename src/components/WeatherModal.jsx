// src/components/WeatherModal.jsx
// 전국 날씨 - 귀엽고 아담한 애니메이션 버전

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const REGIONS = [
  { name: '서울',     lat: 37.5665, lon: 126.9780 },
  { name: '경기/인천', lat: 37.4138, lon: 127.5183 },
  { name: '충청',     lat: 36.5184, lon: 127.1246 },
  { name: '전라',     lat: 35.8242, lon: 127.1480 },
  { name: '경상',     lat: 35.8714, lon: 128.6014 },
  { name: '강원',     lat: 37.8228, lon: 128.1555 },
  { name: '제주',     lat: 33.4996, lon: 126.5312 },
]

const getWeather = (code) => {
  if (code === 0)  return { icon:'🌞', anim:'spin',  label:'맑음',   badge:'파티 GO!',   badgeColor:'#FF8C00', badgeBg:'#FFF3CD' }
  if (code <= 2)   return { icon:'⛅', anim:'sway',  label:'구름조금', badge:'춤추기 딱!', badgeColor:'#1565C0', badgeBg:'#E3F2FD' }
  if (code <= 48)  return { icon:'☁️', anim:'sway',  label:'흐림',   badge:'실내 소셜!', badgeColor:'#64748B', badgeBg:'#F1F5F9' }
  if (code <= 67)  return { icon:'🌧️', anim:'fall',  label:'비',    badge:'실내 파티!', badgeColor:'#1565C0', badgeBg:'#E3F2FD' }
  if (code <= 77)  return { icon:'❄️', anim:'float', label:'눈',    badge:'설경 댄스!', badgeColor:'#6D28D9', badgeBg:'#F5F3FF' }
  return           { icon:'⛈️', anim:'shake', label:'뇌우',  badge:'실내로!',   badgeColor:'#B91C1C', badgeBg:'#FEE2E2' }
}

const ANIM_STYLE = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  .wx-wrap * { font-family: 'Pretendard', -apple-system, sans-serif !important; }
  @keyframes wx-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes wx-sway  { 0%,100%{transform:translateX(0)} 50%{transform:translateX(5px)} }
  @keyframes wx-fall  { 0%{transform:translateY(-5px);opacity:0} 50%{opacity:1} 100%{transform:translateY(7px);opacity:0} }
  @keyframes wx-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes wx-shake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-10deg)} 75%{transform:rotate(10deg)} }
  .anim-spin  { animation: wx-spin  6s linear infinite; display:inline-block; }
  .anim-sway  { animation: wx-sway  3s ease-in-out infinite; display:inline-block; }
  .anim-fall  { animation: wx-fall  1.2s ease-in-out infinite; display:inline-block; }
  .anim-float { animation: wx-float 2s ease-in-out infinite; display:inline-block; }
  .anim-shake { animation: wx-shake 0.5s ease-in-out infinite; display:inline-block; }
  .wx-card { transition: transform 0.15s ease; cursor: pointer; }
  .wx-card:hover  { transform: scale(1.06); }
  .wx-card:active { transform: scale(0.94); }
`

export default function WeatherModal({ onClose }) {
  const [weatherData, setWeatherData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          REGIONS.map(async (region) => {
            const res = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current_weather=true&timezone=Asia/Seoul`
            )
            const data = await res.json()
            const temp = Math.round(data.current_weather.temperature)
            const code = data.current_weather.weathercode
            const weather = getWeather(code)
            return { ...region, temp, ...weather }
          })
        )
        setWeatherData(results)
      } catch {
        setWeatherData(REGIONS.map((r, i) => ({
          ...r, temp: '--',
          ...getWeather(0),
        })))
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  return (
    <>
      <style>{ANIM_STYLE}</style>

      {/* 오버레이 */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:10010 }} />

      {/* 모달 */}
      <div className="wx-wrap" style={{
        position:'fixed', bottom:0, left:0, width:'100%',
        background:'#F0F4FF', zIndex:10011,
        borderRadius:'24px 24px 0 0',
        padding:'16px 16px 32px',
        fontFamily:"'Pretendard', -apple-system, sans-serif",
      }}>

        {/* 헤더 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:'#1E293B' }}>🗺️ 전국 날씨</div>
            <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>오늘 밤 파티 날씨 실시간 안내</div>
          </div>
          <button onClick={onClose} style={{
            background:'#E2E8F0', border:'none', borderRadius:'50%',
            width:32, height:32, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <X size={14} color="#64748B"/>
          </button>
        </div>

        {/* 카드 그리드 */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
          {loading
            ? Array(7).fill(0).map((_, i) => (
                <div key={i} style={{
                  background:'#E2E8F0', borderRadius:14, height:100,
                  gridColumn: i === 6 ? '3/5' : 'auto',
                }}/>
              ))
            : weatherData.map((r, i) => (
                <div
                  key={i}
                  className="wx-card"
                  style={{
                    background:'#fff',
                    border:'1px solid #E2E8F0',
                    borderRadius:14,
                    padding:'10px 6px',
                    textAlign:'center',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                    gridColumn: i === 6 ? '3/5' : 'auto',
                  }}
                >
                  <div style={{ fontSize:22, marginBottom:3 }}>
                    <span className={`anim-${r.anim}`}>{r.icon}</span>
                  </div>
                  <div style={{ fontSize:10, fontWeight:900, color:'#1E293B', marginBottom:1 }}>{r.name}</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#1565C0' }}>{r.temp}°</div>
                  <div style={{ fontSize:9, color:'#94A3B8', marginBottom:5 }}>{r.label}</div>
                  <div style={{
                    background: r.badgeBg,
                    color: r.badgeColor,
                    borderRadius:99, padding:'3px 6px',
                    fontSize:8, fontWeight:800,
                    display:'inline-block',
                  }}>
                    {r.badge}
                  </div>
                </div>
              ))
          }
        </div>

        <div style={{ textAlign:'center', marginTop:10, fontSize:9, color:'#CBD5E1' }}>
          Open-Meteo 실시간 데이터
        </div>
      </div>
    </>
  )
}
