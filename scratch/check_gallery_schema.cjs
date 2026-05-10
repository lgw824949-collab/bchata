const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://biwziyyklaycbjrnitem.supabase.co',
  'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
);

async function check() {
  // Attempt to select from a non-existent column to see if it errors with column names
  const { data, error } = await supabase.from('instructor_gallery').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    // If empty, try to get column names via PostgREST metadata if available
    console.log('Sample Data:', data);
  }
}

check();
