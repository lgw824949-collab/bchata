
import React, { useState, useEffect } from 'react'
import { ChevronLeft, Check, Trash2, Edit3, Save, X } from 'lucide-react'
import { supabase } from './lib/supabase'

const ClassAdminDashboard = ({ onBack }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [activeTab, setActiveTab] = useState('class') // 'class' or 'club'

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('classes_info')
      .select('*')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
    
    if (error) console.error(error)
    else setItems(data || [])
    setLoading(false)
  }

  const filteredItems = items.filter(item => {
    if (activeTab === 'class') return item.category_type === 'class' || !item.category_type
    return item.category_type === 'club'
  })

  const pendingCount = (type) => items.filter(i => (type === 'class' ? (i.category_type === 'class' || !i.category_type) : i.category_type === 'club') && i.status === 'pending').length

  const handleApprove = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('classes_info')
        .update({ status: 'active' })
        .eq('id', id)
      
      if (!error) {
        alert('승인이 완료되었습니다. 화면을 갱신합니다.')
        window.location.reload()
      }
    } catch (err) {
      console.error('Approve error:', err)
    }
  }

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('정말 이 게시물을 삭제(보관)하시겠습니까?')) return
    
    setItems(prev => prev.filter(item => String(item.id) !== String(id)))
    
    try {
      const { error } = await supabase
        .from('classes_info')
        .update({ status: 'archived' })
        .eq('id', id)
      
      if (error) {
        console.error('Delete error:', error)
        alert('삭제 처리 중 오류가 발생했습니다.')
      } else {
        alert('삭제 처리가 완료되었습니다. 화면을 갱신합니다.')
        window.location.reload()
      }
    } catch (err) {
      console.error('Crash in handleDelete:', err)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditData({ ...item })
  }

  const handleSave = async () => {
    const { error } = await supabase
      .from('classes_info')
      .update(editData)
      .eq('id', editingId)
    
    if (!error) {
      setItems(items.map(item => item.id === editingId ? { ...editData } : item))
      setEditingId(null)
      alert('수정되었습니다.')
    }
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#F9FAFB', minHeight: '100vh', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>강습/동호회 관리자</h1>
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginLeft: 'auto', fontSize: '11px', background: 'white', color: '#03C75A', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, border: '1.5px solid #03C75A' }}
        >
          갱신
        </button>
      </div>

      {/* 탭 내비게이션 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('class')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '12px', 
            border: 'none', 
            background: activeTab === 'class' ? '#FF8C00' : 'white',
            color: activeTab === 'class' ? 'white' : '#666',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: activeTab === 'class' ? '0 4px 12px rgba(255, 140, 0, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          강습 홍보 
          <span style={{ fontSize: '11px', opacity: 0.8 }}>({pendingCount('class')})</span>
        </button>
        <button 
          onClick={() => setActiveTab('club')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '12px', 
            border: 'none', 
            background: activeTab === 'club' ? '#FF8C00' : 'white',
            color: activeTab === 'club' ? 'white' : '#666',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: activeTab === 'club' ? '0 4px 12px rgba(255, 140, 0, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          동호회 강습
          <span style={{ fontSize: '11px', opacity: 0.8 }}>({pendingCount('club')})</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>로딩 중...</div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', color: '#999' }}>{activeTab === 'class' ? '강습' : '동호회'} 신청 내역이 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredItems.map(item => (
            <div key={item.id} style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '16px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: item.status === 'pending' ? '2px solid #FF8C00' : '1px solid #E5E7EB',
              opacity: item.status === 'active' ? 0.7 : 1
            }}>
              {editingId === item.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input style={inputStyle} value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="제목" />
                  <input style={inputStyle} value={editData.instructor} onChange={e => setEditData({...editData, instructor: e.target.value})} placeholder="강사명" />
                  <input style={inputStyle} value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} placeholder="주소" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: '#03C75A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>저장</button>
                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '12px', background: '#9CA3AF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    {item.poster_url && <img src={item.poster_url} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} onClick={() => window.open(item.poster_url, '_blank')} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: item.status === 'active' ? '#03C75A' : '#FF8C00', fontWeight: 800, marginBottom: '2px' }}>{item.status.toUpperCase()}</div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '4px' }}>{item.title}</h3>
                      <div style={{ fontSize: '12px', color: '#666' }}>{item.instructor} 강사 | {item.day_of_week}요일 {item.time}</div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>📍 {item.address}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.status === 'pending' && (
                      <button 
                        type="button"
                        onClick={(e) => handleApprove(e, item.id)} 
                        style={{ flex: 2, padding: '10px', background: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <Check size={18} /> 승인하기
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startEdit(item); }} 
                      style={{ flex: 1, padding: '10px', background: '#F3F4F6', border: 'none', borderRadius: '8px', color: '#4B5563' }}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)} 
                      disabled={loading}
                      style={{ 
                        flex: 1, 
                        padding: '12px', 
                        background: '#FEE2E2', 
                        border: 'none', 
                        borderRadius: '12px', 
                        color: '#EF4444', 
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Trash2 size={20} style={{ pointerEvents: 'none' }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1.5px solid #E5E7EB',
  fontSize: '14px',
  width: '100%'
}

export default ClassAdminDashboard
