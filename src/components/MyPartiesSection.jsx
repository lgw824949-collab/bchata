import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const MyPartiesSection = ({ onClose }) => {
  const [contributorId, setContributorId] = useState('')
  const [parties, setParties] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!contributorId.trim()) return
    setLoading(true)
    const { data } = await supabase
      .from('parties')
      .select('*')
      .eq('contributor_id', contributorId.trim())
      .order('created_at', { ascending: false })
    setParties(data || [])
    setSearched(true)
    setLoading(false)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        <input
          value={contributorId}
          onChange={e => setContributorId(e.target.value)}
          placeholder="내 등록자 ID 입력"
          style={{ flex:1, padding:'12px 14px', borderRadius:12, border:'1px solid #E5E7EB', fontSize:14 }}
        />
        <button
          onClick={search}
          disabled={loading}
          style={{ padding:'12px 20px', borderRadius:12, background:'#E53935', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}
        >{loading ? '...' : '확인'}</button>
      </div>

      {searched && parties.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 0', color:'#999' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          <div style={{ fontSize:14 }}>등록된 파티가 없어요</div>
        </div>
      )}

      {parties.map(party => (
        <div key={party.id} style={{ background:'#F8F9FA', borderRadius:16, padding:16, marginBottom:12, border:'1px solid #F1F5F9' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#111' }}>{party.title?.replace(/^\[.*?\]\s*/, '').replace('ㅣ 오늘밤빠', '').trim()}</span>
            <span style={{
              fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20,
              background: party.status === 'approved' ? '#E8F5E9' : party.status === 'pending' ? '#FFF8E1' : '#FFEBEE',
              color: party.status === 'approved' ? '#2E7D32' : party.status === 'pending' ? '#F57F17' : '#C62828'
            }}>
              {party.status === 'approved' ? '✓ 승인' : party.status === 'pending' ? '⏳ 검토중' : '✕ 반려'}
            </span>
          </div>
          <div style={{ fontSize:12, color:'#666' }}>{party.date} · {party.location_name}</div>
        </div>
      ))}
    </div>
  )
}

export default MyPartiesSection
