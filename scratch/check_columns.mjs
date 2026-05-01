import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://biwziyyklaycbjrnitem.supabase.co',
  'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
);

async function checkColumns() {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in parties:', Object.keys(data[0]));
  } else {
    console.log('No data in parties to check columns.');
  }
  
  const { data: pData, error: pError } = await supabase
    .from('pending_parties')
    .select('*')
    .limit(1);
    
  if (!pError && pData && pData.length > 0) {
    console.log('Columns in pending_parties:', Object.keys(pData[0]));
  }
}

checkColumns();
