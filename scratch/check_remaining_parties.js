import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRemaining() {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .in('date', ['2026-05-23', '2026-05-25', '2026-05-29', '2026-06-19']);

  if (error) {
    console.error('Error fetching remaining parties:', error);
    return;
  }

  console.log(`Found ${data.length} remaining parties:`);
  for (const p of data) {
    console.log(`- [${p.id}] ${p.date} | ${p.title} | ${p.address}`);
  }
}

checkRemaining();
