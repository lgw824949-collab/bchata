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
const bytes = fs.readFileSync('public/Photo/cadiz_logo.png')

for (const bucket of ['bar-logos', 'posters']) {
  const path = bucket === 'posters' ? `bar-logos/cadiz_logo_${Date.now()}.png` : 'cadiz_logo.png'
  const r = await supabase.storage.from(bucket).upload(path, bytes, { contentType: 'image/png', upsert: true })
  process.stdout.write(`${bucket} upload: ${JSON.stringify(r)}\n`)
}
