import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function queryRecentParties() {
  console.log('--- Recent 5 from pending_parties ---')
  const { data: pending, error: pendingErr } = await supabase
    .from('pending_parties')
    .select('date, title')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (pendingErr) {
    console.error('Pending Parties Error:', pendingErr.message)
  } else {
    console.table(pending)
  }

  console.log('\n--- Recent 5 from parties ---')
  const { data: parties, error: partiesErr } = await supabase
    .from('parties')
    .select('date, title')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (partiesErr) {
    console.error('Parties Error:', partiesErr.message)
  } else {
    console.table(parties)
  }
}

queryRecentParties()
