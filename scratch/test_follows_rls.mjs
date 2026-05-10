
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
  const dummySession = 'test-session-' + Math.random();
  const dummyInstructor = 'f0f75798-fb89-4fce-af8b-595598fdd4e3';

  console.log('Testing RLS policies on instructor_follows...');

  // 1. Test Insert
  console.log('Attempting to insert a dummy follow...');
  const { error: insertError } = await supabase
    .from('instructor_follows')
    .insert({ instructor_id: dummyInstructor, user_session: dummySession });

  if (insertError) {
    console.log('Insert failed:', insertError.message);
  } else {
    console.log('Insert successful!');
  }

  // 2. Test Select
  console.log('Attempting to select follows...');
  const { data, error: selectError } = await supabase
    .from('instructor_follows')
    .select('*')
    .eq('user_session', dummySession);

  if (selectError) {
    console.log('Select failed:', selectError.message);
  } else {
    console.log('Select successful, found:', data.length, 'records');
  }

  // 3. Test Delete
  console.log('Attempting to delete the dummy follow...');
  const { error: deleteError } = await supabase
    .from('instructor_follows')
    .delete()
    .eq('user_session', dummySession);

  if (deleteError) {
    console.log('Delete failed:', deleteError.message);
  } else {
    console.log('Delete successful!');
  }
}

testRLS();
