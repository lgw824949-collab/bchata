import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co'
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const testId = Date.now().toString(); // Maybe it's a UUID? Let's not provide ID to auto-generate it.
  const { data: inserted, error: insertError } = await supabase.from('classes_info').insert([{
    title: 'test item',
    status: 'pending',
    category_type: 'club'
  }]).select('*');
  
  if (insertError) {
    console.log('Insert Error:', insertError);
    return;
  }
  
  console.log('Inserted:', inserted);
  
  const id = inserted[0].id;
  
  const { data: updated, error: updateError } = await supabase.from('classes_info').update({ status: 'active' }).eq('id', id).select('*');
  console.log('Update Error:', updateError);
  console.log('Updated Data:', updated);
  
  // Clean up
  await supabase.from('classes_info').delete().eq('id', id);
}

test();
