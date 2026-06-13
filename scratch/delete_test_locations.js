import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTestRecords() {
  const idsToDelete = [
    'c2f38e06-3312-4c06-8ffb-6b5bddb791a9',
    '5fb3af27-9e95-448b-b652-9b5f13a475bb',
    '3caddfe0-59b4-4f4d-8e09-12ef68852d84',
    '34deb06d-0abe-449f-a559-f4b247aac80d'
  ];

  console.log('Deleting 4 target test records from locations table...');
  const { data: delData, error: delError } = await supabase
    .from('locations')
    .delete()
    .in('id', idsToDelete);

  if (delError) {
    console.error('Error deleting records:', delError.message);
  } else {
    console.log('Successfully executed delete query for target IDs.');
  }

  // Count remaining records
  const { count, error: countError } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting remaining records:', countError.message);
  } else {
    console.log(`\n삭제 완료. 남은 총 레코드 수: ${count}`);
  }
}

deleteTestRecords();
