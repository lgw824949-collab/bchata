// 전국의 바차타/댄스 바 마스터 정보 (GPS용 lat/lon 포함)
export const BAR_DATABASE = [
  // [서울 - 강남권]
  { name: '라틴', address: '서울특별시 강남구 테헤란로 6길 9', region: '서울', lat: 37.4980, lon: 127.0279 },
  { name: '강남턴', address: '서울특별시 강남구 역삼로3길 17-5 (역삼동), 삼영빌딩 지하 1층', region: '서울', aliases: ['강턴'], lat: 37.4975, lon: 127.0358 },
  { name: '강남SOL', address: '서울특별시 강남구 테헤란로 8길 11-7', region: '서울', aliases: ['Sol bar', 'SOL'], lat: 37.4982, lon: 127.0285 },
  { name: '마이애미', address: '서울특별시 강남구 테헤란로14길 25', region: '서울', lat: 37.4985, lon: 127.0312 },
  { name: '뉴욕', address: '서울특별시 강남구 강남대로84길 24-4', region: '서울', lat: 37.5015, lon: 127.0247 },
  { name: '압구정 TOP', address: '서울특별시 강남구 압구정로 224', region: '서울', aliases: ['탑', '압탑', '압구정 살사클럽 탑'], lat: 37.5272, lon: 127.0286 },
  { name: '압구정 On2', address: '서울특별시 강남구 논현로167길 12', region: '서울', aliases: ['압온'], lat: 37.5268, lon: 127.0298 },
  { name: '아지트', address: '서울특별시 강남구 역삼동 831-30', region: '서울', lat: 37.4973, lon: 127.0356 },

  // [서울 - 홍대권]
  { name: '보니따', address: '서울특별시 마포구 동교로 191', region: '서울', lat: 37.5560, lon: 126.9218 },
  { name: '홍턴', address: '서울특별시 마포구 동교로207', region: '서울', lat: 37.5563, lon: 126.9221 },
  { name: '부에나', address: '서울특별시 마포구 동교로 217', region: '서울', lat: 37.5566, lon: 126.9228 },
  { name: '마콘도', address: '서울특별시 마포구 홍익로 6길48', region: '서울', lat: 37.5558, lon: 126.9225 },
  { name: '안단테', address: '서울특별시 마포구 양화로12길 24', region: '서울', lat: 37.5548, lon: 126.9198 },
  { name: '놀이터', address: '서울특별시 마포구 동교로213', region: '서울', lat: 37.5564, lon: 126.9224 },
  { name: '하바나', address: '서울특별시 마포구 서교동 어울마당로 53', region: '서울', aliases: ['Havana', 'HAVANA'], lat: 37.5545, lon: 126.9212 },
  { name: '아난타라', address: '서울특별시 마포구 양화로 18안길20', region: '서울', lat: 37.5552, lon: 126.9202 },
  { name: '홍대SOL', address: '서울특별시 마포구 홍익로6길 83', region: '서울', aliases: ['솔SOL빠', 'Sol Bar'], lat: 37.5556, lon: 126.9228 },
  { name: '꼼애야', address: '서울특별시 마포구 동교로 209-4', region: '서울', lat: 37.5562, lon: 126.9222 },

  // [경기 - 수원]
  { name: '돌체비타', address: '경기도 수원시 팔달구 인계동 1042-7, 3층', region: '경기도', aliases: ['쿠바'], lat: 37.2636, lon: 127.0286 },
  { name: '원스', address: '경기도 수원시 팔달구 인계동 1024-5, 4층', region: '경기도', lat: 37.2632, lon: 127.0282 },

  // [경기 - 안산]
  { name: '아임살사', address: '경기도 안산시 상록구', region: '경기도', aliases: ['안산 상록수역', '안산상록수역', '상록수역'], lat: 37.3010, lon: 126.8315 },
  { name: '라소클', address: '경기도 안산시 단원구 민육공원로 85 지하1층', region: '경기도', lat: 37.3219, lon: 126.8309 },
  { name: '퀸즈살사', address: '경기도 안산시 상록구 팝핀스 493-13 2층', region: '경기도', lat: 37.3012, lon: 126.8318 },
  { name: 'EDM댄스스튜디오', address: '경기도 안산시 상록구 180/B102호', region: '경기도', lat: 37.3008, lon: 126.8312 },

  // [경기 - 분당]
  { name: '분당살사', address: '경기도 분당구 정자동 23-1 지파크프라자5층', region: '경기도', lat: 37.3595, lon: 127.1052 },
  { name: '바이라모스', address: '경기도 성남시 분당구 수내동 19-3 대덕프라자 509호', region: '경기도', aliases: ['바일라모스'], lat: 37.3842, lon: 127.1218 },

  // [경기 - 용인]
  { name: '비비고댄스', address: '경기도 용인시 기흥구 용구대로 2390-12 삼송빌딩지하', region: '경기도', lat: 37.2748, lon: 127.1152 },

  // [경기 - 부천]
  { name: '카디즈', address: '경기도 부천시 숭내대로 265번길 17, 효성프라자 6F', region: '경기도', lat: 37.5034, lon: 126.7658 },

  // [인천]
  { name: '라틴크루', address: '인천 미추홀구 석바위로 49-1', region: '인천광역시', lat: 37.4598, lon: 126.6859 },
  { name: '엘마르', address: '인천 부평구 십정동 420-1', region: '인천광역시', aliases: ['엘마'], lat: 37.4708, lon: 126.7003 },
  { name: '라씬 카우보이', address: '인천시 미추홀구 경원대로 851 4층', region: '인천광역시', lat: 37.4612, lon: 126.6782 },
  { name: 'LBT', address: '인천 구월동 1391-8 지하1층', region: '인천광역시', lat: 37.4449, lon: 126.7052 },

  // [경기 - 일산]
  { name: '칼리', address: '경기도 고양시 일산동구 백석동 1228-4', region: '경기도', lat: 37.6412, lon: 126.7798 },
  { name: '살사 우노', address: '경기도 고양시 일산동구 1196-2 B1', region: '경기도', lat: 37.6408, lon: 126.7792 },

  // [경기 - 의정부]
  { name: '이그녹스', address: '경기도 의정부시 평화로 567-1 청관정지하', region: '경기도', lat: 37.7382, lon: 127.0438 },

  // [충청 - 대전·천안·청주]
  { name: '라틴팩토리', address: '대전 유성구 문화원로6번길 B1', region: '충청도', aliases: ['라팩', 'SNS'], lat: 36.3624, lon: 127.3562 },
  { name: '노체', address: '대전 서구 둔산동 31번길 66 3F', region: '충청도', lat: 36.3512, lon: 127.3868 },
  { name: 'DLC', address: '대전 서구 갈마동 395-13 3F', region: '충청도', lat: 36.3498, lon: 127.3742 },
  { name: '미아모르', address: '대전 동남구 신부동 976 B1', region: '충청도', lat: 36.8142, lon: 127.1138 },
  { name: '천안턴', address: '천안시 원두정9길 3 B1', region: '충청도', aliases: ['천안틴', '살컨', '살사컨셉'], lat: 36.8086, lon: 127.1510 },
  { name: '리코빠', address: '청주시 서원구 사창동 531번지 B1', region: '충청도', lat: 36.6348, lon: 127.4892 },

  // [경상 - 대구·김천·창원·김해·부산·포항]
  { name: '개츠비', address: '경상북도 김천시 평화동 260-10 3층', region: '경상도', lat: 36.1398, lon: 128.1138 },
  { name: '바야', address: '대구 중구 동성로4길 20-7 2,3층', region: '경상도', lat: 35.8698, lon: 128.5972 },
  { name: '바바루', address: '대구 중구 동성로 4길 39 4층', region: '경상도', lat: 35.8702, lon: 128.5968 },
  { name: '턴 바', address: '대구광역시 중구 동성로 123', region: '경상도', lat: 35.8695, lon: 128.5978 },
  { name: '난다BAR', address: '경상남도 창원시 성산구 중앙대로83번길 14 창원종합상가 2층', region: '경상도', lat: 35.2278, lon: 128.6818 },
  { name: '엘하비댄스스튜디오', address: '경상남도 김해시 분성로 302번길 12, 2층', region: '경상도', lat: 35.2285, lon: 128.8892 },
  { name: '맘보', address: '부산진구 중앙대로 691번길 52 지하1층', region: '경상도', lat: 35.1598, lon: 129.0588 },
  { name: '제이 바', address: '부산광역시 해운대구 우동 456', region: '경상도', lat: 35.1632, lon: 129.1638 },
  { name: '포항댄스사랑', address: '경상북도 포항시 남구 중앙로 112, 4층', region: '경상도', aliases: ['포댄사'], lat: 36.0320, lon: 129.3650 },
  { name: '루에다', address: '부산광역시 부산진구 신천대로62번길 42 2층', region: '경상도', lat: 35.1526, lon: 129.0586 },

  // [전라 - 광주·여수]
  { name: '부에나비스타바', address: '광주광역시 동구 문화전당로23번길 38-1', region: '전라도', lat: 35.1468, lon: 126.9218 },
  { name: '마얀', address: '광주광역시 동구 황금동 84번지 3층', region: '전라도', lat: 35.1495, lon: 126.9158 },
  { name: '엘카리베', address: '전라남도 여수시 소라면 죽림중앙로 13-12 4층', region: '전라도', lat: 34.7975, lon: 127.6738 },
  { name: '몬투노bar', address: '광주광역시 동구 무등로 400, 3층', region: '전라도', aliases: ['몬투노', 'Montuno'], lat: 35.1612, lon: 126.9264 },
]

export const findBarByName = (text) => {
  if (!text) return null
  
  const normalize = (s) => s.replace(/\s/g, '').toLowerCase()
  const cleanSearch = normalize(text)
  
  let matched = BAR_DATABASE.find(bar => {
    const targets = [bar.name, ...(bar.aliases || [])].map(normalize)
    return targets.some(target => target.includes(cleanSearch) || cleanSearch.includes(target))
  })
  
  if (matched) return matched

  return BAR_DATABASE.find(bar => {
    const targets = [bar.name, ...(bar.aliases || [])].map(normalize)
    return targets.some(target => target.length > 0 && (target.includes(cleanSearch) || cleanSearch.includes(target)))
  })
}

export const findBarByAddress = (address) => {
  return BAR_DATABASE.find(bar => address.includes(bar.address))
}
