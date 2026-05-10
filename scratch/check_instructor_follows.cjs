
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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
