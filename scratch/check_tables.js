
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkTables() {
  const { data, error } = await supabase.from('classes_news').select('count', { count: 'exact', head: true })
  if (error) {
    console.log('Error querying classes_news:', error.message)
    const { data: infoData, error: infoError } = await supabase.from('classes_info').select('count', { count: 'exact', head: true })
    if (infoError) {
      console.log('Error querying classes_info:', infoError.message)
    } else {
      console.log('classes_info table exists.')
    }
  } else {
    console.log('classes_news table exists.')
  }
}

checkTables()
