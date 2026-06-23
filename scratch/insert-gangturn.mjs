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

const SEOUL_REGION_ID = '824d39e2-3f22-4749-9fae-5f69a59478e8'
const ADDRESS = '서울특별시 강남구 역삼로3길 17-5 (역삼동), 삼영빌딩 지하 1층'

const existing = await supabase
  .from('locations')
  .select('id, name, address')
  .eq('name', '강남턴')

if (existing.error) {
  process.stderr.write(`${existing.error.message}\n`)
  process.exit(1)
}

if (existing.data?.length) {
  process.stdout.write(`${JSON.stringify({ ok: true, skipped: true, rows: existing.data })}\n`)
  process.exit(0)
}

const payload = {
  name: '강남턴',
  address: ADDRESS,
  region_id: SEOUL_REGION_ID,
  latitude: 37.4975,
  longitude: 127.0358,
  view_count: 0,
  description: null,
  kakao_url: null,
  instagram_url: null,
  image_url: null,
}

const result = await supabase.from('locations').insert([payload]).select('*')
if (result.error) {
  process.stderr.write(`${result.error.message}\n`)
  process.exit(1)
}

process.stdout.write(`${JSON.stringify({ ok: true, inserted: result.data })}\n`)
