import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setNeutralPosters() {
  const provincialUpdates = [
    {
      id: '3987ebe4-26d5-4899-8405-b5c9cc266ef7', // 경상도 하이텐션파티
      url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'c8b545dc-69aa-49f7-bd59-a486cec886aa', // 경상도 알루에고 초청파티
      url: 'https://images.unsplash.com/photo-1504609813442-d8ab0f86521f?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'a9f0b4d0-7993-4a96-956f-0506c42179f4', // 충청도 CAFESALSA
      url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '9a1ac376-111b-418c-9730-8b3b8b09cf03', // 전라도 광주 마얀 라틴홀릭
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '8e1bc0d8-0cc6-4e43-b22e-9b52ebfce738', // 강원/제주 제주 아일랜드
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
    }
  ];

  console.log('Replacing provincial party posters with text-neutral premium Unsplash dance/party imagery...');
  for (const item of provincialUpdates) {
    console.log(`Updating party [${item.id}] -> ${item.url}`);
    await supabase
      .from('parties')
      .update({ poster_url: item.url })
      .eq('id', item.id);
  }
  console.log('Successfully applied completely distinct, gorgeous graphic images to provincial parties!');
}

setNeutralPosters();
