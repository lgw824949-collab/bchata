
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fix() {
  // Get Gyeongsang-do ID
  const { data: rd } = await supabase.from('regions').select('id').eq('name', '경상도').single()
  if (!rd) return
  
  // Update Baya
  const { error } = await supabase.from('locations').update({ region_id: rd.id }).eq('name', '바야')
  if (error) {
    console.error(error)
  } else {
    console.log('Baya location updated to Gyeongsang-do')
  }
}

fix()
