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
