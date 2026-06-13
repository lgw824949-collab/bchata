const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDeletionsV2() {
  console.log('Checking for deletions in app_traffic_logs...');
  
  const { data, error } = await supabase
    .from('app_traffic_logs')
    .select('*')
    .ilike('event_type', '%delete%')
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (error) console.error('Error:', error);
  else {
    console.log(`Found ${data.length} deletion logs.`);
    data.forEach(log => {
      console.log(`${log.created_at} | ${log.event_type} | ${log.visitor_id}`);
    });
  }
}

checkDeletionsV2();
