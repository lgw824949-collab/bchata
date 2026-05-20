/**
 * 로컬 개발용 테스트 수업 (import.meta.env.DEV 에서만 병합)
 * 삭제: 이 파일 비우거나 VenueDetailModal 의 DEV 병합 제거
 */
export function getDevTestLessons(todayStr) {
  const [y, m, d] = todayStr.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const addDays = (n) => {
    const x = new Date(base);
    x.setDate(x.getDate() + n);
    const yy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, '0');
    const dd = String(x.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  return [
    {
      id: 'dev-lesson-gangturn-bachata',
      title: '[테스트] 강남턴 바차타 입문반',
      genre: '바차타',
      level: '입문',
      day_of_week: '화, 목',
      start_time: '20:00',
      end_time: '21:30',
      start_date: addDays(-14),
      studio_name: '강남턴',
      address: '서울특별시 강남구 역삼1동 831-34',
      fee: '12',
      poster_url: '/logo.png',
      status: 'approved',
      category_type: 'class',
    },
    {
      id: 'dev-lesson-gangturn-salsa',
      title: '[테스트] 강남턴 살사 중급',
      genre: '살사',
      level: '중급',
      day_of_week: '금',
      start_time: '21:00',
      end_time: '22:30',
      start_date: addDays(-7),
      studio_name: '강남턴',
      address: '서울특별시 강남구 역삼1동 831-34',
      fee: '15',
      poster_url: '/logo.png',
      status: 'approved',
      category_type: 'class',
    },
    {
      id: 'dev-lesson-latin-social',
      title: '[테스트] 라틴 소셜 기초',
      genre: '바차타',
      level: '입문',
      day_of_week: '수',
      start_time: '19:30',
      end_time: '21:00',
      start_date: addDays(-3),
      studio_name: '라틴',
      address: '서울특별시 강남구 테헤란로 6길 9',
      fee: '10',
      poster_url: '/logo.png',
      status: 'approved',
      category_type: 'class',
    },
    {
      id: 'dev-lesson-latin-workshop',
      title: '[테스트] 라틴 워크숍 (1회)',
      genre: '쥬크',
      level: '중급',
      day_of_week: '',
      start_time: '14:00',
      end_time: '17:00',
      start_date: addDays(5),
      studio_name: '라틴',
      address: '서울특별시 강남구 테헤란로 6길 9',
      fee: '3',
      poster_url: '/logo.png',
      status: 'approved',
      category_type: 'class',
    },
    {
      id: 'dev-lesson-ggomaeya',
      title: '[테스트] 꼼애야 바차타 기초',
      genre: '바차타',
      level: '입문',
      day_of_week: '월, 수',
      start_time: '20:30',
      end_time: '22:00',
      start_date: addDays(-10),
      studio_name: '꼼애야',
      address: '서울특별시 마포구 동교로 209-4',
      fee: '11',
      poster_url: '/logo.png',
      status: 'approved',
      category_type: 'class',
    },
    {
      id: 'dev-lesson-noriter',
      title: '[테스트] 놀이터 살사 중급',
      genre: '살사',
      level: '중급',
      day_of_week: '화, 금',
      start_time: '21:00',
      end_time: '22:30',
      start_date: addDays(-5),
      studio_name: '놀이터',
      address: '서울특별시 마포구 동교로213',
      fee: '13',
      poster_url: '/logo.png',
      status: 'approved',
      category_type: 'class',
    },
  ];
}
