import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkLocationsSchema() {
  console.log('--- Checking locations table schema ---')
  const { data, error } = await supabase.from('locations').select('*').limit(1)
  
  if (error) {
    console.error('Error fetching from locations:', error.message)
  } else if (data && data.length > 0) {
    console.log('Sample record:', JSON.stringify(data[0], null, 2))
    const keys = Object.keys(data[0])
    console.log('Columns:', keys.join(', '))
  } else {
    console.log('Table is empty or no records found.')
  }
}

checkLocationsSchema()
