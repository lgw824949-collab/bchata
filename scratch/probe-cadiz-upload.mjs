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

const env = {
  ...parseEnvFile('.env'),
  ...parseEnvFile('.env.local'),
  ...parseEnvFile('.env.production.local'),
}

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(url, key)

const buckets = await supabase.storage.listBuckets()
process.stdout.write(`buckets: ${JSON.stringify(buckets)}\n`)

const cadiz = await supabase.from('social_bars').select('id,name,logo_url').eq('name', '카디즈')
process.stdout.write(`cadiz: ${JSON.stringify(cadiz)}\n`)

const list = await supabase.storage.from('bar-logos').list('', { limit: 10 })
process.stdout.write(`bar-logos list: ${JSON.stringify(list)}\n`)
