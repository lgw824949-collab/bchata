import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 관리자가 수동으로 동호회/빠 변동 사항을 기록하는 공간
const ADMIN_KNOWLEDGE = `
[관리자 실시간 팩트 체크]
- 입장료: 서울권 약 1.2만원, 지방권 약 1만원, 파티/이벤트는 1.5~3만원 수준입니다.
- 음악 비율: 일반적으로 바차타 4 : 살사 2 또는 바차타 3 : 살사 3 비율로 나옵니다.
- 동호회 명칭: 특정 동호회 이름 대신 각 빠(Bar)의 '동호회'라고만 지칭하세요. 특정 이름 언급은 피합니다.
`;

const GENRE_MAP = { '1': '바차타', '2': '살사', '3': '쥬크', '4': '키좀바' };
const MENU_MSG = '오늘 뭘 찾으세요?\n1. 파티 (소셜)\n2. 강습\n3. 부트캠프\n4. 페스티벌';
const GENRE_MSG = '장르는?\n1. 바차타\n2. 살사\n3. 쥬크\n4. 키좀바';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handler);
    return () => window.removeEventListener('open-chatbot', handler);
  }, []);
  const [messages, setMessages] = useState([
    { role: 'model', content: "안녕하세요! 밤빠 컨시어지예요 ✨\n오늘 밤, 당신의 완벽한 댄스 파티를 함께 찾아드릴게요! 💖" },
    { role: 'model', content: MENU_MSG }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [dbData, setDbData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Step-based flow state: 1=카테고리 선택, 2=장르 선택, 3=재검색?
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [genre, setGenre] = useState(null);

  // 키보드 대응: 비주얼 뷰포트 높이 감지
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      setViewportHeight(window.visualViewport.height);
      // 키보드가 올라올 때 스크롤 최하단 유지
      if (isOpen) {
        setTimeout(scrollToBottom, 100);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  // 유저 위치 실시간 감지 (이동성 고려)
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location watch error:', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOpen]);

  // 챗봇 오픈 시 플랫폼 실시간 데이터 로드
  useEffect(() => {
    if (isOpen && !isDataLoaded) {
      const fetchData = async () => {
        try {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          const [partiesRes, instructorsRes, bootcampsRes, festivalsRes] = await Promise.all([
            supabase.from('parties').select('*, imageUrl').eq('status', 'approved').gte('date', todayStr).limit(10),
            supabase.from('instructors').select('*').eq('status', 'active'),
            supabase.from('bootcamps').select('*').eq('status', 'active').order('start_date', { ascending: true }),
            supabase.from('festivals').select('*').eq('status', 'active').order('start_date', { ascending: true })
          ]);
          setDbData({
            parties: partiesRes.data || [],
            instructors: instructorsRes.data || [],
            bootcamps: bootcampsRes.data || [],
            festivals: festivalsRes.data || []
          });
        } catch (e) {
          console.error('Failed to fetch DB data for ChatBot', e);
        } finally {
          setIsDataLoaded(true);
        }
      };
      fetchData();
    }
  }, [isOpen, isDataLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* [OLD] handleSend — Groq AI 호출 방식 (주석 처리)
  const handleSend = async () => {
    if (!input.trim()) return;

    const lowerInput = input.trim().toLowerCase();
    const isYes = lowerInput === 'y' || lowerInput === 'ㅛ' || lowerInput === '네' || lowerInput === 'yes';

    if (isYes && dbData?.parties?.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const upcoming = dbData.parties.filter(p => p.date >= today).slice(0, 2);
      const reply = upcoming.length > 0
        ? upcoming.map(p => `🎵 ${p.title} | ${p.time?.split('-')[0].trim()} | ${p.fee}`).join('\n')
        : '현재 등록된 파티가 없어요 😢';
      setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'model', content: reply }]);
      setInput('');
      setIsLoading(false);
      return;
    }

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqApiKey) throw new Error('Groq API key is missing');
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const getRegionName = (loc) => {
        if (!loc) return null;
        const { lat, lng } = loc;
        if (lat > 37.3 && lat < 37.7 && lng > 126.8 && lng < 127.3) return '서울';
        if (lat > 37.2 && lat < 37.6 && lng > 126.4 && lng < 126.8) return '인천';
        if (lat > 37.0 && lat < 37.8 && lng > 126.5 && lng < 127.8) return '수도권/경기';
        if (lat > 34.9 && lat < 35.4 && lng > 128.8 && lng < 129.4) return '부산';
        if (lat > 35.6 && lat < 36.1 && lng > 128.4 && lng < 128.8) return '대구';
        return '지방권';
      };
      const currentRegion = getRegionName(userLocation);
      let dataContext = "현재 실시간 데이터베이스 정보가 없습니다.";
      if (dbData) {
        const partiesInfo = dbData.parties.map(p => {
          const venue = p.locationName || p.location_name || p.studio_name || '장소 확인 필요';
          return `- 파티명: ${p.title} | 장소: ${venue} | 날짜: ${p.date} | 입장료: ${p.fee || '정보 없음'} | 지역: ${p.broadRegion || p.region || '전국'} | 이미지: ${p.imageUrl || '없음'}`;
        }).join('\n');
        const instructorsInfo = dbData.instructors.map(i => `- 강사명: ${i.name} | 장르: ${i.genres || '정보 없음'} | 지역: ${i.region || i.broadRegion || '정보 없음'} | SNS: ${i.instagram_id || i.sns_id || '없음'} | 가격: ${i.price || '문의'}`).join('\n');
        dataContext = `\n\n[실시간 플랫폼 정보]\n오늘 날짜: ${todayStr}\n* 파티:\n${partiesInfo}\n* 강사:\n${instructorsInfo}\n${ADMIN_KNOWLEDGE}`;
      }
      const systemPrompt = `당신은 밤빠 컨시어지입니다. 아래 규칙을 절대 준수하세요.\n[절대 규칙]\n1. 답변은 무조건 3줄 이내\n2. 첫 질문: "어떤 장르요? 1.바차타 2.살사 3.쥬크 4.키좀바"\n3. 장르 선택 후: "오늘 근처 파티 찾을까요? Y/N"\n4. Y면 DB에서 가까운 파티 최대 2개만 출력 (형식: "🎵 파티명 | 시간 | 입장료")\n5. 설명, 인사말, 긴 문장 절대 금지\n[데이터 규칙 - 절대 준수]\n- 파티 추천 시 반드시 위에서 전달된 [실시간 플랫폼 정보] 데이터만 사용\n- DB에 없는 파티명, 장소, 시간, 금액은 절대 지어내지 말 것\n- DB 데이터가 없으면 "현재 근처 파티 정보가 없어요 😢" 한 줄로 끝\n${dataContext}`;
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...newMessages.slice(-8).map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.content }))
      ];
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: apiMessages, temperature: 0.7, max_tokens: 1024 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Groq API request failed');
      if (data.choices && data.choices.length > 0) {
        setMessages(prev => [...prev, { role: 'model', content: data.choices[0].message.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: "죄송합니다, 답변을 생성하지 못했습니다." }]);
      }
    } catch (error) {
      console.error('Groq API Error:', error);
      const errorMessage = error.message?.includes('429') || error.message?.includes('quota')
        ? "지금 대화가 너무 많아 밤빠가 조금 힘들어하네요! 😅\n약 1분 뒤에 다시 말을 걸어주시면 감사하겠습니다! ✨"
        : "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };
  */

  const getResultItems = (catNum, genreName) => {
    if (!dbData) return [];

    if (catNum === '1') {
      return (dbData.parties || [])
        .filter(p => (p.genre || '').includes(genreName))
        .slice(0, 3)
        .map(p => ({
          label: `🎵 ${p.title} | ${p.date} | ${p.fee || '무료'}`,
          posterUrl: p.imageUrl || p.poster_url || null
        }));
    }
    if (catNum === '2') {
      return (dbData.instructors || [])
        .filter(i => (Array.isArray(i.genre) ? i.genre.join(' ') : (i.genre || '')).includes(genreName))
        .slice(0, 3)
        .map(i => ({
          label: `🎵 ${i.name} | ${Array.isArray(i.genre) ? i.genre.join('/') : (i.genre || genreName)} | ${i.price || i.fee || '문의'}`,
          posterUrl: i.photo_url || null
        }));
    }
    if (catNum === '3') {
      return (dbData.bootcamps || [])
        .filter(b => (b.genre || '').includes(genreName))
        .slice(0, 3)
        .map(b => ({
          label: `🎵 ${b.instructor} | ${b.start_date?.slice(0, 10)} | ${b.fee || b.price_info || '문의'}`,
          posterUrl: b.poster_url || null
        }));
    }
    if (catNum === '4') {
      return (dbData.festivals || [])
        .filter(f => (f.genre || '').includes(genreName))
        .slice(0, 3)
        .map(f => ({
          label: `🎵 ${f.title || f.name} | ${(f.start_date || f.date)?.slice(0, 10)} | ${f.fee || '확인 필요'}`,
          posterUrl: f.poster_url || null
        }));
    }
    return [];
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userInput = input.trim();
    setInput('');
    const userMsg = { role: 'user', content: userInput };

    if (step === 1) {
      if (!['1', '2', '3', '4'].includes(userInput)) {
        setMessages(prev => [...prev, userMsg, { role: 'model', content: '번호로 선택해주세요 😊' }]);
        return;
      }
      setCategory(userInput);
      setStep(2);
      setMessages(prev => [...prev, userMsg, { role: 'model', content: GENRE_MSG }]);
      return;
    }

    if (step === 2) {
      if (!['1', '2', '3', '4'].includes(userInput)) {
        setMessages(prev => [...prev, userMsg, { role: 'model', content: '번호로 선택해주세요 😊' }]);
        return;
      }
      const selectedGenre = GENRE_MAP[userInput];
      setGenre(userInput);
      setStep(3);

      const resultItems = getResultItems(category, selectedGenre);
      const resultMsg = resultItems.length > 0
        ? { role: 'model', type: 'results', items: resultItems }
        : { role: 'model', content: '현재 등록된 정보가 없어요 😢' };

      setMessages(prev => [
        ...prev,
        userMsg,
        resultMsg,
        { role: 'model', content: '다시 찾으시겠어요? 1.예 2.아니오' }
      ]);
      return;
    }

    if (step === 3) {
      if (userInput === '1') {
        setStep(1);
        setCategory(null);
        setGenre(null);
        setMessages(prev => [...prev, userMsg, { role: 'model', content: MENU_MSG }]);
      } else if (userInput === '2') {
        setMessages(prev => [...prev, userMsg, { role: 'model', content: '즐거운 댄스 되세요! 🎶' }]);
      } else {
        setMessages(prev => [...prev, userMsg, { role: 'model', content: '번호로 선택해주세요 😊' }]);
      }
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("음성 인식을 지원하지 않는 브라우저입니다.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <>

      {isOpen && (
        <>
        <style>{`
          @keyframes slideUpChat {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
        {/* 챗봇: visualViewport 높이에 맞게 조정 → 키보드 올라와도 딱 맞음 */}
        <div style={{
          position: 'fixed',
          top: window.visualViewport ? window.visualViewport.offsetTop : 0,
          left: 0,
          width: '100%',
          height: `${viewportHeight}px`,
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          animation: 'slideUpChat 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
          >
          
          <div style={{
            backgroundColor: '#FFFFFF',
            color: '#333',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #F0F0F0'
          }}>
            <div>
              <div style={{ fontWeight: '850', fontSize: '19px', color: '#FF8A80', letterSpacing: '-0.5px' }}>✨ 밤빠 컨시어지</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '3px', fontWeight: '600' }}>
                {isDataLoaded ? "실시간 AI 가이드 가동 중" : "정보를 불러오는 중..."}
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: '#F5F5F5', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>

          <div style={{
            flex: 1,
            padding: '20px 16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: '#FAFAFA'
          }}>
            {messages.map((msg, idx) => {
              // Results type: list of items with optional [포스터 보기] button
              if (msg.type === 'results') {
                return (
                  <div key={idx} style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '92%' }}>
                    {msg.items.map((item, i) => (
                      <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '16px', borderTopLeftRadius: i === 0 ? '4px' : '16px', padding: '12px 16px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{item.label}</div>
                        {item.posterUrl && (
                          <button
                            onClick={() => setMessages(prev => [...prev, { role: 'model', content: `![poster](${item.posterUrl})` }])}
                            style={{ marginTop: '8px', padding: '5px 14px', borderRadius: '12px', background: '#FF8A80', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                          >📷 포스터 보기</button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }

              const renderContent = (content) => {
                const imgRegex = /!\[poster\]\((.*?)\)/;
                const match = content.match(imgRegex);
                if (match) {
                  const textPart = content.replace(imgRegex, '').trim();
                  return (
                    <>
                      {textPart && <div style={{ marginBottom: '8px' }}>{textPart}</div>}
                      <img 
                        src={match[1]} 
                        alt="Party Poster" 
                        style={{ width: '100%', borderRadius: '12px', marginTop: '5px', display: 'block' }} 
                      />
                    </>
                  );
                }
                return content;
              };

              return (
                <div key={idx} style={{
                  alignSelf: msg.role === 'model' ? 'flex-start' : 'flex-end',
                  backgroundColor: msg.role === 'model' ? '#FFFFFF' : '#FF8A80',
                  color: msg.role === 'model' ? '#333' : '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: '20px',
                  borderTopLeftRadius: msg.role === 'model' ? '4px' : '20px',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '20px',
                  border: msg.role === 'model' ? '1px solid #EAEAEA' : 'none',
                  maxWidth: '88%',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  boxShadow: msg.role === 'model' ? '0 2px 5px rgba(0,0,0,0.03)' : '0 4px 10px rgba(255, 138, 128, 0.25)',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  fontWeight: '500'
                }}>
                  {renderContent(msg.content)}
                </div>
              );
            })}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#AAA', marginLeft: '8px', fontStyle: 'italic' }}>
                밤빠봇이 생각 중입니다...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'
          }}>
            <button
              onClick={startVoiceRecognition}
              style={{
                background: isRecording ? '#ffebee' : '#F5F5F5',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                color: isRecording ? '#E53935' : '#777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="음성 입력"
            >
              🎤
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isDataLoaded ? "메시지를 입력하세요..." : "로딩 중..."}
              disabled={!isDataLoaded}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #EEE',
                borderRadius: '24px',
                outline: 'none',
                fontSize: '15px',
                backgroundColor: isDataLoaded ? '#F9F9F9' : '#F5F5F5'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || !isDataLoaded}
              style={{
                background: (isLoading || !input.trim() || !isDataLoaded) ? '#EEE' : '#FF8A80',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '24px',
                cursor: (isLoading || !input.trim() || !isDataLoaded) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '800',
                transition: 'all 0.2s',
                boxShadow: (isLoading || !input.trim() || !isDataLoaded) ? 'none' : '0 4px 12px rgba(255, 138, 128, 0.3)',
                flexShrink: 0
              }}
            >
              전송
            </button>
          </div>
          </div>
        </div>
        </>
      )}
    </>
  );
};

export default ChatBot;
