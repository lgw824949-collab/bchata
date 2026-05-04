import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getTables() {
  const tables = [
    'activity_logs',
    'bar_checkins',
    'classes_info',
    'community_posts',
    'locations',
    'parties',
    'pending_parties',
    'regions',
    'instructors'
  ]

  console.log('| Table Name | Status |')
  console.log('| --- | --- |')
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true })
    if (!error) {
      console.log(`| ${table} | ✅ Exists |`)
    } else {
      console.log(`| ${table} | ❌ Error: ${error.message} |`)
    }
  }
}

getTables()
