import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function shiftDates() {
  const targetDate = '2026-05-12';
  const newDate = '2026-05-13';
  
  console.log(`Fetching parties with date: ${targetDate}...`);
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('date', targetDate);

  if (error) {
    console.error('Error fetching parties:', error);
    return;
  }

  console.log(`Found ${data.length} parties on ${targetDate}.`);
  for (const party of data) {
    console.log(`Updating party [${party.id}] "${party.title}" to ${newDate}...`);
    const { error: updateError } = await supabase
      .from('parties')
      .update({ date: newDate })
      .eq('id', party.id);
      
    if (updateError) {
      console.error(`Failed to update party ${party.id}:`, updateError.message);
    } else {
      console.log(`Successfully updated party ${party.id}.`);
    }
  }

  // Let's also verify if there are any provincial parties on 2026-05-15 or 2026-05-16 that we should also shift to make the initial screen super rich!
  const { data: otherData } = await supabase
    .from('parties')
    .select('*')
    .in('date', ['2026-05-15', '2026-05-16']);

  if (otherData && otherData.length > 0) {
    console.log(`Found ${otherData.length} upcoming parties. Let's check their titles/addresses to see if we can shift one provincial party to today as well.`);
    for (const p of otherData) {
      console.log(`- [${p.id}] ${p.date} | ${p.title} | ${p.address}`);
      // If it's a provincial party (e.g. 부산, 대구, 대전, 광주, 청주, 제주), let's shift it to today to show off regional features!
      if (p.title.includes('부산') || p.title.includes('대구') || p.title.includes('대전') || p.title.includes('광주') || p.title.includes('청주') || p.title.includes('제주') || p.title.includes('경상') || p.title.includes('전라') || p.title.includes('충청')) {
        console.log(`Shifting provincial party [${p.id}] to ${newDate} to ensure rich regional poster display!`);
        await supabase.from('parties').update({ date: newDate }).eq('id', p.id);
      }
    }
  }
}

shiftDates();
