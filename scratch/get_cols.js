
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const { data, error } = await supabase.from('pending_parties').insert([{ title: 'Temp' }]).select()
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Columns:', Object.keys(data[0]))
    await supabase.from('pending_parties').delete().eq('id', data[0].id)
  }
}

check()
