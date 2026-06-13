
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listTables() {
  const { data, error } = await supabase.from('parties').select('*').limit(1)
  if (!error) console.log('Parties found')
  
  const { data: d2, error: e2 } = await supabase.from('pending_parties').select('*').limit(1)
  if (!e2) console.log('Pending_parties found')

  // Try some other common names
  const { error: e3 } = await supabase.from('posts').select('*').limit(1)
  if (!e3) console.log('Posts found')

  const { error: e4 } = await supabase.from('posters').select('*').limit(1)
  if (!e4) console.log('Posters found')
}

listTables()
