import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    // Query one row to see all column names
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching locations:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
      console.log('Sample data:', data[0]);
    } else {
      console.log('No data found in locations table.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTableStructure();
