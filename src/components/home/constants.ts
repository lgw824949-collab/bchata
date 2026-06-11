/** 한 화면에 보일 카드 수 (목업 밸런스) */
export const HOME_DARK_VISIBLE_PARTY = 4;
export const HOME_DARK_VISIBLE_INSTRUCTOR = 4;
export const HOME_DARK_VISIBLE_BAR = 5;
export const HOME_DARK_MIN_BAR_ITEMS = 5;

export const HOME_DARK_REGION_PILLS = [
  { id: 'all', labelKo: '전체', labelEn: 'All' },
  { id: 'national', labelKo: '전국', labelEn: 'National' },
  { id: 'seoul', labelKo: '서울', labelEn: 'Seoul' },
  { id: 'metro', labelKo: '수도권', labelEn: 'Metro' },
] as const;
