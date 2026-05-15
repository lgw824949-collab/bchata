import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 관리자가 수동으로 동호회/빠 변동 사항을 기록하는 공간
const ADMIN_KNOWLEDGE = `
[관리자 실시간 팩트 체크]
- 입장료: 서울권 약 1.2만원, 지방권 약 1만원, 파티/이벤트는 1.5~3만원 수준입니다.
- 음악 비율: 일반적으로 바차타 4 : 살사 2 또는 바차타 3 : 살사 3 비율로 나옵니다.
- 동호회 명칭: 특정 동호회 이름 대신 각 빠(Bar)의 '동호회'라고만 지칭하세요. 특정 이름 언급은 피합니다.
`;

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "안녕하세요! 밤빠 컨시어지예요 ✨\n오늘 밤, 당신의 완벽한 댄스 파티를 함께 찾아드릴게요! 💖" }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [dbData, setDbData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

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
          
          const [partiesRes, instructorsRes] = await Promise.all([
            supabase.from('parties').select('*, imageUrl').eq('status', 'approved').gte('date', todayStr).limit(10),
            supabase.from('instructors').select('*').eq('status', 'active')
          ]);
          setDbData({
            parties: partiesRes.data || [],
            instructors: instructorsRes.data || []
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqApiKey) throw new Error('Groq API key is missing');

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // 좌표 기반 지역 명칭 추출
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
        dataContext = `\n\n[실시간 팩트 데이터]\n오늘 날짜: ${todayStr}\n* 파티:\n${partiesInfo}\n* 강사:\n${instructorsInfo}\n${ADMIN_KNOWLEDGE}`;
      }

      const systemPrompt = `당신은 '오늘밤빠'의 실시간 컨시어지 '밤빠봇'입니다. 
유저가 추천을 요청하면 아래 3단계 프로세스를 엄격히 따르세요.

[1단계: 장르 확인]
- 즉시 질문: "어떤 장르를 즐기시나요? 1. 바차타, 2. 살사, 3. 전체"

[2단계: 실시간 근거리 추천]
- 장르 선택 시, 유저의 현재 위치(${currentRegion || '주변'})에서 가장 가까운 파티 3개를 추천 순서대로 안내하세요.
- 포맷: "1. [지역명] 파티명 | 날짜 | 입장료"
- **포스터 노출**: 이미지 정보가 있다면 반드시 마지막에 ![poster](이미지URL) 형식으로 한 장만 포함하세요.

[3단계: 지도 및 연결 안내]
- 유저가 지도/상세정보를 원하면: "상세 페이지 하단에 지도가 연결되어 있어요! 즐거운 시간 되세요! ✨" 라고 답하고 대화를 종료하세요.

[절대 규칙]
1. 인사/설명/수식어 모두 생략. 무조건 3줄 이내, 번호 선택형 답변만 하세요.
2. 유저의 현재 실시간 위치(${currentRegion || '주변'}) 정보를 최우선으로 합니다.
3. 'undefined' 노출 금지. 데이터가 없으면 '정보 없음'으로 표시하세요.

${dataContext}`;

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...newMessages.slice(-8).map(msg => ({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.content
        }))
      ];

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Groq API request failed');

      if (data.choices && data.choices.length > 0) {
        const reply = data.choices[0].message.content;
        setMessages(prev => [...prev, { role: 'model', content: reply }]);
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
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#FF8A80',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 15px rgba(255, 138, 128, 0.4)',
          cursor: 'pointer',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        ✨
      </button>

      {isOpen && (
        <div 
          className="chatbot-window"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            height: '75vh',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000,
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <style>
            {`
              @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @media (max-width: 600px) {
                .chatbot-window {
                  width: 100% !important;
                  height: 100dvh !important;
                  bottom: 0 !important;
                  right: 0 !important;
                  border-radius: 0 !important;
                  z-index: 999999 !important;
                }
              }
            `}
          </style>
          
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
      )}
    </>
  );
};

export default ChatBot;
