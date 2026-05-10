// v0.1.1 - Force redeploy for UI simplification
import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChevronLeft, Check, Trash2, ShieldCheck, X, RefreshCw, XCircle, Clock, Tent, Flag, Music2, Camera, Zap, Menu, User, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import RegisterForm from './RegisterForm'

const EventRanking = () => {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      const since = new Date()
      since.setDate(since.getDate() - 15)

      const [partiesRes, bootcampsRes, festivalsRes] = await Promise.all([
        supabase.from('parties').select('contributor_id, status').not('contributor_id', 'is', null).gte('created_at', since.toISOString()),
        supabase.from('bootcamps').select('contributor_id, status').not('contributor_id', 'is', null).gte('created_at', since.toISOString()),
        supabase.from('festivals').select('contributor_id, status').not('contributor_id', 'is', null).gte('created_at', since.toISOString()),
      ])

      const all = [
        ...(partiesRes.data || []),
        ...(bootcampsRes.data || []),
        ...(festivalsRes.data || []),
      ]

      const map = {}
      all.forEach(p => {
        if (!p.contributor_id) return
        if (!map[p.contributor_id]) map[p.contributor_id] = { total:0, approved:0, pending:0 }
        map[p.contributor_id].total++
        if (p.status === 'approved') map[p.contributor_id].approved++
        if (p.status === 'pending') map[p.contributor_id].pending++
      })

      const sorted = Object.entries(map)
        .sort((a, b) => b[1].approved - a[1].approved)
        .map(([id, counts], i) => ({ rank: i+1, id, ...counts }))

      setRankings(sorted)
      setLoading(false)
    }
    fetchRankings()
  }, [])

  return (
    <div style={{ padding:24 }}>
      <div style={{ fontSize:18, fontWeight:900, color:'#111', marginBottom:4 }}>🥃 포스터 이벤트 집계</div>
      <div style={{ fontSize:12, color:'#999', marginBottom:20 }}>최근 15일 · 소셜+부트캠프+페스티벌 승인 기준</div>

      {loading && <div style={{ textAlign:'center', padding:40, color:'#999' }}>집계 중...</div>}

      {!loading && rankings.length === 0 && (
        <div style={{ textAlign:'center', padding:40, color:'#999' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
          <div>등록된 포스터가 없어요</div>
        </div>
      )}

      {rankings.map(r => (
        <div key={r.id} style={{
          display:'flex', alignItems:'center', gap:16,
          padding:'14px 16px', borderRadius:14, marginBottom:10,
          background: r.rank === 1 ? '#FFF8E1' : '#F8F9FA',
          border: r.rank === 1 ? '1px solid #F59E0B' : '1px solid #F1F5F9'
        }}>
          <div style={{ fontSize:20, width:32, textAlign:'center' }}>
            {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#111', fontFamily:'monospace' }}>{r.id}</div>
            <div style={{ fontSize:11, color:'#999', marginTop:2 }}>
              전체 {r.total}개 · 승인 {r.approved}개 · 검토중 {r.pending}개
            </div>
          </div>
          {r.rank === 1 && (
            <span style={{ fontSize:11, fontWeight:700, color:'#F59E0B', background:'#FEF3C7', padding:'3px 10px', borderRadius:20 }}>🥃 위스키</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard({ onBack }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginStep, setLoginStep] = useState(1)
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const handleAdminImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }
  const [items, setItems] = useState([])
  const [category, setCategory] = useState('social') // 'social', 'live-mgmt', 'live', 'bootcamp', 'festival', 'instructor'
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'active', 'rejected'
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [loading, setLoading] = useState(false)

  // 로그인 처리
  const handleLogin = (e) => {
    e.preventDefault()
    const validId = 'lgw1004'; const validPw = '^^dlwlsdn1052181818';
    if (loginStep === 1) { if (adminId === validId) setLoginStep(2); else alert('아이디 오류'); return; }
    if (password === validPw) { setIsAdmin(true); localStorage.setItem('admin_login_time', Date.now().toString()); fetchData(); } 
    else alert('비번 오류');
  }

  // 데이터 불러오기
  const fetchData = async () => {
    setLoading(true)
    setItems([]) // 이전 데이터 초기화하여 혼선 방지
    try {
      let query;
      if (category === 'social') {
        if (activeTab === 'active') query = supabase.from('parties').select('*, locations!location_id(name)');
        else query = supabase.from('pending_parties').select('*').eq('status', activeTab);
      } else if (category === 'live-mgmt') {
        const todayStr = new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
        query = supabase.from('parties').select('*, locations!location_id(name)').eq('date', todayStr);
      } else if (category === 'live') {
        query = supabase.from('community_posts').select('*');
      } else if (category === 'bootcamp') {
        query = supabase.from('bootcamps').select('*').eq('status', activeTab);
      } else if (category === 'festival') {
        query = supabase.from('festivals').select('*').eq('status', activeTab);
      } else if (category === 'instructor') {
        const statusVal = activeTab === 'active' ? 'active' : activeTab;
        query = supabase.from('instructors').select('*').eq('status', statusVal);
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => { if (isAdmin) fetchData() }, [category, activeTab, isAdmin])

  // 수정 시작
  const startEdit = (item) => {
    if (category === 'social') {
      const targetTable = activeTab === 'active' ? 'parties' : 'pending_parties'
      setCurrentItem({ ...item, _table: targetTable })
      setShowEditModal(true)
    } else {
      setEditingItem(item.id)
      setEditFormData({ ...item })
    }
  }

  // 과거 데이터 삭제 (클린업)
  const cleanupPastData = async () => {
    if (!window.confirm('오늘 이전의 모든 파티/부트캠프/페스티벌 데이터를 삭제하시겠습니까?')) return
    setLoading(true)
    try {
      const today = new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0]
      const tables = ['parties', 'pending_parties', 'bootcamps', 'festivals']
      
      for (const table of tables) {
        const dateCol = (table === 'bootcamps' || table === 'festivals') ? 'start_date' : 'date'
        await supabase.from(table).delete().lt(dateCol, today)
      }
      alert('과거 데이터 정리가 완료되었습니다.')
      fetchData()
    } catch (err) {
      alert('정리 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 수정 취소
  const cancelEdit = () => {
    setEditingItem(null)
    setEditFormData({})
    setImageFile(null)
    setPreview(null)
  }

  // 수정 저장
  const saveEdit = async () => {
    setLoading(true)
    try {
      let table;
      if (category === 'social') table = activeTab === 'active' ? 'parties' : 'pending_parties';
      else if (category === 'live') table = 'community_posts';
      else if (category === 'instructor') table = 'instructors';
      else table = category === 'bootcamp' ? 'bootcamps' : 'festivals';

      let finalPhotoUrl = editFormData.photo_url || '';

      // Upload image if a new file is selected (for instructors)
      if (category === 'instructor' && imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `instructors/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(fileName, imageFile)
        
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('posters')
          .getPublicUrl(fileName)
        
        finalPhotoUrl = urlData.publicUrl
      }

      const { locations, created_at, id, locationName, location_name, ...updateData } = editFormData;
      const { error } = await supabase.from(table).update({
        ...updateData,
        photo_url: category === 'instructor' ? finalPhotoUrl : (updateData.photo_url || updateData.poster_url)
      }).eq('id', editingItem);

      if (error) throw error;
      alert('수정되었습니다.');
      setEditingItem(null);
      setImageFile(null);
      setPreview(null);
      fetchData();
    } catch (err) { alert('수정 실패: ' + err.message) } finally { setLoading(false) }
  }

  // 상태 업데이트 (승인/보류/반려 - 확인창 제거하여 속도 개선)
  const updateStatus = async (item, newStatus) => {
    setLoading(true)
    try {
      if (category === 'social') {
        if (newStatus === 'active') {
          // 승인: pending_parties -> parties 이동
          let finalLocationId = null;
          const { data: locData } = await supabase.from('locations').select('id').eq('name', item.location_name).maybeSingle();
          if (locData) {
            finalLocationId = locData.id;
          } else {
            const { data: newLoc } = await supabase.from('locations').insert([{
              name: item.location_name,
              address: item.address,
              region_id: 1 
            }]).select().maybeSingle();
            finalLocationId = newLoc?.id;
          }
          const { error: insError } = await supabase.from('parties').insert([{
            title: item.title, 
            location_id: finalLocationId, 
            address: item.address, 
            fee: item.fee,
            date: item.date, 
            time: item.time, 
            day_of_week: item.day_of_week, 
            poster_url: item.poster_url,
            s_ratio: item.s_ratio, 
            b_ratio: item.b_ratio, 
            j_ratio: item.j_ratio, 
            k_ratio: item.k_ratio, 
            status: 'approved'
          }]);
          if (insError) throw insError;
          await supabase.from('pending_parties').delete().eq('id', item.id);
        } else {
          if (activeTab === 'active') return alert('승인된 데이터는 삭제 후 재등록해야 합니다.');
          await supabase.from('pending_parties').update({ status: newStatus }).eq('id', item.id);
        }
      } else {
        let table;
        if (category === 'live') table = 'community_posts';
        else if (category === 'instructor') table = 'instructors';
        else table = category === 'bootcamp' ? 'bootcamps' : 'festivals';
        
        const statusVal = newStatus === 'approved' ? 'active' : newStatus;
        if (category !== 'live') {
          const { error } = await supabase.from(table).update({ status: statusVal }).eq('id', item.id);
          if (error) throw error;
        }
      }
      fetchData();
      alert('상태가 업데이트되었습니다!');
    } catch (err) { 
      console.error(err);
      alert('처리 실패: ' + err.message); 
    } finally { setLoading(false) }
  }

  // 영구 삭제
  const deleteItem = async (id) => {
    if (!window.confirm('DB에서 영구 삭제하시겠습니까?')) return
    setLoading(true)
    try {
      let table;
      if (category === 'social') table = activeTab === 'active' ? 'parties' : 'pending_parties';
      else if (category === 'live') table = 'community_posts';
      else if (category === 'instructor') table = 'instructors';
      else table = category === 'bootcamp' ? 'bootcamps' : 'festivals';
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    } catch (err) { alert('삭제 실패') } finally { setLoading(false) }
  }

  // 수동 체크인 추가 (LIVE 관리용)
  const addManualCheckin = async (party) => {
    try {
      const locName = party.locations?.name || party.location_name;
      const { error } = await supabase.from('bar_checkins').insert([{
        bar_name: locName,
        region: party.broadRegion || '전국',
        checked_in_at: new Date().toISOString()
      }]);
      if (error) throw error;
      alert('인원이 1명 추가되었습니다.');
    } catch (err) { console.error('체크인 추가 실패', err); }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
        <ShieldCheck size={80} color="#FF1744" style={{ margin: '0 auto 32px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 900 }}>BAMPPA ADMIN</h1>
        <form onSubmit={handleLogin} style={{ marginTop: '50px', maxWidth: '320px', margin: '50px auto 0' }}>
          <input type={loginStep === 1 ? "text" : "password"} value={loginStep === 1 ? adminId : password} onChange={e => loginStep === 1 ? setAdminId(e.target.value) : setPassword(e.target.value)} placeholder={loginStep === 1 ? "ID" : "PW"} style={{ width: '100%', padding: '20px', borderRadius: '20px', border: '2px solid #334155', backgroundColor: '#0F172A', color: 'white', textAlign: 'center', marginBottom: '20px' }} />
          <button 
            type="submit" 
            style={{ 
              width: '100%', padding: '20px', background: '#FF1744', color: 'white', 
              borderRadius: '20px', fontWeight: 900, cursor: 'pointer', 
              pointerEvents: 'auto', position: 'relative', zIndex: 1 
            }}
          >
            {loginStep === 1 ? 'NEXT' : 'LOGIN'}
          </button>
        </form>
      </div>
    )
  }

  const MAIN_CATEGORIES = [
    { id: 'social', label: '소셜파티', icon: <Music2 size={16} /> }
  ]

  const MORE_CATEGORIES = [
    { id: 'instructor', label: '강사 승인/관리 🌟', icon: <User size={16} /> },
    { id: 'live-mgmt', label: 'LIVE 관리', icon: <Zap size={16} color="#F59E0B" /> },
    { id: 'live', label: 'LIVE PICK', icon: <Camera size={16} /> },
    { id: 'bootcamp', label: '부트캠프', icon: <Tent size={16} /> },
    { id: 'festival', label: '페스티벌', icon: <Flag size={16} /> },
    { id: 'event', label: '🥃 이벤트', icon: <Sparkles size={16} color="#F59E0B" /> }
  ]

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#1E293B' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#FFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ padding: '8px', background: 'none', border: 'none' }}><ChevronLeft size={28} /></button>
          <h2 style={{ fontSize: '18px', fontWeight: 900, marginLeft: '8px' }}>통합 관리자 센터</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={cleanupPastData} 
            disabled={loading} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: 'none', padding: '8px 12px', borderRadius: '12px', color: '#64748B', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
          >
            <Sparkles size={14} color="#7C3AED" /> 과거청소
          </button>
          <button onClick={fetchData} disabled={loading} style={{ background: 'none', border: 'none' }}><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </header>

      {/* 카테고리 탭 (개편됨 - 1개 메인 + 더보기) */}
      <div style={{ display: 'flex', padding: '16px', gap: '8px', backgroundColor: '#FFF', position: 'relative' }}>
        {MAIN_CATEGORIES.map(cat => (
          <button 
            key={cat.id} 
            type="button"
            onClick={() => { setCategory(cat.id); setShowMoreMenu(false); }} 
            style={{ 
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
              padding: '16px', borderRadius: '16px', border: 'none', 
              background: category === cat.id ? '#000' : '#F1F5F9', 
              color: category === cat.id ? '#FFF' : '#64748B', 
              fontWeight: 900, fontSize: '15px', transition: 'all 0.2s ease',
              cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
        
        {/* 더보기 버튼 (아이콘 확실히 적용) */}
        <button 
          type="button"
          onClick={() => setShowMoreMenu(!showMoreMenu)} 
          style={{ 
            width: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '16px 0', borderRadius: '16px', border: 'none', 
            background: MORE_CATEGORIES.some(m => m.id === category) ? '#7C3AED' : '#F1F5F9', 
            color: MORE_CATEGORIES.some(m => m.id === category) ? '#FFF' : '#64748B', 
            fontWeight: 900, fontSize: '14px',
            cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
          }}
        >
          {showMoreMenu ? <X size={20} /> : <Menu size={20} />}
          {showMoreMenu ? '닫기' : '전체메뉴'}
        </button>

        {/* 더보기 메뉴 드롭다운 (강사 관리 최상단) */}
        <AnimatePresence>
          {showMoreMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 10, scale: 0.95 }} 
              style={{ 
                position: 'absolute', top: '85px', right: '16px', width: '220px', 
                background: '#FFF', borderRadius: '20px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0', 
                padding: '10px', zIndex: 1000 
              }}
            >
              <div style={{ padding: '8px 12px', fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>관리 카테고리</div>
              {MORE_CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => { setCategory(cat.id); setShowMoreMenu(false); }} 
                  style={{ 
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', 
                    padding: '16px', borderRadius: '12px', border: 'none', 
                    background: category === cat.id ? '#F5F3FF' : 'none', 
                    color: category === cat.id ? '#7C3AED' : '#1E293B', 
                    fontWeight: 800, fontSize: '15px', textAlign: 'left',
                    marginBottom: '4px'
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 상태 탭 */}
      {category !== 'live-mgmt' && category !== 'event' && (
        <div style={{ display: 'flex', padding: '0 16px 16px', gap: '8px', backgroundColor: '#FFF' }}>
          {[
            { id: 'pending', label: '승인대기', color: '#F59E0B' },
            { id: 'active', label: '승인완료', color: '#10B981' },
            { id: 'rejected', label: '반려됨', color: '#EF4444' }
          ].map(tab => (
            <button 
              key={tab.id} 
              type="button"
              onClick={() => setActiveTab(tab.id)} 
              style={{ 
                flex: 1, padding: '10px', borderRadius: '10px', 
                border: activeTab === tab.id ? `2px solid ${tab.color}` : '1px solid #E2E8F0', 
                background: activeTab === tab.id ? `${tab.color}10` : '#FFF', 
                color: tab.color, fontWeight: 900, fontSize: '12px',
                cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 리스트 */}
      <div style={{ padding: '16px' }}>
        {category === 'event' ? <EventRanking /> : items.length === 0 ? <div style={{ textAlign: 'center', padding: '100px 0', color: '#94A3B8' }}>데이터가 없습니다.</div> : items.map(item => (
          <div key={item.id} style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {(item.poster_url || item.photo_url || item.image_url) && <img src={item.poster_url || item.photo_url || item.image_url} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '12px' }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>ID: {item.id} | {item.created_at?.split('T')[0]} {item.created_at?.split('T')[1]?.slice(0, 5)}</div>
                
                {editingItem === item.id ? (
                  /* 수정 모드 */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input value={editFormData.title || editFormData.name || ''} onChange={e => setEditFormData({ ...editFormData, title: e.target.value, name: e.target.value })} placeholder="제목/이름" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontWeight: 700 }} />
                    {category === 'instructor' && (
                      <>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input value={editFormData.custom_id || ''} onChange={e => setEditFormData({ ...editFormData, custom_id: e.target.value })} placeholder="고유 ID (Handle)" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                          <input value={editFormData.city || ''} onChange={e => setEditFormData({ ...editFormData, city: e.target.value })} placeholder="활동 지역" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        </div>
                        <input value={Array.isArray(editFormData.genre) ? editFormData.genre.join(', ') : editFormData.genre || ''} onChange={e => setEditFormData({ ...editFormData, genre: e.target.value.split(',').map(s => s.trim()) })} placeholder="장르 (쉼표로 구분)" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input value={editFormData.instagram || ''} onChange={e => setEditFormData({ ...editFormData, instagram: e.target.value })} placeholder="인스타그램 ID" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                          <input value={editFormData.kakao_link || ''} onChange={e => setEditFormData({ ...editFormData, kakao_link: e.target.value })} placeholder="카카오 오픈챗 링크" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#F1F5F9', borderRadius: '10px' }}>
                          <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                            <input type="file" accept="image/*" onChange={handleAdminImageChange} style={{ display: 'none' }} />
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#FFF', border: '1px dashed #94A3B8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {(preview || editFormData.photo_url) ? (
                                <img src={preview || editFormData.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : <Camera size={24} color="#94A3B8" />}
                            </div>
                          </label>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>프로필 사진 교체</div>
                            <input value={editFormData.photo_url || ''} onChange={e => setEditFormData({ ...editFormData, photo_url: e.target.value })} placeholder="또는 URL 직접 입력" style={{ width: '100%', padding: '5px 0', border: 'none', borderBottom: '1px solid #CBD5E1', backgroundColor: 'transparent', fontSize: '12px' }} />
                          </div>
                        </div>

                        <textarea value={editFormData.bio || ''} onChange={e => setEditFormData({ ...editFormData, bio: e.target.value })} placeholder="자기소개" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', minHeight: '80px' }} />
                      </>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={saveEdit} style={{ flex: 1, padding: '10px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 800 }}>SAVE</button>
                      <button onClick={cancelEdit} style={{ flex: 1, padding: '10px', background: '#EEE', color: '#666', border: 'none', borderRadius: '10px', fontWeight: 800 }}>CANCEL</button>
                    </div>
                  </div>
                ) : (
                  /* 보기 모드 */
                  <div style={{ flex: 1 }}>
                    {category === 'instructor' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>👤 {item.name} (@{item.custom_id})</h3>
                        <div style={{ fontSize: '13px', color: '#7C3AED', fontWeight: 800 }}>🎵 {Array.isArray(item.genre) ? item.genre.join(', ') : item.genre} | 📍 {item.city}</div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                          <span style={{ color: '#E11D48', fontWeight: 700 }}>📸 Inst: {item.instagram || '-'}</span>
                          <span style={{ color: '#F59E0B', fontWeight: 700 }}>💬 Kakao: {item.kakao_link ? 'YES' : 'NO'}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.4', background: '#F8FAFC', padding: '8px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>{item.bio}</div>
                      </div>
                    ) : category === 'live' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>📍 {item.bar_name || '장소미지정'} ({item.region})</h3>
                        <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', padding: '10px', background: '#F8FAFC', borderRadius: '8px' }}>{item.content}</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>{item.title}</h3>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>📍 {item.locations?.name || item.location_name || item.address || item.location}</div>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>📅 {item.date || item.start_date}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button 
                        type="button"
                        onClick={() => updateStatus(item, 'active')} 
                        style={{ 
                          flex: 1, padding: '10px', borderRadius: '10px', border: 'none', 
                          background: '#E8F5E9', color: '#2E7D32', cursor: 'pointer', 
                          pointerEvents: 'auto', position: 'relative', zIndex: 1 
                        }} 
                        title="승인"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => updateStatus(item, 'pending')} 
                        style={{ 
                          flex: 1, padding: '10px', borderRadius: '10px', border: 'none', 
                          background: '#FFF8E1', color: '#F59E0B', cursor: 'pointer', 
                          pointerEvents: 'auto', position: 'relative', zIndex: 1 
                        }} 
                        title="보류"
                      >
                        <Clock size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => updateStatus(item, 'rejected')} 
                        style={{ 
                          flex: 1, padding: '10px', borderRadius: '10px', border: 'none', 
                          background: '#FFEBEE', color: '#C62828', cursor: 'pointer', 
                          pointerEvents: 'auto', position: 'relative', zIndex: 1 
                        }} 
                        title="반려"
                      >
                        <XCircle size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => startEdit(item)} 
                        style={{ 
                          flex: 1, padding: '10px', borderRadius: '10px', border: 'none', 
                          background: '#F1F5F9', color: '#475569', cursor: 'pointer', 
                          pointerEvents: 'auto', position: 'relative', zIndex: 1 
                        }} 
                        title="수정"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => deleteItem(item.id)} 
                        style={{ 
                          flex: 'none', padding: '10px', borderRadius: '10px', border: 'none', 
                          background: '#F5F5F5', color: '#666', cursor: 'pointer', 
                          pointerEvents: 'auto', position: 'relative', zIndex: 1 
                        }} 
                        title="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {category === 'live-mgmt' && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#F59E0B' }}>수동 인원 조절</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => addManualCheckin(item)} style={{ padding: '8px 16px', background: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>+1명 추가</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* 파티 수정 모달 */}
      <AnimatePresence>
        {showEditModal && (
          <RegisterForm 
            isEdit={true}
            initialData={currentItem}
            onBack={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
