
const { createClient } = require('@supabase/supabase-js');
const URL = 'https://biwziyyklaycbjrnitem.supabase.co';
const KEY = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(URL, KEY);

async function checkSchema() {
  console.log('--- Checking classes_news schema ---');
  const { data, error } = await supabase.from('classes_news').select('*').limit(1);
  if (error) {
    console.error('Schema Check Error:', error);
  } else {
    console.log('Sample Data Key Names:', Object.keys(data[0] || {}));
  }

  console.log('--- Testing nested query ---');
  const { error: queryError } = await supabase
    .from('classes_news')
    .select('*, locations(*)')
    .eq('status', 'active')
    .limit(1);
  
  if (queryError) console.error('Nested Query Error:', queryError);
  else console.log('Nested Query Success!');
}

checkSchema();
