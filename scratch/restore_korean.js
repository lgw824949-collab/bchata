import fs from 'fs';

const filePath = 'src/pages/Community.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix regions
content = content.replace(/'\?쒖슱'/g, "'서울'");
content = content.replace(/'寃쎄린\/\?몄쿇'/g, "'경인'");
content = content.replace(/'寃쎌긽\?\?,/g, "'경상도',");
content = content.replace(/'\?꾨씪\?\?,/g, "'전라도',");
content = content.replace(/'異⑹껌\?\?,/g, "'충청도',");
content = content.replace(/'媛뺤썝\/\?쒖＜'/g, "'강원/제주'");

// Fix quickTags
content = content.replace(/'#遺꾩쐞湲곗턀怨좒윍\?'/g, "'#분위기최고👍'");
content = content.replace(/'#\?뚯븙留쏆쭛\?렦'/g, "'#음악맛집🎵'");
content = content.replace(/'#\?щ엺留롮쓬\?뫉'/g, "'#사람많음🔥'");
content = content.replace(/'#\?ъ쑀濡쒖\?\?\?\?'/g, "'#여유로움☕'");
content = content.replace(/'#\?댁궗留쏆쭛\?뭴'/g, "'#살사맛집💃'");
content = content.replace(/'#諛붿감\?€留쏆쭛\?뭴'/g, "'#바차타맛집🕺'");
content = content.replace(/'#\?ㅼ\?諛붾쭧吏묅쑉'/g, "'#키좀바맛집✨'");
content = content.replace(/'#二쇳겕留쏆쭛\?뵦'/g, "'#주크맛집🎶'");
content = content.replace(/'#誘몃え\?ы뀗\?\?컻\?\?,/g, "'#미모포텐🎈',");
content = content.replace(/'\?덈궓\?덈?媛€\?앿윉\?,/g, "'#훈남훈녀가득🌟',");
content = content.replace(/'\?⑥뀡\?뺣벑\?먳윉\?,/g, "'#패션왕등판🕶️',");
content = content.replace(/'\?덊샇媛뺤쨷\?ㄹ'/g, "'#안호강중🔥'");

// Fix other common strings
content = content.replace(/\?꾩껜/g, "전체");
content = content.replace(/\?쒖슱/g, "서울");
content = content.replace(/蹂대땲\?\?,/g, "보니따,");
content = content.replace(/移대뵒利\?,/g, "카디스,");
content = content.replace(/\?랁꽩/g, "턴");
content = content.replace(/\?ㅻ뒛 諛\? \?닿린媛€ \?€\?⑦빀\?덈떎! \?뵦/g, "오늘 밤 분위기가 후끈합니다! 🔥");
content = content.replace(/諛⑸툑 \?\?;/g, "방금 전;");
content = content.replace(/\${diff}遺\?\?\?;/g, "`${diff}분 전`;");
content = content.replace(/\${Math\.floor\(diff\/60\)}\?쒓컙 \?\?;/g, "`${Math.floor(diff/60)}시간 전`;");
content = content.replace(/\${Math\.floor\(diff\/1440\)}\?\?\?\?;/g, "`${Math.floor(diff/1440)}일 전`;");
content = content.replace(/\?꾩옣 由ы룷\?\? /g, "현장 리포트 ");
content = content.replace(/遺꾩쐞湲\?\?뺤씤\?섏꽭\?\?/g, "분위기 확인하세요!");
content = content.replace(/留곹겕媛€ 蹂듭궗\?섏뿀\?듬땲\?\?/g, "링크가 복사되었습니다.");
content = content.replace(/\?ъ쭊怨\?\?\댁슜\?\?\낅젰\?댁＜\?몄슂!/g, "사진과 내용을 입력해주세요!");
content = content.replace(/\?낅줈\?\?\ㅽ뙣: /g, "업로드 실패: ");

// Modal specific strings
content = content.replace(/>\?덈줈\?\?\쇰뱶<\/h2>/g, ">새로운 피드</h2>");
content = content.replace(/>吏€湲\?\?\꾩옣 \?ъ쭊\?낅땲\?\?\/p>/g, ">지금 현장 사진입니다</p>");
content = content.replace(/>泥댄겕 \?\?\[\?ㅼ떆媛\?\?\몄쬆\] 諭껋\?媛€ 遺€\?щ맗\?덈떎\.<\/p>/g, ">체크 시 [실시간 인증] 뱃지가 부여됩니다.</p>");
content = content.replace(/placeholder="\?꾩옣 遺꾩쐞湲곕\? \?곸뼱二쇱꽭\?\?\.\."/g, 'placeholder="현장 분위기를 적어주세요.."');
content = content.replace(/>鍮좊Ⅸ \?쒓렇 異붽\?<\/p>/g, ">빠른 태그 추가</p>");
content = content.replace(/>珥덇린\?\?                    <\/button>/g, ">초기화</button>");
content = content.replace(/placeholder="\?μ냼紐\?"/g, 'placeholder="장소명"');
content = content.replace(/\?낅줈\?\?以\?\.\./g, "업로드 중..");
content = content.replace(/怨듭쑀\?섍린/g, "공유하기");

// Header and others
content = content.replace(/\?꾩옣 由ы룷\?몃뒗 3\?쇨컙 \?좎\?\?\⑸땲\?\? \?멸린 \?ъ뒪\?몃뒗 \[踰좎뒪\?\?濡\?\?좎젙\?\?\⑸땲\?\?/g, "현장 리포트는 3일간 유지됩니다. 인기 포스트는 [베스트]로 선정됩니다.");
content = content.replace(/濡쒕뵫 以\?\.\./g, "로딩 중..");
content = content.replace(/>由ы룷\?멸\? \?놁뒿\?덈떎<\/h3>/g, ">리포트가 없습니다</h3>");
content = content.replace(/\?ㅼ떆媛\?\?\몄쬆/g, "실시간 인증");
content = content.replace(/\?듬챸\?\?\?꾩꽌/g, "익명투자자");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Restored Korean strings and fixed compilation error in Community.jsx');
