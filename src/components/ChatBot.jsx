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
            supabase.from('parties').select('*').eq('status', 'approved').gte('date', todayStr).limit(10),
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
          return `- 파티명: ${p.title} | 장소: ${venue} | 날짜: ${p.date} | 입장료: ${p.fee || '정보 없음'} | 지역: ${p.broadRegion || p.region || '전국'}`;
        }).join('\n');
        const instructorsInfo = dbData.instructors.map(i => `- 강사명: ${i.name} | 장르: ${i.genres || '정보 없음'} | 지역: ${i.region || i.broadRegion || '정보 없음'} | SNS: ${i.instagram_id || i.sns_id || '없음'} | 가격: ${i.price || '문의'}`).join('\n');
        dataContext = `\n\n[실시간 팩트 데이터]\n오늘 날짜: ${todayStr}\n* 파티:\n${partiesInfo}\n* 강사:\n${instructorsInfo}\n${ADMIN_KNOWLEDGE}`;
      }

      const systemPrompt = `당신은 '오늘밤빠'의 초정밀 티키타카 가이드 '밤빠봇'입니다.
절대 정보를 한꺼번에 주지 마세요. 유저의 답변을 기다리며 한 단계씩 질문하세요.

[유저 현재 상황]
- 오늘 날짜: ${todayStr}
- 실시간 위치: ${currentRegion || '확인 중'}

[절대 규칙: 티키타카 퍼널]
1. 위치 확인 단계: 유저가 정보를 요청하면 리스트를 먼저 내뱉지 말고 무조건 "지금 계신 ${currentRegion || '이 지역'} 정보를 바로 보여드릴까요? 1. 예, 2. 다른 지역" 이라고만 물으세요.
2. 장르 확인 단계: 위치가 확인되면 "좋아요! 어떤 장르를 선호하세요? 1. 바차타, 2. 살사, 3. 전체" 라고 물으세요.
3. 최종 추천 단계: 장르까지 확정된 후에만 해당 조건의 파티를 딱 1~2개만 핵심 정보를 안내하세요.
4. 초보자 중심: 복잡한 데이터 나열은 피하고 "여기가 초보자분들도 가기 좋은 핫스팟이에요! ✨" 처럼 친근하고 짧게 답변하세요.
5. 장문 금지: 인사/설명 생략. 무조건 3줄 이내, 번호 선택형 중심. 'undefined' 노출 시 즉시 차단.

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
            {messages.map((msg, idx) => (
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
                {msg.content}
              </div>
            ))}
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
