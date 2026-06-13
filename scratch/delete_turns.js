import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTurnRecords() {
  console.log('지정된 2개 BAR 레코드 삭제 실행 중...');
  
  const names = ['강남턴', '홍대 턴'];
  
  for (const name of names) {
    const { error } = await supabase.from('locations').delete().eq('name', name);
    if (error) {
      console.error(`삭제 에러 (${name}):`, error.message);
    } else {
      console.log(`- "${name}" 레코드 성공적으로 삭제 완료`);
    }
  }

  console.log('모든 삭제 쿼리 실행이 완료되었습니다.');
}

deleteTurnRecords();
