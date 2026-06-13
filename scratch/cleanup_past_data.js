import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanup() {
  const today = new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
  console.log('Today (KST):', today);

  const tables = ['parties', 'pending_parties', 'bootcamps', 'festivals'];
  
  for (const table of tables) {
    console.log(`Checking table: ${table}...`);
    
    // Some tables use 'date', some 'start_date'
    const dateCol = (table === 'bootcamps' || table === 'festivals') ? 'start_date' : 'date';
    
    const { data, error: countError } = await supabase
      .from(table)
      .select('id, ' + dateCol)
      .lt(dateCol, today);
      
    if (countError) {
      console.error(`Error checking ${table}:`, countError.message);
      continue;
    }
    
    if (data.length > 0) {
      console.log(`Found ${data.length} past items in ${table}. Deleting...`);
      const { error: delError } = await supabase
        .from(table)
        .delete()
        .lt(dateCol, today);
        
      if (delError) console.error(`Error deleting from ${table}:`, delError.message);
      else console.log(`Successfully cleaned ${table}.`);
    } else {
      console.log(`No past items found in ${table}.`);
    }
  }
}

cleanup();
