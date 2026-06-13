import fs from 'fs';

const filePath = 'src/pages/Community.jsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Line 18: quickTags
lines[17] = "  const quickTags = ['#분위기최고👍', '#음악맛집🎵', '#사람많음🔥', '#여유로움☕', '#살사맛집💃', '#바차타맛집🕺', '#키좀바맛집✨', '#주크맛집🎶', '#미모포텐🎈', '#훈남훈녀가득🌟', '#패션왕등판🕶️', '#안호강중🔥'];";

// Line 21, 22, 23: demoPosts
lines[20] = "    { id: 'real_v1', image_url: '/demo/real_1.png', bar_name: '보니따', region: '서울', content: '오늘 밤 분위기가 후끈합니다! 🔥 #분위기최고👍 #바차타맛집🕺', likes_count: 312, view_count: 4200, created_at: new Date().toISOString(), is_live: true },";
lines[21] = "    { id: 'real_v2', image_url: '/demo/real_2.png', bar_name: '카디스', region: '서울', content: '바차타의 매력에 푹 빠진 시간 ❤️ #여유로움☕', likes_count: 245, view_count: 3150, created_at: new Date().toISOString(), is_live: true },";
lines[22] = "    { id: 'real_v3', image_url: '/demo/real_3.png', bar_name: '턴', region: '서울', content: '살사 파티 현장 리포트 💃 #사람많음🔥', likes_count: 189, view_count: 2400, created_at: new Date().toISOString(), is_live: true }";

// Other mangled lines if any
for (let i = 0; i < lines.length; i++) {
  // Fix remaining mangled characters if any (using common patterns)
  lines[i] = lines[i].replace(/\?쒖슱/g, "서울");
  lines[i] = lines[i].replace(/\?꾩껜/g, "전체");
  lines[i] = lines[i].replace(/吏€湲\?\?\꾩옣 \?ъ쭊\?낅땲\?\?/g, "지금 현장 사진입니다");
  lines[i] = lines[i].replace(/泥댄겕 \?\?\[\?ㅼ떆媛\?\?\몄쬆\] 諭껋\?媛€ 遺€\?щ맗\?덈떎/g, "체크 시 [실시간 인증] 뱃지가 부여됩니다");
  lines[i] = lines[i].replace(/\?덈줈\?\?\쇰뱶/g, "새로운 피드");
  lines[i] = lines[i].replace(/\?꾩옣 遺꾩쐞湲곕\? \?곸뼱二쇱꽭\?\?\.\./g, "현장 분위기를 적어주세요..");
  lines[i] = lines[i].replace(/鍮좊Ⅸ \?쒓렇 異붽\?/g, "빠른 태그 추가");
  lines[i] = lines[i].replace(/珥덇린\?\?/g, "초기화");
  lines[i] = lines[i].replace(/\?μ냼紐\?/g, "장소명");
  lines[i] = lines[i].replace(/\?낅줈\?\?以\?\.\./g, "업로드 중..");
  lines[i] = lines[i].replace(/怨듭쑀\?섍린/g, "공유하기");
  lines[i] = lines[i].replace(/\?ㅼ떆媛\?\?\몄쬆/g, "실시간 인증");
  lines[i] = lines[i].replace(/\?듬챸\?\?\?꾩꽌/g, "익명투자자");
  lines[i] = lines[i].replace(/\?꾩옣 由ы룷\?몃뒗 3\?쇨컙 \?좎\?\?\⑸땲\?\?/g, "현장 리포트는 3일간 유지됩니다.");
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Fixed syntax errors and restored all Korean strings in Community.jsx');
