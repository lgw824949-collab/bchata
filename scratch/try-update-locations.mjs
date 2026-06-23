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

const testUrl = 'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/bar-logos/cadiz_logo_test.png'
const r = await supabase
  .from('locations')
  .update({ image_url: testUrl })
  .eq('name', '카디즈')
  .select('id,name,image_url')

process.stdout.write(JSON.stringify(r) + '\n')
