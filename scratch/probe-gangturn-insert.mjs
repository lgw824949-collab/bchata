import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 1) continue
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const env = { ...parseEnvFile('.env'), ...parseEnvFile('.env.production.local') }
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const regions = await supabase.from('regions').select('id, name')
process.stdout.write(`regions: ${JSON.stringify(regions)}\n`)

const seoulSample = await supabase.from('locations').select('*').ilike('address', '%서울%').limit(2)
process.stdout.write(`seoul samples: ${JSON.stringify(seoulSample)}\n`)

const gang = await supabase.from('locations').select('*').or('name.ilike.%강남턴%,name.ilike.%강턴%')
process.stdout.write(`gangturn: ${JSON.stringify(gang)}\n`)
