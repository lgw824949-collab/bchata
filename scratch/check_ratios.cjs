const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load .env
const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf8');
const config = {};
env.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) config[key.trim()] = value.trim();
});

const supabase = createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('parties').select('id, title, s_ratio, b_ratio, j_ratio, k_ratio').limit(10);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

check();
