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

  // 챗봇 오픈 시 플랫폼 실시간 데이터 로드
  useEffect(() => {
    if (isOpen && !isDataLoaded) {
      const fetchData = async () => {
        try {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          const [partiesRes, bootcampsRes, instructorsRes] = await Promise.all([
            supabase.from('parties').select('*').eq('status', 'approved').gte('date', todayStr).limit(10),
            supabase.from('bootcamps').select('*').eq('status', 'active'),
            supabase.from('instructors').select('*').eq('status', 'active')
          ]);
          setDbData({
            parties: partiesRes.data || [],
            bootcamps: bootcampsRes.data || [],
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

    let response, data;
    try {
      // Groq API Implementation
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqApiKey) {
        console.error('Groq API key is missing');
        setIsLoading(false);
        return;
      }

      let dataContext = "현재 실시간 데이터베이스 정보가 없습니다.";
      if (dbData) {
        const partiesInfo = dbData.parties.map(p => {
          const venue = p.locationName || p.location_name || '장소 정보 확인 필요';
          return `- 파티명: ${p.title} | 장소: ${venue} | 날짜: ${p.date} | 입장료: ${p.price || '정보 없음'} | 지역: ${p.region || '정보 없음'}`;
        }).join('\n');
        const bootcampsInfo = dbData.bootcamps.map(b => `- ${b.title} | 강사: ${b.instructor_name || '정보 없음'}`).join('\n');
        const instructorsInfo = dbData.instructors.map(i => `- 강사명: ${i.name} | 장르: ${i.genres} | 지역: ${i.region || '정보 없음'} | SNS: ${i.instagram_id || i.sns_id || '없음'} | 상세링크: /instructors/${i.id} | 가격: ${i.price || '문의'}`).join('\n');
        dataContext = `\n\n[실시간 팩트 데이터]\n* 파티:\n${partiesInfo}\n* 강의:\n${bootcampsInfo}\n* 강사:\n${instructorsInfo}\n${ADMIN_KNOWLEDGE}`;
      }

      const systemPrompt = `당신은 '오늘밤빠' 플랫폼의 초간편 티키타카 가이드 '밤빠봇'입니다. 

[강사 추천 규칙 - 절대 준수]
1. 강사 추천 시 반드시 위 [실시간 팩트 데이터]에 있는 데이터만 사용하세요. (지어내기 금지)
2. 추천 형식: 이름 + 장르 + 활동지역 + SNS(있을 경우) 순서로 안내하세요.
   - 예: "🎵 홍길동 강사 | 바차타·살사 | 서울 홍대 | @instagram_id"
3. 유저가 장르를 말하면 해당 '장르' 정보를 기준으로 필터링하세요.
4. 유저가 지역을 말하면 해당 '지역' 정보를 기준으로 필터링하세요.
5. 매칭 강사가 없으면 "현재 해당 조건의 강사 정보가 없어요 😢" 라고만 답하세요.
6. 가격 정보는 유저가 직접 물어볼 때만 안내하세요.
7. 강사 상세링크가 있다면 함께 안내하세요.
8. 한 번에 최대 3명까지만 추천하세요.

[바(파티장소) 추천 규칙 - 절대 준수]
1. 바 추천 시 반드시 위 [실시간 팩트 데이터]의 파티 데이터를 사용하세요. (지어내기 금지)
2. 추천 형식: 파티명 + 날짜 + 장소 + 입장료 순서로 안내하세요.
   - 예: "🎶 [XX빠] 바차타 나잇 | 5/17(토) | 홍대 XX | 12,000원"
3. 유저가 장르를 말하면 해당 장르의 파티만 필터링하세요.
4. 유저가 지역을 말하면 해당 지역의 파티만 필터링하세요.
5. 오늘 이후 날짜의 파티만 추천하세요. (지난 파티 추천 금지)
6. 매칭 파티가 없으면 "현재 해당 조건의 파티 정보가 없어요 😢" 라고만 답하세요.
7. 한 번에 최대 3개까지만 추천하세요.
8. 유저가 "오늘", "이번 주말" 등 시간 표현을 쓰면 해당 날짜에 맞는 파티를 필터링하세요.

[대화 전략: 티키타카 퍼널]
1. 단계적 질문: 지역 -> 장르 -> 레벨 순으로 질문하여 범위를 좁히세요.
2. 메타 발언 금지: 내부 판단이나 혼잣말은 절대 답변에 포함하지 마세요. 
3. 3C 원칙: 답변은 무조건 2~3줄 이내. 번호 선택형만 사용.

${dataContext}`;

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...newMessages.slice(-8).map(msg => ({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.content
        }))
      ];

      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

      data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Groq API request failed');

      if (data.choices && data.choices.length > 0) {
        const reply = data.choices[0].message.content;
        setMessages(prev => [...prev, { role: 'model', content: reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: "죄송합니다, 답변을 생성하지 못했습니다." }]);
      }

    } catch (error) {
      console.error('Groq API Error:', error);
      const isQuotaError = response?.status === 429 || error.message?.includes('429') || error.message?.includes('quota');
      const errorMessage = isQuotaError 
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
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '350px',
          height: '70vh',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <style>
            {`
              @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}
          </style>
          
          <div style={{
            backgroundColor: 'white',
            color: '#333',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #F0F0F0'
          }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: '#FF8A80' }}>✨ 밤빠 컨시어지</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px', fontWeight: '500' }}>
                {isDataLoaded ? "실시간 연동 중" : "정보를 불러오고 있어요"}
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#BBB', cursor: 'pointer', fontSize: '22px', padding: '4px' }}
            >
              ✕
            </button>
          </div>

          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'white'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'model' ? 'flex-start' : 'flex-end',
                backgroundColor: msg.role === 'model' ? '#FFFFFF' : '#FCE4EC',
                color: msg.role === 'model' ? '#444' : '#555',
                padding: '12px 16px',
                borderRadius: '18px',
                borderTopLeftRadius: msg.role === 'model' ? '4px' : '18px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '18px',
                border: msg.role === 'model' ? '1px solid #EAEAEA' : 'none',
                maxWidth: '85%',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                fontSize: '14.5px',
                lineHeight: '1.6',
                fontWeight: '500'
              }}>
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#888', marginLeft: '4px' }}>
                입력 중...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <button
              onClick={startVoiceRecognition}
              style={{
                background: isRecording ? '#ffebee' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '8px',
                borderRadius: '50%',
                color: isRecording ? '#E53935' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
              placeholder={isDataLoaded ? "메시지를 입력하세요..." : "데이터 로딩 중..."}
              disabled={!isDataLoaded}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                outline: 'none',
                fontSize: '14px',
                backgroundColor: isDataLoaded ? 'white' : '#f5f5f5'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || !isDataLoaded}
              style={{
                background: (isLoading || !input.trim() || !isDataLoaded) ? '#EEE' : '#FF8A80',
                color: 'white',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '20px',
                cursor: (isLoading || !input.trim() || !isDataLoaded) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                transition: 'all 0.2s',
                boxShadow: (isLoading || !input.trim() || !isDataLoaded) ? 'none' : '0 2px 8px rgba(255, 138, 128, 0.3)'
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
