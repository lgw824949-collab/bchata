import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChevronLeft, Check, Trash2, RefreshCw, Calendar, Clock, MapPin, User, Tag } from 'lucide-react'

export default function ClassAdminDashboard({ onBack }) {
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'approved', 'expired'
  const [loading, setLoading] = useState(false)

  // 데이터 불러오기 (클래스 전용)
  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('classes_info')
        .select('*')
        .eq('category_type', 'class')
        .eq('status', activeTab)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error(err)
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
      alert('승인되었습니다.')
      fetchData()
    } catch (err) {
      alert('오류 발생: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 반려/삭제 처리
  const handleDelete = async (id) => {
    if (!window.confirm('DB에서 영구 삭제하시겠습니까? (반려 시 삭제 처리됩니다)')) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('classes_info')
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

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '100px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ padding: '8px', color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={28} /></button>
          <div style={{ marginLeft: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>클래스 관리</h2>
            <div style={{ fontSize: '11px', color: '#FF8C00', fontWeight: 700 }}>ACADEMY_ADMIN_PANEL</div>
          </div>
        </div>
        <button onClick={fetchData} disabled={loading} style={{ padding: '8px', color: '#FF8C00', background: 'none', border: 'none', cursor: 'pointer' }}><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
      </header>

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', padding: '16px', gap: '8px' }}>
        {[
          { id: 'pending', label: '대기중', color: '#FF8C00' },
          { id: 'approved', label: '승인됨', color: '#03C75A' },
          { id: 'expired', label: '만료됨', color: '#64748B' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              flex: 1, padding: '14px', borderRadius: '16px', border: 'none', 
              background: activeTab === tab.id ? tab.color : '#FFFFFF', 
              color: activeTab === tab.id ? 'white' : '#64748B', 
              fontWeight: 800, fontSize: '14px',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 목록 리스트 */}
      <div style={{ padding: '0 16px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#94A3B8' }}>데이터가 없습니다.</div>
        ) : (
          items.map(item => (
            <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', marginBottom: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                {item.poster_url && (
                  <img 
                    src={item.poster_url} 
                    style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '12px' }} 
                    alt="Poster" 
                    onClick={() => window.open(item.poster_url, '_blank')}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>{item.genre}</span>
                    <span style={{ fontSize: '10px', background: '#FFF7ED', color: '#EA580C', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>{item.level}</span>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#1E293B', margin: '0 0 8px 0' }}>{item.title}</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {item.instructor}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {item.city}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {item.day_of_week} ({item.start_date?.slice(5)})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {item.start_time?.slice(0,5)}~{item.end_time?.slice(0,5)}</div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={12} /> {item.studio_name} | {item.duration}
                  </div>

                  {/* 관리 버튼 */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    {activeTab === 'pending' && (
                      <button 
                        onClick={() => handleApprove(item.id)} 
                        style={{ flex: 2, background: '#FF8C00', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Check size={18} /> 승인하기
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      style={{ flex: 1, background: '#FEE2E2', color: '#EF4444', padding: '12px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={18} /> {activeTab === 'pending' ? '반려' : '삭제'}
                    </button>
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
