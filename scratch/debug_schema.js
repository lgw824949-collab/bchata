
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_columns_info', { t_name: 'pending_parties' })
  if (error) {
    // If RPC doesn't exist, try fetching all and hope for one record or error message
    const { data: d, error: e } = await supabase.from('classes_news').select('*').limit(1)
    if (e) {
      console.log('Error Message:', e.message)
    } else {
      console.log('Columns:', Object.keys(d[0] || {}))
    }
  } else {
    console.log('Schema:', data)
  }
}

checkSchema()
