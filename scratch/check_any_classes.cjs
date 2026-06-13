const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAnyClasses() {
  const { data, error } = await supabase
    .from('classes_info')
    .select('count')
    .limit(1);
    
  if (error) console.error('Error:', error);
  else console.log(`Total classes in DB: ${data[0].count}`);
}

checkAnyClasses();
