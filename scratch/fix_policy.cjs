
require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixPolicy() {
  console.log('Fixing classes_news policy...');
  // exec_sql RPC가 정의되어 있다고 가정하거나, 기존 정책을 덮어쓰는 대체 로직 시도
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql: 'ALTER TABLE classes_news ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Public Full Access" ON classes_news; CREATE POLICY "Public Full Access" ON classes_news FOR ALL USING (true);' 
  });
  
  if (error) console.error('Policy Fix Error:', error);
  else console.log('Policy Fix Success:', data);
}

fixPolicy();
