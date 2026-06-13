import fs from 'fs'

for (const f of ['.env', '.env.local', '.env.production.local']) {
  if (!fs.existsSync(f)) continue
  const raw = fs.readFileSync(f)
  const text = raw.toString('utf8')
  process.stdout.write(`\n${f} bytes=${raw.length}\n`)
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    process.stdout.write(`${t.slice(0, i).trim()}\n`)
  }
}
