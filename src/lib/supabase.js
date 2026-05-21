import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let client = null

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  } catch (err) {
    console.error('[supabase] createClient failed:', err)
    client = null
  }
} else {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — DB calls are disabled.',
  )
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase = client

/**
 * @param {string} label
 * @param {(client: import('@supabase/supabase-js').SupabaseClient) => Promise<{ data?: unknown, error?: unknown }>} queryFn
 */
export async function runSupabaseQuery(label, queryFn) {
  if (!supabase) {
    const error = new Error('Supabase client not configured')
    console.warn(`[supabase] ${label}:`, error.message)
    return { data: null, error }
  }
  try {
    return await queryFn(supabase)
  } catch (err) {
    console.warn(`[supabase] ${label}:`, err?.message || err)
    return { data: null, error: err }
  }
}

/**
 * 행동 로그 — DB activity_logs 테이블은 사용하지 않음.
 */
export const logActivity = async (_action, _metadata = {}) => {
  /* no-op */
}
