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

const row = await supabase.from('festivals').select('*').limit(1).maybeSingle()
if (row.data) process.stdout.write(`cols: ${Object.keys(row.data).join(',')}\n`)

for (const col of ['price_poster_url', 'poster_urls', 'gallery_urls', 'extra_poster_url']) {
  const r = await supabase.from('festivals').select(`id, ${col}`).limit(1)
  process.stdout.write(`${col}: ${r.error ? r.error.message : 'ok'}\n`)
}
