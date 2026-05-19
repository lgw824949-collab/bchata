/** PostgreSQL date 컬럼용: 빈 문자열은 null로 변환 */
export function toDateOrNull(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/** 객체의 지정 키에 toDateOrNull 적용 (in-place) */
export function sanitizeDateFields(obj, keys) {
  for (const k of keys) {
    if (k in obj) obj[k] = toDateOrNull(obj[k]);
  }
  return obj;
}

/** 수정 화면: 종료일이 없거나 시작일과 같으면 당일 행사로 추정 */
export function inferOneDayEvent(start_date, end_date) {
  const start = toDateOrNull(start_date);
  const end = toDateOrNull(end_date);
  if (!start) return true;
  if (!end) return true;
  return start === end;
}

/**
 * 당일 행사: start만 필요 → end = start
 * 기간 행사: start·end 모두 필요, end >= start
 */
export function resolveEventDates({ isOneDay, start_date, end_date }) {
  const start = toDateOrNull(start_date);
  const end = toDateOrNull(end_date);

  if (isOneDay) {
    if (!start) {
      return { ok: false, error: '행사 날짜를 선택해주세요.' };
    }
    return { ok: true, start_date: start, end_date: start };
  }

  if (!start) {
    return { ok: false, error: '시작일을 선택해주세요.' };
  }
  if (!end) {
    return { ok: false, error: '종료일을 선택해주세요. (1박 2일 등 기간 행사)' };
  }
  if (end < start) {
    return { ok: false, error: '종료일은 시작일과 같거나 이후여야 합니다.' };
  }
  return { ok: true, start_date: start, end_date: end };
}
