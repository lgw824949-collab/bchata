import { normDate } from './dateNorm';

export const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function addDaysToDateStr(dateStr, days) {
  const day = normDate(dateStr);
  if (!day) return day;
  const [y, mo, d] = day.split('-').map(Number);
  const base = new Date(Date.UTC(y, mo - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** YYYY-MM-DD → 한글 요일 (KST 달력일) */
export function getKoreanWeekdayFromDateStr(dateStr) {
  const day = normDate(dateStr);
  if (!day) return '';
  const [y, mo, d] = day.split('-').map(Number);
  if (!y || !mo || !d) return '';
  return KOREAN_WEEKDAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
}

export function isWeeklyRecurringParty(p) {
  return Boolean(p?.is_weekly_recurring);
}

/** 달력 날짜에 이 파티(또는 매주 반복)가 해당하는지 */
export function partyMatchesCalendarDate(p, dateStr) {
  const target = normDate(dateStr);
  if (!target || !p) return false;
  if (isWeeklyRecurringParty(p)) {
    const dow = String(p.day_of_week || '').trim();
    if (!dow) return false;
    return getKoreanWeekdayFromDateStr(target) === dow;
  }
  return normDate(p.date) === target;
}

/** 소셜 목록 — 오늘 이후 단발 + 매주 반복 */
export function partyIsUpcomingOrRecurring(p, todayStr) {
  if (isWeeklyRecurringParty(p)) return true;
  const d = normDate(p?.date);
  const today = normDate(todayStr);
  if (!d || !today) return false;
  return d >= today;
}

/** 기간 내 이 파티가 노출되는 달력일 목록 */
export function expandPartyDatesInRange(p, fromDateStr, toDateStr) {
  const from = normDate(fromDateStr);
  const to = normDate(toDateStr);
  if (!from || !to || to < from) return [];

  if (!isWeeklyRecurringParty(p)) {
    const d = normDate(p.date);
    if (d && d >= from && d <= to) return [d];
    return [];
  }

  const dates = [];
  let cur = from;
  while (cur <= to) {
    if (partyMatchesCalendarDate(p, cur)) dates.push(cur);
    cur = addDaysToDateStr(cur, 1);
  }
  return dates;
}

/** Supabase .or() — 오늘 날짜 단발 + 매주 반복 전체 */
export function partiesTodayOrWeeklyOrFilter(todayStr) {
  const day = normDate(todayStr);
  return `date.eq.${day},is_weekly_recurring.eq.true`;
}
