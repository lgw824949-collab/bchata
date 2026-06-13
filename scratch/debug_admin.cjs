
const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
  console.log('--- Debugging Admin Privileges ---')
  
  // 1. Try to fetch one pending
  const { data: pending } = await supabase.from('pending_parties').select('*').limit(1)
  console.log('Pending sample:', pending)
  
  if (pending && pending[0]) {
    const pid = pending[0].id
    console.log(`Testing delete from pending_parties for ID: ${pid}`)
    const { error: dErr, status } = await supabase.from('pending_parties').delete().match({ id: pid })
    console.log('Delete result:', status, dErr)
  }
}

debug()
