const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('classes_info')
    .select('*')
    .limit(1);
    
  if (error) console.error('Error:', error);
  else console.log('Columns in classes_info:', Object.keys(data[0]));
}

checkSchema();
