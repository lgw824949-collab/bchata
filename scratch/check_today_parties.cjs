const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTodayParties() {
  console.log('Checking parties for May 10, 2026 with full details...');
  
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('date', '2026-05-10')
    .order('created_at', { ascending: false });
    
  if (error) console.error('Error:', error);
  else {
    console.log(`Found ${data.length} parties.`);
    data.forEach(p => {
      console.log(`ID: ${p.id}`);
      console.log(`Title: ${p.title}`);
      console.log(`Address: ${p.address}`);
      console.log(`LocationID: ${p.location_id}`);
      console.log(`LocationName: ${p.locationName || p.location_name}`);
      console.log(`Poster: ${p.poster_url}`);
      console.log(`Status: ${p.status}`);
      console.log('---');
    });
  }
}

checkTodayParties();
