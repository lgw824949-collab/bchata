import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocationsData() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching locations:', error);
    return;
  }

  const list = data || [];
  console.log(`Total locations fetched: ${list.length}`);
  console.log('==================================================');

  // 1. Check for duplicate or similar BAR names
  const nameGroups = {};
  list.forEach(loc => {
    if (!loc.name) return;
    // Normalize name by removing spaces and lowercasing to find close similarities
    const norm = loc.name.replace(/\s+/g, '').toLowerCase();
    if (!nameGroups[norm]) nameGroups[norm] = [];
    nameGroups[norm].push(loc);
  });

  console.log('\n[1] 중복되거나 이름이 매우 유사한 BAR 목록:');
  let dupCount = 0;
  Object.keys(nameGroups).forEach(key => {
    if (nameGroups[key].length > 1) {
      dupCount++;
      console.log(`\n▶ 유사 그룹: "${key}" (${nameGroups[key].length}개 레코드)`);
      nameGroups[key].forEach(loc => {
        console.log(`   - ID: ${loc.id} | Name: "${loc.name}" | Address: "${loc.address || '없음'}"`);
      });
    }
  });

  if (dupCount === 0) {
    console.log('중복되거나 유사한 이름의 BAR가 발견되지 않았습니다.');
  }

  // 2. Check for addresses containing English characters
  console.log('\n==================================================');
  console.log('\n[2] 영문(알파벳)이 포함되거나 영문으로 표기된 주소 목록:');
  let engCount = 0;
  list.forEach(loc => {
    if (loc.address && /[a-zA-Z]/.test(loc.address)) {
      engCount++;
      console.log(`\n▶ Name: "${loc.name}"`);
      console.log(`   - Address: "${loc.address}"`);
      console.log(`   - ID: ${loc.id}`);
    }
  });

  if (engCount === 0) {
    console.log('영문으로 된 주소가 발견되지 않았습니다.');
  }
}

checkLocationsData();
