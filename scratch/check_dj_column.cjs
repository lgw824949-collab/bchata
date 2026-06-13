const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data, error } = await supabase.from('parties').select('dj_name').limit(1);
    if (error) {
      console.log('dj_name does not exist');
    } else {
      console.log('dj_name exists!');
    }
  } catch (e) {
    console.log('Error checking dj_name');
  }
}

check();
