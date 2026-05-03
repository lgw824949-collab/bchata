import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChevronLeft, Check, Trash2, Clock, Calendar, MapPin, User, RefreshCw, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ClassAdminDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('pending')
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  // 데이터 가져오기
  const fetchClasses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('classes_info')
        .select('*')
        .eq('category_type', 'class')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClasses(data || [])
    } catch (err) {
      console.error('Error fetching classes:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  // 승인 처리
  const handleApprove = async (id) => {
    if (!window.confirm('이 클래스를 승인하시겠습니까?')) return
    try {
      const { error } = await supabase
        .from('classes_info')
        .update({ status: 'approved' })
        .eq('id', id)

      if (error) throw error
      alert('승인되었습니다.')
      fetchClasses()
    } catch (err) {
      alert('승인 실패: ' + err.message)
    }
  }

  // 삭제 처리
  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 클래스를 삭제하시겠습니까? DB에서 완전히 제거됩니다.')) return
    try {
      const { error } = await supabase
        .from('classes_info')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('삭제되었습니다.')
      fetchClasses()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  // 탭별 데이터 필터링
  const filteredClasses = classes.filter(item => item.status === activeTab)
  const counts = {
    pending: classes.filter(i => i.status === 'pending').length,
    approved: classes.filter(i => i.status === 'approved').length,
    expired: classes.filter(i => i.status === 'expired').length
  }

  return (
    <div style={{ backgroundColor: '#0F172A', minHeight: '100vh', color: '#F8FAFC', paddingBottom: '60px' }}>
      {/* 헤더 */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#1E293B', borderBottom: '1px solid #334155', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><ChevronLeft size={28} /></button>
          <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>클래스 관리자</h1>
        </div>
        <button onClick={fetchClasses} style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer' }}><RefreshCw size={22} className={loading ? 'animate-spin' : ''} /></button>
      </header>

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', padding: '12px', gap: '8px', overflowX: 'auto', backgroundColor: '#0F172A' }}>
        {[
          { id: 'pending', label: '대기중', color: '#F59E0B' },
          { id: 'approved', label: '승인됨', color: '#10B981' },
          { id: 'expired', label: '만료됨', color: '#94A3B8' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, minWidth: '100px', padding: '12px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? tab.color : '#1E293B',
              color: activeTab === tab.id ? '#fff' : '#94A3B8',
              fontWeight: 800, fontSize: '13px', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            {tab.label}
            <span style={{ fontSize: '11px', opacity: 0.8, backgroundColor: activeTab === tab.id ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '6px' }}>{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* 리스트 영역 */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748B' }}>데이터를 불러오는 중...</div>
        ) : filteredClasses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748B' }}>
            <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ fontWeight: 700 }}>해당되는 클래스가 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            <AnimatePresence>
              {filteredClasses.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ backgroundColor: '#1E293B', borderRadius: '20px', overflow: 'hidden', border: '1px solid #334155' }}
                >
                  <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
                    {/* 썸네일 */}
                    <div style={{ width: '80px', height: '110px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#0F172A' }}>
                      {item.poster_url ? (
                        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} color="#334155" /></div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 900 }}>{item.genre} · {item.level}</span>
                        <div style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 900, backgroundColor: item.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: item.status === 'pending' ? '#F59E0B' : '#10B981' }}>{item.status.toUpperCase()}</div>
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: 900, margin: '0 0 8px 0', color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '12px', color: '#94A3B8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={13} /> {item.instructor}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {item.city} {item.studio_name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {item.day_of_week} {item.start_time}~{item.end_time}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} /> {item.start_date} ({item.duration})</div>
                      </div>
                    </div>
                  </div>

                  {/* 하단 액션 버튼 */}
                  <div style={{ display: 'flex', borderTop: '1px solid #334155' }}>
                    {item.status === 'pending' && (
                      <button 
                        onClick={() => handleApprove(item.id)}
                        style={{ flex: 1, padding: '14px', background: 'none', border: 'none', borderRight: '1px solid #334155', color: '#10B981', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Check size={18} /> 승인하기
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(item.id)}
                      style={{ flex: 1, padding: '14px', background: 'none', border: 'none', color: '#EF4444', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Trash2 size={18} /> {item.status === 'pending' ? '거절/삭제' : '삭제'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClassAdminDashboard
