const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .or('name.ilike.%보니따%,name.ilike.%턴%,name.ilike.%부에나%');
    
  if (error) console.error('Error:', error);
  else console.log('Found Locations:', data);
}

findLocations();
