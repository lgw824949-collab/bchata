import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const InstructorClassForm = ({ onBack }) => {
  const [instructorId, setInstructorId] = useState('')
  const [instructor, setInstructor] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', schedule: '', location: '', fee: ''
  })

  const findInstructor = async () => {
    if (!instructorId.trim()) return
    setLoading(true)
    const { data } = await supabase
      .from('instructors')
      .select('*')
      .eq('id', instructorId.trim())
      .single()
    if (data) {
      setInstructor(data)
      setStep(2)
    } else {
      alert('강사 ID를 찾을 수 없어요.')
    }
    setLoading(false)
  }

  const submit = async () => {
    if (!form.title || !form.schedule) {
      alert('수업명과 수업 일정은 필수예요.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('instructor_classes').insert({
      instructor_id: instructor.id,
      title: form.title,
      description: form.description,
      schedule: form.schedule,
      location: form.location,
      fee: form.fee,
      status: 'active'
    })
    if (!error) setDone(true)
    else alert('등록 실패했어요. 다시 시도해주세요.')
    setLoading(false)
  }

  if (done) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🎉</div>
      <div style={{ fontSize:20, fontWeight:900, color:'#111', marginBottom:8 }}>수업등록 완료!</div>
      <div style={{ fontSize:14, color:'#999', lineHeight:1.6, marginBottom:32 }}>강사 페이지 CLASSES 탭에서 확인하세요</div>
      <button onClick={onBack}
        style={{ padding:'14px 32px', borderRadius:16, background:'#E53935', color:'#fff', border:'none', fontSize:15, fontWeight:700, cursor:'pointer' }}>확인</button>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#fff' }}>
      <div style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid #F1F5F9', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
        <button onClick={onBack}
          style={{ background:'#F1F5F9', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18 }}>←</button>
        <div>
          <div style={{ fontSize:18, fontWeight:900, color:'#111' }}>수업등록 📚</div>
          <div style={{ fontSize:12, color:'#999' }}>강사 전용 수업 등록</div>
        </div>
      </div>

      <div style={{ padding:24 }}>
        {step === 1 && (
          <>
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🔑</div>
              <div style={{ fontSize:16, fontWeight:900, color:'#111', marginBottom:8 }}>강사 ID를 입력해주세요</div>
              <div style={{ fontSize:13, color:'#999' }}>라틴에 진심 등록 시 발급된 ID</div>
            </div>
            <input
              value={instructorId}
              onChange={e => setInstructorId(e.target.value)}
              placeholder="강사 ID 입력"
              style={{ width:'100%', padding:'14px', borderRadius:12, border:'1px solid #E5E7EB', fontSize:14, marginBottom:16, boxSizing:'border-box', fontFamily:'monospace' }}
            />
            <button onClick={findInstructor} disabled={loading}
              style={{ width:'100%', padding:'16px', borderRadius:16, background:'#E53935', color:'#fff', border:'none', fontSize:15, fontWeight:700, cursor:'pointer' }}>
              {loading ? '확인 중...' : '확인'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:12, background:'#FFF5F5', borderRadius:16, padding:16, marginBottom:24, border:'1px solid #FECACA' }}>
              <div style={{ width:48, height:48, borderRadius:'50%', overflow:'hidden', background:'#FEE2E2', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                {instructor?.photo_url ? <img src={instructor.photo_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '💃'}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#111' }}>{instructor?.name}</div>
                <div style={{ fontSize:12, color:'#E53935' }}>{Array.isArray(instructor?.genre) ? instructor.genre.join(' · ') : instructor?.genre}</div>
              </div>
            </div>

            {[
              { key:'title', label:'수업명 *', placeholder:'예: 바차타 입문반', required:true },
              { key:'schedule', label:'수업 일정 *', placeholder:'예: 매주 화·목 오후 7시', required:true },
              { key:'location', label:'수업 장소', placeholder:'예: 서울 강남구 댄스스튜디오' },
              { key:'fee', label:'수강료', placeholder:'예: 월 15만원 / 1회 3만원' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:6 }}>{f.label}</div>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width:'100%', padding:'14px', borderRadius:12, border:'1px solid #E5E7EB', fontSize:14, boxSizing:'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:6 }}>수업 소개</div>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="수업 내용, 대상, 특징 등을 자유롭게 적어주세요"
                rows={4}
                style={{ width:'100%', padding:'14px', borderRadius:12, border:'1px solid #E5E7EB', fontSize:14, resize:'none', boxSizing:'border-box' }}
              />
            </div>

            <button onClick={submit} disabled={loading}
              style={{ width:'100%', padding:'16px', borderRadius:16, background:'#E53935', color:'#fff', border:'none', fontSize:16, fontWeight:900, cursor:'pointer' }}>
              {loading ? '등록 중...' : '수업등록하기 📚'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default InstructorClassForm
