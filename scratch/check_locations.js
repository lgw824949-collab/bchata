
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const { data, error } = await supabase.from('locations').select('*').limit(1)
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Columns:', Object.keys(data[0]))
    console.log('Sample Data:', data[0])
  }
}

check()
