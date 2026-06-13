const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://biwziyyklaycbjrnitem.supabase.co',
  'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
);

async function check() {
  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Recent Instructors:', JSON.stringify(data, null, 2));
  }
}

check();
