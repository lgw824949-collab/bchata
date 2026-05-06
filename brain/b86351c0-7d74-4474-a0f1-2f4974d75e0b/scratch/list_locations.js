import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listLocations() {
  console.log('--- Listing all locations (name, address) ---')
  const { data, error } = await supabase
    .from('locations')
    .select('name, address')
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching locations:', error.message)
  } else if (data) {
    console.table(data)
    // Also log as JSON if console.table is not sufficient in this environment
    // console.log(JSON.stringify(data, null, 2))
  }
}

listLocations()
