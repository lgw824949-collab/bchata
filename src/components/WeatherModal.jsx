// src/components/WeatherModal.jsx
// 전국 날씨 - 기상청 API 직접 연동 버전

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const REGIONS = [
  { key: 'region_seoul', nx:60, ny:127 },
  { key: 'region_gyeonggi_incheon', nx:55, ny:124 },
  { key: 'region_chungcheong', nx:67, ny:100 },
  { key: 'region_jeolla', nx:58, ny:74 },
  { key: 'region_gyeongsang', nx:89, ny:90 },
  { key: 'region_gangwon', nx:73, ny:134 },
  { key: 'region_jeju', nx:52, ny:38 },
]

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
  const { t } = useTranslation()
  const [weatherData, setWeatherData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const now = new Date()
        // KST 기준 날짜 계산 (UTC+9)
        const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000))
        const baseDate = kstDate.toISOString().slice(0,10).replace(/-/g,'')
        const baseTime = '0500'
        const serviceKey = import.meta.env.VITE_KMA_API_KEY

        if (!serviceKey) {
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          REGIONS.map(async (region) => {
            const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${region.nx}&ny=${region.ny}`
            
            try {
              const res = await fetch(url)
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text.slice(0, 50)}`);
              }
              const data = await res.json()
              
              if (data.response?.header?.resultCode !== '00') {
                throw new Error(data.response?.header?.resultMsg)
              }

              const items = data.response.body.items.item
              const tmp = items.find(i => i.category === 'TMP')?.fcstValue
              const sky = items.find(i => i.category === 'SKY')?.fcstValue

              // sky 코드: 1 → ☀️ 맑음, 3 → ⛅ 구름많음, 4 → ☁️ 흐림
              let icon = '☀️'
              let labelKey = 'weather_clear'
              let anim = 'spin'
              let badgeKey = 'badge_party_go'
              let badgeColor = '#FF8C00'
              let badgeBg = '#FFF3CD'

              if (sky === '3') {
                icon = '⛅'
                labelKey = 'weather_partly_cloudy'
                anim = 'sway'
                badgeKey = 'badge_perfect_dance'
                badgeColor = '#1565C0'
                badgeBg = '#E3F2FD'
              } else if (sky === '4') {
                icon = '☁️'
                labelKey = 'weather_cloudy'
                anim = 'sway'
                badgeKey = 'badge_indoor_social'
                badgeColor = '#64748B'
                badgeBg = '#F1F5F9'
              }

              return { ...region, temp: tmp, icon, labelKey, anim, badgeKey, badgeColor, badgeBg }
            } catch (err) {
              console.error(`Error fetching weather for ${region.key}:`, err)
              return { 
                ...region, 
                temp: '--', 
                icon: '☀️', 
                labelKey: 'weather_clear', 
                anim: 'spin', 
                badgeKey: 'weather_error', 
                badgeColor: '#64748B', 
                badgeBg: '#F1F5F9' 
              }
            }
          })
        )
        setWeatherData(results)
      } catch (err) {
        console.error('Weather fetch error:', err)
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
            <div style={{ fontSize:16, fontWeight:900, color:'#1E293B' }}>{t('weather_title')}</div>
            <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>{t('weather_desc')}</div>
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
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
          {loading
            ? Array(7).fill(0).map((_, i) => (
                <div key={i} style={{
                  background:'#E2E8F0', borderRadius:14, height:130,
                  gridColumn: i === 6 ? '2/3' : 'auto',
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
                    padding:'16px 10px',
                    textAlign:'center',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                    gridColumn: i === 6 ? '2/3' : 'auto',
                  }}
                >
                  <div style={{ fontSize:32, marginBottom:3 }}>
                    <span className={`anim-${r.anim}`}>{r.icon}</span>
                  </div>
                  <div style={{ fontSize:13, fontWeight:900, color:'#1E293B', marginBottom:1 }}>{t(r.key)}</div>
                  <div style={{ fontSize:26, fontWeight:900, color:'#1565C0' }}>{r.temp}°</div>
                  <div style={{ fontSize:12, color:'#94A3B8', marginBottom:5 }}>{t(r.labelKey)}</div>
                  <div style={{
                    background: r.badgeBg,
                    color: r.badgeColor,
                    borderRadius:99, padding:'5px 10px',
                    fontSize:11, fontWeight:800,
                    display:'inline-block',
                  }}>
                    {t(r.badgeKey)}
                  </div>
                </div>
              ))
          }
        </div>

        <div style={{ textAlign:'center', marginTop:10, fontSize:9, color:'#CBD5E1' }}>
          {t('weather_source')}
        </div>
      </div>
    </>
  )
}
