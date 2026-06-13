
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const fields = ['ai_reason', 'ai_analysis', 'reason', 'memo', 'description', 'region', 'location_category', 'broad_region']
  for (const field of fields) {
    const { error } = await supabase.from('pending_parties').select(field).limit(1)
    if (!error) {
      console.log(`Column FOUND: ${field}`)
    } else {
      console.log(`Column NOT found: ${field} (${error.message})`)
    }
  }
}

check()
