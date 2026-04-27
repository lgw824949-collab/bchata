
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const { data, error } = await supabase.from('parties').select('*, locations(*)').ilike('title', '%부에나%')
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Search Results:', JSON.stringify(data, null, 2))
  }
}

check()
