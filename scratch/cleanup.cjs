const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanup() {
  const { data, error } = await supabase
    .from('community_posts')
    .delete()
    .neq('id', 0);
  
  if (error) {
    console.error('Error deleting posts:', error);
  } else {
    console.log('Successfully deleted all community posts.');
  }
}

cleanup();
