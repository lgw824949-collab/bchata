import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Plus, Search, Phone, Trash2, ChevronDown } from 'lucide-react';
import { Z } from '../constants/zLayers';
import { supabase } from '../lib/supabase';

const STATUS_OPTIONS = [
  { value: 'registered', label: '신청' },
  { value: 'paid', label: '입금완료' },
  { value: 'attended', label: '수강완료' },
  { value: 'cancelled', label: '취소' },
];

const statusColor = (value) => {
  if (value === 'paid') return '#22C55E';
  if (value === 'attended') return '#38BDF8';
  if (value === 'cancelled') return '#94A3B8';
  return '#C9A84C';
};

const emptyForm = () => ({
  name: '',
  phone: '',
  classId: '',
  memo: '',
  status: 'registered',
});

const StudentManagementModal = ({ onClose, instructorId }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [dbReady, setDbReady] = useState(true);

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const loadData = useCallback(async () => {
    if (!instructorId || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [classRes, studentRes] = await Promise.all([
        supabase
          .from('instructor_classes')
          .select('id, title, schedule, capacity, status')
          .eq('instructor_id', instructorId)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('instructor_class_students')
          .select('*')
          .eq('instructor_id', instructorId)
          .order('created_at', { ascending: false }),
      ]);

      if (classRes.error) throw classRes.error;
      if (studentRes.error) {
        if (studentRes.error.code === '42P01' || String(studentRes.error.message || '').includes('instructor_class_students')) {
          setDbReady(false);
          setStudents([]);
        } else {
          throw studentRes.error;
        }
      } else {
        setDbReady(true);
        setStudents(studentRes.data || []);
      }
      setClasses(classRes.data || []);
    } catch {
      setClasses([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classTitleById = useMemo(() => {
    const map = {};
    classes.forEach((c) => {
      map[c.id] = c.title || '클래스';
    });
    return map;
  }, [classes]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter !== 'all' && s.class_id !== classFilter) return false;
      if (!q) return true;
      const hay = `${s.name || ''} ${s.phone || ''} ${s.memo || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [students, classFilter, search]);

  const countByClass = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      if (s.status === 'cancelled') return;
      const key = s.class_id || '_none';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [students]);

  const activeCount = students.filter((s) => s.status !== 'cancelled').length;

  const handleAddStudent = async () => {
    const name = form.name.trim();
    if (!name) {
      alert('수강생 이름을 입력해주세요.');
      return;
    }
    if (!dbReady) {
      alert('수강생 DB가 아직 준비되지 않았습니다. Supabase에서 migration SQL을 실행해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        instructor_id: instructorId,
        class_id: form.classId || null,
        name,
        phone: form.phone.trim() || null,
        status: form.status,
        memo: form.memo.trim() || null,
      };
      const { data, error } = await supabase
        .from('instructor_class_students')
        .insert(payload)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (data) setStudents((prev) => [data, ...prev]);
      setForm(emptyForm());
      setShowForm(false);
    } catch {
      alert('등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (row, nextStatus) => {
    if (!dbReady) return;
    const { data, error } = await supabase
      .from('instructor_class_students')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .select('*')
      .maybeSingle();
    if (error || !data) {
      alert('상태 변경에 실패했습니다.');
      return;
    }
    setStudents((prev) => prev.map((s) => (s.id === row.id ? data : s)));
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`${row.name} 수강생을 삭제할까요?`)) return;
    const { error } = await supabase.from('instructor_class_students').delete().eq('id', row.id);
    if (error) {
      alert('삭제에 실패했습니다.');
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== row.id));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modal,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          background: '#121212',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '440px',
          maxHeight: '88vh',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} color="#C9A84C" />
              수강생 관리
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
              VIP INSTRUCTOR · 등록 {activeCount}명
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 12,
              padding: 8,
              color: '#C9A84C',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>
          {!dbReady && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.25)',
                fontSize: 12,
                color: '#E2E8F0',
                lineHeight: 1.5,
                fontWeight: 600,
              }}
            >
              수강생 테이블이 아직 없습니다. Supabase SQL Editor에서{' '}
              <span style={{ color: '#C9A84C' }}>20260523120000_instructor_class_students.sql</span>을 실행해 주세요.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: 14,
                background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.2)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>수강생</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#C9A84C', marginTop: 4 }}>{activeCount}</div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>내 클래스</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC', marginTop: 4 }}>{classes.length}</div>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 · 연락처 검색"
              style={{ ...inputStyle, paddingLeft: 40 }}
            />
          </div>

          <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
            <button
              type="button"
              onClick={() => setClassFilter('all')}
              style={{
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: 999,
                border: `1px solid ${classFilter === 'all' ? '#C9A84C' : 'rgba(255,255,255,0.12)'}`,
                background: classFilter === 'all' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.03)',
                color: classFilter === 'all' ? '#C9A84C' : '#94A3B8',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              전체 {students.filter((s) => s.status !== 'cancelled').length}
            </button>
            {classes.map((c) => {
              const cap = parseInt(String(c.capacity || '').replace(/\D/g, ''), 10);
              const enrolled = countByClass[c.id] || 0;
              const capLabel = Number.isFinite(cap) && cap > 0 ? ` ${enrolled}/${cap}` : ` ${enrolled}`;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClassFilter(c.id)}
                  style={{
                    flexShrink: 0,
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: `1px solid ${classFilter === c.id ? '#C9A84C' : 'rgba(255,255,255,0.12)'}`,
                    background: classFilter === c.id ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.03)',
                    color: classFilter === c.id ? '#C9A84C' : '#94A3B8',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(c.title || '클래스').slice(0, 12)}
                  {capLabel}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            disabled={!dbReady}
            style={{
              width: '100%',
              marginBottom: 14,
              padding: '12px 16px',
              borderRadius: 14,
              border: '1px solid rgba(201,168,76,0.35)',
              background: 'rgba(201,168,76,0.12)',
              color: '#C9A84C',
              fontSize: 14,
              fontWeight: 800,
              cursor: dbReady ? 'pointer' : 'not-allowed',
              opacity: dbReady ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Plus size={18} />
            {showForm ? '등록 폼 닫기' : '수강생 추가'}
          </button>

          {showForm && dbReady && (
            <div
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="이름 *"
                style={inputStyle}
              />
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="연락처 (전화·카톡)"
                style={inputStyle}
              />
              <div style={{ position: 'relative' }}>
                <select
                  value={form.classId}
                  onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                  style={{ ...inputStyle, appearance: 'none', paddingRight: 36 }}
                >
                  <option value="">클래스 선택 (선택)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || '클래스'}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} color="#64748B" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  style={{ ...inputStyle, appearance: 'none', paddingRight: 36 }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} color="#64748B" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <input
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="메모"
                style={inputStyle}
              />
              <button
                type="button"
                disabled={saving}
                onClick={handleAddStudent}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 12,
                  border: 'none',
                  background: '#C9A84C',
                  color: '#121212',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? '등록 중...' : '등록하기'}
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 13, fontWeight: 700 }}>불러오는 중...</div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 12px', color: '#64748B' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>등록된 수강생이 없습니다</div>
              <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600 }}>위에서 수강생을 추가해 보세요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredStudents.map((row) => (
                <div
                  key={row.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#F8FAFC' }}>{row.name}</div>
                      {row.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                          <Phone size={12} />
                          {row.phone}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 6, fontWeight: 700 }}>
                        {row.class_id ? classTitleById[row.class_id] : '클래스 미지정'}
                      </div>
                      {row.memo && (
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, lineHeight: 1.4 }}>{row.memo}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      style={{
                        flexShrink: 0,
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleStatusChange(row, opt.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: `1px solid ${row.status === opt.value ? statusColor(opt.value) : 'rgba(255,255,255,0.1)'}`,
                          background: row.status === opt.value ? `${statusColor(opt.value)}22` : 'transparent',
                          color: row.status === opt.value ? statusColor(opt.value) : '#64748B',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StudentManagementModal;
