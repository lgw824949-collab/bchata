const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findSeoul() {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('name', '서울');
    
  if (error) console.error('Error:', error);
  else console.log('Found Regions:', data);
}

findSeoul();
