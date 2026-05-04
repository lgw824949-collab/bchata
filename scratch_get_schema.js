import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getSchema() {
  console.log('--- instructors schema ---')
  const { data: inst, error: instErr } = await supabase.from('instructors').select('*')
  if (!instErr) {
    console.log(JSON.stringify(inst, null, 2))
  } else {
    console.log('Error fetching instructor:', instErr.message)
  }

  console.log('--- classes_info schema ---')
  const { data: cls, error: clsErr } = await supabase.from('classes_info').select('*').limit(1).single()
  if (!clsErr) {
    console.log(JSON.stringify(cls, null, 2))
  } else {
    console.log('Error fetching class:', clsErr.message)
  }
}

getSchema()
