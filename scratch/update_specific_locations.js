import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeDBOperations() {
  console.log('1. 지정된 3개 BAR 레코드 삭제 중...');
  const namesToDelete = ['홍대턴', '비비고댄스', '엘마'];
  
  for (const name of namesToDelete) {
    const { error } = await supabase.from('locations').delete().eq('name', name);
    if (error) {
      console.error(`삭제 실패 (${name}):`, error.message);
    } else {
      console.log(`- "${name}" 레코드 삭제 완료`);
    }
  }

  console.log('\n2. "꼼애야 2차" 이름을 "꼼애야"로 수정 중...');
  const { error: updateNameError } = await supabase
    .from('locations')
    .update({ name: '꼼애야' })
    .eq('name', '꼼애야 2차');

  if (updateNameError) {
    console.error('이름 수정 실패:', updateNameError.message);
  } else {
    console.log('- "꼼애야 2차" -> "꼼애야" 이름 변경 완료');
  }

  console.log('\n3. "아임살사" 주소를 "경기도 안산시"로 변경 중...');
  const { error: updateAddrError } = await supabase
    .from('locations')
    .update({ address: '경기도 안산시' })
    .eq('name', '아임살사');

  if (updateAddrError) {
    console.error('주소 변경 실패:', updateAddrError.message);
  } else {
    console.log('- "아임살사" 주소 -> "경기도 안산시" 업데이트 완료');
  }

  console.log('\n========================================');
  console.log('모든 데이터베이스 작업이 성공적으로 실행되었습니다.');
}

executeDBOperations();
