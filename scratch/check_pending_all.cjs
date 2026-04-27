const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPendingAll() {
  const { data, error } = await supabase
    .from('pending_parties')
    .select('*')
    .limit(10);
    
  if (error) console.error('Error:', error);
  else {
    console.log(`Sample pending_parties:`, data);
  }
}

checkPendingAll();
