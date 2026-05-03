import React from 'react'
import { ChevronLeft } from 'lucide-react'

const PostClub = ({ onBack }) => {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #F3F4F6', position: 'fixed', top: 0, width: '100%', backgroundColor: 'white' }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
        <span style={{ fontSize: '18px', fontWeight: 800, marginLeft: '8px' }}>수업/정모 등록 (준비 중)</span>
      </div>
      <p style={{ fontWeight: 800, color: '#94A3B8' }}>새로운 수업/정모 등록 폼을 작성해 주세요.</p>
    </div>
  )
}

export default PostClub
