const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkToday() {
  const today = '2026-04-25';
  console.log(`Checking data for ${today}...`);
  
  const { data: parties, error: pError } = await supabase
    .from('parties')
    .select('*')
    .eq('date', today);
    
  if (pError) console.error('Error fetching parties:', pError);
  else console.log(`Found ${parties.length} parties for today.`);

  const { data: classes, error: cError } = await supabase
    .from('classes_info')
    .select('*')
    .eq('date', today);
    
  if (cError) console.error('Error fetching classes:', cError);
  else console.log(`Found ${classes.length} classes for today.`);

  if (parties && parties.length > 0) {
    console.log('Sample party:', parties[0]);
  }
}

checkToday();
