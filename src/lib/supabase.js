import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing in .env. Connectivity will be disabled.')
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * 행동 로그 — DB activity_logs 테이블은 사용하지 않음.
 * 상세 조회 등은 bchata-venue-view 커스텀 이벤트·barStats 로컬 bump로 처리.
 */
export const logActivity = async (_action, _metadata = {}) => {
  /* no-op: ghost table insert 제거 */
}
