
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const { error } = await supabase.from('pending_parties').insert([{ location_category: 'test' }])
  if (error && error.message.includes('Could not find')) {
    console.log('location_category NOT found')
  } else {
    console.log('location_category FOUND or other error:', error?.message)
  }
}

check()
