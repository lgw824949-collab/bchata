import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  const sql = `
    ALTER TABLE locations 
    ADD COLUMN IF NOT EXISTS image_url text,
    ADD COLUMN IF NOT EXISTS kakao_url text,
    ADD COLUMN IF NOT EXISTS instagram_url text;
  `;

  console.log('Trying to add columns using rpc...');
  
  // Try calling common SQL execution RPC functions
  const rpcNames = ['exec_sql', 'run_sql', 'execute_sql', 'sql'];
  let success = false;

  for (const name of rpcNames) {
    console.log(`Trying rpc('${name}')...`);
    const { data, error } = await supabase.rpc(name, { query: sql });
    if (!error) {
      console.log(`Successfully executed SQL via rpc('${name}') with param query!`);
      success = true;
      break;
    }
    const { data: d2, error: e2 } = await supabase.rpc(name, { sql: sql });
    if (!e2) {
      console.log(`Successfully executed SQL via rpc('${name}') with param sql!`);
      success = true;
      break;
    }
    const { data: d3, error: e3 } = await supabase.rpc(name, { sql_string: sql });
    if (!e3) {
      console.log(`Successfully executed SQL via rpc('${name}') with param sql_string!`);
      success = true;
      break;
    }
  }

  if (!success) {
    console.log('RPC execution failed or function does not exist. Checking if columns already exist by fetching a row...');
  }

  // Let's test if the columns exist by selecting them
  const { data: locData, error: locError } = await supabase
    .from('locations')
    .select('id, name, image_url, kakao_url, instagram_url')
    .limit(1);

  if (locError) {
    console.log('Columns test check returned error:', locError.message);
  } else {
    console.log('SUCCESS: The columns image_url, kakao_url, instagram_url are present and selectable in the locations table!');
    console.log('Sample row:', locData[0]);
  }
}

addColumns();
