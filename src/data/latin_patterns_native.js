// 실전 네이티브 라틴댄스 영어 100 패턴
// 구동사(phrasal verbs) 강조 버전

export const PATTERNS = [
  // ═══════════════════════════════
  // 1. 인사 / 첫 만남 (1-10)
  // ═══════════════════════════════
  {n:1, cat:'인사', en:"Hey, what's up? You come here often?", kr:"안녕, 어떻게 지내요? 여기 자주 와요?", note:"구동사: come here / 가장 자연스러운 첫 접근", ex:"Hey, what's up? You come here often? I've never seen you around before."},
  {n:2, cat:'인사', en:"I've been looking forward to checking this place out.", kr:"여기 와보고 싶었어요.", note:"구동사: look forward to / check out / 장소 첫 방문 표현", ex:"I've been looking forward to checking this place out — the vibe is amazing."},
  {n:3, cat:'인사', en:"You really stand out on the floor!", kr:"플로어에서 확 눈에 띄네요!", note:"구동사: stand out / 자연스러운 칭찬", ex:"I have to say, you really stand out on the floor — great energy!"},
  {n:4, cat:'인사', en:"I was hoping you'd show up tonight.", kr:"오늘 밤 오실 줄 알았어요.", note:"구동사: show up / 반가운 재회 표현", ex:"I was hoping you'd show up tonight — I owe you a dance!"},
  {n:5, cat:'인사', en:"How are you holding up?", kr:"요즘 어떻게 지내요?", note:"구동사: hold up / 안부 묻는 네이티브 표현", ex:"Hey, long time no see! How are you holding up?"},
  {n:6, cat:'인사', en:"I've heard a lot about you — it's great to finally put a face to the name.", kr:"많이 들었어요, 드디어 만나네요.", note:"put a face to the name / 소개받은 후 첫 만남", ex:"You're Sarah, right? I've heard a lot about you — great to finally put a face to the name."},
  {n:7, cat:'인사', en:"I just got here — what did I miss?", kr:"방금 왔는데 뭔가 놓쳤나요?", note:"구동사: miss out / 파티 도착 후 자연스러운 말", ex:"I just got here — what did I miss? The floor looks packed already!"},
  {n:8, cat:'인사', en:"You're killing it out there!", kr:"완전 잘하시는데요!", note:"killing it / 칭찬하는 네이티브 슬랭", ex:"Wow, you're killing it out there — where did you train?"},
  {n:9, cat:'인사', en:"I always end up running into you at these things!", kr:"이런 자리에서 항상 마주치네요!", note:"구동사: run into / 우연한 재회", ex:"I always end up running into you at these things — must be fate!"},
  {n:10, cat:'인사', en:"This place is really growing on me.", kr:"여기가 점점 마음에 들어요.", note:"구동사: grow on / 장소/음악에 익숙해지는 표현", ex:"I wasn't sure about this venue at first, but it's really growing on me."},

  // ═══════════════════════════════
  // 2. 댄스 요청 (11-20)
  // ═══════════════════════════════
  {n:11, cat:'댄스요청', en:"Do you want to jump in for this one?", kr:"이 곡 같이 춰볼래요?", note:"구동사: jump in / 가볍고 자연스러운 요청", ex:"Do you want to jump in for this one? It's a great song."},
  {n:12, cat:'댄스요청', en:"Can I steal you for a dance?", kr:"잠깐 빌려도 될까요?", note:"steal you / 네이티브가 자주 쓰는 댄스 요청", ex:"Can I steal you for a dance? I promise I'll give you back!"},
  {n:13, cat:'댄스요청', en:"Feel like dancing? I'll try not to step on your feet.", kr:"춤출래요? 발 안 밟으려고 노력할게요.", note:"feel like + -ing / 유머 섞인 댄스 요청", ex:"Feel like dancing? I'll try not to step on your feet — no promises though!"},
  {n:14, cat:'댄스요청', en:"I've been working up the courage to ask you all night.", kr:"오늘 밤 내내 용기 내려고 했어요.", note:"구동사: work up / 솔직하고 귀여운 표현", ex:"I've been working up the courage to ask you all night — would you like to dance?"},
  {n:15, cat:'댄스요청', en:"Want to give it a go?", kr:"한번 해볼래요?", note:"구동사: give it a go / 편한 요청", ex:"This is a fun song — want to give it a go?"},
  {n:16, cat:'댄스요청', en:"I'd love to get out there with you.", kr:"같이 나가서 추고 싶어요.", note:"구동사: get out there / 플로어로 나가자는 표현", ex:"They're playing my favorite song — I'd love to get out there with you."},
  {n:17, cat:'댄스요청', en:"You up for a dance?", kr:"춤 한 판 어때요?", note:"be up for / 캐주얼한 제안", ex:"Hey, you up for a dance? They just switched to bachata."},
  {n:18, cat:'댄스요청', en:"Mind if I cut in?", kr:"끼어도 될까요?", note:"cut in / 다른 사람과 추던 파트너에게 요청", ex:"Excuse me, mind if I cut in? I've been waiting for this song."},
  {n:19, cat:'댄스요청', en:"Save the next one for me?", kr:"다음 곡 나 예약해줄 수 있어요?", note:"save for / 다음 곡 예약 요청", ex:"I know you're dancing right now, but save the next one for me?"},
  {n:20, cat:'댄스요청', en:"I'll sit this one out — catch you on the next?", kr:"이 곡은 쉴게요, 다음 곡에 봐요?", note:"sit out / catch on the next / 자연스러운 거절+예약", ex:"I need a breather — I'll sit this one out. Catch you on the next?"},

  // ═══════════════════════════════
  // 3. 리드 & 팔로우 (21-30)
  // ═══════════════════════════════
  {n:21, cat:'리드팔로우', en:"Just go with the flow — don't overthink it.", kr:"흐름에 맡겨요, 너무 생각하지 말고.", note:"go with the flow / 팔로어 긴장 풀어주기", ex:"Relax and just go with the flow — don't overthink it, feel the music."},
  {n:22, cat:'리드팔로우', en:"I'll ease you into it.", kr:"천천히 익숙해지게 할게요.", note:"구동사: ease into / 초보 파트너 배려", ex:"Don't worry, I'll ease you into it — we'll start with the basics."},
  {n:23, cat:'리드팔로우', en:"Try to tune in to my body movement.", kr:"제 바디 무브먼트에 맞춰봐요.", note:"구동사: tune in / 연결감 표현", ex:"Try to tune in to my body movement rather than counting beats."},
  {n:24, cat:'리드팔로우', en:"Don't fight it — just let it happen.", kr:"저항하지 말고, 그냥 흘러가게 해요.", note:"let it happen / fight it / 연결 감각 설명", ex:"When I lead the turn, don't fight it — just let it happen naturally."},
  {n:25, cat:'리드팔로우', en:"Pick up on my cues and we'll be golden.", kr:"제 신호 잘 캐치하면 완벽해요.", note:"구동사: pick up on / be golden / 리드 신호 표현", ex:"Pick up on my cues and we'll be golden — you're already doing great."},
  {n:26, cat:'리드팔로우', en:"I'll dial it back so you can catch up.", kr:"좀 천천히 할게요, 따라잡을 수 있도록.", note:"구동사: dial back / catch up / 속도 조절", ex:"Let me dial it back a bit so you can catch up — no rush at all."},
  {n:27, cat:'리드팔로우', en:"Stay connected — don't let go of the frame.", kr:"연결 유지해요, 프레임 놓지 말고.", note:"stay connected / let go / 댄스 연결감", ex:"Stay connected through the turn — don't let go of the frame."},
  {n:28, cat:'리드팔로우', en:"You're starting to get the hang of it!", kr:"감 잡히기 시작했어요!", note:"구동사: get the hang of / 발전 칭찬", ex:"That's it — you're starting to get the hang of it! Keep going."},
  {n:29, cat:'리드팔로우', en:"Go along with whatever I throw at you.", kr:"제가 뭘 하든 따라와요.", note:"go along with / throw at / 임프로바 요청", ex:"Just go along with whatever I throw at you — trust your instincts."},
  {n:30, cat:'리드팔로우', en:"Let me take the lead on this part.", kr:"이 부분은 제가 이끌게요.", note:"take the lead / 자연스러운 리드 선언", ex:"Let me take the lead on this part — it's a tricky transition."},

  // ═══════════════════════════════
  // 4. 동작 설명 (31-40)
  // ═══════════════════════════════
  {n:31, cat:'동작설명', en:"Step into it — don't hold back.", kr:"과감하게 스텝 내딛어요.", note:"구동사: step into / hold back / 자신감 표현", ex:"When you go for the turn, step into it — don't hold back."},
  {n:32, cat:'동작설명', en:"Break it down — what's tripping you up?", kr:"분석해봐요, 뭐가 걸리는 거예요?", note:"구동사: break down / trip up / 문제점 파악", ex:"Let's break it down — what's tripping you up on that footwork?"},
  {n:33, cat:'동작설명', en:"Roll through the movement, don't chop it up.", kr:"동작을 굴려요, 끊지 말고.", note:"구동사: roll through / chop up / 부드러운 움직임", ex:"Try to roll through the movement — don't chop it up into pieces."},
  {n:34, cat:'동작설명', en:"Sink down into your hips.", kr:"힙에 몸을 내려요.", note:"sink down into / 힙 무브먼트 설명", ex:"Sink down into your hips on the downbeat — that's where the magic is."},
  {n:35, cat:'동작설명', en:"Pull back slightly on the prep.", kr:"준비 동작에서 살짝 당겨요.", note:"구동사: pull back / prep step 설명", ex:"Pull back slightly on the prep — it'll give your partner more time to react."},
  {n:36, cat:'동작설명', en:"Wind up before you spin.", kr:"돌기 전에 감아요.", note:"wind up / 스핀 전 준비 동작", ex:"Make sure to wind up before you spin — it gives you more momentum."},
  {n:37, cat:'동작설명', en:"Follow through on the arm styling.", kr:"암 스타일링 끝까지 해요.", note:"구동사: follow through / 마무리 동작", ex:"Follow through on the arm styling — don't cut it short."},
  {n:38, cat:'동작설명', en:"Ground yourself before going into the turn.", kr:"턴 들어가기 전에 중심 잡아요.", note:"ground yourself / 중심잡기 표현", ex:"Ground yourself on that prep step before going into the turn."},
  {n:39, cat:'동작설명', en:"Your footwork is all over the place — let's clean it up.", kr:"풋워크가 흐트러졌어요, 정리해봐요.", note:"구동사: clean up / all over the place / 교정 표현", ex:"Your footwork is a bit all over the place — let's slow down and clean it up."},
  {n:40, cat:'동작설명', en:"Ease off the tension in your shoulders.", kr:"어깨 힘 빼요.", note:"구동사: ease off / 자세 교정", ex:"Ease off the tension in your shoulders — you're carrying a lot up there."},

  // ═══════════════════════════════
  // 5. 피드백 (41-50)
  // ═══════════════════════════════
  {n:41, cat:'피드백', en:"You've really come a long way!", kr:"정말 많이 늘었어요!", note:"come a long way / 발전 칭찬", ex:"I danced with you three months ago and you've really come a long way!"},
  {n:42, cat:'피드백', en:"That really came together nicely!", kr:"정말 잘 맞아떨어졌어요!", note:"구동사: come together / 호흡이 맞는 표현", ex:"That last combination really came together nicely — perfect timing!"},
  {n:43, cat:'피드백', en:"You're picking this up so fast!", kr:"정말 빨리 배우는데요!", note:"구동사: pick up / 빠른 학습 칭찬", ex:"Honestly, you're picking this up so fast — natural talent!"},
  {n:44, cat:'피드백', en:"Something's off — let's figure out what.", kr:"뭔가 안 맞아요, 뭔지 찾아봐요.", note:"be off / figure out / 문제 파악", ex:"Something's off with that transition — let's slow down and figure out what."},
  {n:45, cat:'피드백', en:"You're holding out on me — I know you can do better!", kr:"숨기고 있죠? 더 잘할 수 있잖아요!", note:"hold out on / 격려 표현", ex:"Come on, you're holding out on me — I know you can do better than that!"},
  {n:46, cat:'피드백', en:"Once you nail the timing, everything else falls into place.", kr:"타이밍만 잡히면 나머지는 저절로 돼요.", note:"nail / fall into place / 타이밍의 중요성", ex:"Trust me, once you nail the timing, everything else just falls into place."},
  {n:47, cat:'피드백', en:"Don't be too hard on yourself — you're doing great.", kr:"너무 자책하지 마요, 잘하고 있어요.", note:"be hard on yourself / 격려 표현", ex:"Don't be too hard on yourself — everyone goes through this phase."},
  {n:48, cat:'피드백', en:"You lit up the floor on that one!", kr:"그 순간 완전 빛났어요!", note:"light up / 열정적인 칭찬", ex:"Did you feel that? You absolutely lit up the floor on that one!"},
  {n:49, cat:'피드백', en:"We're really vibing — let's keep it going.", kr:"호흡 완전 맞아요, 계속해요.", note:"vibe / keep it going / 긍정적 연결감", ex:"We're really vibing right now — let's keep it going for another song."},
  {n:50, cat:'피드백', en:"You threw me off a little there — no worries though.", kr:"거기서 살짝 흔들렸어요, 괜찮아요.", note:"구동사: throw off / 부드러운 교정", ex:"You threw me off a little on that combo — want to try it again?"},

  // ═══════════════════════════════
  // 6. 음악 (51-58)
  // ═══════════════════════════════
  {n:51, cat:'음악', en:"This song is really calling to me.", kr:"이 노래 나를 부르는 것 같아요.", note:"call to / 노래에 이끌리는 표현", ex:"I don't know what it is, but this song is really calling to me tonight."},
  {n:52, cat:'음악', en:"The DJ is really bringing it tonight!", kr:"오늘 DJ 완전 대박이에요!", note:"bring it / DJ 칭찬 슬랭", ex:"Wow, the DJ is really bringing it tonight — every track is fire."},
  {n:53, cat:'음악', en:"This beat is hitting hard.", kr:"이 비트 완전 강렬해요.", note:"hit hard / 음악 에너지 표현", ex:"Did you hear that drop? This beat is hitting hard — let's go!"},
  {n:54, cat:'음악', en:"They're switching it up — time to change gears.", kr:"바뀌네요, 우리도 모드 바꿔요.", note:"구동사: switch up / change gears / 음악 전환", ex:"They're switching it up to salsa — time to change gears!"},
  {n:55, cat:'음악', en:"This song always gets me going.", kr:"이 노래 들으면 항상 신나요.", note:"구동사: get going / 좋아하는 노래 표현", ex:"Oh yes — this song always gets me going. Ready to tear it up?"},
  {n:56, cat:'음악', en:"Can you feel how the music builds up?", kr:"음악이 고조되는 거 느껴져요?", note:"구동사: build up / 음악적 감각 공유", ex:"Can you feel how the music builds up here? Follow that energy."},
  {n:57, cat:'음악', en:"I'm so into this track right now.", kr:"이 곡 지금 완전 빠져들었어요.", note:"be into / 음악에 몰입 표현", ex:"Don't talk to me — I'm so into this track right now."},
  {n:58, cat:'음악', en:"They've been on a roll all night.", kr:"오늘 밤 내내 연속으로 잘 틀어주네요.", note:"be on a roll / 연속 좋은 선곡", ex:"The DJ has been on a roll all night — I don't want to stop dancing."},

  // ═══════════════════════════════
  // 7. 실수 대처 (59-66)
  // ═══════════════════════════════
  {n:59, cat:'실수대처', en:"My bad — I totally blanked on that part.", kr:"내 실수, 그 부분에서 완전 머리가 하얘졌어요.", note:"my bad / blank on / 실수 인정", ex:"My bad — I totally blanked on that footwork. Let's start over."},
  {n:60, cat:'실수대처', en:"I messed that up — let me shake it off and try again.", kr:"망했어요, 털어버리고 다시 해볼게요.", note:"구동사: mess up / shake off / 실수 회복", ex:"I really messed that up — give me a second to shake it off."},
  {n:61, cat:'실수대처', en:"We got our wires crossed — let's reset.", kr:"서로 엇갈렸어요, 다시 맞춰봐요.", note:"get wires crossed / reset / 연결 실수", ex:"We got our wires crossed on that transition — let's reset and go again."},
  {n:62, cat:'실수대처', en:"I lost the beat — help me find it again.", kr:"비트 놓쳤어요, 다시 찾게 도와줘요.", note:"구동사: lose / find / 비트 실수", ex:"I completely lost the beat there — tap it out for me so I can find it again."},
  {n:63, cat:'실수대처', en:"Shake it off — it happens to the best of us.", kr:"털어버려요, 다들 그래요.", note:"구동사: shake off / 위로 표현", ex:"Don't sweat it — shake it off, it happens to the best of us."},
  {n:64, cat:'실수대처', en:"We just have to laugh it off.", kr:"그냥 웃어넘겨요.", note:"구동사: laugh off / 실수를 가볍게", ex:"That was a mess, but we just have to laugh it off and keep going."},
  {n:65, cat:'실수대처', en:"I fumbled — give me a do-over.", kr:"실수했어요, 다시 한 번 기회 줘요.", note:"fumble / do-over / 재시도 요청", ex:"I totally fumbled that combo — can I get a do-over?"},
  {n:66, cat:'실수대처', en:"Let's just roll with it.", kr:"그냥 그대로 가요.", note:"구동사: roll with it / 즉흥으로 넘기기", ex:"Even if we mess up, let's just roll with it — that's part of the dance."},

  // ═══════════════════════════════
  // 8. 레벨 확인 (67-73)
  // ═══════════════════════════════
  {n:67, cat:'레벨확인', en:"How long have you been at it?", kr:"얼마나 됐어요?", note:"be at it / 경력 묻는 자연스러운 표현", ex:"You move really well — how long have you been at it?"},
  {n:68, cat:'레벨확인', en:"Where did you start out?", kr:"어디서 처음 시작했어요?", note:"구동사: start out / 댄스 배경 묻기", ex:"Where did you start out — did you take classes or pick it up on your own?"},
  {n:69, cat:'레벨확인', en:"I'm still figuring it out, to be honest.", kr:"솔직히 아직 파악 중이에요.", note:"구동사: figure out / 겸손한 자기 소개", ex:"I'm still figuring it out, to be honest — been dancing for about six months."},
  {n:70, cat:'레벨확인', en:"I'm trying to level up my footwork.", kr:"풋워크 레벨업 하려고 노력 중이에요.", note:"level up / 발전 목표 표현", ex:"I'm really trying to level up my footwork this year — it's been a struggle."},
  {n:71, cat:'레벨확인', en:"I'm somewhere between intermediate and advanced — it depends on the day!", kr:"중급이랑 고급 사이 어딘가, 그날 기분에 따라 달라요!", note:"somewhere between / 유머 있는 레벨 표현", ex:"Where am I? Somewhere between intermediate and advanced — depends on the day!"},
  {n:72, cat:'레벨확인', en:"You clearly know your stuff.", kr:"확실히 실력자시네요.", note:"know your stuff / 실력자 인정", ex:"I can tell from the way you move — you clearly know your stuff."},
  {n:73, cat:'레벨확인', en:"I'm still working on getting my timing down.", kr:"아직 타이밍 잡는 연습 중이에요.", note:"구동사: work on / get down / 타이밍 연습", ex:"I'm still working on getting my timing down — the musicality is the hardest part."},

  // ═══════════════════════════════
  // 9. 소셜 대화 (74-82)
  // ═══════════════════════════════
  {n:74, cat:'소셜대화', en:"I keep coming back because of the community.", kr:"커뮤니티 때문에 계속 오게 돼요.", note:"구동사: come back / keep -ing / 소속감 표현", ex:"The dancing is great, but I keep coming back because of the community here."},
  {n:75, cat:'소셜대화', en:"Word got out about this event fast.", kr:"이 이벤트 소문이 빨리 퍼졌네요.", note:"구동사: get out / 소문 표현", ex:"Word got out about this event really fast — look how packed it is!"},
  {n:76, cat:'소셜대화', en:"I've been branching out — trying zouk now.", kr:"다양하게 넓히고 있어요, 지금 주크 도전 중.", note:"구동사: branch out / 새 장르 도전", ex:"I've been branching out lately — started taking zouk classes and I'm hooked."},
  {n:77, cat:'소셜대화', en:"This scene has really blown up lately.", kr:"요즘 이 씬이 엄청 커졌어요.", note:"구동사: blow up / 씬의 성장 표현", ex:"The Latin dance scene here has really blown up over the last year — so many new faces."},
  {n:78, cat:'소셜대화', en:"I dragged my friend along — hope they're having fun.", kr:"친구 끌고 왔어요, 재밌어하면 좋겠네요.", note:"구동사: drag along / 친구 데려온 표현", ex:"I dragged my friend along tonight — it's their first social. Fingers crossed they love it!"},
  {n:79, cat:'소셜대화', en:"I dropped in on a class last week — it was eye-opening.", kr:"지난주에 수업 들어봤어요, 눈이 떠지는 것 같았어요.", note:"구동사: drop in on / eye-opening / 수업 경험 표현", ex:"I dropped in on a sensual bachata class last week and it was seriously eye-opening."},
  {n:80, cat:'소셜대화', en:"We should meet up before the next social.", kr:"다음 소셜 전에 만나요.", note:"구동사: meet up / 다음 만남 제안", ex:"We should meet up before the next social — grab a coffee and geek out about dancing."},
  {n:81, cat:'소셜대화', en:"I'm trying to put myself out there more.", kr:"더 적극적으로 나서려고 해요.", note:"구동사: put yourself out there / 소셜 활동 표현", ex:"I used to be shy, but I'm really trying to put myself out there more this year."},
  {n:82, cat:'소셜대화', en:"I'm totally burnt out — I need a break from training.", kr:"완전 지쳤어요, 훈련 좀 쉬어야 할 것 같아요.", note:"burnt out / 번아웃 표현", ex:"I've been training five days a week and I'm totally burnt out — need to dial it back."},

  // ═══════════════════════════════
  // 10. 파티 정보 (83-88)
  // ═══════════════════════════════
  {n:83, cat:'파티정보', en:"What time does this wrap up?", kr:"몇 시에 끝나요?", note:"구동사: wrap up / 종료 시간 묻기", ex:"This has been amazing — do you know what time it wraps up?"},
  {n:84, cat:'파티정보', en:"Is there a warm-up set before the main floor opens up?", kr:"메인 플로어 열리기 전에 웜업 있어요?", note:"구동사: open up / 파티 구성 묻기", ex:"Is there a warm-up set before the main floor opens up? I want to get loose first."},
  {n:85, cat:'파티정보', en:"Do you know who's lined up to perform?", kr:"공연 라인업이 어떻게 돼요?", note:"구동사: line up / 공연진 묻기", ex:"Do you know who's lined up to perform tonight? I heard there's a show."},
  {n:86, cat:'파티정보', en:"I heard they bring in guest instructors — is that true?", kr:"게스트 강사를 초청한다고 들었는데 맞아요?", note:"bring in / 게스트 강사 정보 확인", ex:"I heard they bring in guest instructors for the workshops — is that true?"},
  {n:87, cat:'파티정보', en:"Is the after-party still on?", kr:"뒷풀이 아직 있어요?", note:"be on / 뒷풀이 확인", ex:"Is the after-party still on? Someone said it might be cancelled."},
  {n:88, cat:'파티정보', en:"How do I sign up for the workshop?", kr:"워크샵 어떻게 신청해요?", note:"구동사: sign up for / 워크샵 등록", ex:"I really want to check out that workshop — how do I sign up for it?"},

  // ═══════════════════════════════
  // 11. 요청 거절 (89-93)
  // ═══════════════════════════════
  {n:89, cat:'요청거절', en:"I need to catch my breath — rain check?", kr:"좀 쉬어야 해요, 다음에 해요?", note:"catch your breath / rain check / 정중한 거절", ex:"I need to catch my breath — rain check on that dance?"},
  {n:90, cat:'요청거절', en:"I'm going to sit this round out.", kr:"이번 라운드는 앉아있을게요.", note:"구동사: sit out / 쉬겠다는 표현", ex:"I'm going to sit this round out — my feet are killing me. Next one, I promise."},
  {n:91, cat:'요청거절', en:"I already promised this one to someone — I'll come find you after.", kr:"이 곡은 다른 분과 약속했어요, 끝나고 찾을게요.", note:"come find / promise to / 약속 이유 거절", ex:"I already promised this one — but I'll come find you after, okay?"},
  {n:92, cat:'요청거절', en:"I'm taking a quick timeout — back in five.", kr:"잠깐 쉴게요, 5분 후에 돌아와요.", note:"take a timeout / 짧은 휴식 표현", ex:"I'm taking a quick timeout — grab some water and I'll be back in five."},
  {n:93, cat:'요청거절', en:"I'm a bit off tonight — not feeling 100%.", kr:"오늘 좀 컨디션이 안 좋아요.", note:"be off / not feeling 100% / 컨디션 부진", ex:"I appreciate it, but I'm a bit off tonight — not feeling 100%. Maybe next time?"},

  // ═══════════════════════════════
  // 12. 안전 & 배려 (94-97)
  // ═══════════════════════════════
  {n:94, cat:'안전배려', en:"Speak up if anything doesn't feel right.", kr:"뭔가 이상하면 바로 말해요.", note:"구동사: speak up / feel right / 안전 표현", ex:"Speak up if anything doesn't feel right — there's no shame in that at all."},
  {n:95, cat:'안전배려', en:"I don't want to push you past your comfort zone.", kr:"불편한 선 넘게 하고 싶지 않아요.", note:"push past / comfort zone / 경계 존중", ex:"Let me know your limits — I don't want to push you past your comfort zone."},
  {n:96, cat:'안전배려', en:"Are you okay? You seem a bit out of it.", kr:"괜찮아요? 좀 멍해 보여요.", note:"be out of it / 파트너 상태 확인", ex:"Hey, are you okay? You seem a bit out of it — need some water?"},
  {n:97, cat:'안전배려', en:"Watch out — it's getting crowded out there.", kr:"조심해요, 플로어 많이 붐벼요.", note:"watch out / 충돌 방지", ex:"Watch out — it's getting really crowded out there, so let's keep our movements tight."},

  // ═══════════════════════════════
  // 13. 감사 & 마무리 (98-100)
  // ═══════════════════════════════
  {n:98, cat:'감사마무리', en:"That was incredible — you really brought it!", kr:"대단했어요, 완전 잘하셨어요!", note:"bring it / 춤 후 최고 칭찬", ex:"That was incredible — you really brought it on that last song!"},
  {n:99, cat:'감사마무리', en:"I hope we get to do this again sometime — I'll look out for you.", kr:"또 함께 출 수 있으면 좋겠어요, 다음에 찾을게요.", note:"구동사: look out for / do this again / 재만남 희망", ex:"I really enjoyed that — I'll look out for you at the next social."},
  {n:100, cat:'감사마무리', en:"You made this night — seriously, thank you.", kr:"오늘 밤을 빛내줬어요, 진심으로 감사해요.", note:"make one's night / 최고의 감사 표현", ex:"I mean it — you made this night. Let's keep in touch and dance again soon."},
];

export const CATS_LATIN = ['인사', '댄스요청', '리드팔로우', '동작설명', '피드백', '음악', '실수대처', '레벨확인', '소셜대화', '파티정보', '요청거절', '안전배려', '감사마무리'];
