const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTrafficSchema() {
  const { data, error } = await supabase
    .from('app_traffic_logs')
    .select('*')
    .limit(1);
    
  if (error) console.error('Error:', error);
  else if (data.length > 0) console.log('Columns in app_traffic_logs:', Object.keys(data[0]));
  else console.log('app_traffic_logs is empty');
}

checkTrafficSchema();
