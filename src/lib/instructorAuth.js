import { supabase } from './supabase';

/** localStorage vip_instructor_session 파싱 */
export function readVipInstructorSession() {
  try {
    const raw = localStorage.getItem('vip_instructor_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 강사 회원(활성 instructors) 여부 — 세션 + DB status 검증 */
export async function verifyActiveInstructorMember() {
  const session = readVipInstructorSession();
  if (!session?.id) return false;

  if (!supabase) return true;

  try {
    const { data, error } = await supabase
      .from('instructors')
      .select('id')
      .eq('id', session.id)
      .eq('status', 'active')
      .maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}
