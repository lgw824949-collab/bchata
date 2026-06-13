import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing from environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkParties() {
  const { data, error } = await supabase
    .from('parties')
    .select('id, title, status')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.table(data);
  }
}

checkParties();
