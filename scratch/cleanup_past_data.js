
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function cleanup() {
  const now = new Date()
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000))
  const today = kst.toISOString().split('T')[0]

  console.log(`[시작] ${today} 이전의 과거 데이터 삭제 중...`)

  // 1. 삭제 대상 조회 (공식 파티 & 대기 파티 전체)
  const [partiesRes, pendingRes] = await Promise.all([
    supabase.from('parties').select('id, poster_url').lt('date', today),
    supabase.from('pending_parties').select('id, poster_url').lt('date', today)
  ])

  const allTargets = [...(partiesRes.data || []), ...(pendingRes.data || [])]
  if (allTargets.length === 0) {
    console.log('[완료] 삭제할 과거 데이터가 없습니다.')
    return
  }

  // 2. 스토리지 파일 경로 추출
  const filePaths = allTargets
    .map(item => item.poster_url)
    .filter(url => url && url.includes('/public/posters/'))
    .map(url => url.split('/public/posters/')[1])

  // 3. 파일 서비스 삭제
  if (filePaths.length > 0) {
    console.log(`[Storage] ${filePaths.length}개의 포스터 파일 삭제 중...`)
    const { error: storageError } = await supabase.storage.from('posters').remove(filePaths)
    if (storageError) console.error('파일 삭제 실패:', storageError)
  }

  // 4. DB 레코드 삭제
  console.log(`[DB] ${allTargets.length}개의 데이터 행 삭제 중...`)
  await Promise.all([
    supabase.from('parties').delete().lt('date', today),
    supabase.from('pending_parties').delete().lt('date', today)
  ])

  console.log('[완료] 모든 과거 데이터 정리가 끝났습니다.')
}

cleanup()
