const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findGavin() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .ilike('name', '%가빈%');
    
  if (error) console.error('Error:', error);
  else console.log('Found Locations:', data);
}

findGavin();
