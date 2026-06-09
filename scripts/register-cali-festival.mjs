import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const POSTER_CANDIDATES = [
  path.join(process.cwd(), 'public', 'cali-9th-party.png'),
  path.join(process.cwd(), 'public', 'home-gate-party.jpg'),
  path.resolve(
    'C:/Users/^^/.cursor/projects/c-dev-bchata/assets/c__Users____AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_KakaoTalk_20260607_134417887-f1f6aa08-7a8c-4722-b62c-84ae7667243d.png',
  ),
]

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

const env = {
  ...parseEnvFile(path.join(process.cwd(), '.env')),
  ...parseEnvFile(path.join(process.cwd(), '.env.local')),
}

const url = pick(env.VITE_SUPABASE_URL, env.SUPABASE_URL)
const key = pick(env.SUPABASE_SERVICE_ROLE_KEY, env.VITE_SUPABASE_ANON_KEY)

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / key in .env or .env.local')
  process.exit(1)
}

const posterPath = POSTER_CANDIDATES.find((p) => fs.existsSync(p))

if (!fs.existsSync(posterPath)) {
  console.error('Poster file not found:', posterPath)
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const EXISTING_ID = '431bde0e-b2a9-460e-8fcb-6f434bf89648'

const payload = {
  title: '칼리9주년 파티',
  organizer: '고양시라틴댄스협회',
  genre: '바차타, 살사',
  start_date: '2026-06-13',
  end_date: '2026-06-13',
  region: '경인',
  location: '칼리 · 경기도 고양시 일산동구 고봉로 20-5, 5층',
  price: '파티비 10,000원',
  bank_info: '농협 351-127252-1793 (고양시라틴댄스협회)',
  event_type: 'party',
  description: [
    '2026년 6월 13일(토) 19:00–01:00',
    '',
    '▶ 오픈클래스 19:00–20:00 · 카푸치노&리키 센슈얼바차타',
    '▶ 소셜댄싱 20:00–01:00',
    '▶ 뒷풀이 24:00~ (별도 안내)',
    '',
    '음악 비율: 살사 3 : 바차타 3 · 라인댄스: 쿠바쿠바',
    '공연: 니르바나&썬 / 카푸치노&리키 / 윤우조 맘보샤인 · DJ ACE',
    '',
    '김밥·과일·튀김·음료 제공 (주류 미제공)',
    '클럽리더·시샵·BAR 사장님 초대',
    '문의: 시샵 짱미 010-9133-1398',
  ].join('\n'),
}

async function main() {
  const fileName = `cali-9th-${Date.now()}.png`
  const filePath = `festivals/${fileName}`
  const bytes = fs.readFileSync(posterPath)

  const { error: uploadError } = await supabase.storage
    .from('posters')
    .upload(filePath, bytes, { contentType: 'image/png', upsert: true })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('posters').getPublicUrl(filePath)
  payload.poster_url = urlData.publicUrl

  const { data: existing } = await supabase
    .from('festivals')
    .select('id')
    .eq('id', EXISTING_ID)
    .maybeSingle()

  let result
  if (existing?.id) {
    const { data: current } = await supabase
      .from('festivals')
      .select('status')
      .eq('id', EXISTING_ID)
      .maybeSingle()
    const updatePayload = { ...payload, poster_url: payload.poster_url }
    if (current?.status) updatePayload.status = current.status
    result = await supabase.from('festivals').update(updatePayload).eq('id', EXISTING_ID).select().maybeSingle()
  } else {
    payload.status = 'pending'
    const { data: byTitle } = await supabase
      .from('festivals')
      .select('id')
      .ilike('title', '%칼리9%')
      .maybeSingle()
    if (byTitle?.id) {
      const { data: current } = await supabase
        .from('festivals')
        .select('status')
        .eq('id', byTitle.id)
        .maybeSingle()
      const updatePayload = { ...payload, poster_url: payload.poster_url }
      if (current?.status) updatePayload.status = current.status
      result = await supabase.from('festivals').update(updatePayload).eq('id', byTitle.id).select().maybeSingle()
    } else {
      result = await supabase.from('festivals').insert([{ ...payload, status: 'pending' }]).select().maybeSingle()
    }
  }

  if (result.error) throw result.error
  console.log(JSON.stringify({ ok: true, festival: result.data }, null, 2))
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
