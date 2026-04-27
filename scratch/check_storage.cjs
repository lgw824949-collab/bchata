const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorage() {
  console.log('Listing files in posters bucket...');
  const { data, error } = await supabase.storage.from('posters').list('posters', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  });
  
  if (error) console.error('Error:', error);
  else {
    console.log(`Found ${data.length} files.`);
    data.forEach(f => {
      console.log(`${f.created_at} | ${f.name}`);
    });
  }
}

checkStorage();
