const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function countByDate() {
  const { data, error } = await supabase
    .from('parties')
    .select('date');
    
  if (error) console.error('Error:', error);
  else {
    const counts = {};
    data.forEach(p => {
      counts[p.date] = (counts[p.date] || 0) + 1;
    });
    console.log('Parties count by date:', counts);
  }
}

countByDate();
