
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepDeleteInstructor() {
  const targetName = '최현우';
  console.log(`Deep deleting instructor: ${targetName}`);
  
  const { data, error: findError } = await supabase
    .from('instructors')
    .select('id, name')
    .eq('name', targetName);

  if (findError) {
    console.error('Error finding instructor:', findError);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`Instructor "${targetName}" not found.`);
    return;
  }

  for (const inst of data) {
    const id = inst.id;
    console.log(`Cleaning up data for ${inst.name} (ID: ${id})...`);

    // 1. Delete Likes
    await supabase.from('instructor_likes').delete().eq('instructor_id', id);
    console.log('- Deleted likes');

    // 2. Delete Follows
    await supabase.from('instructor_follows').delete().eq('instructor_id', id);
    console.log('- Deleted follows');

    // 3. Delete Posts
    await supabase.from('instructor_posts').delete().eq('instructor_id', id);
    console.log('- Deleted posts');

    // 4. Finally Delete Instructor
    const { error: deleteError } = await supabase.from('instructors').delete().eq('id', id);

    if (deleteError) {
      console.error(`Error deleting instructor record:`, deleteError);
    } else {
      console.log(`Successfully deleted instructor: ${inst.name}`);
    }
  }
}

deepDeleteInstructor();
