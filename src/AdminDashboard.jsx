import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChevronLeft, Check, Trash2, ShieldCheck, X, RefreshCw, XCircle, Clock, Tent, Flag, Music2, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminDashboard({ onBack }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginStep, setLoginStep] = useState(1)
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [items, setItems] = useState([])
  const [category, setCategory] = useState('social') // 'social', 'live', 'bootcamp', 'festival'
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'active', 'rejected'
  const [editingItem, setEditingItem] = useState(null)
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
    try {
      let query;
      if (category === 'social') {
        if (activeTab === 'active') query = supabase.from('parties').select('*, locations!location_id(name)');
        else query = supabase.from('pending_parties').select('*').eq('status', activeTab);
      } else if (category === 'live') {
        query = supabase.from('community_posts').select('*');
      } else {
        const table = category === 'bootcamp' ? 'bootcamps' : 'festivals';
        query = supabase.from(table).select('*');
        if (category !== 'live') query = query.eq('status', activeTab);
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => { if (isAdmin) fetchData() }, [category, activeTab, isAdmin])

  // 수정 시작
  const startEdit = (item) => {
    setEditingItem(item.id)
    setEditFormData({ ...item })
  }

  // 수정 취소
  const cancelEdit = () => {
    setEditingItem(null)
    setEditFormData({})
  }

  // 수정 저장
  const saveEdit = async () => {
    setLoading(true)
    try {
      let table;
      if (category === 'social') table = activeTab === 'active' ? 'parties' : 'pending_parties';
      else if (category === 'live') table = 'community_posts';
      else table = category === 'bootcamp' ? 'bootcamps' : 'festivals';

      const { locations, created_at, id, ...updateData } = editFormData;
      const { error } = await supabase.from(table).update(updateData).eq('id', editingItem);
      if (error) throw error;
      alert('수정되었습니다.');
      setEditingItem(null);
      fetchData();
    } catch (err) { alert('수정 실패: ' + err.message) } finally { setLoading(false) }
  }

  // 상태 업데이트 (승인/보류/반려)
  const updateStatus = async (item, newStatus) => {
    if (!window.confirm(`상태를 [${newStatus}]로 변경하시겠습니까?`)) return
    setLoading(true)
    try {
      if (category === 'social') {
        if (newStatus === 'active') {
          // 승인: pending_parties -> parties 이동
          const { data: locData } = await supabase.from('locations').select('id').eq('name', item.location_name).maybeSingle();
          const { error: insError } = await supabase.from('parties').insert([{
            title: item.title, 
            location_id: locData?.id, 
            location_name: item.location_name,
            locationName: item.location_name,
            address: item.address, 
            fee: item.fee,
            date: item.date, time: item.time, day_of_week: item.day_of_week, poster_url: item.poster_url,
            s_ratio: item.s_ratio, b_ratio: item.b_ratio, j_ratio: item.j_ratio, k_ratio: item.k_ratio, status: 'approved'
          }]);
          if (insError) throw insError;
          await supabase.from('pending_parties').delete().eq('id', item.id);
        } else {
          // 보류/반려: pending_parties 내부 업데이트
          if (activeTab === 'active') return alert('승인된 데이터는 삭제 후 재등록해야 합니다.');
          await supabase.from('pending_parties').update({ status: newStatus }).eq('id', item.id);
        }
      } else {
        const table = category === 'bootcamp' ? 'bootcamps' : 'festivals';
        await supabase.from(table).update({ status: newStatus }).eq('id', item.id);
      }
      fetchData();
    } catch (err) { alert('처리 실패: ' + err.message) } finally { setLoading(false) }
  }

  // 영구 삭제
  const deleteItem = async (id) => {
    if (!window.confirm('DB에서 영구 삭제하시겠습니까?')) return
    setLoading(true)
    try {
      let table;
      if (category === 'social') table = activeTab === 'active' ? 'parties' : 'pending_parties';
      else if (category === 'live') table = 'community_posts';
      else table = category === 'bootcamp' ? 'bootcamps' : 'festivals';
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    } catch (err) { alert('삭제 실패') } finally { setLoading(false) }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
        <ShieldCheck size={80} color="#FF1744" style={{ margin: '0 auto 32px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 900 }}>BAMPPA ADMIN</h1>
        <form onSubmit={handleLogin} style={{ marginTop: '50px', maxWidth: '320px', margin: '50px auto 0' }}>
          <input type={loginStep === 1 ? "text" : "password"} value={loginStep === 1 ? adminId : password} onChange={e => loginStep === 1 ? setAdminId(e.target.value) : setPassword(e.target.value)} placeholder={loginStep === 1 ? "ID" : "PW"} style={{ width: '100%', padding: '20px', borderRadius: '20px', border: '2px solid #334155', backgroundColor: '#0F172A', color: 'white', textAlign: 'center', marginBottom: '20px' }} />
          <button type="submit" style={{ width: '100%', padding: '20px', background: '#FF1744', color: 'white', borderRadius: '20px', fontWeight: 900 }}>{loginStep === 1 ? 'NEXT' : 'LOGIN'}</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#1E293B' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#FFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ padding: '8px', background: 'none', border: 'none' }}><ChevronLeft size={28} /></button>
          <h2 style={{ fontSize: '18px', fontWeight: 900, marginLeft: '8px' }}>통합 관리자 센터</h2>
        </div>
        <button onClick={fetchData} disabled={loading} style={{ background: 'none', border: 'none' }}><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
      </header>

      {/* 카테고리 탭 */}
      <div style={{ display: 'flex', padding: '16px', gap: '8px', backgroundColor: '#FFF', overflowX: 'auto' }}>
        {[
          { id: 'social', label: '소셜파티', icon: <Music2 size={16} /> },
          { id: 'live', label: 'LIVE PICK', icon: <Camera size={16} /> },
          { id: 'bootcamp', label: '부트캠프', icon: <Tent size={16} /> },
          { id: 'festival', label: '페스티벌', icon: <Flag size={16} /> }
        ].map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ flexShrink: 0, minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px', borderRadius: '12px', border: 'none', background: category === cat.id ? '#000' : '#EEE', color: category === cat.id ? '#FFF' : '#666', fontWeight: 800, fontSize: '13px' }}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* 상태 탭 */}
      {category !== 'live' && (
        <div style={{ display: 'flex', padding: '0 16px 16px', gap: '8px', backgroundColor: '#FFF' }}>
          {[
            { id: 'pending', label: '승인대기', color: '#F59E0B' },
            { id: 'active', label: '승인완료', color: '#10B981' },
            { id: 'rejected', label: '반려됨', color: '#EF4444' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: activeTab === tab.id ? `2px solid ${tab.color}` : '1px solid #E2E8F0', background: activeTab === tab.id ? `${tab.color}10` : '#FFF', color: tab.color, fontWeight: 900, fontSize: '12px' }}>{tab.label}</button>
          ))}
        </div>
      )}

      {/* 리스트 */}
      <div style={{ padding: '16px' }}>
        {items.length === 0 ? <div style={{ textAlign: 'center', padding: '100px 0', color: '#94A3B8' }}>데이터가 없습니다.</div> : items.map(item => (
          <div key={item.id} style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {(item.poster_url || item.image_url) && <img src={item.poster_url || item.image_url} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '12px' }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>ID: {item.id} | {item.created_at?.split('T')[0]} {item.created_at?.split('T')[1]?.slice(0, 5)}</div>
                
                {editingItem === item.id ? (
                  /* 수정 모드 */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input value={editFormData.title || ''} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} placeholder="제목" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontWeight: 700 }} />
                    
                    {category === 'social' && (
                      <>
                        <input value={editFormData.location_name || ''} onChange={e => setEditFormData({ ...editFormData, location_name: e.target.value })} placeholder="장소명" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        <input value={editFormData.address || ''} onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} placeholder="주소" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="date" value={editFormData.date || ''} onChange={e => setEditFormData({ ...editFormData, date: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                          <input value={editFormData.time || ''} onChange={e => setEditFormData({ ...editFormData, time: e.target.value })} placeholder="시간 (21:00)" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        </div>
                        <input value={editFormData.fee || ''} onChange={e => setEditFormData({ ...editFormData, fee: e.target.value })} placeholder="비용 (예: 20,000원)" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94A3B8' }}>S</div><input type="number" value={editFormData.s_ratio || 0} onChange={e => setEditFormData({ ...editFormData, s_ratio: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #E2E8F0' }} /></div>
                          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94A3B8' }}>B</div><input type="number" value={editFormData.b_ratio || 0} onChange={e => setEditFormData({ ...editFormData, b_ratio: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #E2E8F0' }} /></div>
                          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94A3B8' }}>J</div><input type="number" value={editFormData.j_ratio || 0} onChange={e => setEditFormData({ ...editFormData, j_ratio: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #E2E8F0' }} /></div>
                          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94A3B8' }}>K</div><input type="number" value={editFormData.k_ratio || 0} onChange={e => setEditFormData({ ...editFormData, k_ratio: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #E2E8F0' }} /></div>
                        </div>
                      </>
                    )}

                    {category === 'bootcamp' && (
                      <>
                        <input value={editFormData.instructor || ''} onChange={e => setEditFormData({ ...editFormData, instructor: e.target.value })} placeholder="강사명" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #DDD' }} />
                        <input value={editFormData.nationality || ''} onChange={e => setEditFormData({ ...editFormData, nationality: e.target.value })} placeholder="국적" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #DDD' }} />
                        <input value={editFormData.venue || ''} onChange={e => setEditFormData({ ...editFormData, venue: e.target.value })} placeholder="장소" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #DDD' }} />
                        <textarea value={editFormData.description || ''} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} placeholder="설명" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #DDD', minHeight: '60px' }} />
                      </>
                    )}
                    {category === 'festival' && (
                      <>
                        <input value={editFormData.location || ''} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} placeholder="장소" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #DDD' }} />
                        <input value={editFormData.organizer || ''} onChange={e => setEditFormData({ ...editFormData, organizer: e.target.value })} placeholder="주최" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #DDD' }} />
                      </>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={saveEdit} style={{ flex: 1, padding: '10px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 800 }}>SAVE</button>
                      <button onClick={cancelEdit} style={{ flex: 1, padding: '10px', background: '#EEE', color: '#666', border: 'none', borderRadius: '10px', fontWeight: 800 }}>CANCEL</button>
                    </div>
                  </div>
                ) : (
                  /* 보기 모드 */
                  <>
                    {category === 'live' ? (
                      <>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '6px' }}>📍 {item.location_name} ({item.region})</h3>
                        <div style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '8px' }}>{item.content}</div>
                        <div style={{ fontSize: '12px', color: '#FF1744', fontWeight: 800 }}>❤️ {item.likes || 0} Likes</div>
                      </>
                    ) : (
                      <h3 style={{ fontSize: '17px', fontWeight: 900, marginBottom: '8px' }}>{item.title}</h3>
                    )}
                    
                    <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {category === 'social' && (
                        <>
                          <div>📍 {item.locations?.name || item.location_name || item.address}</div>
                          <div>📅 {item.date} | 💰 {item.fee}</div>
                        </>
                      )}
                      {category === 'bootcamp' && (
                        <>
                          <div style={{ color: '#F59E0B', fontWeight: 800 }}>👤 {item.instructor} ({item.nationality})</div>
                          <div>🎵 {item.genre} | 📊 {item.level}</div>
                          <div>📅 {item.start_date} ~ {item.end_date}</div>
                          <div>📍 {item.venue} | 💰 {item.fee}</div>
                          <div style={{ fontSize: '11px' }}>{item.accommodation_included ? '✅ 숙박 포함' : '❌ 숙박 미포함'} | <span style={{ color: '#000' }}>[{item.type?.toUpperCase()}]</span></div>
                        </>
                      )}
                      {category === 'festival' && (
                        <>
                          <div>🎵 {item.genre} | 🏢 {item.organizer}</div>
                          <div>📅 {item.start_date} ~ {item.end_date}</div>
                          <div>📍 {item.location} ({item.region}) | 💰 ₩{item.price?.toLocaleString()}</div>
                        </>
                      )}
                    </div>

                    {/* 버튼 그룹 */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      {category !== 'live' && (
                        <>
                          <button onClick={() => updateStatus(item, 'active')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#E8F5E9', color: '#2E7D32' }} title="승인"><Check size={18} /></button>
                          <button onClick={() => updateStatus(item, 'pending')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#FFF8E1', color: '#F59E0B' }} title="보류"><Clock size={18} /></button>
                          <button onClick={() => updateStatus(item, 'rejected')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#FFEBEE', color: '#C62828' }} title="반려"><XCircle size={18} /></button>
                          <button onClick={() => startEdit(item)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#475569' }} title="수정"><RefreshCw size={18} /></button>
                        </>
                      )}
                      <button onClick={() => deleteItem(item.id)} style={{ flex: category === 'live' ? 1 : 'none', padding: '10px', borderRadius: '10px', border: 'none', background: '#F5F5F5', color: '#666' }} title="삭제"><Trash2 size={18} /></button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
