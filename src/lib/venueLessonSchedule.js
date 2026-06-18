export const WEEK_COUNT_OPTIONS = [4, 6, 8];

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

const parseDateParts = (dateStr) => {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDateParts = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const weekdayFromDate = (dateStr) => {
  if (!dateStr) return '';
  return DAYS_KOR[parseDateParts(dateStr).getDay()];
};

/** N주반 — 같은 요일 기준 N회차의 마지막 수업일 */
export const calcRegularCourseEndDate = (startDate, weekCount) => {
  if (!startDate || !weekCount || weekCount === 'custom') return '';
  const weeks = Number(weekCount);
  if (!Number.isFinite(weeks) || weeks < 1) return '';
  const d = parseDateParts(startDate);
  d.setDate(d.getDate() + (weeks - 1) * 7);
  return formatDateParts(d);
};

export const buildDurationLabel = (scheduleType, weekCount, endDate) => {
  if (scheduleType === 'oneday') return '원데이';
  if (weekCount === 'custom') return endDate ? `~ ${endDate}` : '기간 미지정';
  const weeks = Number(weekCount);
  if (!Number.isFinite(weeks)) return endDate ? `~ ${endDate}` : '기간 미지정';
  return endDate ? `${weeks}주 · ~ ${endDate}` : `${weeks}주`;
};

export const parseScheduleFromLessonRow = (item) => {
  const duration = String(item?.duration || '');
  const endDateMatch = duration.match(/~\s*(\d{4}-\d{2}-\d{2})/);
  const endDate = endDateMatch?.[1] || '';
  const startDate = item?.start_date || '';

  if (/원데이/i.test(duration)) {
    return {
      scheduleType: 'oneday',
      weekCount: 4,
      endDate: startDate || endDate,
    };
  }

  const weekMatch = duration.match(/(\d+)\s*주/);
  if (weekMatch) {
    const weekCount = Number(weekMatch[1]);
    return {
      scheduleType: 'regular',
      weekCount: WEEK_COUNT_OPTIONS.includes(weekCount) ? weekCount : 'custom',
      endDate: endDate || calcRegularCourseEndDate(startDate, weekCount),
    };
  }

  if (endDate) {
    return { scheduleType: 'regular', weekCount: 'custom', endDate };
  }

  return {
    scheduleType: 'regular',
    weekCount: 4,
    endDate: calcRegularCourseEndDate(startDate, 4),
  };
};
