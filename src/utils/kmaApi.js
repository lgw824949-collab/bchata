// src/utils/kmaApi.js
// 기상청 단기예보 API 연동 유틸리티

const SERVICE_KEY = import.meta.env.VITE_KMA_SERVICE_KEY;

// 주요 지역별 기상청 nx, ny 좌표 (공공데이터포털 가이드 기준)
export const KMA_REGION_COORDS = {
  '서울': { nx: 60, ny: 127 },
  '경인': { nx: 55, ny: 124 }, // 인천 기준
  '충청': { nx: 67, ny: 100 },    // 대전 기준
  '전라': { nx: 58, ny: 74 },     // 광주 기준
  '경상': { nx: 89, ny: 90 },     // 대구 기준
  '강원': { nx: 73, ny: 134 },    // 춘천 기준
  '제주': { nx: 52, ny: 38 },
};

// Home.tsx에서 사용하는 지역명 매핑용
export const HOME_REGION_MAP = {
  '서울': '서울',
  '경인': '경인',
  '충청도': '충청',
  '전라도': '전라',
  '경상도': '경상',
  '강원/제주': '제주' // 제주 기준으로 대표값 노출
};

/**
 * 기상청 API용 base_date, base_time 계산
 * 초단기예보는 매시각 45분 단위로 생성
 */
const getBaseDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  
  let hours = now.getHours();
  let minutes = now.getMinutes();

  // 45분 이전이면 전 시각 데이터 조회
  if (minutes < 45) {
    if (hours === 0) {
      // 자정 이전이면 전날 23시
      const yesterday = new Date(now.setDate(now.getDate() - 1));
      return {
        baseDate: `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`,
        baseTime: '2330'
      };
    }
    hours -= 1;
  }
  
  return {
    baseDate: `${year}${month}${date}`,
    baseTime: `${String(hours).padStart(2, '0')}30`
  };
};

/**
 * 기상청 초단기실황 API 호출
 */
export const fetchCurrentWeather = async (nx, ny) => {
  if (!SERVICE_KEY) {
    console.error('VITE_KMA_SERVICE_KEY is missing');
    return null;
  }

  const { baseDate, baseTime } = getBaseDateTime();
  const url = `/kma-api/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${SERVICE_KEY}&numOfRows=10&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}&dataType=JSON`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.response?.header?.resultCode !== '00') {
      console.error('KMA API Error:', data.response?.header?.resultMsg);
      return null;
    }

    const items = data.response.body.items.item;
    const weather = {};
    items.forEach(item => {
      weather[item.category] = item.obsrValue;
    });

    return weather; // T1H(기온), PTY(강수형태), REH(습도), WSD(풍속) 등
  } catch (err) {
    console.error('Fetch error:', err);
    return null;
  }
};

/**
 * 기상청 초단기예보 API 호출 (SKY 상태 확인용)
 */
export const fetchWeatherForecast = async (nx, ny) => {
  if (!SERVICE_KEY) return null;

  const { baseDate, baseTime } = getBaseDateTime();
  const url = `/kma-api/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${SERVICE_KEY}&numOfRows=60&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}&dataType=JSON`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.response?.header?.resultCode !== '00') return null;

    const items = data.response.body.items.item;
    // 현재 시각과 가장 가까운 데이터 추출
    const sky = items.find(i => i.category === 'SKY')?.fcstValue;
    const pty = items.find(i => i.category === 'PTY')?.fcstValue;
    const t1h = items.find(i => i.category === 'T1H')?.fcstValue;

    return { sky, pty, t1h };
  } catch (err) {
    return null;
  }
};

/**
 * 날씨 코드 -> UI용 데이터 변환
 */
export const parseKmaWeather = (sky, pty) => {
  // PTY: 0(없음), 1(비), 2(비/눈), 3(눈), 5(빗방울), 6(빗방울눈날림), 7(눈날림)
  if (pty > 0) {
    if ([1, 5].includes(Number(pty))) return { icon:'🌧️', anim:'fall',  label:'비',    badge:'실내 파티!', badgeColor:'#1565C0', badgeBg:'#E3F2FD' };
    if ([2, 6].includes(Number(pty))) return { icon:'🌨️', anim:'fall',  label:'비/눈',  badge:'조심조심!', badgeColor:'#1565C0', badgeBg:'#E3F2FD' };
    if ([3, 7].includes(Number(pty))) return { icon:'❄️', anim:'float', label:'눈',    badge:'설경 댄스!', badgeColor:'#6D28D9', badgeBg:'#F5F3FF' };
  }

  // SKY: 1(맑음), 3(구름많음), 4(흐림)
  const skyNum = Number(sky);
  if (skyNum === 1) return { icon:'🌞', anim:'spin',  label:'맑음',   badge:'파티 GO!',   badgeColor:'#FF8C00', badgeBg:'#FFF3CD' };
  if (skyNum === 3) return { icon:'⛅', anim:'sway',  label:'구름조금', badge:'춤추기 딱!', badgeColor:'#1565C0', badgeBg:'#E3F2FD' };
  if (skyNum === 4) return { icon:'☁️', anim:'sway',  label:'흐림',   badge:'실내 소셜!', badgeColor:'#64748B', badgeBg:'#F1F5F9' };

  return { icon:'🌞', anim:'spin',  label:'맑음',   badge:'파티 GO!',   badgeColor:'#FF8C00', badgeBg:'#FFF3CD' };
};
