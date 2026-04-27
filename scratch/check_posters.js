
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTables() {
  const { data, error } = await supabase.from('posters').select('*').limit(1)
  if (error) {
    console.log('Posters table NOT found or error:', error.message)
  } else {
    console.log('Posters table FOUND. Columns:', Object.keys(data[0] || {}))
  }
}

checkTables()
