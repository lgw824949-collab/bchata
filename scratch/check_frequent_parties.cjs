const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function frequentBars() {
  const { data, error } = await supabase
    .from('parties')
    .select('title, location_id');
    
  if (error) console.error('Error:', error);
  else {
    const counts = {};
    data.forEach(p => {
      counts[p.title] = (counts[p.title] || 0) + 1;
    });
    console.log('Frequent Party Titles:', Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 20));
  }
}

frequentBars();
