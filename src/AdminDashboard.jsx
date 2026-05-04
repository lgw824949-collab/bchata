import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChevronLeft, Check, Trash2, ShieldCheck, X, RefreshCw, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminDashboard({ onBack, setView }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginStep, setLoginStep] = useState(1)
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [parties, setParties] = useState([])
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'approved', 'rejected'
  const [loading, setLoading] = useState(false)

  // 로그인 처리 (기존 보안 로직 유지)
  const handleLogin = (e) => {
    e.preventDefault()
    const validId = 'lgw1004'
    const validPw = '^^dlwlsdn1052181818'

    if (loginStep === 1) {
      if (adminId === validId) setLoginStep(2)
      else alert('존재하지 않는 아이디입니다.')
      return
    }

    if (password === validPw) {
      setIsAdmin(true)
      localStorage.setItem('admin_login_time', Date.now().toString())
      fetchData()
    } else {
      alert('비밀번호가 틀렸습니다.')
    }
  }

  // 데이터 불러오기 (소셜 파티 전용)
  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setParties(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) fetchData()
  }, [activeTab, isAdmin])

  // 상태 업데이트 (승인/반려)
  const updateStatus = async (id, newStatus) => {
    if (!window.confirm(`상태를 [${newStatus}]로 변경하시겠습니까?`)) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('parties')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) throw error
      alert('변경되었습니다.')
      fetchData()
    } catch (err) {
      alert('오류 발생: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 영구 삭제
  const deleteParty = async (id) => {
    if (!window.confirm('DB에서 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('parties')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      alert('삭제되었습니다.')
      fetchData()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
        <ShieldCheck size={80} color="#FF1744" style={{ margin: '0 auto 32px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 900 }}>BAMPPA ADMIN</h1>
        <p style={{ color: '#94A3B8', marginTop: '12px' }}>관리자 로그인이 필요합니다.</p>
        <form onSubmit={handleLogin} style={{ marginTop: '50px', maxWidth: '320px', margin: '50px auto 0' }}>
          <input 
            type={loginStep === 1 ? "text" : "password"}
            value={loginStep === 1 ? adminId : password}
            onChange={e => loginStep === 1 ? setAdminId(e.target.value) : setPassword(e.target.value)}
            placeholder={loginStep === 1 ? "아이디" : "비밀번호"}
            style={{ width: '100%', padding: '20px', borderRadius: '20px', border: '2px solid #334155', backgroundColor: '#0F172A', color: 'white', textAlign: 'center', fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}
          />
          <button type="submit" style={{ width: '100%', padding: '20px', background: '#FF1744', color: 'white', borderRadius: '20px', fontWeight: 900, fontSize: '18px', border: 'none', cursor: 'pointer' }}>
            {loginStep === 1 ? '다음' : '로그인'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#F1F5F9' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ padding: '8px', color: 'white', background: 'none', border: 'none' }}><ChevronLeft size={28} /></button>
          <div style={{ marginLeft: '12px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 900 }}>소셜 파티 관리</h2>
            <div style={{ fontSize: '11px', color: '#FF1744', fontWeight: 700 }}>SOCIAL_PARTY_OPERATIONS</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setView('class-admin')} 
            style={{ 
              background: '#2ECC71', 
              color: 'white', 
              padding: '10px 14px', 
              borderRadius: '12px', 
              fontWeight: 800, 
              fontSize: '13px', 
              border: 'none', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(46, 204, 113, 0.2)'
            }}
          >
            클래스 관리
          </button>
          <button onClick={fetchData} disabled={loading} style={{ padding: '8px', color: '#FF1744', background: 'none', border: 'none', cursor: 'pointer' }}><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </header>

      {/* 탭 구성 */}
      <div style={{ display: 'flex', padding: '16px', gap: '8px' }}>
        {[
          { id: 'pending', label: '대기중', color: '#F59E0B' },
          { id: 'approved', label: '승인됨', color: '#00FF00' },
          { id: 'rejected', label: '반려됨', color: '#EF4444' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '15px', border: 'none', 
              background: activeTab === tab.id ? tab.color : '#1E293B', 
              color: activeTab === tab.id ? 'black' : '#94A3B8', 
              fontWeight: 800, fontSize: '13px' 
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 목록 영역 */}
      <div style={{ padding: '0 16px 40px' }}>
        {parties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748B' }}>데이터가 없습니다.</div>
        ) : (
          parties.map(item => (
            <div key={item.id} style={{ backgroundColor: '#0F172A', borderRadius: '24px', padding: '20px', marginBottom: '16px', border: '1px solid #1E293B' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                {item.poster_url && <img src={item.poster_url} style={{ width: '70px', height: '95px', objectFit: 'cover', borderRadius: '12px' }} alt="Poster" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>ID: {item.id} | {item.created_at?.split('T')[0]}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 6px 0', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                  <div style={{ fontSize: '13px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div>📍 {item.location_name || item.address}</div>
                    <div>📅 {item.date} ({item.day_of_week}) | ⏰ {item.time}</div>
                    <div style={{ color: '#FF1744', fontWeight: 700 }}>💰 {item.fee}</div>
                  </div>
                  
                  {/* 버튼 영역 */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    {activeTab !== 'approved' && (
                      <button onClick={() => updateStatus(item.id, 'approved')} style={{ flex: 2, background: '#00FF00', color: 'black', padding: '10px', borderRadius: '10px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>승인하기</button>
                    )}
                    {activeTab === 'pending' && (
                      <button onClick={() => updateStatus(item.id, 'rejected')} style={{ flex: 1, background: '#EF4444', color: 'white', padding: '10px', borderRadius: '10px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>반려</button>
                    )}
                    <button onClick={() => deleteParty(item.id)} style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '10px', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
