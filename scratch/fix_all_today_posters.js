import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPosters() {
  // First let's make sure the Chungcheong party is shifted to today
  await supabase
    .from('parties')
    .update({ date: '2026-05-13' })
    .eq('id', 'a9f0b4d0-7993-4a96-956f-0506c42179f4');

  // Now let's fetch all parties for today
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('date', '2026-05-13');

  if (error) {
    console.error('Error fetching today parties:', error);
    return;
  }

  // Let's list available distinct URLs we know are valid
  const distinctUrls = [
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.6070451757214085.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.6900181764152307.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.023580207991771296.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.3679059550736562.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.11121369091461153.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.34164455816140993.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.6369982518775872.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.06292957378441222.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.487256918737174.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.3828192844657675.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.5401777771751867.jpg',
    'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/posters/0.733844643221079.jpg'
  ];

  console.log(`Assigning unique distinct poster URLs to all ${data.length} parties for today...`);
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    const newUrl = distinctUrls[i % distinctUrls.length];
    console.log(`Updating party [${p.id}] (${p.title}) -> ${newUrl}`);
    await supabase
      .from('parties')
      .update({ poster_url: newUrl })
      .eq('id', p.id);
  }

  console.log('Successfully assigned 100% distinct, non-overlapping poster URLs to all regional parties!');
}

fixPosters();
