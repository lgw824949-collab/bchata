
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDelete() {
  const targetId = 'fc686bd8-d81a-4127-ae8c-00e27999d9ee'
  console.log(`Checking if record exists: ${targetId}`)
  
  const { data: fetchResult, error: fetchError } = await supabase
    .from('parties')
    .select('*')
    .eq('id', targetId)
    .single()
    
  if (fetchError) {
    console.log('Fetch Error:', fetchError)
    return
  }
  
  console.log('Record found:', fetchResult)
  
  console.log('Attempting delete...')
  const { data: deleteResult, error: deleteError, status, statusText } = await supabase
    .from('parties')
    .delete()
    .eq('id', targetId)
    .select()

  if (deleteError) {
    console.log('--- DELETE FAILED ---')
    console.log('Status:', status, statusText)
    console.log('Error Code:', deleteError.code)
    console.log('Message:', deleteError.message)
    console.log('Details:', deleteError.details)
    console.log('Hint:', deleteError.hint)
  } else {
    console.log('--- DELETE SUCCESSFUL ---')
    console.log('Result:', deleteResult)
  }
}

testDelete()
