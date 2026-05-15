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
      /* 
      // Gemini API (Commented out for future use)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is missing');
      }

      let dataContext = "현재 실시간 데이터베이스 정보가 없습니다.";
      if (dbData) {
        const partiesInfo = dbData.parties.map(p => `- ${p.title} (${p.locationName || p.location_name})`).join('\n').slice(0, 500);
        const bootcampsInfo = dbData.bootcamps.map(b => `- ${b.title}`).join('\n').slice(0, 300);
        const instructorsInfo = dbData.instructors.map(i => `- ${i.name}(${i.genres})`).join('\n').slice(0, 300);
        
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

      const systemPrompt = `당신은 '오늘밤빠'의 초간편 컨시어지입니다. 

[대화 규칙 - 절대 준수]
1. 모든 답변은 '번호와 선택지' 위주로 극도로 짧게 작성하세요. (최대 2줄 이내)
2. 인사말, 긴 설명, 불필요한 홍보 멘트는 절대 금지입니다. 
3. 유저가 번호만 보고 고를 수 있게 하세요.

[대화 예시]
유저: 바 추천
AI: "어디로 모실까요? 1. 수도권, 2. 지방"
유저: 1
AI: "좋아하는 장르는? 1. 바차타, 2. 살사, 3. 기타"
유저: 2
AI: "오늘 홍대 [XX빠] 살사 파티가 핫해요! (20:00 시작)"

${ADMIN_KNOWLEDGE}
${dataContext}

[엄격한 금기사항]
- 데이터에 없는 정보는 절대 지어내지 마세요.
- 답변이 길어지면 무조건 탈락입니다. 핵심만 찌르세요.`;
      
      const historyToSend = newMessages.slice(1).slice(-6);
      
      const apiContents = historyToSend.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
      }));

      const requestBody = {
        contents: apiContents,
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.7,
        }
      };

      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API request failed');
      
      if (data.candidates && data.candidates.length > 0) {
        const reply = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'model', content: reply }]);
      } else {
         setMessages(prev => [...prev, { role: 'model', content: "죄송합니다, 답변을 생성하지 못했습니다." }]);
      }
      */

      // Groq API Implementation
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqApiKey) throw new Error('Groq API key is missing');

      let dataContext = "현재 실시간 데이터베이스 정보가 없습니다.";
      if (dbData) {
        const partiesInfo = dbData.parties.map(p => `- ${p.title} (${p.locationName || p.location_name})`).join('\n').slice(0, 500);
        const bootcampsInfo = dbData.bootcamps.map(b => `- ${b.title}`).join('\n').slice(0, 300);
        const instructorsInfo = dbData.instructors.map(i => `- ${i.name}(${i.genres})`).join('\n').slice(0, 300);
        dataContext = `\n\n[실시간 플랫폼 정보]\n* 파티: ${partiesInfo}\n* 강의: ${bootcampsInfo}\n* 강사: ${instructorsInfo}\n${ADMIN_KNOWLEDGE}`;
      }

      const systemPrompt = `당신은 '오늘밤빠' 라틴댄스 커뮤니티의 AI 길잡이 '밤빠봇'입니다.\n\n역할:\n- 전국 라틴댄스 파티, 부트캠프, 페스티벌 정보 안내\n- 강사 및 댄스 장소 추천\n- 초보자 댄스 입문 가이드\n- 바차타, 살사, 쥬크, 키좀바 장르 정보 제공\n\n답변 스타일:\n- 친근하고 활기차게 🎶\n- 짧고 핵심만 명확하게\n- 이모지 적절히 활용\n- 모르는 건 솔직하게${dataContext}`;

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
          model: "llama3-8b-8192",
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
