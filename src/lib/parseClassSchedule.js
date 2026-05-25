/** instructor_classes.schedule 문자열 파싱 */
export function parseClassSchedule(scheduleStr) {
  const sched = String(scheduleStr || '').trim();
  const rangeM = sched.match(
    /(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/,
  );
  if (rangeM) {
    return {
      startDate: rangeM[1],
      endDate: rangeM[2],
      startTime: padTime(rangeM[3]),
      endTime: padTime(rangeM[4]),
      raw: sched,
    };
  }
  const singleM = sched.match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/);
  if (singleM) {
    return {
      startDate: singleM[1],
      endDate: singleM[1],
      startTime: padTime(singleM[2]),
      endTime: padTime(singleM[3]),
      raw: sched,
    };
  }
  const dateOnly = sched.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  return {
    startDate: dateOnly || '',
    endDate: dateOnly || '',
    startTime: '',
    endTime: '',
    raw: sched || '',
  };
}

function padTime(raw) {
  const m = String(raw || '').trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
}

/** todayStr: YYYY-MM-DD (KST) */
export function getScheduleTiming(parsed, todayStr) {
  const start = parsed?.startDate || '';
  const end = parsed?.endDate || start;
  if (!start) return 'unknown';
  if (end < todayStr) return 'past';
  if (start > todayStr) return 'upcoming';
  return 'today';
}

export function formatScheduleDateLabel(dateStr) {
  if (!dateStr) return '일정 미정';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const wd = weekdays[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${wd})`;
}

export function formatScheduleTimeRange(parsed) {
  if (parsed.startTime && parsed.endTime) {
    return `${parsed.startTime} ~ ${parsed.endTime}`;
  }
  if (parsed.raw) return parsed.raw;
  return '시간 미정';
}
