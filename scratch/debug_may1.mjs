import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://biwziyyklaycbjrnitem.supabase.co',
  'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
);

async function checkParties() {
  const date = '2026-05-01';
  const { data, error } = await supabase
    .from('parties')
    .select('*, locations(*, regions(*))')
    .eq('date', date);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Parties for ${date}:`, data.length);
  data.forEach(p => {
    const loc = Array.isArray(p.locations) ? p.locations[0] : p.locations;
    const reg = loc?.regions ? (Array.isArray(loc.regions) ? loc.regions[0] : loc.regions) : null;
    console.log(`- Title: ${p.title}, Genre: ${p.genre}, Region: ${reg?.name}, City: ${p.cityName}`);
  });
}

checkParties();
