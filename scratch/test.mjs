import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data: d2 } = await supabase.from('classes_info').select('*').eq('status', 'pending').limit(1);
  console.log('Pending Class:', d2);
  
  if (d2 && d2.length > 0) {
    const item = d2[0];
    const { error } = await supabase.from('classes_info').update({ status: 'active' }).eq('id', item.id)
    console.log('Update Error:', error);
  }
}

test();
