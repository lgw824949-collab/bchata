import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bell, Copy, MessageCircle, Send } from 'lucide-react';
import { Z } from '../constants/zLayers';
import { supabase } from '../lib/supabase';

const formatNoticeDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const buildShareText = (name, title, body) => {
  const header = `[${name || '강사'} 공지]`;
  return `${header}\n${title}\n\n${body}`.trim();
};

const InstructorNoticeModal = ({ onClose, instructorId }) => {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const { data: inst } = await supabase
        .from('instructors')
        .select('id, name, kakao_link')
        .eq('id', instructorId)
        .maybeSingle();
      setProfile(inst);

      const { data: rows, error } = await supabase
        .from('instructor_notices')
        .select('id, title, body, created_at')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        if (error.code === '42P01' || String(error.message || '').includes('instructor_notices')) {
          setDbReady(false);
          setHistory([]);
        } else {
          throw error;
        }
      } else {
        setDbReady(true);
        setHistory(rows || []);
      }
    } catch {
      setProfile(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const shareText = buildShareText(profile?.name, title, body);

  const handleCopy = async () => {
    if (!title.trim() || !body.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    try {
      await navigator.clipboard.writeText(shareText);
      alert('공지 내용이 복사되었습니다. 카톡·인스타 등에 붙여넣기 하세요.');
    } catch {
      alert('복사에 실패했습니다. 내용을 직접 복사해주세요.');
    }
  };

  const handleKakao = async () => {
    if (!title.trim() || !body.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    await handleCopy();
    const link = String(profile?.kakao_link || '').trim();
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      alert('프로필에 카카오 문의 링크가 없습니다. 클래스등록에서 카카오 링크를 등록해 주세요.');
    }
  };

  const handleSend = async () => {
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    if (!dbReady) {
      await handleCopy();
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('instructor_notices')
        .insert({ instructor_id: instructorId, title: t, body: b })
        .select('id, title, body, created_at')
        .maybeSingle();
      if (error) throw error;
      if (data) setHistory((prev) => [data, ...prev].slice(0, 10));
      setTitle('');
      setBody('');
      alert('공지가 저장되었습니다.');
    } catch {
      alert('저장에 실패했습니다. 복사 후 직접 보내주세요.');
    } finally {
      setSaving(false);
    }
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
              <Bell size={20} color="#C9A84C" />
              공지 보내기
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
              VIP INSTRUCTOR
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
                marginBottom: 12,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.25)',
                fontSize: 11,
                color: '#FDE68A',
                fontWeight: 600,
              }}
            >
              공지 저장 DB가 없으면 복사·카톡만 사용됩니다. SQL: 20260524120000_instructor_notices.sql
            </div>
          )}

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지 제목 (예: 이번 주 수업 안내)"
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="공지 내용을 입력하세요."
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 120, marginBottom: 12, fontFamily: 'inherit' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              disabled={saving}
              onClick={handleSend}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Send size={16} />
              {dbReady ? (saving ? '저장 중...' : '공지 저장') : '내용 복사하기'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid rgba(201,168,76,0.35)',
                  background: 'rgba(201,168,76,0.1)',
                  color: '#C9A84C',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Copy size={14} />
                복사
              </button>
              <button
                type="button"
                onClick={handleKakao}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid rgba(254,229,0,0.35)',
                  background: 'rgba(254,229,0,0.12)',
                  color: '#FEE500',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MessageCircle size={14} />
                카톡
              </button>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 8, letterSpacing: '0.5px' }}>
            최근 보낸 공지
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>불러오는 중...</div>
          ) : history.length === 0 ? (
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, padding: '12px 0' }}>
              아직 저장한 공지가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>{n.title}</div>
                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, flexShrink: 0 }}>
                      {formatNoticeDate(n.created_at)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#94A3B8',
                      lineHeight: 1.45,
                      fontWeight: 600,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {n.body}
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

export default InstructorNoticeModal;
