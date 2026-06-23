import fs from 'fs'

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

const files = ['.env', '.env.local', '.env.production.local']
for (const f of files) {
  const e = parseEnvFile(f)
  for (const k of Object.keys(e).sort()) {
    if (/supabase|service|admin/i.test(k)) {
      process.stdout.write(`${f} ${k} len=${e[k]?.length || 0}\n`)
    }
  }
}
