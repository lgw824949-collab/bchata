/** 홈 탭 = 다크 게이트(HomeDarkGate), 소셜 탭 = 라이트 파티 목록 */

/** 다크 홈 헤더 — 오늘밤빠 아래 슬로건 (목업 영문 톤) */
export const HOME_DARK_HEADER_TAGLINE = 'Ready to dance tonight?';

/** 한 화면에 보일 카드 수 (목업 밸런스) */
export const HOME_DARK_VISIBLE_PARTY = 4;
export const HOME_DARK_VISIBLE_INSTRUCTOR = 4;
export const HOME_DARK_VISIBLE_BAR = 5;
export const HOME_DARK_MIN_BAR_ITEMS = 5;

export const HOME_DARK_REGION_PILLS = [
  { id: 'national', labelKo: '전국', labelEn: 'National' },
  { id: 'seoul', labelKo: '서울', labelEn: 'Seoul' },
  { id: 'metro', labelKo: '수도권', labelEn: 'Metro' },
  { id: 'local', labelKo: '지방권', labelEn: 'Local' },
] as const;
