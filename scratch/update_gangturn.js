
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateGangTurn() {
  // 1. Find the location '강턴'
  const { data: loc, error: findError } = await supabase
    .from('locations')
    .select('*')
    .ilike('name', '%강턴%')
  
  if (findError) {
    console.error('Error finding location:', findError.message)
    return
  }

  if (!loc || loc.length === 0) {
    console.log('Location "강턴" not found.')
    return
  }

  console.log('Found locations:', loc)

  // 2. Update address
  const targetId = loc[0].id
  const newAddress = '서울특별시 강남구 역삼로3길 17-5'
  
  const { error: updateError } = await supabase
    .from('locations')
    .update({ address: newAddress })
    .eq('id', targetId)

  if (updateError) {
    console.error('Error updating address:', updateError.message)
  } else {
    console.log(`Address for "${loc[0].name}" updated to: ${newAddress}`)
  }
}

updateGangTurn()
