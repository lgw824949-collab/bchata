const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://biwziyyklaycbjrnitem.supabase.co',
  'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
);

async function resetCounts() {
  console.log('Resetting all instructor counts to 0...');
  const { error } = await supabase
    .from('instructors')
    .update({ follower_count: 0, likes_count: 0 })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to bypass "requires WHERE clause"
  
  if (error) {
    console.error('Reset Error:', error);
  } else {
    console.log('Successfully reset all counts to 0!');
  }
}

resetCounts();
