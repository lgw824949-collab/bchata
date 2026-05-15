import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 관리자가 수동으로 동호회/빠 변동 사항을 기록하는 공간
const ADMIN_KNOWLEDGE = `
[관리자 팩트 체크 및 주의사항]
- 입장료 정보: 일반 정모는 서울권 12,000원, 지방 10,000원 수준입니다. 파티는 보통 15,000원 ~ 30,000원 사이입니다.
- 음악 비율: 보통 바차타 4 : 살사 2, 혹은 바차타 3 : 살사 3 비율입니다.
- 동호회 언급 금지: 특정 동호회 이름은 절대 언급하지 마세요. 동호회 관련 질문 시 특정 이름 대신 그냥 각 빠(Bar)의 "동호회"라고만 뭉뚱그려 대답하세요.
`;

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "안녕하세요! 밤빠 AI예요 🎶\n오늘 파티, 강사, 장소 뭐든 물어보세요!" }
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
            supabase.from('parties').select('*').eq('status', 'approved').gte('date', todayStr).limit(30),
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is missing');
      }

      let dataContext = "현재 실시간 데이터베이스 정보가 없습니다.";
      if (dbData) {
        // 토큰 절약을 위해 일부 텍스트만 요약 (최대 1000자 내외)
        const partiesInfo = dbData.parties.map(p => `- [${p.date}] ${p.title} (${p.locationName || p.location_name || '장소 미정'})`).join('\n').slice(0, 1500);
        const bootcampsInfo = dbData.bootcamps.map(b => `- ${b.title} (강사: ${b.instructor_name || '미상'})`).join('\n').slice(0, 1500);
        const instructorsInfo = dbData.instructors.map(i => `- ${i.name}`).join('\n').slice(0, 1500);
        
        dataContext = `
[최신 플랫폼 데이터]
* 예정된 파티(최근 30개 요약):
${partiesInfo || '예정된 파티 없음'}

* 모집 중인 부트캠프:
${bootcampsInfo || '모집 중인 강의 없음'}

* 활동 중인 강사 목록:
${instructorsInfo || '강사 목록 없음'}
`;
      }

      const systemPrompt = `당신은 사용자의 귀찮음을 해결해 주는 센스 있고 위트 있는 '오늘밤빠' 전용 라틴댄스 컨시어지입니다. 
정보를 한꺼번에 쏟아내는 것은 '정보 공해'입니다. 반드시 다음의 **[3단계 질문 깔때기]**를 통해 유저의 선택을 도와주세요.

[3단계 질문 깔때기 가이드라인]
1단계: 지역 파악 (수도권 vs 지방)
- 유저가 장소를 먼저 말하지 않았다면, 가장 먼저 지역을 물어보세요. (예: "오늘 밤 어디서 춤추고 싶으세요? 수도권인가요, 지방권인가요?")
2단계: 세부 구역 파악 (예: 강남 vs 홍대)
- 지역이 파악되면 세부 구역을 물으세요. (예: "서울이시군요! 강남권인가요, 아니면 홍대권인가요?")
3단계: 장르 파악 (살사, 바차타, 키좀바, 주크)
- 구역이 파악되면 선호 장르를 묻습니다. (예: "마지막으로 오늘 밤 어떤 음악에 몸을 맡기고 싶으신가요? (바차타, 살사, 키좀바, 주크)")

[추천 및 답변 규칙]
- 위 단계가 모두 완료되었을 때만 [최신 플랫폼 데이터]에서 딱 1~2곳만 골라 **아주 짧고 센스 있게** 추천하세요.
- 추천 형식: [파티명], [장소], [음악비율], [입장료] 정보만 한 줄씩 요약.
- **모든 답변은 최대한 짧고 간결하게 작성하세요.** 유저가 읽기 지루하지 않게 서론/결론은 생략하고 '위트' 있게 핵심만 답합니다.
- 유저가 이미 특정 정보를 말했으면(예: "나 지금 강남이야") 해당 단계는 즉시 건너뛰고 다음 단계 질문을 하세요.

${ADMIN_KNOWLEDGE}

${dataContext}

[엄격한 금기사항]
- 데이터에 없는 정보는 절대 지어내지(Hallucination) 말고 모른다고 하세요.
- 한 번에 두 가지 단계의 질문을 던지지 마세요. 무조건 한 번에 딱 하나만 묻습니다.`;
      
      const apiContents = [];
      apiContents.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
      });
      apiContents.push({
          role: 'model',
          parts: [{ text: "네, 엄격한 제약조건과 제공해주신 실시간 데이터를 바탕으로 정확하고 친절하게 답변하겠습니다." }]
      });

      for (let i = 1; i < newMessages.length; i++) {
          apiContents.push({
              role: newMessages[i].role,
              parts: [{ text: newMessages[i].content }]
          });
      }

      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents: apiContents })
      });

      data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API request failed');
      
      if (data.candidates && data.candidates.length > 0) {
        const reply = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'model', content: reply }]);
      } else {
         setMessages(prev => [...prev, { role: 'model', content: "죄송합니다, 답변을 생성하지 못했습니다." }]);
      }

    } catch (error) {
      console.error('Gemini API Error:', error);
      console.error('Response status:', response?.status);
      console.error('Response data:', JSON.stringify(data));
      setMessages(prev => [...prev, { role: 'model', content: "오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
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
          backgroundColor: '#E53935',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          zIndex: 9999,
          transition: 'transform 0.2s',
        }}
      >
        🎵
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
            backgroundColor: '#E53935',
            color: 'white',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>🎶 밤빠 AI</div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                {isDataLoaded ? "실시간 데이터 연동 중..." : "데이터 불러오는 중..."}
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#f8f9fa'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'model' ? 'flex-start' : 'flex-end',
                backgroundColor: msg.role === 'model' ? 'white' : '#E53935',
                color: msg.role === 'model' ? '#333' : 'white',
                padding: '10px 14px',
                borderRadius: '16px',
                borderTopLeftRadius: msg.role === 'model' ? '4px' : '16px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                maxWidth: '85%',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                fontSize: '14px',
                lineHeight: '1.5'
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
                background: (isLoading || !input.trim() || !isDataLoaded) ? '#ccc' : '#E53935',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: (isLoading || !input.trim() || !isDataLoaded) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
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
