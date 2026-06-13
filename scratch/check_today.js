import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTodayParties() {
  const today = '2026-05-02';
  console.log(`Checking parties for date: ${today}`);
  
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('date', today);
    
  if (error) {
    console.error('Error fetching parties:', error);
    return;
  }
  
  console.log(`Found ${data.length} parties for today.`);
  data.forEach(p => {
    console.log(`- [${p.id}] ${p.title} at ${p.location_name} (broadRegion: ${p.broadRegion})`);
  });
}

checkTodayParties();
