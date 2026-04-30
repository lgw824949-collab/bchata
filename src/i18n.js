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
      "hot_pick": "HOT PICK 5",
      "nationwide_popular": "전국 인기",
      "intelligent_route": "지능형 경로 최적화",
      "shortest_distance": "최단 거리 성지 탐색 →",
      "view_all": "전체보기",
      "admin_dashboard": "관리자 모드",
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
      "region_seoul": "서울",
      "region_gyeonggi_incheon": "경기/인천",
      "region_chungcheong": "충청도",
      "region_jeolla": "전라도",
      "region_gyeongsang": "경상도",
      "region_gangwon_jeju": "강원/제주"
    }
  },
  en: {
    translation: {
      "nav_social": "Social Party",
      "nav_class": "Class/Meetup",
      "nav_bootcamp": "Bootcamp",
      "nav_festival": "Festival",
      "nav_register": "Post",
      "hot_pick": "HOT PICK 5",
      "nationwide_popular": "Nationwide",
      "intelligent_route": "Intelligent Route",
      "shortest_distance": "Finding nearest venue →",
      "view_all": "View All",
      "admin_dashboard": "Admin Mode",
      "view_calendar": "Calendar",
      "no_parties": "No parties registered in this area yet.",
      "back_to_today": "Back to Today",
      "premium_services": "Premium Services",
      "platform_desc": "Intelligent Dance Life Platform",
      "restaurant": "Top Restaurants",
      "saju": "Destiny Coordinates",
      "weather": "Weather",
      "notice": "Notice",
      "coming_soon": "Coming Soon",
      "region_seoul": "Seoul",
      "region_gyeonggi_incheon": "Incheon/Gyeonggi",
      "region_chungcheong": "Chungcheong",
      "region_jeolla": "Jeolla",
      "region_gyeongsang": "Gyeongsang",
      "region_gangwon_jeju": "Gangwon/Jeju"
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
