
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyRLS() {
  const sql = `
    -- instructor_follows RLS 정책 확인 및 추가
    ALTER TABLE instructor_follows ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can read follows" ON instructor_follows;
    CREATE POLICY "Anyone can read follows" ON instructor_follows
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Anyone can insert follows" ON instructor_follows;
    CREATE POLICY "Anyone can insert follows" ON instructor_follows
      FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Anyone can delete follows" ON instructor_follows;
    CREATE POLICY "Anyone can delete follows" ON instructor_follows
      FOR DELETE USING (true);
  `;

  console.log('Applying RLS policies to instructor_follows...');
  
  // Try to use exec_sql RPC which seems to be available in this project's Supabase setup
  const { data, error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('Error applying RLS policies:', error.message);
    if (error.message.includes('does not exist')) {
        console.log('Note: The table "instructor_follows" might not exist yet.');
    }
  } else {
    console.log('Successfully applied RLS policies:', data);
  }
}

applyRLS();
