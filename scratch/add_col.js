import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addColumn() {
  console.log('Adding column schedule_poster_url...');
  // We can't directly execute DDL via standard supabase client, but we can try an RPC or just hope it's not needed, or maybe it's saved in `description` as a JSON string?
  // Let's check if the user has an RPC.
  const { data, error } = await supabase.rpc('add_schedule_poster_column');
  console.log('RPC result:', error || data);
}

addColumn()
