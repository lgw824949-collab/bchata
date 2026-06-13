const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLogs() {
  console.log('Checking activity logs...');
  
  const { data, error } = await supabase
    .from('activity_logs')
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

checkLogs();
