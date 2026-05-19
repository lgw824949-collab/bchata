// 전국의 바차타/댄스 바 마스터 정보
export const BAR_DATABASE = [
  // [서울 - 강남권]
  { name: '라틴', name_en: 'Latin', address: '서울특별시 강남구 테헤란로 6길 9', region: '서울' },
  { name: '강남턴', name_en: 'Gangnam Turn', address: '서울특별시 강남구 역삼1동 831-34', region: '서울', aliases: ['강턴'] },
  { name: '강남SOL', name_en: 'Gangnam SOL', address: '서울특별시 강남구 테헤란로 8길 11-7', region: '서울', aliases: ['Sol bar', 'SOL'] },
  { name: '마이애미', name_en: 'Miami', address: '서울특별시 강남구 테헤란로14길 25', region: '서울' },
  { name: '뉴욕', name_en: 'New York', address: '서울특별시 강남구 강남대로84길 24-4', region: '서울' },
  { name: '압구정 TOP', name_en: 'Apgujeong TOP', address: '서울특별시 강남구 압구정로 224', region: '서울', aliases: ['탑', '압탑', '압구정 살사클럽 탑'] },
  { name: '압구정 On2', name_en: 'Apgujeong On2', address: '서울특별시 강남구 논현로167길 12', region: '서울', aliases: ['압온'] },
  { name: '아지트', name_en: 'Azit', address: '서울특별시 강남구 역삼동 831-30', region: '서울' },

  // [서울 - 홍대권]
  { name: '보니따', name_en: 'Bonita', address: '서울특별시 마포구 동교로 191', region: '서울' },
  { name: '홍턴', name_en: 'Hong Turn', address: '서울특별시 마포구 동교로207', region: '서울' },
  { name: '부에나', name_en: 'Buena', address: '서울특별시 마포구 동교로 217', region: '서울' },
  { name: '마콘도', name_en: 'Macondo', address: '서울특별시 마포구 홍익로 6길48', region: '서울' },
  { name: '안단테', name_en: 'Andante', address: '서울특별시 마포구 양화로12길 24', region: '서울' },
  { name: '놀이터', name_en: 'Noriter', address: '서울특별시 마포구 동교로213', region: '서울' },
  { name: '하바나', name_en: 'Havana', address: '서울특별시 마포구 서교동 어울마당로 53', region: '서울' },
  { name: '아난타라', name_en: 'Anantara', address: '서울특별시 마포구 양화로 18안길20', region: '서울' },
  { name: '홍대SOL', name_en: 'Hongdae SOL', address: '서울특별시 마포구 홍익로6길 83', region: '서울', aliases: ['솔SOL빠', 'Sol Bar'] },
  { name: '꼼애야', name_en: 'Come Ya', address: '서울특별시 마포구 동교로 209-4', region: '서울' },

  // [경기 - 수원]
  { name: '돌체비타', name_en: 'Dolce Vita', address: '경기도 수원시 팔달구 인계동 1042-7, 3층', region: '경기도', aliases: ['쿠바'] },
  { name: '원스', name_en: 'Ones', address: '경기도 수원시 팔달구 인계동 1024-5, 4층', region: '경기도' },

  // [경기 - 안산]
  { name: '라소클', name_en: 'Lasocle', address: '경기도 안산시 단원구 민육공원로 85 지하1층', region: '경기도' },
  { name: '퀸즈살사', name_en: 'Queens Salsa', address: '경기도 안산시 상록구 팝핀스 493-13 2층', region: '경기도' },
  { name: 'EDM댄스스튜디오', name_en: 'EDM Dance', address: '경기도 안산시 상록구 180/B102호', region: '경기도' },

  // [경기 - 분당]
  { name: '분당살사', name_en: 'Bundang Salsa', address: '경기도 분당구 정자동 23-1 지파크프라자5층', region: '경기도' },
  { name: '바이라모스', name_en: 'Baila Ramos', address: '경기도 성남시 분당구 수내동 19-3 대덕프라자 509호', region: '경기도', aliases: ['바일라모스'] },

  // [경기 - 용인]
  { name: '비비고댄스', name_en: 'Bibigo Dance', address: '경기도 용인시 기흥구 용구대로 2390-12 삼송빌딩지하', region: '경기도' },

  // [경기 - 부천]
  { name: '카디즈', name_en: 'Cadiz', address: '경기도 부천시 숭내대로 265번길 17, 효성프라자 6F', region: '경기도' },

  // [인천]
  { name: '라틴크루', name_en: 'Latin Crew', address: '인천 미추홀구 석바위로 49-1', region: '인천광역시' },
  { name: '엘마르', name_en: 'Elmar', address: '인천 부평구 십정동 420-1', region: '인천광역시', aliases: ['엘마'] },
  { name: '라씬 카우보이', name_en: 'Latin Cowboy', address: '인천시 미추홀구 경원대로 851 4층', region: '인천광역시' },
  { name: 'LBT', name_en: 'LBT', address: '인천 구월동 1391-8 지하1층', region: '인천광역시' },

  // [경기 - 일산]
  { name: '칼리', name_en: 'Cali', address: '경기도 고양시 일산동구 백석동 1228-4', region: '경기도' },
  { name: '살사 우노', name_en: 'Salsa Uno', address: '경기도 고양시 일산동구 1196-2 B1', region: '경기도' },

  // [경기 - 의정부]
  { name: '이그녹스', name_en: 'Egnox', address: '경기도 의정부시 평화로 567-1 청관정지하', region: '경기도' },

  // [충청 - 대전·천안·청주]
  { name: '라틴팩토리', name_en: 'Latin Factory', address: '대전 유성구 문화원로6번길 B1', region: '충청도', aliases: ['라팩', 'SNS'] },
  { name: '노체', name_en: 'Noche', address: '대전 서구 둔산동 31번길 66 3F', region: '충청도' },
  { name: 'DLC', name_en: 'DLC', address: '대전 서구 갈마동 395-13 3F', region: '충청도' },
  { name: '미아모르', name_en: 'Mi Amor', address: '대전 동남구 신부동 976 B1', region: '충청도' },
  { name: '천안턴', name_en: 'Cheonan Turn', address: '천안시 원두정9길 3 B1', region: '충청도', aliases: ['천안틴', '살컨', '살사컨셉'] },
  { name: '리코빠', name_en: 'Rico Bar', address: '청주시 서원구 사창동 531번지 B1', region: '충청도' },

  // [경상 - 대구·김천·창원·김해·부산·포항]
  { name: '개츠비', name_en: 'Gatsby', address: '경상북도 김천시 평화동 260-10 3층', region: '경상도' },
  { name: '바야', name_en: 'Baya', address: '대구 중구 동성로4길 20-7 2,3층', region: '경상도' },
  { name: '바바루', name_en: 'Babalu', address: '대구 중구 동성로 4길 39 4층', region: '경상도' },
  { name: '턴 바', name_en: 'Turn Bar', address: '대구광역시 중구 동성로 123', region: '경상도' },
  { name: '난다BAR', name_en: 'Nanda Bar', address: '경상남도 창원시 성산구 중앙대로83번길 14 창원종합상가 2층', region: '경상도' },
  { name: '엘하비댄스스튜디오', name_en: 'Elhabi Dance', address: '경상남도 김해시 분성로 302번길 12, 2층', region: '경상도' },
  { name: '맘보', name_en: 'Mambo', address: '부산진구 중앙대로 691번길 52 지하1층', region: '경상도' },
  { name: '제이 바', name_en: 'J Bar', address: '부산광역시 해운대구 우동 456', region: '경상도' },
  { name: '포항댄스사랑', name_en: 'Pohang Dance Love', address: '경상북도 포항시 남구 중앙로 112, 4층', region: '경상도', aliases: ['포댄사'] },
  { name: '루에다', name_en: 'Rueda', address: '부산광역시 부산진구 신천대로62번길 42 2층', region: '경상도' },

  // [전라 - 광주·여수]
  { name: '부에나비스타바', name_en: 'Buena Vista', address: '광주광역시 동구 문화전당로23번길 38-1', region: '전라도' },
  { name: '마얀', name_en: 'Mayan', address: '광주광역시 동구 황금동 84번지 3층', region: '전라도' },
  { name: '엘카리베', name_en: 'El Caribe', address: '전라남도 여수시 소라면 죽림중앙로 13-12 4층', region: '전라도' },
]

