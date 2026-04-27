const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPastSaturdays() {
  const pastSaturday = '2026-04-18';
  console.log(`Checking parties for ${pastSaturday}...`);
  
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('date', pastSaturday);
    
  if (error) console.error('Error fetching parties:', error);
  else {
    console.log(`Found ${data.length} parties for ${pastSaturday}.`);
    data.forEach(p => {
      console.log(`${p.title} | ${p.time} | ${p.location_id}`);
    });
  }
}

checkPastSaturdays();
