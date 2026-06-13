import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listPosters() {
  const { data, error } = await supabase
    .from('parties')
    .select('id, title, poster_url, date')
    .not('poster_url', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const uniqueUrls = new Set();
  data.forEach(p => {
    if (p.poster_url && p.poster_url.trim() !== '') {
      uniqueUrls.add(p.poster_url);
    }
  });

  console.log(`Found ${uniqueUrls.size} distinct poster URLs in the database:`);
  Array.from(uniqueUrls).slice(0, 20).forEach((url, idx) => {
    console.log(`[${idx + 1}] ${url}`);
  });
}

listPosters();
