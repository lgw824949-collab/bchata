import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChevronLeft, Check, Trash2, ShieldCheck, Edit3, X, Save, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CLASS_CATEGORIES, DANCE_STYLES, REGIONS, DAYS } from './lib/constants'

export default function AdminDashboard({ onBack, refreshData }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginStep, setLoginStep] = useState(1) // 1: ID, 2: Password
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [pendingParties, setPendingParties] = useState([])
  const [officialParties, setOfficialParties] = useState([])
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'official', 'traffic', 'lesson'
  const [classItems, setClassItems] = useState([])
  const [classTab, setClassTab] = useState('class') // 'class' or 'club' inside lesson tab
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    recentClicks: 0,
    recentMaps: 0,
    recentTalks: 0,
    regionalData: {},
    partnerStats: null
  })
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editingParty, setEditingParty] = useState(null)
  const [editingClass, setEditingClass] = useState(null)

  // 로그인 처리
  const handleLogin = (e) => {
    e.preventDefault()
    
    // 환경 변수 무시하고 하드코딩된 값으로 강제 고정 (Vercel 환경 변수 충돌 방지)
    const validId = 'lgw1004'
    const validPw = '^^dlwlsdn1052181818'

    if (loginStep === 1) {
      if (adminId === validId) {
        setLoginStep(2)
      } else {
        alert('존재하지 않는 아이디입니다.')
      }
      return
    }

    // 2단계: 비밀번호 체크
    // 잠금 확인
    const lockUntil = localStorage.getItem('admin_lock_until')
    if (lockUntil && Date.now() < parseInt(lockUntil)) {
      const remaining = Math.ceil((parseInt(lockUntil) - Date.now()) / (60 * 1000))
      alert(`⚠️ 5회 실패로 인해 잠금 상태입니다. ${remaining}분 후 다시 시도해주세요.`)
      return
    }

    if (password === validPw) { 
      setIsAdmin(true)
      localStorage.setItem('admin_login_time', Date.now().toString())
      localStorage.removeItem('admin_login_attempts')
      localStorage.removeItem('admin_lock_until')
      fetchPending()
    } else {
      const attempts = (parseInt(localStorage.getItem('admin_login_attempts') || '0')) + 1
      localStorage.setItem('admin_login_attempts', attempts.toString())
      
      if (attempts >= 5) {
        const lockTime = Date.now() + 30 * 60 * 1000 // 30분 잠금
        localStorage.setItem('admin_lock_until', lockTime.toString())
        alert("⚠️ 5회 실패로 30분간 잠금됩니다")
      } else {
        alert(`비밀번호가 틀렸습니다. (남은 시도 횟수: ${5 - attempts})`)
      }
    }
  }

  // 데이터 불러오기
  const fetchPending = async () => {
    const { data, error } = await supabase
      .from('pending_parties')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setPendingParties(data || [])
    
    // 강습/동호회 대기 건도 함께 새로고침
    fetchClasses()
  }

  const fetchOfficial = async () => {
    const { data, error } = await supabase
      .from('parties')
      .select('*, locations(name)')
      .order('date', { ascending: false })
    if (!error) setOfficialParties(data || [])
  }

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes_info')
      .select('*')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
    if (!error) setClassItems(data || [])
  }

  // 과거 데이터 및 포스터 자동 클린업 엔진 (현재 비활성화 - 정밀 점검 예정)
  const performAutoCleanup = async () => {
    console.log('[Auto-Cleanup] Skipping cleanup for safety.')
    return;
    /*
    try {
      const now = new Date()
      const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000))
      const today = kst.toISOString().split('T')[0]

      const [oldParties, oldPending] = await Promise.all([
        supabase.from('parties').select('poster_url').lt('date', today),
        supabase.from('pending_parties').select('poster_url').lt('date', today)
      ])

      const allOldItems = [...(oldParties.data || []), ...(oldPending.data || [])]
      if (allOldItems.length === 0) return

      const filePaths = allOldItems
        .map(item => item.poster_url)
        .filter(url => url && url.includes('/public/posters/'))
        .map(url => url.split('/public/posters/')[1])

      if (filePaths.length > 0) {
        await supabase.storage.from('posters').remove(filePaths)
        console.log(`[Auto-Cleanup] ${filePaths.length} posters deleted.`)
      }

      const { error: delErr1 } = await supabase.from('parties').delete().lt('date', today)
      const { error: delErr2 } = await supabase.from('pending_parties').delete().lt('date', today)
      
      if (delErr1 || delErr2) console.error('Cleanup DB Error:', delErr1 || delErr2)
    } catch (err) {
      console.error('Auto-Cleanup Error:', err)
    }
    */
  }

  useEffect(() => {
    // 세션 만료 체크 (2시간)
    if (isAdmin) {
      const loginTime = localStorage.getItem('admin_login_time')
      if (loginTime && Date.now() - parseInt(loginTime) > 2 * 60 * 60 * 1000) {
        setIsAdmin(false)
        localStorage.removeItem('admin_login_time')
        alert('보안을 위해 세션이 만료되었습니다. 다시 로그인해주세요.')
        return
      }

      if (activeTab === 'pending') fetchPending()
      else if (activeTab === 'official') fetchOfficial()
      else if (activeTab === 'traffic') fetchAnalytics()
      else if (activeTab === 'lesson') fetchClasses()
      performAutoCleanup()
    }
  }, [activeTab, isAdmin])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const { data: recentLogs } = await supabase
        .from('activity_logs')
        .select('*')
        .gt('created_at', fiveMinsAgo)

      const clicks = recentLogs?.filter(l => l.action === 'poster_click').length || 0
      const maps = recentLogs?.filter(l => l.action === 'map_view').length || 0
      const talks = recentLogs?.filter(l => l.action === 'talk_entry').length || 0

      // 지역별 데이터
      const { data: allLogs } = await supabase.from('activity_logs').select('region').limit(1000)
      const regionCounts = {}
      allLogs?.forEach(l => { regionCounts[l.region] = (regionCounts[l.region] || 0) + 1 })

      setStats(prev => ({
        ...prev,
        recentClicks: clicks,
        recentMaps: maps,
        recentTalks: talks,
        regionalData: regionCounts
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPartnerStats = async (partyId) => {
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('target_id', partyId)
    
    const totalViews = logs?.filter(l => l.action === 'poster_click').length || 0
    const mapClicks = logs?.filter(l => l.action === 'map_view').length || 0
    
    setStats(prev => ({
      ...prev,
      partnerStats: { totalViews, mapClicks }
    }))
  }

  const getDayName = (dateStr) => {
    if (!dateStr) return '?'
    const days = ['일', '월', '화', '수', '목', '금', '토']
    // YYYY-MM-DD 직접 파싱하여 타임존 오차 방지
    const parts = dateStr.split('-')
    if (parts.length !== 3) return '?'
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    return isNaN(d.getTime()) ? '?' : days[d.getDay()]
  }

  // [수정 내용 저장]
  const handleUpdate = async () => {
    if (!editingParty) return
    setLoading(true)
    try {
      const table = activeTab === 'pending' ? 'pending_parties' : 'parties'
      // 화면의 모든 input 값을 하나의 객체로 묶어 UPDATE 요청 준비
      const updateData = activeTab === 'pending' ? {
        title: editingParty.title,
        location_name: editingParty.location_name,
        date: editingParty.date,
        time: editingParty.time,
        fee: editingParty.fee
      } : {
        title: editingParty.title,
        date: editingParty.date,
        time: editingParty.time,
        day_of_week: getDayName(editingParty.date), // 요일 자동 재계산 반영
        description: editingParty.description,
        fee: editingParty.fee,
        s_ratio: parseInt(editingParty.s_ratio) || 0,
        b_ratio: parseInt(editingParty.b_ratio) || 0,
        j_ratio: parseInt(editingParty.j_ratio) || 0,
        k_ratio: parseInt(editingParty.k_ratio) || 0
      }

      const { error } = await supabase.from(table).update(updateData).eq('id', editingParty.id)
      
      if (error) throw error

      // 수정 완료 후 즉시 상태 초기화 및 데이터 강제 리로드(Fetch)
      setEditingParty(null)
      if (activeTab === 'pending') {
        await fetchPending()
      } else {
        await fetchOfficial()
      }
      
      if (refreshData) refreshData()
      alert('수정이 완료되었습니다.')
    } catch (err) {
      // 실패 시 구체적인 이유(권한, 네트워크 등)를 화면에 표시
      alert('저장 실패: ' + (err.message || '알 수 없는 오류가 발생했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  // [승인 버튼 - 핵심 로직]
  const handleApprove = async (e, item) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!item) return
    
    setLoading(true)
    try {
      let finalLocId = item.location_id
      if (!finalLocId && item.location_name) {
        const { data: locData } = await supabase
          .from('locations')
          .select('id')
          .eq('name', item.location_name)
          .maybeSingle()
        if (locData) finalLocId = locData.id
      }

      const { error } = await supabase
        .from('parties')
        .insert([{
          title: item.title,
          date: item.date,
          day_of_week: item.day_of_week,
          time: item.time,
          address: item.address,
          fee: item.fee,
          poster_url: item.poster_url,
          s_ratio: item.s_ratio || 0,
          b_ratio: item.b_ratio || 0,
          j_ratio: item.j_ratio || 0,
          k_ratio: item.k_ratio || 0,
          location_id: finalLocId,
        }])
      
      if (error) {
        console.error(error)
        alert('승인 실패: ' + error.message)
        return
      }

      await supabase.from('pending_parties').delete().eq('id', item.id)
      if (refreshData) refreshData()
      alert('승인되었습니다!')
      fetchPending()
    } catch (err) {
      alert('오류 발생: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) {
      alert('삭제할 데이터의 ID를 찾을 수 없습니다.')
      return
    }
    setLoading(true)
    try {
      const targetTable = activeTab === 'pending' ? 'pending_parties' : 'parties'
      const { error } = await supabase
        .from(targetTable)
        .delete()
        .eq('id', id)
      if (error) throw error

      if (activeTab === 'pending') {
        setPendingParties(prev => prev.filter(p => p.id !== id))
      } else {
        setOfficialParties(prev => prev.filter(p => p.id !== id))
      }
      if (refreshData) refreshData()
    } catch (err) {
      alert('삭제 오류: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
        <ShieldCheck size={80} color="#00FF00" style={{ margin: '0 auto 32px', filter: 'drop-shadow(0 0 15px rgba(0,255,0,0.3))' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em' }}>BAMBPA COMMAND</h1>
        <p style={{ color: '#94A3B8', marginTop: '12px', fontSize: '15px' }}>Access Restricted to Authorized Personnel Only</p>
        <form onSubmit={handleLogin} style={{ marginTop: '50px', maxWidth: '320px', margin: '50px auto 0' }}>
          {loginStep === 1 ? (
            <input 
              type="text" 
              value={adminId} 
              onChange={e => setAdminId(e.target.value)} 
              placeholder="OPERATOR ID" 
              autoFocus
              style={{ 
                width: '100%', 
                padding: '20px', 
                borderRadius: '20px', 
                border: '2px solid #334155', 
                backgroundColor: '#0F172A',
                color: 'white',
                textAlign: 'center', 
                fontSize: '18px',
                fontWeight: 800,
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }} 
            />
          ) : (
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="ACCESS KEY" 
              autoFocus
              style={{ 
                width: '100%', 
                padding: '20px', 
                borderRadius: '20px', 
                border: '2px solid #334155', 
                backgroundColor: '#0F172A',
                color: 'white',
                textAlign: 'center', 
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '0.2em',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }} 
            />
          )}
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: '20px', 
              background: 'linear-gradient(135deg, #00FF00 0%, #00CC00 100%)', 
              color: 'black', 
              borderRadius: '20px', 
              marginTop: '20px', 
              fontWeight: 900,
              fontSize: '18px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(0,255,0,0.2)'
            }}
          >
            {loginStep === 1 ? 'NEXT STEP' : 'INITIALIZE'}
          </button>
          {loginStep === 2 && (
            <button 
              type="button"
              onClick={() => setLoginStep(1)}
              style={{ marginTop: '15px', background: 'none', border: 'none', color: '#94A3B8', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to ID entry
            </button>
          )}
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
            <h2 style={{ fontSize: '17px', fontWeight: 900, marginBottom: '2px', letterSpacing: '-0.02em' }}>OPERATIONS</h2>
            <div style={{ fontSize: '11px', color: '#00FF00', fontWeight: 700, fontFamily: 'monospace' }}>SECURE_CHANNEL_READY</div>
          </div>
        </div>
        <button onClick={activeTab === 'pending' ? fetchPending : fetchOfficial} disabled={loading} style={{ padding: '8px', color: '#00FF00', background: 'none', border: 'none' }}><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
      </header>

      <div style={{ display: 'flex', padding: '16px', gap: '8px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ flexShrink: 0, padding: '12px 20px', borderRadius: '15px', border: 'none', background: activeTab === 'pending' ? '#00FF00' : '#1E293B', color: activeTab === 'pending' ? 'black' : '#94A3B8', fontWeight: 800, fontSize: '13px' }}
        >
          WAITING ({pendingParties.length})
        </button>
        <button 
          onClick={() => setActiveTab('official')}
          style={{ flexShrink: 0, padding: '12px 20px', borderRadius: '15px', border: 'none', background: activeTab === 'official' ? '#00FF00' : '#1E293B', color: activeTab === 'official' ? 'black' : '#94A3B8', fontWeight: 800, fontSize: '13px' }}
        >
          ACTIVE ({officialParties.length})
        </button>
        <button 
          onClick={() => setActiveTab('traffic')}
          style={{ flexShrink: 0, padding: '12px 20px', borderRadius: '15px', border: 'none', background: activeTab === 'traffic' ? '#6366F1' : '#1E293B', color: 'white', fontWeight: 800, fontSize: '13px' }}
        >
          TOWER
        </button>
        <button 
          onClick={() => setActiveTab('lesson')}
          style={{ flexShrink: 0, padding: '12px 20px', borderRadius: '15px', border: 'none', background: activeTab === 'lesson' ? '#F59E0B' : '#1E293B', color: 'white', fontWeight: 800, fontSize: '13px' }}
        >
          ACADEMY ({classItems.filter(i => i.status === 'pending').length})
        </button>
      </div>

      <div className="admin-content" style={{ padding: '0 16px 40px' }}>
        {activeTab === 'traffic' ? (
          <div className="traffic-tower-ui">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #00FF00 0%, #00CC00 100%)', color: 'black', padding: '24px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,255,0,0.1)' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, marginBottom: '8px', letterSpacing: '0.1em' }}>LIVE_USERS</div>
                <div style={{ fontSize: '40px', fontWeight: 950, letterSpacing: '-0.05em' }}>{stats.totalUsers || 24}</div>
              </div>
              <div style={{ background: '#1E293B', color: 'white', padding: '24px', borderRadius: '24px', textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', marginBottom: '8px', letterSpacing: '0.1em' }}>TRAFFIC_5M</div>
                <div style={{ fontSize: '40px', fontWeight: 950, letterSpacing: '-0.05em' }}>{stats.recentClicks + stats.recentMaps}</div>
              </div>
            </div>

            <section style={{ background: '#0F172A', padding: '24px', borderRadius: '28px', marginBottom: '24px', border: '1px solid #1E293B' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }} /> 
                PERFORMANCE ANALYTICS
              </h3>
              <select 
                onChange={(e) => {
                  const p = officialParties.find(x => x.id === parseInt(e.target.value))
                  setSelectedPartner(p)
                  if(p) fetchPartnerStats(p.id)
                }}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #E5E7EB', marginBottom: '20px' }}
              >
                <option value="">광고주(Bar) 선택</option>
                {officialParties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>

              {selectedPartner && stats.partnerStats && (
                <div id="report-area">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#6B7280' }}>누적 노출(클릭)</div>
                    <div style={{ fontWeight: 800 }}>{stats.partnerStats.totalViews}회</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#6B7280' }}>지도 버튼 전환</div>
                    <div style={{ fontWeight: 800, color: '#03C75A' }}>{stats.partnerStats.mapClicks}회</div>
                  </div>
                  <div style={{ marginTop: '20px', padding: '16px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                    <div style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 800, marginBottom: '4px' }}>💡 영업 코멘트</div>
                    <p style={{ fontSize: '13px', color: '#1E3A8A', lineHeight: '1.5' }}>
                      "{selectedPartner.title} 사장님, 현재 비회원 유저 비중이 95%로 매우 높습니다. 
                      이는 가입 절차 없이도 실구매 의사가 높은 유저들이 장소를 찾고 있다는 강력한 증거입니다. 
                      지도 클릭 수 {stats.partnerStats.mapClicks}회는 실제 매장 방문으로 이어질 확률이 매우 높습니다."
                    </p>
                  </div>
                </div>
              )}
            </section>

            <button 
              onClick={() => window.print()}
              style={{ width: '100%', padding: '18px', background: 'white', border: '2px solid #E5E7EB', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              📄 영업용 실적 보고서 PDF 출력
            </button>
          </div>
        ) : activeTab === 'pending' ? (
          (() => {
            const pendingLessons = classItems.filter(i => i.status === 'pending');
            const allPending = [...pendingParties, ...pendingLessons].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            if (allPending.length === 0) {
              return <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748B' }}>NO_PENDING_DATA</div>;
            }

            return allPending.map(item => {
              const isLesson = !!item.category_type || item.genre || item.start_time; // 레슨/동호회 판별
              
              return (
                <div key={item.id} style={{ backgroundColor: '#0F172A', borderRadius: '24px', padding: '20px', marginBottom: '16px', border: isLesson ? '2px solid #F59E0B' : '1px solid #1E293B', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {item.poster_url && <img src={item.poster_url} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '15px' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>#{item.id}</div>
                        <div style={{ fontSize: '10px', fontWeight: 900, color: isLesson ? '#F59E0B' : '#00FF00', padding: '2px 8px', borderRadius: '50px', background: 'rgba(255,255,255,0.05)' }}>
                          {isLesson ? 'ACADEMY/CLUB' : 'PARTY'}
                        </div>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 6px 0', color: 'white' }}>{item.title}</h3>
                      
                      {isLesson ? (
                        <>
                          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0' }}>👤 {item.instructor || 'TBA'}</p>
                          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0' }}>📅 {item.day_of_week} / ⏰ {item.start_time}~{item.end_time}</p>
                          <p style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 700, margin: '4px 0' }}>📍 {item.studio_name || item.address}</p>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0' }}>📍 {item.location_name}</p>
                          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0' }}>📅 {item.date} / ⏰ {item.time}</p>
                          <div style={{ backgroundColor: 'rgba(0,255,0,0.1)', color: '#00FF00', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', marginTop: '12px', fontWeight: 700, border: '1px solid rgba(0,255,0,0.2)' }}>{item.ai_reason || '정기 제보'}</div>
                        </>
                      )}
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button 
                          onClick={async (e) => {
                            if (isLesson) {
                              const { error } = await supabase.from('classes_info').update({ status: 'active' }).eq('id', item.id);
                              if (!error) { 
                                if (refreshData) refreshData()
                                alert('승인되었습니다.'); 
                                fetchPending(); 
                              }
                            } else {
                              handleApprove(e, item);
                            }
                          }} 
                          disabled={loading} 
                          style={{ flex: 2, backgroundColor: isLesson ? '#F59E0B' : '#00FF00', color: isLesson ? 'white' : 'black', padding: '12px', borderRadius: '12px', fontWeight: 900, fontSize: '14px', border: 'none' }}
                        >
                          APPROVE
                        </button>
                        <button onClick={() => isLesson ? setEditingClass(item) : setEditingParty(item)} disabled={loading} style={{ flex: 1, backgroundColor: '#1E293B', color: 'white', padding: '12px', borderRadius: '12px', border: 'none' }}><Edit3 size={18} /></button>
                        <button 
                          onClick={async (e) => { 
                            e.stopPropagation(); 
                            if (isLesson) {
                              if (!window.confirm('삭제하시겠습니까?')) return;
                              const { error } = await supabase.from('classes_info').update({ status: 'archived' }).eq('id', item.id);
                              if (!error) { 
                                if (refreshData) refreshData()
                                alert('삭제되었습니다.'); 
                                fetchPending(); 
                              }
                            } else {
                              handleDelete(item.id); 
                            }
                          }} 
                          disabled={loading} 
                          style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        ><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        ) : activeTab === 'lesson' ? (
          <div className="lesson-management-ui">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button 
                onClick={() => setClassTab('class')}
                style={{ flex: 1, padding: '12px', borderRadius: '15px', border: 'none', background: classTab === 'class' ? '#F59E0B' : '#1E293B', color: 'white', fontWeight: 800, fontSize: '12px' }}
              >
                CLASS ({classItems.filter(i => (i.category_type === 'class' || !i.category_type) && i.status === 'pending').length})
              </button>
              <button 
                onClick={() => setClassTab('club')}
                style={{ flex: 1, padding: '12px', borderRadius: '15px', border: 'none', background: classTab === 'club' ? '#F59E0B' : '#1E293B', color: 'white', fontWeight: 800, fontSize: '12px' }}
              >
                CLUB ({classItems.filter(i => i.category_type === 'club' && i.status === 'pending').length})
              </button>
            </div>

            {classItems.filter(item => {
              if (classTab === 'class') return item.category_type === 'class' || !item.category_type
              return item.category_type === 'club'
            }).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748B' }}>NO_LESSON_DATA</div>
            ) : (
              classItems.filter(item => {
                if (classTab === 'class') return item.category_type === 'class' || !item.category_type
                return item.category_type === 'club'
              }).map(item => (
                <div key={item.id} style={{ backgroundColor: '#0F172A', borderRadius: '24px', padding: '20px', marginBottom: '16px', border: item.status === 'pending' ? '2px solid #F59E0B' : '1px solid #1E293B' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {item.poster_url && <img src={item.poster_url} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '15px' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: item.status === 'active' ? '#00FF00' : '#F59E0B', fontWeight: 900, marginBottom: '4px', letterSpacing: '0.05em' }}>{item.status.toUpperCase()}</div>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 6px 0', color: 'white' }}>{item.title}</h3>
                      <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0' }}>👤 {item.instructor || 'TBA'}</p>
                      <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0' }}>📅 {item.day_of_week} / ⏰ {item.start_time}~{item.end_time}</p>
                      <p style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 700, margin: '4px 0' }}>
                        📍 {item.studio_name ? `[${item.studio_name}] ` : ''}{item.address || 'MISSING_ADDRESS'}
                      </p>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        {item.status === 'pending' && (
                          <button onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              const { error } = await supabase.from('classes_info').update({ status: 'active' }).eq('id', item.id)
                              if (error) {
                                alert('승인 실패 (DB): ' + error.message);
                                return;
                              }
                              
                              // 지역명 표준화 (메인 화면 필터 매칭용)
                              const normalizeRegion = (reg) => {
                                if (!reg) return '서울';
                                if (reg.includes('서울')) return '서울';
                                if (reg.includes('경기') || reg.includes('인천')) return '경기/인천';
                                if (reg.includes('충청') || reg.includes('대전') || reg.includes('세종')) return '충청도';
                                if (reg.includes('전라') || reg.includes('광주')) return '전라도';
                                if (reg.includes('경상') || reg.includes('부산') || reg.includes('대구') || reg.includes('울산')) return '경상도';
                                if (reg.includes('강원') || reg.includes('제주')) return '강원/제주';
                                return reg;
                              };

                              // parties 테이블에도 등록하여 앱에 노출되도록 함
                              const { error: insertErr } = await supabase.from('parties').insert([{
                                title: `[${item.category_type === 'club' ? '동호회' : '강습/정모'}] ${item.title}`,
                                date: item.start_date || new Date().toISOString().split('T')[0],
                                day_of_week: item.day_of_week ? item.day_of_week.split(',')[0].trim() : '일',
                                time: `${item.start_time || ''}~${item.end_time || ''}`,
                                address: item.address || item.studio_name || '',
                                fee: item.fee || '0',
                                poster_url: item.poster_url || '',
                                // 누락되었던 핵심 필드 추가
                                broadRegion: normalizeRegion(item.region),
                                cityName: item.city || item.region || '전국'
                              }]);

                              if (insertErr) console.error('Parties insert error:', insertErr);

                              if (refreshData) refreshData()
                              alert('승인되었습니다.');
                              fetchClasses();
                            } catch (err) {
                              alert('오류 발생: ' + err.message);
                            }
                          }} style={{ flex: 2, backgroundColor: '#F59E0B', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 900, fontSize: '14px', border: 'none' }}>APPROVE</button>
                        )}
                        <button onClick={() => setEditingClass(item)} style={{ flex: 1, backgroundColor: '#1E293B', color: 'white', padding: '12px', borderRadius: '12px', border: 'none' }}><Edit3 size={18} /></button>
                        <button onClick={async () => {
                          if(!window.confirm('삭제하시겠습니까?')) return
                          const { error } = await supabase.from('classes_info').update({ status: 'archived' }).eq('id', item.id)
                          if(!error) { 
                            if (refreshData) refreshData()
                            alert('삭제되었습니다.'); 
                            fetchClasses(); 
                          }
                        }} style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          officialParties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748B' }}>NO_OFFICIAL_DATA</div>
          ) : (
            officialParties.map(party => (
              <div key={party.id} style={{ backgroundColor: '#0F172A', borderRadius: '24px', padding: '20px', marginBottom: '16px', border: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {party.poster_url && <img src={party.poster_url} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '15px' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px', fontFamily: 'monospace' }}>#{party.id}</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 6px 0', color: 'white' }}>{party.title}</h3>
                    <p style={{ fontSize: '14px', color: '#00FF00', fontWeight: 900, margin: '4px 0' }}>{party.locations?.name || 'TBA'}</p>
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0' }}>📅 {party.date} ({party.day_of_week}) / ⏰ {party.time}</p>
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0' }}>💰 {party.fee || party.description}</p>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button onClick={() => setEditingParty(party)} disabled={loading} style={{ flex: 1, backgroundColor: '#1E293B', color: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #334155', fontWeight: 800, fontSize: '13px' }}>MODIFY</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(party.id); }} disabled={loading} style={{ flex: 0.8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {editingParty && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(5px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 3000,
          padding: '20px'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            width: '100%', 
            maxWidth: '500px', 
            borderRadius: '24px', 
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{activeTab === 'pending' ? '등록 신청 내용 수정' : '공식 정보 수정'}</h3>
              <button 
                onClick={() => setEditingParty(null)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={inputGroupStyle}><label style={labelStyle}>파티 제목</label><input value={editingParty.title} onChange={e => setEditingParty({...editingParty, title: e.target.value})} style={inputStyle} /></div>
              
              <div style={inputGroupStyle}>
                <label style={labelStyle}>{activeTab === 'pending' ? '장소명' : '장소 (공식 등록됨)'}</label>
                <input 
                  value={activeTab === 'pending' ? editingParty.location_name : (editingParty.locations?.name || '')} 
                  onChange={e => activeTab === 'pending' && setEditingParty({...editingParty, location_name: e.target.value})} 
                  disabled={activeTab === 'official'}
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{...inputGroupStyle, flex: 1}}><label style={labelStyle}>날짜</label><input type="date" value={editingParty.date} onChange={e => setEditingParty({...editingParty, date: e.target.value})} style={inputStyle} /></div>
                <div style={{...inputGroupStyle, flex: 1}}><label style={labelStyle}>시간</label><input type="time" value={editingParty.time} onChange={e => setEditingParty({...editingParty, time: e.target.value})} style={inputStyle} /></div>
              </div>

              <div style={inputGroupStyle}><label style={labelStyle}>참가비 (fee)</label><input value={editingParty.fee || ''} onChange={e => setEditingParty({...editingParty, fee: e.target.value})} style={inputStyle} /></div>
              
              {activeTab === 'official' && (
                <div style={inputGroupStyle}><label style={labelStyle}>설명 (description)</label><input value={editingParty.description || ''} onChange={e => setEditingParty({...editingParty, description: e.target.value})} style={inputStyle} /></div>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{...inputGroupStyle, flex: '1 1 20%' }}><label style={labelStyle}>S비율</label><input type="number" value={editingParty.s_ratio} onChange={e => setEditingParty({...editingParty, s_ratio: e.target.value})} style={inputStyle} /></div>
                <div style={{...inputGroupStyle, flex: '1 1 20%' }}><label style={labelStyle}>B비율</label><input type="number" value={editingParty.b_ratio} onChange={e => setEditingParty({...editingParty, b_ratio: e.target.value})} style={inputStyle} /></div>
                <div style={{...inputGroupStyle, flex: '1 1 20%' }}><label style={labelStyle}>J비율</label><input type="number" value={editingParty.j_ratio} onChange={e => setEditingParty({...editingParty, j_ratio: e.target.value})} style={inputStyle} /></div>
                <div style={{...inputGroupStyle, flex: '1 1 20%' }}><label style={labelStyle}>K비율</label><input type="number" value={editingParty.k_ratio} onChange={e => setEditingParty({...editingParty, k_ratio: e.target.value})} style={inputStyle} /></div>
              </div>
              
              <button onClick={handleUpdate} style={{ width: '100%', padding: '16px', background: '#03C75A', color: 'white', borderRadius: '12px', fontWeight: 800 }}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {editingClass && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>강습 정보 수정</h3>
              <button onClick={() => setEditingClass(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', padding: '4px' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={inputGroupStyle}><label style={labelStyle}>강습명</label><input value={editingClass.title} onChange={e => setEditingClass({...editingClass, title: e.target.value})} style={inputStyle} /></div>
              
              <div style={inputGroupStyle}>
                <label style={labelStyle}>강습 유형</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {CLASS_CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setEditingClass({...editingClass, level: cat})}
                      style={{ 
                        padding: '8px 4px', fontSize: '11px', borderRadius: '8px', border: '1px solid',
                        borderColor: editingClass.level === cat ? '#FF8C00' : '#E5E7EB',
                        background: editingClass.level === cat ? '#FF8C00' : 'white',
                        color: editingClass.level === cat ? 'white' : '#666',
                        fontWeight: 700
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>댄스 장르</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {DANCE_STYLES.map(style => (
                    <button 
                      key={style}
                      onClick={() => setEditingClass({...editingClass, genre: style})}
                      style={{ 
                        padding: '8px 4px', fontSize: '11px', borderRadius: '8px', border: '1px solid',
                        borderColor: editingClass.genre === style ? '#FF8C00' : '#E5E7EB',
                        background: editingClass.genre === style ? '#FF8C00' : 'white',
                        color: editingClass.genre === style ? 'white' : '#666',
                        fontWeight: 700
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>요일 선택</label>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {DAYS.map(day => {
                    const isSelected = editingClass.day_of_week?.includes(day)
                    return (
                      <button 
                        key={day}
                        onClick={() => {
                          const currentDays = editingClass.day_of_week ? editingClass.day_of_week.split(', ') : []
                          const newDays = isSelected 
                            ? currentDays.filter(d => d !== day)
                            : [...currentDays, day].sort((a,b) => DAYS.indexOf(a) - DAYS.indexOf(b))
                          setEditingClass({...editingClass, day_of_week: newDays.join(', ')})
                        }}
                        style={{ 
                          width: '32px', height: '32px', borderRadius: '16px', fontSize: '11px', border: '1px solid',
                          borderColor: isSelected ? '#FF8C00' : '#E5E7EB',
                          background: isSelected ? '#FF8C00' : 'white',
                          color: isSelected ? 'white' : '#666',
                          fontWeight: 700
                        }}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={inputGroupStyle}><label style={labelStyle}>강사/동호회</label><input value={editingClass.instructor} onChange={e => setEditingClass({...editingClass, instructor: e.target.value})} style={inputStyle} /></div>
              <div style={inputGroupStyle}><label style={labelStyle}>장소/스튜디오</label><input value={editingClass.studio_name} onChange={e => setEditingClass({...editingClass, studio_name: e.target.value})} style={inputStyle} /></div>
              <div style={inputGroupStyle}><label style={labelStyle}>주소</label><input value={editingClass.address} onChange={e => setEditingClass({...editingClass, address: e.target.value})} style={inputStyle} /></div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{...inputGroupStyle, flex: 1}}><label style={labelStyle}>시작 시간</label><input type="time" value={editingClass.start_time} onChange={e => setEditingClass({...editingClass, start_time: e.target.value})} style={inputStyle} /></div>
                <div style={{...inputGroupStyle, flex: 1}}><label style={labelStyle}>종료 시간</label><input type="time" value={editingClass.end_time} onChange={e => setEditingClass({...editingClass, end_time: e.target.value})} style={inputStyle} /></div>
              </div>
              
              <div style={inputGroupStyle}><label style={labelStyle}>참가비</label><input value={editingClass.fee} onChange={e => setEditingClass({...editingClass, fee: e.target.value})} style={inputStyle} /></div>
              
              <button onClick={async () => {
                const { error } = await supabase.from('classes_info').update(editingClass).eq('id', editingClass.id)
                if(!error) { alert('수정되었습니다.'); setEditingClass(null); fetchClasses(); }
              }} style={{ width: '100%', padding: '16px', background: '#FF8C00', color: 'white', borderRadius: '12px', fontWeight: 800, marginTop: '10px' }}>수정 내용 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' }
const labelStyle = { fontSize: '12px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em' }
const inputStyle = { width: '100%', padding: '14px', border: '1px solid #334155', backgroundColor: '#0F172A', color: 'white', borderRadius: '12px', fontSize: '15px', outline: 'none' }
