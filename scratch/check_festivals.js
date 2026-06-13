import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkFestivals() {
  const { data, error } = await supabase.from('festivals').select('*').limit(1)
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Festivals Schema:', JSON.stringify(data[0], null, 2))
  }
}

checkFestivals()
