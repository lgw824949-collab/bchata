import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
// Manually parse .env file
const envFile = fs.readFileSync('.env', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) env[key.trim()] = value.trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function addLocation() {
  const { data, error } = await supabase
    .from('locations')
    .insert([
      { 
        name: '루에다', 
        address: '부산광역시 부산진구 신천대로62번길 42 2층', 
        region_id: 'fddea3cc-8551-47b1-a822-f8aa0286a6db' // 경상도
      }
    ])
    .select()

  if (error) {
    console.error('Error inserting location:', error)
  } else {
    console.log('Location inserted successfully:', data)
  }
}

addLocation()
