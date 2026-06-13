const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env from .env file manually
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('parties').select('*').limit(1);
  if (error) {
    console.error(error);
    return;
  }
  console.log('Columns:', Object.keys(data[0] || {}));
}

check();