export const findBarByName = (text) => {
  if (!text) return null
  
  // 검색어 정규화 (공백 제거, 대소문자 무시, 관용적 수식어 제거)
  const normalize = (s) => {
    const basic = s.replace(/\s/g, '').toLowerCase();
    if (basic.length <= 2) return basic; // 2글자 이하는 관용구 제거 안함 (바야, 마얀 등 보존)
    return basic.replace(/(바|빠|bar|클럽|studio|스튜디오|dance|댄스|살사)/g, '');
  };

  const cleanSearch = text.replace(/\s/g, '').toLowerCase()
  const coreSearch = normalize(text)
  
  if (coreSearch.length < 1) return null

  // 1단계: 직접 포함 여부 확인 (강남턴, 홍턴 등)
  let matched = BAR_DATABASE.find(bar => {
    const targets = [bar.name, ...(bar.aliases || [])].map(s => s.replace(/\s/g, '').toLowerCase())
    return targets.some(target => target.includes(cleanSearch) || cleanSearch.includes(target))
  })
  
  if (matched) return matched

  // 2단계: 핵심 키워드 매칭 (라틴팩토리 -> 라팩 등 관용구 제외 매칭)
  return BAR_DATABASE.find(bar => {
    const targets = [bar.name, ...(bar.aliases || [])].map(normalize)
    return targets.some(target => target.length > 0 && (target.includes(coreSearch) || coreSearch.includes(target)))
  })
}

export const findBarByAddress = (address) => {
  return BAR_DATABASE.find(bar => address.includes(bar.address))
}
