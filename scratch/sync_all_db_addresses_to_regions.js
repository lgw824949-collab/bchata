import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAddressesAndRegions() {
  console.log('Fetching all approved parties to ensure strict address and region alignment...');
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('status', 'approved');

  if (error) {
    console.error('Error fetching parties:', error);
    return;
  }

  let updatedCount = 0;
  for (const p of data) {
    let targetAddress = p.address;
    let needsUpdate = false;

    // Standardize address based on title region prefix if there is a mismatch
    if (p.title?.includes('[서울]') && (!p.address || !p.address.includes('서울'))) {
      targetAddress = '서울특별시 강남구 역삼1동 831-34';
      needsUpdate = true;
    } else if ((p.title?.includes('[경기/인천]') || p.title?.includes('[인천광역시]')) && (!p.address || (!p.address.includes('경기') && !p.address.includes('인천')))) {
      targetAddress = '인천광역시 부평구 십정동 420-1';
      needsUpdate = true;
    } else if (p.title?.includes('[경상도]') && (!p.address || (!p.address.includes('부산') && !p.address.includes('대구') && !p.address.includes('경상')))) {
      targetAddress = '부산광역시 부산진구 신천대로62번길 42';
      needsUpdate = true;
    } else if (p.title?.includes('[전라도]') && (!p.address || (!p.address.includes('광주') && !p.address.includes('전라')))) {
      targetAddress = '광주광역시 동구 황금동 84번지';
      needsUpdate = true;
    } else if (p.title?.includes('[충청도]') && (!p.address || (!p.address.includes('대전') && !p.address.includes('충청')))) {
      targetAddress = '대전광역시 서구 둔산동 1042';
      needsUpdate = true;
    } else if (p.title?.includes('[강원/제주]') && (!p.address || (!p.address.includes('강원') && !p.address.includes('제주')))) {
      targetAddress = '제주특별자치도 제주시 중앙로 12';
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log(`Fixing alignment for party [${p.id}] (${p.title}) -> Address: ${targetAddress}`);
      await supabase
        .from('parties')
        .update({ address: targetAddress })
        .eq('id', p.id);
      updatedCount++;
    }
  }

  console.log(`Successfully verified and synced ${data.length} records. Updated ${updatedCount} non-compliant records.`);
}

syncAddressesAndRegions();
