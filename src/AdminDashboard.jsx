// v0.1.1 - Force redeploy for UI simplification
import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChevronLeft, Check, Trash2, ShieldCheck, X, RefreshCw, XCircle, Clock, Tent, Flag, Music2, Camera, Zap, Menu, User, Sparkles, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import RegisterForm from './RegisterForm'
import ClassRegisterModal from './components/ClassRegisterModal'
import gangturnPhoto from './assets/gangturn_photo.png'
import ggomaeyaPhoto from './assets/ggomaeya_photo.jpg'
import noriterPhoto from './assets/noriter_photo.png'
import latinPhoto from './assets/latin_photo.png'
import macondoPhoto from './assets/macondo_photo.png'
import bonitaPhoto from './assets/bonita_photo.png'
import buenaPhoto from './assets/buena_photo.png'
import hongturnPhoto from './assets/hongturn_photo.png'
import bibigoPhoto from './assets/bibigo_photo.png'

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

  const handleNewRentalImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewRentalFile(file)
    setNewRentalPreview(URL.createObjectURL(file))
  }

  const [items, setItems] = useState([])
  const [category, setCategory] = useState('social') // 'social', 'live-mgmt', 'live', 'bootcamp', 'festival', 'instructor', 'rental'
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'active', 'rejected'
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [showClassEditModal, setShowClassEditModal] = useState(false)
  const [classEditItem, setClassEditItem] = useState(null)

  const normalizePartyItemForForm = (item, table) => ({
    ...item,
    _table: table,
    location_name: item.location_name || item.locations?.name || '',
    location_id: item.location_id ?? item.locations?.id ?? null,
    address: item.address || item.locations?.address || '',
    poster_url: item.poster_url || '',
    latitude: item.latitude ?? item.locations?.latitude ?? null,
    longitude: item.longitude ?? item.locations?.longitude ?? null,
  })

  const openPartyRegisterForm = (item = null) => {
    const table = activeTab === 'active' ? 'parties' : 'pending_parties'
    const todayStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
    setCurrentItem(item ? normalizePartyItemForForm(item, table) : { _table: 'parties', date: todayStr })
    setShowEditModal(true)
  }
  const [editFormData, setEditFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [adminMessage, setAdminMessage] = useState(null)

  const showAdminError = (text) => setAdminMessage({ type: 'error', text: String(text || '요청 처리에 실패했습니다.') })
  const showAdminSuccess = (text) => setAdminMessage({ type: 'success', text: String(text || '처리되었습니다.') })
  const clearAdminMessage = () => setAdminMessage(null)

  const formatInstructorGenre = (genre) => {
    if (Array.isArray(genre)) return genre.filter(Boolean).join(', ') || '-'
    return genre?.trim() ? genre : '-'
  }

  const instructorStatusMeta = (status) => {
    if (status === 'active') return { label: '승인완료', color: '#10B981', bg: '#ECFDF5' }
    if (status === 'rejected') return { label: '반려됨', color: '#EF4444', bg: '#FEF2F2' }
    return { label: '승인대기', color: '#F59E0B', bg: '#FFFBEB' }
  }

  const buildInstructorUpdatePayload = (form, photoUrl) => {
    const genreRaw = form.genre
    const genre = Array.isArray(genreRaw)
      ? genreRaw.map((g) => String(g).trim()).filter(Boolean)
      : String(genreRaw || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
    const awardsVal = form.awards
    return {
      name: String(form.name || form.title || '').trim(),
      custom_id: String(form.custom_id || '').trim() || null,
      city: String(form.city || '').trim() || null,
      genre: genre.length ? genre : null,
      instagram: String(form.instagram || '').trim() || null,
      kakao_link: String(form.kakao_link || '').trim() || null,
      bio: String(form.bio || '').trim() || null,
      career: String(form.career || '').trim() || null,
      class_type: String(form.class_type || '').trim() || null,
      awards:
        awardsVal === '' || awardsVal == null
          ? null
          : String(awardsVal).trim(),
      photo_url: photoUrl || String(form.photo_url || '').trim() || null,
    }
  }

  const [newRental, setNewRental] = useState({ name: '', address: '', kakao_url: '', instagram_url: '', image_url: '' })
  const [newRentalFile, setNewRentalFile] = useState(null)
  const [newRentalPreview, setNewRentalPreview] = useState(null)

  // 로그인 처리
  const handleLogin = (e) => {
    e.preventDefault()
    const validId = 'lgw1004'; const validPw = '^^dlwlsdn1052181818';
    if (loginStep === 1) { if (adminId === validId) setLoginStep(2); else alert('아이디 오류'); return; }
    if (password === validPw) { setIsAdmin(true); localStorage.setItem('admin_login_time', Date.now().toString()); fetchData(); } 
    else alert('비번 오류');
  }

  const getAdminKSTTodayStr = () => {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    if (kst.getHours() < 5) kst.setDate(kst.getDate() - 1);
    return kst.toISOString().split('T')[0];
  };

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
        const todayStr = getAdminKSTTodayStr();
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
      } else if (category === 'instructor-classes') {
        const statusVal = activeTab === 'active' ? 'active' : activeTab;
        query = supabase.from('instructor_classes').select('*, instructors(name)').eq('status', statusVal);
      } else if (category === 'rental') {
        query = supabase.from('locations').select('*');
      }
      const { data, error } = await (category === 'rental' ? query.order('name', { ascending: true }) : query.order('created_at', { ascending: false }))
      if (error) throw error
      setItems(data || [])
      clearAdminMessage()
    } catch (err) {
      if (category === 'instructor') showAdminError(`목록 불러오기 실패: ${err.message || err}`)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (isAdmin) fetchData() }, [category, activeTab, isAdmin])

  const handleCreateRental = async (e) => {
    e.preventDefault();
    if (!newRental.name?.trim() || !newRental.address?.trim()) {
      alert('BAR 이름과 주소를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      let finalImageUrl = newRental.image_url || '';
      if (newRentalFile) {
        const ext = newRentalFile.name.split('.').pop();
        const fileName = `posters/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, newRentalFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }
      const payload = {
        name: newRental.name.trim(),
        address: newRental.address.trim(),
        image_url: finalImageUrl || null,
        kakao_url: newRental.kakao_url?.trim() || null,
        instagram_url: newRental.instagram_url?.trim() || null
      };
      let { error } = await supabase.from('locations').insert([payload]);
      if (error && (error.message?.includes('column') || error.message?.includes('cache') || error.message?.includes('exist'))) {
        console.warn('스키마 캐시 지연 감지: 기본 컬럼(name, address)으로만 안전하게 등재합니다.');
        const safePayload = { name: newRental.name.trim(), address: newRental.address.trim() };
        const { error: retryError } = await supabase.from('locations').insert([safePayload]);
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
      }
      alert('신규 BAR가 성공적으로 등재되었습니다!');
      setNewRental({ name: '', address: '', kakao_url: '', instagram_url: '', image_url: '' });
      setNewRentalFile(null);
      setNewRentalPreview(null);
      fetchData();
    } catch (err) {
      alert('등록 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 수정 시작
  const startEdit = (item) => {
    clearAdminMessage()
    if (category === 'social') {
      openPartyRegisterForm(item)
    } else if (category === 'instructor-classes') {
      setClassEditItem(item)
      setShowClassEditModal(true)
    } else {
      setEditingItem(item.id)
      setEditFormData({ ...item, name: item.name || item.title || '' })
      setImageFile(null)
      setPreview(null)
    }
  }

  const toggleInstructorRowEdit = (item) => {
    if (editingItem === item.id) {
      cancelEdit()
      return
    }
    startEdit(item)
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
    clearAdminMessage()
  }

  // 수정 저장
  const saveEdit = async () => {
    setLoading(true)
    clearAdminMessage()
    try {
      let table;
      if (category === 'social') table = activeTab === 'active' ? 'parties' : 'pending_parties';
      else if (category === 'live') table = 'community_posts';
      else if (category === 'instructor') table = 'instructors';
      else if (category === 'instructor-classes') table = 'instructor_classes';
      else if (category === 'rental') table = 'locations';
      else table = category === 'bootcamp' ? 'bootcamps' : 'festivals';

      let finalPhotoUrl = editFormData.photo_url || editFormData.image_url || '';

      // Upload image if a new file is selected
      if ((category === 'instructor' || category === 'rental') && imageFile) {
        const ext = imageFile.name.split('.').pop()
        const folder = category === 'rental' ? 'posters' : 'instructors';
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(fileName, imageFile)
        
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('posters')
          .getPublicUrl(fileName)
        
        finalPhotoUrl = urlData.publicUrl
      }

      if (category === 'rental') {
        const payload = {
          name: editFormData.name?.trim(),
          address: editFormData.address?.trim(),
          image_url: finalPhotoUrl || null,
          kakao_url: editFormData.kakao_url?.trim() || null,
          instagram_url: editFormData.instagram_url?.trim() || null
        };
        let { error } = await supabase.from('locations').update(payload).eq('id', editingItem);
        if (error && (error.message?.includes('column') || error.message?.includes('cache') || error.message?.includes('exist'))) {
          console.warn('스키마 캐시 지연 감지: 기본 컬럼(name, address)으로만 안전하게 수정 적용합니다.');
          const safePayload = { name: editFormData.name?.trim(), address: editFormData.address?.trim() };
          const { error: retryError } = await supabase.from('locations').update(safePayload).eq('id', editingItem);
          if (retryError) throw retryError;
        } else if (error) {
          throw error;
        }
      } else if (category === 'instructor') {
        if (!supabase) {
          showAdminError('Supabase 연결이 없습니다. .env 설정을 확인해 주세요.')
          return
        }
        const row = items.find((i) => i.id === editingItem)
        const payload = buildInstructorUpdatePayload(
          {
            ...row,
            ...editFormData,
            name: editFormData.name || editFormData.title || row?.name || '',
          },
          finalPhotoUrl,
        )
        if (!payload.name) {
          showAdminError('강사 이름을 입력해 주세요.')
          return
        }
        const { data: updated, error } = await supabase
          .from('instructors')
          .update(payload)
          .eq('id', editingItem)
          .select()
          .maybeSingle()
        if (error) throw error
        if (!updated) {
          showAdminError('DB에 반영되지 않았습니다. ID·권한(RLS)을 확인해 주세요.')
          return
        }
        setItems((prev) => prev.map((i) => (i.id === editingItem ? { ...i, ...updated } : i)))
      } else {
        const { locations, created_at, id, locationName, location_name, photo_url: _photo, instructors, ...updateData } = editFormData;
        const finalUpdate = { ...updateData };
        finalUpdate.poster_url = updateData.poster_url || _photo || '';
        // 빈 문자열 날짜 → null 변환 (DB date 타입 오류 방지)
        ['start_date', 'end_date', 'date'].forEach(k => {
          if (finalUpdate[k] === '') finalUpdate[k] = null;
        });
        const { error } = await supabase.from(table).update(finalUpdate).eq('id', editingItem);
        if (error) throw error;
      }

      showAdminSuccess('수정되었습니다.')
      setEditingItem(null)
      setImageFile(null)
      setPreview(null)
      await fetchData()
    } catch (err) {
      showAdminError(`수정 실패: ${err.message || err}`)
    } finally { setLoading(false) }
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
        else if (category === 'instructor-classes') table = 'instructor_classes';
        else table = category === 'bootcamp' ? 'bootcamps' : 'festivals';
        
        const statusVal = newStatus === 'approved' ? 'active' : newStatus;
        if (category !== 'live') {
          const { error } = await supabase.from(table).update({ status: statusVal }).eq('id', item.id);
          if (error) throw error;
        }
      }
      await fetchData();
      showAdminSuccess('상태가 업데이트되었습니다.');
    } catch (err) { 
      showAdminError(`처리 실패: ${err.message || err}`);
    } finally { setLoading(false) }
  }

  // 영구 삭제
  const deleteItem = async (id) => {
    if (!window.confirm('DB에서 영구 삭제하시겠습니까?')) return
    setLoading(true)
    clearAdminMessage()
    try {
      let table;
      if (category === 'social') table = activeTab === 'active' ? 'parties' : 'pending_parties';
      else if (category === 'live') table = 'community_posts';
      else if (category === 'instructor') table = 'instructors';
      else if (category === 'instructor-classes') table = 'instructor_classes';
      else if (category === 'rental') table = 'locations';
      else table = category === 'bootcamp' ? 'bootcamps' : 'festivals';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      if (editingItem === id) cancelEdit();
      showAdminSuccess('삭제되었습니다.');
      await fetchData();
    } catch (err) {
      showAdminError(`삭제 실패: ${err.message || err}`);
    } finally { setLoading(false) }
  }

  /** parties.view_count — 오늘 날짜 파티만 누적 (+20/+30/+50/+100) */
  const bumpPartyViewCount = async (party, delta) => {
    if (!party?.id) return;
    const todayStr = getAdminKSTTodayStr();
    const partyDate = String(party.date || '').slice(0, 10);
    if (partyDate !== todayStr) {
      alert('오늘 날짜 파티만 인원 조절할 수 있습니다.');
      return;
    }
    const current = Number(party.view_count) || 0;
    const next = current + delta;
    try {
      const { error } = await supabase
        .from('parties')
        .update({ view_count: next })
        .eq('id', party.id)
        .eq('date', todayStr);
      if (error) throw error;
      alert(`인원 ${current}명 → ${next}명 (+${delta}명)`);
      fetchData();
    } catch (err) {
      console.error('[Admin] bumpPartyViewCount failed:', err);
      alert(`인원 업데이트 실패: ${err.message || err}`);
    }
  };

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
    { id: 'rental', label: '대관문의 (BAR) 🍷', icon: <Sparkles size={16} color="#E53935" /> },
    { id: 'instructor', label: '강사 승인/관리 🌟', icon: <User size={16} /> },
    { id: 'live-mgmt', label: 'LIVE 관리', icon: <Zap size={16} color="#F59E0B" /> },
    { id: 'live', label: 'LIVE PICK', icon: <Camera size={16} /> },
    { id: 'bootcamp', label: '부트캠프', icon: <Tent size={16} /> },
    { id: 'festival', label: '페스티벌', icon: <Flag size={16} /> },
    { id: 'instructor-classes', label: '강사 클래스 📚', icon: <Sparkles size={16} /> },
    { id: 'event', label: '🥃 이벤트', icon: <Sparkles size={16} color="#F59E0B" /> }
  ]

  const iconActionBtn = {
    padding: '8px 10px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
  }

  const renderInstructorEditPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
      <input
        value={editFormData.name || editFormData.title || ''}
        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value, title: e.target.value })}
        placeholder="강사 이름"
        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontWeight: 700 }}
      />
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
              <img src={preview || editFormData.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : <Camera size={24} color="#94A3B8" />}
          </div>
        </label>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>프로필 사진 교체</div>
          <input value={editFormData.photo_url || ''} onChange={e => setEditFormData({ ...editFormData, photo_url: e.target.value })} placeholder="또는 URL 직접 입력" style={{ width: '100%', padding: '5px 0', border: 'none', borderBottom: '1px solid #CBD5E1', backgroundColor: 'transparent', fontSize: '12px' }} />
        </div>
      </div>
      <textarea value={editFormData.bio || ''} onChange={e => setEditFormData({ ...editFormData, bio: e.target.value })} placeholder="자기소개" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', minHeight: '80px' }} />
      <input value={editFormData.career || ''} onChange={e => setEditFormData({ ...editFormData, career: e.target.value })} placeholder="경력" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
      <input value={editFormData.class_type || ''} onChange={e => setEditFormData({ ...editFormData, class_type: e.target.value })} placeholder="수업 방식" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
      <input type="number" value={editFormData.awards ?? ''} onChange={e => setEditFormData({ ...editFormData, awards: e.target.value })} placeholder="수상 횟수 (예: 3)" aria-label="수상 횟수" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" onClick={(e) => { e.stopPropagation(); saveEdit() }} disabled={loading} style={{ flex: 1, padding: '10px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 800 }}>SAVE</button>
        <button type="button" onClick={(e) => { e.stopPropagation(); cancelEdit() }} style={{ flex: 1, padding: '10px', background: '#EEE', color: '#666', border: 'none', borderRadius: '10px', fontWeight: 800 }}>CANCEL</button>
      </div>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#1E293B' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#FFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ padding: '8px', background: 'none', border: 'none' }}><ChevronLeft size={28} /></button>
          <h2 style={{ fontSize: '18px', fontWeight: 900, marginLeft: '8px' }}>통합 관리자 센터</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {category === 'social' && (
            <button
              type="button"
              onClick={() => openPartyRegisterForm()}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FF1744',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '12px',
                color: '#FFF',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> 파티 등록
            </button>
          )}
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
      {category !== 'live-mgmt' && category !== 'event' && category !== 'rental' && (
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
        {category === 'rental' && (
          <div style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', marginBottom: '24px', boxShadow: '0 10px 25px rgba(229,57,53,0.1)', border: '2px solid #FFEBEE' }}>
            <div style={{ fontSize: '15px', fontWeight: 950, color: '#E53935', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🍷 신규 대관처(BAR) 직접 등재
            </div>
            <form onSubmit={handleCreateRental} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input value={newRental.name} onChange={e => setNewRental({...newRental, name: e.target.value})} placeholder="BAR 이름 *" required style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: 800 }} />
              <input value={newRental.address} onChange={e => setNewRental({...newRental, address: e.target.value})} placeholder="상세 주소 *" required style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
              <input value={newRental.kakao_url} onChange={e => setNewRental({...newRental, kakao_url: e.target.value})} placeholder="카카오톡 문의 링크" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
              <input value={newRental.instagram_url} onChange={e => setNewRental({...newRental, instagram_url: e.target.value})} placeholder="인스타그램 링크" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <input type="file" accept="image/*" onChange={handleNewRentalImageChange} style={{ display: 'none' }} />
                  <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FFF', border: '1px dashed #CBD5E1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {newRentalPreview ? <img src={newRentalPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} color="#94A3B8" />}
                  </div>
                </label>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>대표 이미지 선택</div>
                  <input value={newRental.image_url} onChange={e => setNewRental({...newRental, image_url: e.target.value})} placeholder="또는 URL 직접 입력" style={{ width: '100%', padding: '4px 0', border: 'none', borderBottom: '1px solid #E2E8F0', background: 'transparent', fontSize: '12px' }} />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ padding: '14px', background: '#E53935', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', marginTop: '4px' }}>
                등재 완료하기
              </button>
            </form>
          </div>
        )}
        {adminMessage && category === 'instructor' && (
          <div
            style={{
              marginBottom: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              background: adminMessage.type === 'error' ? '#FEF2F2' : '#ECFDF5',
              color: adminMessage.type === 'error' ? '#B91C1C' : '#047857',
              border: `1px solid ${adminMessage.type === 'error' ? '#FECACA' : '#A7F3D0'}`,
            }}
          >
            {adminMessage.text}
          </div>
        )}
        {category === 'event' ? <EventRanking /> : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#94A3B8' }}>데이터가 없습니다.</div>
        ) : category === 'instructor' ? (
          <div
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              backgroundColor: '#FFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                  {['프로필', '이름', 'Handle', '지역', '장르', '카카오', '상태', '액션'].map((h) => (
                    <th key={h} style={{ padding: '12px 10px', fontWeight: 800, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const st = instructorStatusMeta(item.status)
                  const isEditing = editingItem === item.id
                  const photo = item.photo_url
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => toggleInstructorRowEdit(item)}
                        style={{
                          cursor: 'pointer',
                          background: isEditing ? '#F5F3FF' : '#FFF',
                          borderBottom: '1px solid #E2E8F0',
                        }}
                      >
                        <td style={{ padding: '10px', width: '56px' }}>
                          {photo ? (
                            <img src={photo} alt="" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '18px' }}>👤</div>
                          )}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 800, color: '#1E293B', minWidth: '100px' }}>{item.name || '-'}</td>
                        <td style={{ padding: '10px', color: '#64748B', minWidth: '88px' }}>@{item.custom_id || '-'}</td>
                        <td style={{ padding: '10px', color: '#475569', whiteSpace: 'nowrap' }}>{item.city || '-'}</td>
                        <td style={{ padding: '10px', color: '#7C3AED', fontWeight: 600, maxWidth: '140px' }}>{formatInstructorGenre(item.genre)}</td>
                        <td style={{ padding: '10px', color: item.kakao_link ? '#059669' : '#94A3B8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {item.kakao_link ? '연결' : '없음'}
                        </td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, color: st.color, background: st.bg }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                            <button type="button" title="승인" onClick={(e) => { e.stopPropagation(); updateStatus(item, 'active') }} style={{ ...iconActionBtn, background: '#E8F5E9', color: '#2E7D32' }}>✓</button>
                            <button type="button" title="반려" onClick={(e) => { e.stopPropagation(); updateStatus(item, 'rejected') }} style={{ ...iconActionBtn, background: '#FFEBEE', color: '#C62828' }}>✗</button>
                            <button type="button" title="대기" onClick={(e) => { e.stopPropagation(); updateStatus(item, 'pending') }} style={{ ...iconActionBtn, background: '#FFF8E1', color: '#F59E0B' }}>🔄</button>
                            <button type="button" title="삭제" onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }} style={{ ...iconActionBtn, background: '#F5F5F5', color: '#666' }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr onClick={(e) => e.stopPropagation()}>
                          <td colSpan={8} style={{ padding: '16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            {renderInstructorEditPanel()}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : items.map(item => (
          <div key={item.id} style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {(() => {
                let img = item.poster_url || item.photo_url || item.image_url;
                if (category === 'rental') {
                  const key = `${item.name || ''}`.replace(/\s+/g, '').toLowerCase();
                  if (key.includes('강남턴') || key.includes('강턴')) img = gangturnPhoto;
                  else if (key.includes('꼼애야')) img = ggomaeyaPhoto;
                  else if (key.includes('놀이터')) img = noriterPhoto;
                  else if (key === '라틴') img = latinPhoto;
                  else if (key.includes('마콘도')) img = macondoPhoto;
                  else if (key.includes('보니따')) img = bonitaPhoto;
                  else if (key.includes('부에나') && !key.includes('비스타')) img = buenaPhoto;
                  else if (key.includes('홍턴')) img = hongturnPhoto;
                  else if (key.includes('비비고')) img = bibigoPhoto;
                }
                return img ? <img src={img} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '12px' }} /> : null;
              })()}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>ID: {item.id} | {item.created_at?.split('T')[0]} {item.created_at?.split('T')[1]?.slice(0, 5)}</div>
                
                {editingItem === item.id && category !== 'instructor-classes' ? (
                  /* 수정 모드 */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input value={editFormData.title || editFormData.name || ''} onChange={e => setEditFormData({ ...editFormData, title: e.target.value, name: e.target.value })} placeholder="제목/이름" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontWeight: 700 }} />

                    {/* ── 페스티벌 전용 필드 ── */}
                    {category === 'festival' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input value={editFormData.organizer || ''} onChange={e => setEditFormData({ ...editFormData, organizer: e.target.value })} placeholder="주최자" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                          <select value={editFormData.genre || '바차타'} onChange={e => setEditFormData({ ...editFormData, genre: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                            {['바차타','살사','키좀바','쥬크'].map(g => <option key={g}>{g}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input type="date" value={editFormData.start_date || ''} onChange={e => setEditFormData({ ...editFormData, start_date: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                          <input type="date" value={editFormData.end_date || ''} onChange={e => setEditFormData({ ...editFormData, end_date: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <select value={editFormData.region || '서울'} onChange={e => setEditFormData({ ...editFormData, region: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                            {['서울','경인','강원','제주','부산/경남','전라도','충청도'].map(r => <option key={r}>{r}</option>)}
                          </select>
                          <input value={editFormData.price || ''} onChange={e => setEditFormData({ ...editFormData, price: e.target.value })} placeholder="가격" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        </div>
                        <input value={editFormData.location || ''} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} placeholder="상세 장소" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        <textarea rows={3} value={editFormData.description || ''} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} placeholder="설명" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', resize: 'none' }} />
                        <input value={editFormData.poster_url || ''} onChange={e => setEditFormData({ ...editFormData, poster_url: e.target.value })} placeholder="포스터 URL" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <input value={editFormData.bank_info || ''} onChange={e => setEditFormData({ ...editFormData, bank_info: e.target.value })} placeholder="입금 계좌 (예: 카카오뱅크 3333-01-123 홍길동)" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: 6 }}>유형</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {[['festival','🎪 페스티벌'],['mt','🏕️ MT']].map(([val, label]) => (
                              <button key={val} type="button" onClick={() => setEditFormData({ ...editFormData, event_type: val })}
                                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${editFormData.event_type === val ? '#C9A84C' : '#E2E8F0'}`, background: editFormData.event_type === val ? 'rgba(201,168,76,0.1)' : '#fff', color: editFormData.event_type === val ? '#B8860B' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                              >{label}</button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── 부트캠프 전용 필드 ── */}
                    {category === 'bootcamp' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input value={editFormData.instructor || ''} onChange={e => setEditFormData({ ...editFormData, instructor: e.target.value })} placeholder="강사명" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                          <select value={editFormData.genre || '바차타'} onChange={e => setEditFormData({ ...editFormData, genre: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                            {['바차타','살사','키좀바','쥬크'].map(g => <option key={g}>{g}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <select value={editFormData.level || '전체'} onChange={e => setEditFormData({ ...editFormData, level: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                            {['초급','중급','상급','전체'].map(l => <option key={l}>{l}</option>)}
                          </select>
                          <select value={editFormData.type || 'domestic'} onChange={e => setEditFormData({ ...editFormData, type: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                            <option value="domestic">국내</option>
                            <option value="overseas">해외</option>
                          </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input type="date" value={editFormData.start_date || ''} onChange={e => setEditFormData({ ...editFormData, start_date: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                          <input type="date" value={editFormData.end_date || ''} onChange={e => setEditFormData({ ...editFormData, end_date: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <select value={editFormData.region || '서울'} onChange={e => setEditFormData({ ...editFormData, region: e.target.value })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                            {['서울','경인','경상도','전라도','충청도','강원/제주','해외'].map(r => <option key={r}>{r}</option>)}
                          </select>
                          <input value={editFormData.fee || ''} onChange={e => setEditFormData({ ...editFormData, fee: e.target.value })} placeholder="가격/참가비" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        </div>
                        <input value={editFormData.venue || ''} onChange={e => setEditFormData({ ...editFormData, venue: e.target.value })} placeholder="상세 장소" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        <textarea rows={3} value={editFormData.description || ''} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} placeholder="설명" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', resize: 'none' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input value={editFormData.instagram || ''} onChange={e => setEditFormData({ ...editFormData, instagram: e.target.value })} placeholder="인스타그램 URL" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                          <input value={editFormData.youtube || ''} onChange={e => setEditFormData({ ...editFormData, youtube: e.target.value })} placeholder="유튜브 URL" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        </div>
                        <input value={editFormData.poster_url || ''} onChange={e => setEditFormData({ ...editFormData, poster_url: e.target.value })} placeholder="포스터 URL" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <input value={editFormData.bank_info || ''} onChange={e => setEditFormData({ ...editFormData, bank_info: e.target.value })} placeholder="입금 계좌 (예: 카카오뱅크 3333-01-123 홍길동)" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      </>
                    )}

                    {category === 'rental' && (
                      <>
                        <input value={editFormData.address || ''} onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} placeholder="상세 주소" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        <input value={editFormData.kakao_url || ''} onChange={e => setEditFormData({ ...editFormData, kakao_url: e.target.value })} placeholder="카카오톡 오픈챗 URL" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        <input value={editFormData.instagram_url || ''} onChange={e => setEditFormData({ ...editFormData, instagram_url: e.target.value })} placeholder="인스타그램 URL" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#F1F5F9', borderRadius: '10px' }}>
                          <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                            <input type="file" accept="image/*" onChange={handleAdminImageChange} style={{ display: 'none' }} />
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#FFF', border: '1px dashed #94A3B8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {(preview || editFormData.image_url) ? (
                                <img src={preview || editFormData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : <Camera size={24} color="#94A3B8" />}
                            </div>
                          </label>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>대표 사진 업로드/교체</div>
                            <input value={editFormData.image_url || ''} onChange={e => setEditFormData({ ...editFormData, image_url: e.target.value })} placeholder="또는 URL 직접 입력" style={{ width: '100%', padding: '5px 0', border: 'none', borderBottom: '1px solid #CBD5E1', backgroundColor: 'transparent', fontSize: '12px' }} />
                          </div>
                        </div>
                      </>
                    )}
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
                        <input value={editFormData.career || ''} onChange={e => setEditFormData({ ...editFormData, career: e.target.value })} placeholder="경력" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        <input value={editFormData.class_type || ''} onChange={e => setEditFormData({ ...editFormData, class_type: e.target.value })} placeholder="수업 방식" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                        <input type="number" value={editFormData.awards || ''} onChange={e => setEditFormData({ ...editFormData, awards: e.target.value })} placeholder="수상 횟수 (예: 3)" aria-label="수상 횟수" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                      </>
                    )}
                    {(category === 'social' || category === 'live-mgmt') && (
                      <>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: 6 }}>실시간 인원</div>
                        <input type="number" value={editFormData.view_count || 0} onChange={e => setEditFormData({ ...editFormData, view_count: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
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
                    {category === 'rental' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>🍷 {item.name}</h3>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>📍 {item.address || '주소 없음'}</div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', marginTop: '4px' }}>
                          <span style={{ color: '#E53935', fontWeight: 800 }}>💬 카카오: {item.kakao_url ? '연결됨' : '미등록'}</span>
                          <span style={{ color: '#C2185B', fontWeight: 800 }}>📸 인스타: {item.instagram_url ? '연결됨' : '미등록'}</span>
                        </div>
                        {(() => {
                          const key = `${item.name || ''}`.replace(/\s+/g, '').toLowerCase();
                          const isLatinValid = key === '라틴';
                          const isCustom = key.includes('강남턴') || key.includes('강턴') || key.includes('꼼애야') || key.includes('놀이터') || isLatinValid || key.includes('마콘도') || key.includes('보니따') || (key.includes('부에나') && !key.includes('비스타')) || key.includes('홍턴') || key.includes('비비고');
                          return (item.image_url || isCustom) && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', wordBreak: 'break-all' }}>이미지: {isCustom ? '✨ 내장 브랜드 고유 에셋 매핑 적용 완료' : item.image_url}</div>;
                        })()}
                      </div>
                    ) : category === 'instructor' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>👤 {item.name} (@{item.custom_id})</h3>
                        <div style={{ fontSize: '13px', color: '#7C3AED', fontWeight: 800 }}>🎵 {Array.isArray(item.genre) ? item.genre.join(', ') : item.genre} | 📍 {item.city}</div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                          <span style={{ color: '#E11D48', fontWeight: 700 }}>📸 Inst: {item.instagram || '-'}</span>
                          <span style={{ color: '#F59E0B', fontWeight: 700 }}>💬 Kakao: {item.kakao_link ? 'YES' : 'NO'}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.4', background: '#F8FAFC', padding: '8px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>{item.bio}</div>
                      </div>
                    ) : category === 'instructor-classes' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>📚 {item.title}</h3>
                        <div style={{ fontSize: '13px', color: '#7C3AED', fontWeight: 800 }}>👤 강사: {item.instructors?.name || '알수없음'}</div>
                        <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.4', background: '#F8FAFC', padding: '8px', borderRadius: '8px' }}>{item.description}</div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>⏰ {item.schedule} | 📍 {item.location} | 💰 {item.fee}</div>
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
                      {category !== 'rental' && (
                        <>
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
                        </>
                      )}
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
                  <button type="button" onClick={() => bumpPartyViewCount(item, 20)} style={{ padding: '8px 16px', background: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>+20명</button>
                  <button type="button" onClick={() => bumpPartyViewCount(item, 30)} style={{ padding: '8px 16px', background: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>+30명</button>
                  <button type="button" onClick={() => bumpPartyViewCount(item, 50)} style={{ padding: '8px 16px', background: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>+50명</button>
                  <button type="button" onClick={() => bumpPartyViewCount(item, 100)} style={{ padding: '8px 16px', background: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>+100명</button>
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
            isEdit={Boolean(currentItem?.id)}
            isAdminMode={true}
            initialData={currentItem}
            onBack={() => {
              setShowEditModal(false);
              setCurrentItem(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setCurrentItem(null);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
      {showClassEditModal && (
        <ClassRegisterModal
          isOpen={showClassEditModal}
          editClassItem={classEditItem}
          instructorId={classEditItem?.instructor_id || ''}
          onClose={() => {
            setShowClassEditModal(false);
            setClassEditItem(null);
          }}
          onSaved={() => {
            fetchData();
          }}
        />
      )}
    </div>
  )
}
