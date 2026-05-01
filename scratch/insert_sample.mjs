import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://biwziyyklaycbjrnitem.supabase.co',
  'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
);

async function insertSample() {
  const sampleData = {
    image_url: 'https://biwziyyklaycbjrnitem.supabase.co/storage/v1/object/public/posters/community_sample.png',
    content: '오늘 홍대 보니따 분위기 정말 뜨겁네요! 🔥 실시간 현장 상황입니다. 다들 즐거운 댄스밤 되세요! #바차타 #살사 #LIVEPICK',
    region: '서울',
    bar_name: '홍대 보니따',
    view_count: 152,
    likes_count: 48,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('community_posts')
    .insert([sampleData]);

  if (error) {
    console.error('Error inserting sample:', error);
  } else {
    console.log('Sample post inserted successfully!');
  }
}

insertSample();
