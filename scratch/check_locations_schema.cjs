
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error('Could not find Supabase credentials in .env.local');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocations() {
  const { data, error } = await supabase.from('locations').select('*').limit(1);
  if (error) {
    console.error('Error fetching locations:', error);
  } else {
    console.log('Columns in locations:', Object.keys(data[0] || {}));
    console.log('Sample data:', data[0]);
  }
}

checkLocations();
