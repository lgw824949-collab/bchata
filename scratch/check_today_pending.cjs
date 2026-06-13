const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPending() {
  const today = '2026-04-25';
  console.log(`Checking pending_parties for ${today}...`);
  
  const { data, error } = await supabase
    .from('pending_parties')
    .select('*')
    .eq('date', today);
    
  if (error) console.error('Error:', error);
  else console.log(`Found ${data.length} pending parties for today.`);
}

checkPending();
