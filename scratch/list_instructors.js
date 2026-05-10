
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listInstructors() {
  const { data, error } = await supabase
    .from('instructors')
    .select('id, name');

  if (error) {
    console.error('Error fetching instructors:', error);
    return;
  }

  console.log('--- Instructor List ---');
  data.forEach(i => console.log(`- ${i.name} (ID: ${i.id})`));
  console.log('-----------------------');
}

listInstructors();
