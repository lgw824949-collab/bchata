/** 홈 탭 = 네이버형 리스트(HomeListGate), 소셜 탭 = 달력+파티 목록 */

/** 다크 홈 헤더 — 오늘밤빠 아래 슬로건 */
export const HOME_DARK_HEADER_TAGLINE = "Let's hit the bar tonight!";
export const HOME_LIST_TAGLINE_KO = "Let's hit the bar tonight!";
export const HOME_LIST_TAGLINE_EN = "Let's hit the bar tonight!";

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
