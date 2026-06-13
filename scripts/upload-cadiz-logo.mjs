import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 1) continue
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function pick(...vals) {
  for (const v of vals) {
    const s = String(v ?? '').trim()
    if (s) return s
  }
  return ''
}

const cwd = process.cwd()
const env = {
  ...parseEnvFile(path.join(cwd, '.env')),
  ...parseEnvFile(path.join(cwd, '.env.local')),
  ...parseEnvFile(path.join(cwd, '.env.production.local')),
}

const url = pick(env.VITE_SUPABASE_URL, env.SUPABASE_URL)
const key = pick(env.SUPABASE_SERVICE_ROLE_KEY, env.VITE_SUPABASE_ANON_KEY)

if (!url || !key) {
  process.stderr.write('Missing Supabase URL or key\n')
  process.exit(1)
}

const logoPath = path.join(cwd, 'public', 'cadiz_logo.png')
if (!fs.existsSync(logoPath)) {
  process.stderr.write(`Missing file: ${logoPath}\n`)
  process.exit(1)
}

const BUCKET = 'bar-logos'
const STORAGE_PATH = 'cadiz_logo.png'

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function ensureBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw listError
  if (buckets?.some((b) => b.name === BUCKET)) return
  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true })
  if (createError) throw createError
}

async function main() {
  await ensureBucket()

  const bytes = fs.readFileSync(logoPath)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(STORAGE_PATH, bytes, { contentType: 'image/png', upsert: true })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(STORAGE_PATH)
  const publicUrl = urlData.publicUrl

  const { data: updated, error: updateError } = await supabase
    .from('social_bars')
    .update({ logo_url: publicUrl })
    .eq('name', '카디즈')
    .select('id, name, logo_url')

  if (updateError) throw updateError
  if (!updated?.length) {
    throw new Error("No row updated for name '카디즈' in social_bars")
  }

  process.stdout.write(`${JSON.stringify({ ok: true, publicUrl, rows: updated })}\n`)
}

main().catch((err) => {
  process.stderr.write(`${err?.message || err}\n`)
  process.exit(1)
})
