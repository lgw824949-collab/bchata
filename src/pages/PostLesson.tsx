import React from 'react'
import { ChevronLeft } from 'lucide-react'

const PostLesson = ({ onBack }) => {
  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <header style={{ position: 'fixed', top: 0, width: '100%', background: 'white', padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center' }}>
        <ChevronLeft onClick={onBack} size={28} style={{ cursor: 'pointer' }} />
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 800, marginRight: '28px' }}>강습 홍보 (준비 중)</h1>
      </header>
      <p style={{ fontWeight: 800, color: '#94A3B8' }}>새로운 강습 홍보 폼을 작성해 주세요.</p>
    </div>
  )
}

export default PostLesson
