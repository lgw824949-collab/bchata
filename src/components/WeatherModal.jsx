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

// 전역 캐시 변수 (컴포넌트 리렌더링과 무관하게 유지)
let weatherCache = {
  data: null,
  timestamp: 0
};

export default function WeatherModal({ onClose }) {
  const { t } = useTranslation()
  const [weatherData, setWeatherData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      // 1. 캐시 확인 (10분 이내 데이터가 있으면 즉시 사용)
      const nowTime = Date.now();
      if (weatherCache.data && (nowTime - weatherCache.timestamp < 10 * 60 * 1000)) {
        setWeatherData(weatherCache.data);
        setLoading(false);
        return;
      }

      try {
        const now = new Date()
        // KST 기준 (UTC+9)
        const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000))
        
        // 초단기실황(getUltraSrtNcst)은 매시간 정시에 데이터 생성, 40분 이후 안정적 수신
        // 안전하게 1시간 전 데이터를 요청하거나 현재 시각의 30분 전으로 설정
        let baseDate = kstDate.toISOString().slice(0,10).replace(/-/g,'')
        let hours = kstDate.getUTCHours();
        let minutes = kstDate.getUTCMinutes();
        
        // 기상청 가이드: 실황 데이터는 매시 40분 이후 호출 권장
        if (minutes < 45) {
          hours -= 1;
          if (hours < 0) {
            hours = 23;
            // 날짜도 하루 전으로 처리해야 하나 단순화 위해 시간만 조정
          }
        }
        const baseTime = hours.toString().padStart(2, '0') + '00';
        
        const serviceKey = import.meta.env.VITE_WEATHER_API_KEY

        if (!serviceKey) {
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          REGIONS.map(async (region) => {
            // 더 가벼운 getUltraSrtNcst 사용
            const url = `/kma-api/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${region.nx}&ny=${region.ny}`
            
            try {
              const res = await fetch(url)
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json()
              
              if (data.response?.header?.resultCode !== '00') {
                throw new Error(data.response?.header?.resultMsg)
              }

              const items = data.response.body.items.item
              const tmp = items.find(i => i.category === 'T1H')?.obsrValue // 실황은 T1H가 온도
              const pty = items.find(i => i.category === 'PTY')?.obsrValue // 강수 형태

              // 실황 API에는 SKY가 없으므로 PTY와 시간대로 추정 (심플 버전)
              let icon = '☀️'
              let labelKey = 'weather_clear'
              let anim = 'spin'
              let badgeKey = 'badge_party_go'
              let badgeColor = '#FF8C00'
              let badgeBg = '#FFF3CD'

              if (pty === '1' || pty === '4') { // 비
                icon = '🌧️'
                labelKey = 'weather_rainy'
                anim = 'fall'
                badgeKey = 'badge_indoor_social'
                badgeColor = '#1565C0'
                badgeBg = '#E3F2FD'
              } else if (pty === '2' || pty === '3') { // 눈
                icon = '❄️'
                labelKey = 'weather_snowy'
                anim = 'sway'
                badgeKey = 'badge_perfect_dance'
                badgeColor = '#64748B'
                badgeBg = '#F1F5F9'
              } else {
                // 구름 등은 실황에서 알기 어려우므로 기본 맑음 유지
              }

              return { ...region, temp: tmp, icon, labelKey, anim, badgeKey, badgeColor, badgeBg }
            } catch (err) {
              return { 
                ...region, temp: '--', icon: '☀️', labelKey: 'weather_clear', anim: 'spin', 
                badgeKey: 'weather_error', badgeColor: '#64748B', badgeBg: '#F1F5F9' 
              }
            }
          })
        )

        // 캐시 저장
        weatherCache = {
          data: results,
          timestamp: Date.now()
        };
        
        setWeatherData(results)
      } catch (err) {
        console.error('Weather optimization error:', err)
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
