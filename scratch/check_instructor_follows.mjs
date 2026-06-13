
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  console.log('Checking for instructor_follows table...');
  const { error } = await supabase.from('instructor_follows').select('*').limit(1);
  if (error) {
    if (error.code === '42P01') {
      console.log('Table instructor_follows does not exist.');
    } else {
      console.log('Error checking table:', error.message);
    }
  } else {
    console.log('Table instructor_follows exists.');
  }
}

checkTable();
