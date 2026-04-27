
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkLocations() {
  const { data, error } = await supabase.from('locations').select('*').limit(1)
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Location Columns:', Object.keys(data[0] || {}))
  }
}

checkLocations()
