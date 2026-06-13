const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'parties' })
  console.log('Schema:', data || error)
}
check()
