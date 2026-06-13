const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTodayClasses() {
  const today = '2026-04-25';
  console.log(`Checking classes for ${today}...`);
  
  const { data, error } = await supabase
    .from('classes_info')
    .select('*')
    .eq('start_date', today);
    
  if (error) console.error('Error fetching classes:', error);
  else console.log(`Found ${data.length} classes for today.`);
}

checkTodayClasses();
