import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTestPlace() {
  console.log("Deleting record where name is 'Test Place'...");
  const { data, error } = await supabase
    .from('locations')
    .delete()
    .eq('name', 'Test Place');

  if (error) {
    console.error('Error deleting Test Place:', error.message);
  } else {
    console.log('Successfully deleted Test Place record.');
  }
}

deleteTestPlace();
