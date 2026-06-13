const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const env = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8')
const envMap = {}
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) envMap[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1')
})

const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY)

async function checkSchema() {
  console.log('Trying simple select on parties')
  const { data: parties, error: pError } = await supabase.from('parties').select('*').limit(1)
  if (pError) console.error('Error fetching parties:', pError)
  else if (parties && parties.length > 0) console.log('Columns in parties:', Object.keys(parties[0]))
  else console.log('Parties table is empty or data is null')

  console.log('\nTrying simple select on pending_parties')
  const { data: pending, error: pendError } = await supabase.from('pending_parties').select('*').limit(1)
  if (pendError) console.error('Error fetching pending_parties:', pendError)
  else if (pending && pending.length > 0) console.log('Columns in pending_parties:', Object.keys(pending[0]))
  else console.log('Pending_parties table is empty or data is null')
}

checkSchema()
