import React, { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "안녕하세요! 밤빠 AI예요 🎶\n오늘 파티, 강사, 장소 뭐든 물어보세요!" }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is missing');
      }

      const systemPrompt = "당신은 오늘밤빠 라틴댄스 파티 플랫폼의 AI 어시스턴트입니다. 파티/강사/장소/일정 관련 질문에 답변해주세요. 한국어로 친근하게 답변하세요.";
      
      const apiContents = [];
      apiContents.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
      });
      apiContents.push({
          role: 'model',
          parts: [{ text: "네, 알겠습니다. 오늘밤빠 라틴댄스 파티 플랫폼의 AI 어시스턴트로서 친근하게 답변해 드리겠습니다." }]
      });

      for (let i = 1; i < newMessages.length; i++) {
          apiContents.push({
              role: newMessages[i].role,
              parts: [{ text: newMessages[i].content }]
          });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents: apiContents })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const reply = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'model', content: reply }]);
      } else {
         setMessages(prev => [...prev, { role: 'model', content: "죄송합니다, 답변을 생성하지 못했습니다." }]);
      }

    } catch (error) {
      console.error(error);
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
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>오늘 어떤 파티 찾으세요?</div>
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
              placeholder="메시지를 입력하세요..."
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                background: (isLoading || !input.trim()) ? '#ccc' : '#E53935',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
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
