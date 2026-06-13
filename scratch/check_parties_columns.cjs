const { createClient } = require('@supabase/supabase-client')
require('dotenv').config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'parties' })
  if (error) {
    // If RPC doesn't exist, try a simple select
    console.log('RPC failed, trying simple select')
    const { data: parties, error: pError } = await supabase.from('parties').select('*').limit(1)
    if (pError) console.error(pError)
    else console.log('Columns in parties:', Object.keys(parties[0]))
  } else {
    console.log('Columns in parties:', data)
  }
}

checkSchema()
