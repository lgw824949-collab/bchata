const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRecentParties() {
  console.log('Checking recent parties...');
  
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .gte('date', '2026-04-24')
    .lte('date', '2026-04-26')
    .order('date', { ascending: true });
    
  if (error) console.error('Error:', error);
  else {
    console.log(`Found ${data.length} parties.`);
    data.forEach(p => {
      console.log(`${p.date} | ${p.title} | ${p.id}`);
    });
  }
}

checkRecentParties();
