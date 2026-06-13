import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertProvincial() {
  const targetDate = '2026-05-13';

  // Let's grab an existing authentic poster URL from one of today's parties to reuse
  const { data: existing, error: fetchError } = await supabase
    .from('parties')
    .select('poster_url')
    .eq('date', targetDate)
    .not('poster_url', 'is', null)
    .limit(1);

  let samplePosterUrl = 'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/community_sample.png';
  if (existing && existing.length > 0 && existing[0].poster_url) {
    samplePosterUrl = existing[0].poster_url;
  }

  const jeollaParty = {
    title: '[전라도] 광주 마얀 라틴홀릭 정모 파티 ㅣ 오늘밤빠',
    location_id: null,
    address: '광주광역시 동구 황금동 84번지 3층',
    fee: '15,000원',
    date: targetDate,
    time: '20:30',
    day_of_week: '수',
    poster_url: samplePosterUrl,
    s_ratio: 5,
    b_ratio: 5,
    j_ratio: 0,
    k_ratio: 0,
    status: 'approved'
  };

  const jejuParty = {
    title: '[강원/제주] 제주 아일랜드 바차타 페스타 ㅣ 오늘밤빠',
    location_id: null,
    address: '제주특별자치도 제주시 중앙로 12 제주살사클럽',
    fee: '20,000원',
    date: targetDate,
    time: '21:00',
    day_of_week: '수',
    poster_url: samplePosterUrl,
    s_ratio: 3,
    b_ratio: 7,
    j_ratio: 0,
    k_ratio: 0,
    status: 'approved'
  };

  console.log('Inserting Jeolla and Jeju sample parties for today...');
  const { error } = await supabase.from('parties').insert([jeollaParty, jejuParty]);
  
  if (error) {
    console.error('Error inserting provincial parties:', error.message);
  } else {
    console.log('Successfully inserted gorgeous provincial sample parties for today!');
  }
}

insertProvincial();
