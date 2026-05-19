/** YYYY-MM-DD — ISO·타임존 접미사(T00:00:00 등) 제거 */
export const normDate = (d) => {
  if (d == null || d === '') return '';
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  const s = String(d).trim();
  const day = s.includes('T') ? s.split('T')[0] : s;
  return day.slice(0, 10);
};

/** KST 달력 오늘 (04:00 롤백 없음 — 오늘의 파티 카운터용) */
export const getKSTCalendarTodayStr = () => {
  const kst = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [m, d, y] = kst.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

export const isApprovedParty = (p) => {
  const s = String(p?.status ?? 'approved').trim().toLowerCase();
  return !s || s === 'approved';
};
