import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ko: {
    translation: {
      "nav_social": "소셜파티",
      "nav_class": "수업/정모",
      "nav_bootcamp": "부트캠프",
      "nav_festival": "전국페스티벌",
      "nav_register": "등록",
      "filter_where": "어디로 가시나요?",
      "filter_genre": "어떤 장르가 꽂히세요?",
      "map": "지도",
      "view_all": "전체보기",
      "today": "오늘",
      "hot_pick": "HOT PICK 5",
      "view_calendar": "달력",
      "no_parties": "이 지역은 아직 등록된 파티가 없습니다.",
      "back_to_today": "오늘로 돌아가기",
      "premium_services": "Premium Services",
      "platform_desc": "지능형 댄스 라이프 플랫폼",
      "restaurant": "뒷풀이 맛집",
      "saju": "운명의 좌표",
      "weather": "오늘 날씨",
      "notice": "공지사항",
      "coming_soon": "준비 중입니다",
      "intelligent_route": "지능형 경로 최적화",
      "region_seoul": "서울",
      "region_gyeonggi_incheon": "경기/인천",
      "region_gyeongsang": "경상도",
      "region_jeolla": "전라도",
      "region_chungcheong": "충청도",
      "region_gangwon_jeju": "강원/제주",
      "region_incheon": "인천",
      "region_busan": "부산",
      "region_daegu": "대구",
      "region_daejeon": "대전",
      "region_gwangju": "광주",
      "region_etc": "기타",
      "today_bootcamp": "오늘의 부트캠프",
      "today_festival": "오늘의 페스티벌",
      "confirm_complete": "확인 완료",
      "reselect_region": "지역 다시 선택",
      "reselect_genre": "장르 다시 선택",
      "no_matching_parties": "해당 조건의 파티가 없습니다 😅",
      "close": "닫기"
    }
  },
  en: {
    translation: {
      "nav_social": "Social Party",
      "nav_class": "Classes",
      "nav_bootcamp": "Bootcamp",
      "nav_festival": "Festival",
      "nav_register": "Register",
      "filter_where": "Where are you going?",
      "filter_genre": "What's your vibe?",
      "map": "Map",
      "view_all": "View All",
      "today": "Today",
      "hot_pick": "HOT PICK 5",
      "view_calendar": "Calendar",
      "no_parties": "No parties registered here yet.",
      "back_to_today": "Back to Today",
      "premium_services": "Premium Services",
      "platform_desc": "Intelligent Dance Life Platform",
      "restaurant": "Top Restaurants",
      "saju": "Fortune",
      "weather": "Weather",
      "notice": "Notice",
      "coming_soon": "Coming Soon",
      "intelligent_route": "Intelligent Route",
      "region_seoul": "SEOUL",
      "region_gyeonggi_incheon": "INCHEON/GYEONGGI",
      "region_gyeongsang": "GYEONGSANG",
      "region_jeolla": "JEOLLA",
      "region_chungcheong": "CHUNGCHEONG",
      "region_gangwon_jeju": "GANGWON/JEJU",
      "region_incheon": "INCHEON",
      "region_busan": "BUSAN",
      "region_daegu": "DAEGU",
      "region_daejeon": "DAEJEON",
      "region_gwangju": "GWANGJU",
      "region_etc": "ETC",
      "today_bootcamp": "TODAY'S BOOTCAMP",
      "today_festival": "TODAY'S FESTIVAL",
      "confirm_complete": "CONFIRM",
      "reselect_region": "Reselect Region",
      "reselect_genre": "Reselect Genre",
      "no_matching_parties": "No matching parties found 😅",
      "close": "CLOSE"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
