import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTodayDetails() {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('date', '2026-05-13');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Today's parties (${data.length}):`);
  data.forEach((p, i) => {
    console.log(`[${i+1}] ID: ${p.id}`);
    console.log(`    Title: ${p.title}`);
    console.log(`    Address: ${p.address}`);
    console.log(`    Poster: ${p.poster_url}`);
    console.log('-----------------------------------');
  });
}

checkTodayDetails();
