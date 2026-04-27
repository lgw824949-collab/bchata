const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTrafficLogs() {
  console.log('Checking app_traffic_logs...');
  
  const { data, error } = await supabase
    .from('app_traffic_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (error) console.error('Error:', error);
  else {
    data.forEach(log => {
      console.log(`${log.created_at} | ${log.action} | ${JSON.stringify(log.metadata)}`);
    });
  }
}

checkTrafficLogs();
