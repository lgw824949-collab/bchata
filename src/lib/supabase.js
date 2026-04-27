import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing in .env. Connectivity will be disabled.')
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const logActivity = async (action, metadata = {}) => {
  if (!supabase) return
  try {
    await supabase.from('activity_logs').insert({
      action,
      region: metadata.region || '전국',
      target_id: metadata.target_id || null,
      metadata,
      is_anonymous: true
    })
  } catch (err) {
    // Ignore error if table doesn't exist
  }
}
