import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, UserPlus, Mail, Lock, ChevronRight, PartyPopper, UserCircle, Phone, ChevronLeft } from 'lucide-react'

const Auth = ({ onAuthSuccess, onMasterSuccess, onBack, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const THEME_ORANGE = '#FF8C00'
  const THEME_GREEN = '#2ECC71'
  const currentTheme = mode === 'login' ? THEME_ORANGE : THEME_GREEN

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Admin bypass logic
      if (name === 'admin' && phone === '12345678') {
        if (onMasterSuccess) onMasterSuccess()
        return
      }

      // Virtual credentials mapping using phone as primary ID
      const virtualEmail = `${phone}@bamba.com`
      const virtualPassword = phone

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: virtualEmail, 
          password: virtualPassword 
        })
        if (error) throw new Error('등록되지 않은 번호이거나 정보가 일치하지 않습니다.')
        if (onAuthSuccess) onAuthSuccess()
      } else {
        if (phone.length < 10) throw new Error('올바른 연락처를 입력해주세요.')
        
        const { error } = await supabase.auth.signUp({ 
            email: virtualEmail,
            password: virtualPassword,
            options: {
                data: {
                    nickname: name,
                    phone: phone
                }
            }
        })
        if (error) throw error
        alert('회원가입이 완료되었습니다! 가입하신 정보로 로그인해주세요.')
        setMode('login')
      }
    } catch (error) {
      let errMsg = error.message
      // [CRITICAL] Hide 'email' keyword from user at all costs
      if (errMsg.toLowerCase().includes('email')) {
        errMsg = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      } else if (errMsg.includes('rate limit')) {
        errMsg = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
      }
      setMessage(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9CA3AF' }}><ChevronLeft size={24} /></button>
          <div className="auth-logo" style={{ margin: 0, width: '48px', height: '48px', backgroundColor: `${currentTheme}15` }}>
            <PartyPopper size={24} color={currentTheme} />
          </div>
          <div style={{ width: '24px' }}></div>
        </div>

        <div className="auth-header">
          <h1 style={{ color: currentTheme }}>{mode === 'login' ? '간편 로그인' : '멤버 가입'}</h1>
          <p>{mode === 'login' ? '성함과 번호를 입력해주세요' : '정보를 입력하고 바로 이용하세요'}</p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          <div className="input-group">
            <UserCircle className="input-icon" size={18} />
            <input 
              type="text" 
              placeholder="성함 (닉네임)" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              style={{ border: mode === 'signup' ? `1.5px solid ${THEME_GREEN}33` : '1.5px solid #F3F4F6' }}
            />
          </div>
          <div className="input-group">
            <Phone className="input-icon" size={18} />
            <input 
              type="tel" 
              placeholder="휴대폰 번호 (숫자만)" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} 
              required 
              style={{ border: mode === 'signup' ? `1.5px solid ${THEME_GREEN}33` : '1.5px solid #F3F4F6' }}
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn" 
            disabled={loading}
            style={{ backgroundColor: currentTheme }}
          >
            {loading ? '처리 중...' : (mode === 'login' ? '입장하기' : '멤버가입 완료')}
            <ChevronRight size={20} />
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px', background: '#F9FAFB', borderRadius: '12px', fontSize: '11px', color: '#9CA3AF', lineHeight: '1.5' }}>
          <b>[이용자 고지]</b> 타인의 정보를 도용하여 가입하거나 허위 정보를 입력할 경우 서비스 이용 제한 및 법적 처벌을 받을 수 있습니다. 계정 및 연락처 관리에 대한 모든 책임은 본인에게 있습니다.
        </div>

        {message && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className={`auth-message ${message.includes('성공') || message.includes('완료') ? 'success' : 'error'}`}
          >
            {message}
          </motion.p>
        )}

        <div className="auth-footer">
          <span>{mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}</span>
          <button 
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}
            style={{ color: currentTheme }}
          >
            {mode === 'login' ? '멤버가입' : '로그인'}
          </button>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 5000;
        }
        .auth-card {
          background: white;
          width: 100%;
          max-width: 400px;
          padding: 40px 32px;
          border-radius: 32px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.03);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-logo {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        .auth-header h1 {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .auth-header p {
          color: #94A3B8;
          font-size: 15px;
          font-weight: 500;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-group {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }
        .input-group input {
          width: 100%;
          padding: 18px 16px 18px 48px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s;
          background: #F8FAFC;
        }
        .input-group input:focus {
          background: white;
          outline: none;
          box-shadow: 0 0 0 4px rgba(0,0,0,0.03);
        }
        .auth-submit-btn {
          margin-top: 8px;
          color: white;
          border: none;
          padding: 18px;
          border-radius: 16px;
          font-size: 17px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .auth-submit-btn:active {
          transform: scale(0.98);
        }
        .auth-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .auth-message {
          margin-top: 16px;
          font-size: 14px;
          text-align: center;
          font-weight: 700;
        }
        .auth-message.error { color: #E11D48; }
        .auth-message.success { color: #059669; }
        .auth-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 14px;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
        }
        .auth-footer button {
          background: none;
          border: none;
          font-weight: 800;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 14px;
        }
      `}} />
    </div>
  )
}

export default Auth
