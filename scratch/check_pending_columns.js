
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
  const { data, error } = await supabase.rpc('get_columns', { table_name: 'pending_parties' })
  if (error) {
    // If RPC doesn't exist, try a different way
    const { data: cols, error: err2 } = await supabase.from('pending_parties').select('*').limit(0)
    if (err2) {
       console.log('Error:', err2.message)
    } else {
       console.log('Columns:', Object.keys(cols[0] || {}))
    }
  } else {
    console.log('Columns:', data)
  }
}

checkColumns()
