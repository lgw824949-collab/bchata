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

for (const table of ['locations', 'bars', 'social_bars', 'location_extras']) {
  const r = await supabase.from(table).select('*').ilike('name', '%카디%').limit(3)
  process.stdout.write(`${table}: ${JSON.stringify(r)}\n`)
}

const locCols = await supabase.from('locations').select('*').limit(1)
if (locCols.data?.[0]) process.stdout.write(`locations cols: ${Object.keys(locCols.data[0]).join(',')}\n`)
