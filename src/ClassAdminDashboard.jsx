import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChevronLeft, Check, Trash2, RefreshCw, Calendar, Clock, MapPin, User, Tag, Award, Edit2, X, Save } from 'lucide-react'

export default function ClassAdminDashboard({ onBack }) {
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'approved', 'expired'
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState({ pending: 0, approved: 0, expired: 0 })
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  // 데이터 및 건수 불러오기
  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. 현재 탭 데이터 조회
      const { data, error } = await supabase
        .from('classes_info')
        .select('*')
        .eq('category_type', 'class')
        .eq('status', activeTab)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setItems(data || [])

      // 2. 각 상태별 건수 조회 (전체)
      const { data: allData, error: countError } = await supabase
        .from('classes_info')
        .select('status')
        .eq('category_type', 'class')

      if (countError) throw countError

      const newCounts = { pending: 0, approved: 0, expired: 0 }
      allData.forEach(item => {
        if (newCounts.hasOwnProperty(item.status)) {
          newCounts[item.status]++
        }
      })
      setCounts(newCounts)

    } catch (err) {
      console.error('데이터 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  // 승인 처리
  const handleApprove = async (id) => {
    if (!window.confirm('이 클래스를 승인하시겠습니까?')) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('classes_info')
        .update({ status: 'approved' })
        .eq('id', id)
      
      if (error) throw error
      alert('클래스가 승인되었습니다.')
      fetchData()
    } catch (err) {
      alert('승인 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 삭제 처리 (Hard Delete)
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('classes_info')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      alert('정상적으로 삭제되었습니다.')
      fetchData()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 수정 시작
  const handleEditStart = (item) => {
    setEditingId(item.id)
    setEditData({ ...item })
  }

  // 수정 저장
  const handleSave = async (id) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('classes_info')
        .update({
          title: editData.title,
          genre: editData.genre,
          level: editData.level,
          duration: editData.duration,
          fee: editData.fee,
          city: editData.city
        })
        .eq('id', id)
      
      if (error) throw error
      alert('수정되었습니다.')
      setEditingId(null)
      fetchData()
    } catch (err) {
      alert('수정 실패: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* 헤더 */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '20px', 
        backgroundColor: '#FFFFFF', 
        borderBottom: '1px solid #E2E8F0', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={onBack} 
            style={{ padding: '8px', color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={28} />
          </button>
          <div style={{ marginLeft: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', margin: 0 }}>LEVEL UP 관리</h2>
            <div style={{ fontSize: '11px', color: '#2ECC71', fontWeight: 700 }}>LEVEL_UP_ADMIN_CONSOLE</div>
          </div>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading} 
          style={{ padding: '8px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', padding: '16px', gap: '8px' }}>
        {[
          { id: 'pending', label: '대기중', count: counts.pending, color: '#FF8C00' },
          { id: 'approved', label: '승인됨', count: counts.approved, color: '#2ECC71' },
          { id: 'expired', label: '만료됨', count: counts.expired, color: '#64748B' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              flex: 1, 
              padding: '12px 4px', 
              borderRadius: '14px', 
              border: 'none', 
              background: activeTab === tab.id ? tab.color : '#FFFFFF', 
              color: activeTab === tab.id ? 'white' : '#64748B', 
              fontWeight: 800, 
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              boxShadow: activeTab === tab.id ? '0 4px 10px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
          >
            <span>{tab.label}</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* 클래스 목록 */}
      <div style={{ padding: '0 16px' }}>
        {loading && items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', fontWeight: 700, color: '#2ECC71' }}>로딩 중...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#94A3B8', fontWeight: 600 }}>해당되는 클래스가 없습니다.</div>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '20px', 
                padding: '16px', 
                marginBottom: '16px', 
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', gap: '14px' }}>
                {/* 썸네일 */}
                <div 
                  onClick={() => window.open(item.poster_url, '_blank')}
                  style={{ cursor: 'pointer' }}
                >
                  <img 
                    src={item.poster_url || 'https://via.placeholder.com/80x110?text=No+Image'} 
                    style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '12px', background: '#F1F5F9' }} 
                    alt="Poster" 
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === item.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        value={editData.title || ''} 
                        onChange={e => setEditData({...editData, title: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #2ECC71', fontSize: '14px', fontWeight: 900 }}
                        placeholder="제목"
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <select 
                          value={editData.genre || ''} 
                          onChange={e => setEditData({...editData, genre: e.target.value})}
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                        >
                          {['바차타', '살사', '키좀바', '쥬크'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select 
                          value={editData.level || ''} 
                          onChange={e => setEditData({...editData, level: e.target.value})}
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                        >
                          {['입문', '초급', '중급', '상급'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input 
                          value={editData.city || ''} 
                          onChange={e => setEditData({...editData, city: e.target.value})}
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                          placeholder="지역(도시)"
                        />
                        <input 
                          value={editData.duration || ''} 
                          onChange={e => setEditData({...editData, duration: e.target.value})}
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                          placeholder="기간"
                        />
                      </div>
                      <input 
                        value={editData.fee || ''} 
                        onChange={e => setEditData({...editData, fee: e.target.value})}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                        placeholder="비용"
                      />
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>{item.genre}</span>
                        <span style={{ fontSize: '10px', background: '#F0FFF4', color: '#2ECC71', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>{item.level}</span>
                        {item.status === 'pending' && <span style={{ fontSize: '10px', background: '#FFF7ED', color: '#FF8C00', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>대기중</span>}
                      </div>
                      
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B', margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {item.instructor || '미지정'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {item.city}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {item.day_of_week} ({item.start_date?.slice(5)})</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {item.start_time?.slice(0,5)}~{item.end_time?.slice(0,5)}</div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={12} /> {item.studio_name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={12} /> {item.duration}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 하단 액션 버튼 */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {editingId === item.id ? (
                  <>
                    <button 
                      onClick={() => handleSave(item.id)} 
                      style={{ flex: 1, background: '#2ECC71', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }}
                    >
                      <Save size={18} /> 저장
                    </button>
                    <button 
                      onClick={() => setEditingId(null)} 
                      style={{ flex: 1, background: '#F1F5F9', color: '#64748B', padding: '12px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }}
                    >
                      <X size={18} /> 취소
                    </button>
                  </>
                ) : (
                  <>
                    {activeTab === 'pending' && (
                      <button 
                        onClick={() => handleApprove(item.id)} 
                        style={{ flex: 2, background: '#2ECC71', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }}
                      >
                        <Check size={18} /> 승인하기
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditStart(item)} 
                      style={{ flex: 1, background: '#F1F5F9', color: '#64748B', padding: '12px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }}
                    >
                      <Edit2 size={18} /> 수정
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      style={{ flex: 1, background: '#FEE2E2', color: '#EF4444', padding: '12px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }}
                    >
                      <Trash2 size={18} /> {activeTab === 'pending' ? '삭제' : '삭제'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
