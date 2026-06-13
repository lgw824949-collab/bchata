import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkBootcampsTable() {
  const { data, error } = await supabase.from('bootcamps').select('*').limit(1)
  if (error) {
    console.log('Error or table does not exist:', error.message)
  } else {
    console.log('Table exists. Sample data:', data)
    // Try to get columns by selecting one row
    if (data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
    }
  }
}

checkBootcampsTable()
