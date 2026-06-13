import { createClient } from '@supabase/supabase-js'

const url = 'https://biwziyyklaycbjrnitem.supabase.co'
const key = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(url, key)

async function cleanup() {
  console.log('Cleaning up tables...')
  const { error: err1 } = await supabase.from('parties').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (err1) console.error('Error cleaning parties:', err1)
  
  const { error: err2 } = await supabase.from('pending_parties').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (err2) console.error('Error cleaning pending_parties:', err2)
  
  console.log('Cleanup finished.')
}

cleanup()
