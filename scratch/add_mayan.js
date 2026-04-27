
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addMayan() {
  // 1. Check if '마얀' exists
  const { data: existing } = await supabase.from('locations').select('*').ilike('name', '%마얀%')
  if (existing && existing.length > 0) {
    console.log('Location "마얀" already exists:', existing)
    return
  }

  // 2. Get region ID for 전라도 (Gwangju belongs to Jeonla region in this app's classification)
  const { data: reg } = await supabase.from('regions').select('id').eq('name', '전라도').single()
  if (!reg) {
    console.error('Region "전라도" not found')
    return
  }

  // 3. Insert new location
  const { data: inserted, error } = await supabase.from('locations').insert([{
    name: '마얀',
    address: '광주 동구 황금동 84번지 3층',
    region_id: reg.id
  }]).select()

  if (error) {
    console.error('Error inserting location:', error.message)
  } else {
    console.log('Successfully added "마얀":', inserted)
  }
}

addMayan()
