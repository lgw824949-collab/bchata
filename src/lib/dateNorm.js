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

/** KST 새벽 4시 전까지는 전날 — 소셜 탭·노출용 */
export const getKSTNightlifeTodayStr = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const pick = (type) => parts.find((p) => p.type === type)?.value ?? '';
  let y = pick('year');
  let m = pick('month');
  let d = pick('day');
  const hour = parseInt(pick('hour'), 10);
  if (hour < 4) {
    const rolled = new Date(`${y}-${m}-${d}T12:00:00+09:00`);
    rolled.setDate(rolled.getDate() - 1);
    const kst = rolled.toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const [rm, rd, ry] = kst.split('/');
    y = ry;
    m = rm;
    d = rd;
  }
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

export const isApprovedParty = (p) => {
  const s = String(p?.status ?? 'approved').trim().toLowerCase();
  return !s || s === 'approved';
};
