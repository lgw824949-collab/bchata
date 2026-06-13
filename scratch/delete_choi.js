
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteInstructor() {
  console.log('Searching for instructor: 최원우');
  
  const { data, error: findError } = await supabase
    .from('instructors')
    .select('id, name')
    .eq('name', '최원우');

  if (findError) {
    console.error('Error finding instructor:', findError);
    return;
  }

  if (!data || data.length === 0) {
    console.log('Instructor "최원우" not found in the database.');
    return;
  }

  console.log(`Found ${data.length} records. Deleting...`);

  for (const inst of data) {
    const { error: deleteError } = await supabase
      .from('instructors')
      .delete()
      .eq('id', inst.id);

    if (deleteError) {
      console.error(`Error deleting ID ${inst.id}:`, deleteError);
    } else {
      console.log(`Successfully deleted ID ${inst.id} (${inst.name})`);
    }
  }
}

deleteInstructor();
