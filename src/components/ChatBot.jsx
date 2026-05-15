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
            supabase.from('parties').select('*').eq('status', 'approved').gte('date', todayStr).limit(15),
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
        const partiesInfo = dbData.parties.map(p => `- [${p.date}] ${p.title} (${p.locationName || p.location_name || '장소 미정'})`).join('\n').slice(0, 800);
        const bootcampsInfo = dbData.bootcamps.map(b => `- ${b.title} (강사: ${b.instructor_name || '미상'})`).join('\n').slice(0, 800);
        const instructorsInfo = dbData.instructors.map(i => `- ${i.name} (장르: ${i.genres || '미상'})`).join('\n').slice(0, 800);
        
        dataContext = `
[최신 플랫폼 데이터]
* 파티:
${partiesInfo || '예정된 파티 없음'}

* 모집 중인 강의:
${bootcampsInfo || '모집 중인 강의 없음'}

* 강사 목록:
${instructorsInfo || '강사 목록 없음'}
`;
      }

      const systemPrompt = `당신은 사용자의 귀찮음을 해결해 주는 센스 있고 위트 있는 '오늘밤빠' 전용 프리미엄 컨시어지입니다. 

[대화의 대원칙]
1. 절대 한 번에 정보를 쏟아내지 마세요(정보 공해 금지). 유저의 답변을 듣고 한 번에 딱 한 가지 질문만 던집니다.
2. **[중요] 플랫폼 안내 멘트는 대화 중간에 절대 하지 마세요.** 오직 모든 질문이 끝나고 **최종 추천을 하는 마지막 단계에서만** 딱 한 번 안내하세요. (예: "더 자세한 정보는 '오늘밤빠' 메뉴에서 확인하실 수 있어요! ✨")
3. 유저가 '놀고 싶을 때(빠/파티)'와 '배우고 싶을 때(강사/강의)'를 명확히 구분하여 응대하세요.

[시나리오 A: 파티/빠 추천을 원할 때]
1단계(지역) -> 2단계(구역) -> 3단계(장르) -> 4단계(최종 추천 + 플랫폼 안내) 순서로 진행.

[시나리오 B: 강사/강의 추천을 원할 때]
1단계(장르) -> 2단계(레벨) -> 3단계(최종 추천 + 플랫폼 안내) 순서로 진행.

${ADMIN_KNOWLEDGE}

${dataContext}

[엄격한 금기사항]
- 데이터베이스에 없는 정보는 절대 지어내지 마세요.
- 답변은 무조건 3~4줄 이내로 간결하게 작성하세요. 서론/결론은 생략하고 핵심만 찌르세요.`;
      
      const apiContents = [];
      apiContents.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
      });
      apiContents.push({
          role: 'model',
          parts: [{ text: "네, 유저님의 노력이 담긴 플랫폼의 가치를 잘 전달할 수 있도록 실시간 데이터를 기반으로 센스 있게 응대하겠습니다." }]
      });

      for (let i = 1; i < newMessages.length; i++) {
          apiContents.push({
              role: newMessages[i].role,
              parts: [{ text: newMessages[i].content }]
          });
      }

      response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
