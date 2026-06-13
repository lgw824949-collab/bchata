
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const { data, error } = await supabase.from('pending_parties').select('*').limit(0)
  if (error) {
    console.log('Error:', error.message)
  } else {
    // This won't work if no data. I'll try to insert a garbage record to see the error message with columns.
    const { error: e } = await supabase.from('pending_parties').insert([{ garbage_field: 'test' }])
    console.log('Error with garbage field:', e.message)
  }
}

check()
