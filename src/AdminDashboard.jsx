import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChevronLeft, Check, Trash2, ShieldCheck, X, RefreshCw, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminDashboard({ onBack, onNavigateToClass }) {
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
      let query;
      if (activeTab === 'approved') {
        // 승인된 데이터는 parties 테이블에서 가져옴 (장소명 조인)
        query = supabase.from('parties').select('*, locations(name)');
      } else {
        // 대기중/반려됨 데이터는 pending_parties 테이블에서 가져옴
        query = supabase.from('pending_parties').select('*').eq('status', activeTab);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
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

  // 승인 처리 (pending_parties -> parties)
  const approveParty = async (item) => {
    if (!window.confirm('이 파티를 승인하여 전체 공개하시겠습니까?')) return
    setLoading(true)
    try {
      // 1. 장소 ID 확인 (locations 테이블)
      let locationId = null;
      const { data: loc } = await supabase.from('locations').select('id').eq('name', item.location_name).maybeSingle();
      if (loc) {
        locationId = loc.id;
      } else {
        // 장소가 없으면 새로 추가
        const { data: newLoc, error: locError } = await supabase.from('locations').insert([{
          name: item.location_name,
          address: item.address || '',
          region_id: 1 // 기본 서울
        }]).select().single();
        if (locError) throw locError;
        locationId = newLoc.id;
      }

      // 2. parties 테이블에 삽입
      const { error: insError } = await supabase.from('parties').insert([{
        title: item.title,
        day_of_week: item.day_of_week,
        date: item.date,
        time: item.time,
        location_id: locationId,
        poster_url: item.poster_url,
        address: item.address,
        fee: item.fee,
        s_ratio: item.s_ratio,
        b_ratio: item.b_ratio,
        j_ratio: item.j_ratio,
        k_ratio: item.k_ratio,
        title_en: item.title_en
      }])
      if (insError) throw insError;

      // 3. pending_parties에서 삭제
      const { error: delError } = await supabase.from('pending_parties').delete().eq('id', item.id);
      if (delError) throw delError;

      alert('승인 및 배포 완료!');
      fetchData();
    } catch (err) {
      alert('승인 처리 실패: ' + err.message);
    } finally {
      setLoading(false)
    }
  }

  // 영구 삭제
  const deleteParty = async (id) => {
    if (!window.confirm('DB에서 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    setLoading(true)
    try {
      const targetTable = activeTab === 'approved' ? 'parties' : 'pending_parties';
      const { error } = await supabase
        .from(targetTable)
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
        <button onClick={fetchData} disabled={loading} style={{ padding: '8px', color: '#FF1744', background: 'none', border: 'none', cursor: 'pointer' }}><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
      </header>

      {/* 클래스 관리 바로가기 버튼 */}
      <button
        onClick={() => onNavigateToClass && onNavigateToClass()}
        style={{
          width: 'calc(100% - 32px)',
          margin: '12px 16px 0',
          padding: '14px',
          background: '#2ECC71',
          color: '#fff',
          fontSize: '15px',
          fontWeight: 900,
          border: 'none',
          borderRadius: '14px',
          cursor: 'pointer'
        }}
      >
        📚 클래스 관리
      </button>

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
                    <div>📍 {item.locations?.name || item.location_name || item.address}</div>
                    <div>📅 {item.date} ({item.day_of_week}) | ⏰ {item.time}</div>
                    <div style={{ color: '#FF1744', fontWeight: 700 }}>💰 {item.fee}</div>
                  </div>
                  
                  {/* 버튼 영역 */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    {activeTab === 'pending' && (
                      <>
                        <button onClick={() => approveParty(item)} style={{ flex: 2, background: '#00FF00', color: 'black', padding: '10px', borderRadius: '10px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>승인하기</button>
                        <button onClick={() => deleteParty(item.id)} style={{ flex: 1, background: '#EF4444', color: 'white', padding: '10px', borderRadius: '10px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>반려</button>
                      </>
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
