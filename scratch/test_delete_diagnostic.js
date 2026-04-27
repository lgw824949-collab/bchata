
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testDelete() {
  console.log('--- Deletion Test ---')
  // 첫 번째 항목 가져오기
  const { data: items } = await supabase.from('classes_news').select('id, title').limit(1)
  
  if (!items || items.length === 0) {
    console.log('No items to delete.')
    return
  }

  const targetId = items[0].id
  const targetTitle = items[0].title
  console.log(`Trying to delete: ${targetTitle} (${targetId})`)

  const { error, count, status } = await supabase
    .from('classes_news')
    .delete({ count: 'exact' })
    .eq('id', targetId)

  if (error) {
    console.error('Delete Error:', error)
  } else {
    console.log('Delete Result:', { status, count })
    if (count === 0) {
      console.warn('SUCCESS status but NO rows were deleted. This is almost certainly an RLS Policy issue.')
    } else {
      console.log('SUCCESS: Row deleted.')
    }
  }
}

testDelete()
