import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkColumns() {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching parties:', error)
  } else {
    console.log('Parties table columns (from first row):', Object.keys(data[0] || {}))
  }
}

checkColumns()
