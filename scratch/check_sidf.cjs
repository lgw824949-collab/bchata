const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSIDF() {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .ilike('title', '%SIDF%');
    
  if (error) console.error('Error:', error);
  else console.log(`Found ${data.length} SIDF parties.`);
}

checkSIDF();
