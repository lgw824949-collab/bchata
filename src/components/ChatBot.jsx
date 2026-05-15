import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 관리자가 수동으로 동호회/빠 변동 사항을 기록하는 공간
const ADMIN_KNOWLEDGE = `
[관리자 팩트 체크 및 주의사항]
- 이 영역에 작성된 내용은 시스템이 인식하는 최우선 팩트입니다.
- 특정 동호회가 활동을 중단했거나 장소를 옮겼을 경우 아래에 명시된 내용을 바탕으로 대답하세요.
(예: A동호회는 홍대 마콘도에서 강남 턴으로 이동함)
- B동호회는 더 이상 활동하지 않음.
- 기타 특이사항 발생 시 여기에 추가 기록하세요.
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

      const systemPrompt = `당신은 '오늘밤빠' 라틴댄스 파티 플랫폼의 공식 AI 어시스턴트입니다.
사용자의 질문에 한국어로 친근하고 예의 바르게 답변하세요.

${ADMIN_KNOWLEDGE}

${dataContext}

[엄격한 제약조건]
1. 위 [최신 플랫폼 데이터] 및 [관리자 팩트 체크]에 명시되지 않은 동호회, 빠, 강사 정보에 대해 질문받으면, "해당 정보는 현재 데이터에 없습니다" 또는 "업데이트된 정보가 없습니다"라고 답하고 절대 상상해서 지어내지(Hallucination) 마세요.
2. 사실이 아닌 내용을 그럴싸하게 꾸며내는 거짓말은 절대 금지됩니다.
3. 주어진 데이터 내에서 매칭되는 내용이 있다면, 그 내용을 바탕으로 친절하게 추천해 주세요.`;
      
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
