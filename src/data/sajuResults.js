// 오행별 댄스 장르 매핑
export const OHENG_GENRE = {
  '목(木)': '살사',
  '화(火)': '쥬크',
  '토(土)': '라인댄스',
  '금(金)': '키좀바',
  '수(水)': '바차타'
};

// 상세 사주 결과 데이터베이스
export const ALL_RESULTS = [
  {
    title: "푸른 나무의 생명력",
    desc: "당신은 곧고 바르게 뻗어 나가는 나무의 기운을 타고났습니다. 리드미컬하고 활기찬 움직임이 행운을 불러옵니다.",
    tip: "파트너와 시선을 맞추며 밝은 미소를 유지하세요."
  },
  {
    title: "타오르는 불꽃의 열정",
    desc: "심장을 울리는 비트와 뜨거운 에너지가 당신의 본능을 깨웁니다. 화려한 풋워크와 역동적인 턴이 돋보이는 날입니다.",
    tip: "강렬한 레드 컬러의 액세서리가 에너지를 증폭시킵니다."
  },
  {
    title: "단단한 대지의 포용력",
    desc: "안정감 있고 부드러운 연결감이 당신의 가장 큰 무기입니다. 파트너를 편안하게 이끌어주는 배려 깊은 춤이 최고의 찬사를 받을 것입니다.",
    tip: "베이직 스텝의 완성도에 집중하면 더 깊은 소셜을 즐길 수 있습니다."
  },
  {
    title: "차가운 금속의 세련미",
    desc: "날카롭고 정확한 텐션과 군더더기 없는 동작이 돋보입니다. 테크니컬한 요소들을 섞어 당신의 기량을 마음껏 뽐내보세요.",
    tip: "차분한 톤의 의상이 당신의 세련된 선을 더욱 강조해줍니다."
  },
  {
    title: "깊은 바다의 유연함",
    desc: "흐르는 물처럼 유연하고 끊김 없는 커넥션이 일품입니다. 음악의 흐름에 온몸을 맡기고 파도처럼 일렁이는 감동을 전달해보세요.",
    tip: "호흡을 깊게 하며 몸의 긴장을 풀 때 최고의 춤이 나옵니다."
  }
];

// 결과 선택 로직
export const selectResult = (genre, gender, month, day, count) => {
  const num = parseInt(month) + parseInt(day) + (gender === 'male' ? 1 : 2)
  const index = num % ALL_RESULTS.length
  const baseResult = ALL_RESULTS[index]

  // 오행 기반 댄스 타입 결정
  const ohengList = Object.keys(OHENG_GENRE)
  const oheng = ohengList[num % ohengList.length]
  const recommendedGenre = genre || OHENG_GENRE[oheng]

  // 성향 타입 결정 (3가지)
  const typeIndex = num % 3
  const types = [
    {
      type: '🔥 핫한 연결형',
      typeDesc: '새로운 사람과 자연스럽게 어울리는 날이에요',
      vibe: '활발하고 에너지 넘침',
      groupSize: '대규모'
    },
    {
      type: '🌿 편안한 교류형',
      typeDesc: '소규모로 깊게 연결되는 날이에요',
      vibe: '여유롭고 따뜻함',
      groupSize: '소규모'
    },
    {
      type: '💎 실력 성장형',
      typeDesc: '오늘은 배움에 집중하는 날이에요',
      vibe: '진지하고 성장 지향',
      groupSize: '클래스'
    }
  ]
  const selectedType = types[typeIndex]

  // AI 분석 근거 3개
  const aiReasons = [
    `${oheng} 기운 보유자 → ${recommendedGenre} 최적 매칭`,
    `${gender === 'male' ? '남성' : '여성'} ${month}월생 에너지 패턴 분석 완료`,
    `현재 ${selectedType.groupSize} 모임 활성도 높음 → 우선 추천`
  ]

  return {
    ...baseResult,
    genre: recommendedGenre,
    oheng,
    selectedType,
    aiReasons
  }
}
