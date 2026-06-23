const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('classes_info').select('*').limit(1);
  if (error) {
    console.error('Error fetching classes_info:', error);
  } else {
    console.log('Columns in classes_info:', Object.keys(data[0] || {}));
  }
}

checkSchema();
