
const { createClient } = require('@supabase/supabase-js');

const URL = 'https://biwziyyklaycbjrnitem.supabase.co';
const KEY = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(URL, KEY);

async function runFix() {
  console.log('--- STARTING FINAL DB FIX ---');
  const sql = `
    ALTER TABLE classes_news DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Full Access" ON classes_news;
    CREATE POLICY "Public Full Access" ON classes_news FOR ALL USING (true);
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('CRITICAL ERROR:', error);
  } else {
    console.log('SUCCESS! Database policy has been disabled and opened.');
    console.log('Data:', data);
  }
}

runFix();
