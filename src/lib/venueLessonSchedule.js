export const WEEK_COUNT_OPTIONS = [4, 6, 8];

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];
const LESSON_DAY_MAP = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

export const normLessonDate = (value) => String(value ?? '').slice(0, 10);

export const isOnedayLesson = (lesson) => /원데이/i.test(String(lesson?.duration || ''));

/** 일정·히어로 태그 — 원데이: BAR 워크숍, 정규반: BAR 클래스 */
export const resolveVenueLessonKindLabel = (lesson) => {
  if (isOnedayLesson(lesson)) {
    return { ko: 'BAR 워크숍', en: 'Bar workshop' };
  }
  return { ko: 'BAR 클래스', en: 'Bar class' };
};

export const resolveVenueLessonHeroSubtitle = (lesson, todayPrefix = false) => {
  const base = resolveVenueLessonKindLabel(lesson);
  if (!todayPrefix) return base;
  return {
    ko: `오늘 ${base.ko}`,
    en: `Today's ${base.en}`,
  };
};

export const parseLessonWeekdays = (dayOfWeek) => {
  if (!dayOfWeek) return [];
  const tokens = String(dayOfWeek).split(/[,/·|\s]+/).map((t) => t.trim()).filter(Boolean);
  const days = new Set();
  tokens.forEach((tok) => {
    const key = tok.replace(/요일/g, '').slice(0, 1);
    if (key in LESSON_DAY_MAP) days.add(LESSON_DAY_MAP[key]);
  });
  return Array.from(days);
};

export const parseLessonEndDate = (lesson) => {
  const duration = String(lesson?.duration || '');
  const m = duration.match(/~\s*(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ? normLessonDate(m[1]) : null;
};

export const getNextLessonOccurrence = (lesson, fromDateStr) => {
  const from = normLessonDate(fromDateStr);
  const start = normLessonDate(lesson?.start_date);
  const end = parseLessonEndDate(lesson);

  if (isOnedayLesson(lesson)) {
    if (!start) return null;
    return start >= from ? start : null;
  }

  const weekdays = parseLessonWeekdays(lesson?.day_of_week);

  if (weekdays.length === 0) {
    if (start && start >= from && (!end || start <= end)) return start;
    return start && (!end || start <= end) ? start : null;
  }

  const base = parseDateParts(from);
  for (let i = 0; i < 84; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const full = formatDateParts(d);
    if (start && full < start) continue;
    if (end && full > end) break;
    if (weekdays.includes(d.getDay())) return full;
  }
  return start && start >= from && (!end || start <= end) ? start : null;
};

export const lessonOccursOnDate = (lesson, dateStr) => {
  const d = normLessonDate(dateStr);
  if (!d) return false;
  if (isOnedayLesson(lesson)) {
    return normLessonDate(lesson.start_date) === d;
  }
  const end = parseLessonEndDate(lesson);
  if (end && d > end) return false;
  if (normLessonDate(lesson.start_date) === d) return true;
  const weekdays = parseLessonWeekdays(lesson.day_of_week);
  if (!weekdays.length) return false;
  const start = normLessonDate(lesson.start_date);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return weekdays.includes(parseDateParts(d).getDay());
};

/** 달력 점 표시용 — fromDateStr부터 weeks주간 수업일 */
export const collectLessonCalendarDates = (lesson, fromDateStr, weeks = 10) => {
  const dates = new Set();
  const start = normLessonDate(lesson.start_date) || fromDateStr;
  if (isOnedayLesson(lesson)) {
    if (start) dates.add(start);
    return dates;
  }
  const end = parseLessonEndDate(lesson);
  const weekdays = parseLessonWeekdays(lesson.day_of_week);
  if (!weekdays.length) {
    if (start && (!end || start <= end)) dates.add(start);
    const next = getNextLessonOccurrence(lesson, fromDateStr);
    if (next) dates.add(next);
    return dates;
  }
  const base = parseDateParts(fromDateStr);
  const totalDays = weeks * 7;
  for (let i = 0; i < totalDays; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const full = formatDateParts(d);
    if (start && full < start) continue;
    if (end && full > end) break;
    if (weekdays.includes(d.getDay())) dates.add(full);
  }
  return dates;
};

export const isApprovedVenueLesson = (lesson) => {
  if (!lesson) return false;
  if (lesson.category_type && lesson.category_type !== 'venue') return false;
  if (lesson.status && lesson.status !== 'approved') return false;
  return Boolean(String(lesson?.poster_url || '').trim());
};

export const filterVenueLessonsForDate = (lessons, dateStr) => {
  const seen = new Set();
  return (lessons || []).filter((lesson) => {
    if (!isApprovedVenueLesson(lesson)) return false;
    if (lesson.category_type && lesson.category_type !== 'venue') return false;
    if (!lessonOccursOnDate(lesson, dateStr)) return false;
    const id = lesson.id;
    if (id != null) {
      if (seen.has(id)) return false;
      seen.add(id);
    }
    return true;
  });
};

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
