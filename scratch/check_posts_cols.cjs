const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://biwziyyklaycbjrnitem.supabase.co',
  'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
);

async function check() {
  const { data, error } = await supabase.from('instructor_posts').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}

check();
