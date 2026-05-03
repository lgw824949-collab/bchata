import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // 1. Supabase 클라이언트 초기화 (Service Role Key 사용으로 모든 권한 허용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. 오늘 날짜 설정 (KST 기준 YYYY-MM-DD)
    const now = new Date()
    const kstOffset = 9 * 60 * 60 * 1000
    const today = new Date(now.getTime() + kstOffset).toISOString().split('T')[0]
    
    // 30일 전 날짜 계산
    const thirtyDaysAgoDate = new Date(now.getTime() + kstOffset - (30 * 24 * 60 * 60 * 1000))
    const thirtyDaysAgo = thirtyDaysAgoDate.toISOString().split('T')[0]

    console.log(`[Cleanup Process Start] Target Date (Today): ${today}, Deletion Threshold: ${thirtyDaysAgo}`)

    // 3. 만료 처리 (Hide): start_date < 오늘 AND status = 'approved' -> 'expired'
    const { count: expiredCount, error: expireError } = await supabase
      .from('classes_info')
      .update({ status: 'expired' })
      .lt('start_date', today)
      .eq('status', 'approved')
      .select('id', { count: 'exact', head: true })

    if (expireError) throw expireError

    // 4. 삭제 처리 (Delete): start_date < 오늘 - 30일 AND status = 'expired' -> DB 삭제
    const { count: deletedCount, error: deleteError } = await supabase
      .from('classes_info')
      .delete({ count: 'exact' })
      .lt('start_date', thirtyDaysAgo)
      .eq('status', 'expired')

    if (deleteError) throw deleteError

    // 5. 결과 로그 출력 및 응답
    const result = {
      message: "Cleanup process completed successfully",
      expired_count: expiredCount ?? 0,
      deleted_count: deletedCount ?? 0,
      processed_at: new Date().toISOString()
    }

    console.log(`[Cleanup Result] Expired: ${result.expired_count}, Deleted: ${result.deleted_count}`)

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error(`[Cleanup Error] ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
