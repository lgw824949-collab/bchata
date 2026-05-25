import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, Wallet, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Z } from '../constants/zLayers';
import { supabase } from '../lib/supabase';
import { formatWon, parseClassFeeWon } from '../lib/parseClassFee';

const CONFIRMED_STATUSES = new Set(['paid', 'attended']);
const PENDING_STATUSES = new Set(['registered']);

const STATUS_LABEL = {
  registered: '신청',
  paid: '입금완료',
  attended: '수강완료',
  cancelled: '취소',
};

const formatShortDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const isThisMonth = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

const RevenueSummaryModal = ({ onClose, instructorId }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [dbReady, setDbReady] = useState(true);

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
          .select('id, title, fee, schedule, capacity')
          .eq('instructor_id', instructorId)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('instructor_class_students')
          .select('id, class_id, name, phone, status, created_at, updated_at')
          .eq('instructor_id', instructorId)
          .order('updated_at', { ascending: false }),
      ]);

      if (classRes.error) throw classRes.error;
      if (studentRes.error) {
        if (
          studentRes.error.code === '42P01'
          || String(studentRes.error.message || '').includes('instructor_class_students')
        ) {
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

  const classMeta = useMemo(() => {
    const map = {};
    classes.forEach((c) => {
      const unit = parseClassFeeWon(c.fee);
      map[c.id] = {
        title: c.title || '클래스',
        feeLabel: c.fee || '미입력',
        unitWon: unit,
        parseable: unit != null,
      };
    });
    return map;
  }, [classes]);

  const filteredStudents = useMemo(() => {
    if (period === 'all') return students;
    return students.filter((s) => isThisMonth(s.created_at));
  }, [students, period]);

  const stats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let unpricedCount = 0;
    const confirmedPeople = [];
    const pendingPeople = [];

    const byClass = {};

    const pushPerson = (list, s, meta, unit) => {
      list.push({
        id: s.id,
        name: s.name || '이름 없음',
        phone: s.phone || '',
        status: s.status,
        statusLabel: STATUS_LABEL[s.status] || s.status,
        classTitle: meta?.title || '클래스 미지정',
        amountWon: unit,
        markedAt: s.updated_at || s.created_at,
      });
    };

    filteredStudents.forEach((s) => {
      if (s.status === 'cancelled') return;
      const key = s.class_id || '_none';
      if (!byClass[key]) {
        byClass[key] = { confirmed: 0, pending: 0, confirmedN: 0, pendingN: 0, unpricedN: 0, people: [] };
      }
      const meta = s.class_id ? classMeta[s.class_id] : null;
      const unit = meta?.unitWon ?? null;
      const amountLabel = unit != null ? formatWon(unit) : '—';

      if (CONFIRMED_STATUSES.has(s.status)) {
        confirmedCount += 1;
        byClass[key].confirmedN += 1;
        pushPerson(confirmedPeople, s, meta, unit);
        byClass[key].people.push({
          name: s.name || '이름 없음',
          statusLabel: STATUS_LABEL[s.status],
          amountLabel,
          kind: 'confirmed',
        });
        if (unit != null) {
          confirmed += unit;
          byClass[key].confirmed += unit;
        } else {
          unpricedCount += 1;
          byClass[key].unpricedN += 1;
        }
      } else if (PENDING_STATUSES.has(s.status)) {
        pendingCount += 1;
        byClass[key].pendingN += 1;
        pushPerson(pendingPeople, s, meta, unit);
        byClass[key].people.push({
          name: s.name || '이름 없음',
          statusLabel: STATUS_LABEL[s.status],
          amountLabel,
          kind: 'pending',
        });
        if (unit != null) {
          pending += unit;
          byClass[key].pending += unit;
        } else {
          unpricedCount += 1;
          byClass[key].unpricedN += 1;
        }
      }
    });

    const classRows = classes
      .map((c) => {
        const agg = byClass[c.id] || { confirmed: 0, pending: 0, confirmedN: 0, pendingN: 0, unpricedN: 0, people: [] };
        const meta = classMeta[c.id];
        return {
          id: c.id,
          title: meta.title,
          feeLabel: meta.feeLabel,
          unitWon: meta.unitWon,
          parseable: meta.parseable,
          ...agg,
          total: agg.confirmed + agg.pending,
        };
      })
      .filter((row) => row.confirmedN > 0 || row.pendingN > 0 || row.unpricedN > 0);

    const unassigned = byClass._none;
    if (unassigned && (unassigned.confirmedN > 0 || unassigned.pendingN > 0)) {
      classRows.push({
        id: '_none',
        title: '클래스 미지정',
        feeLabel: '—',
        unitWon: null,
        parseable: false,
        people: unassigned.people || [],
        ...unassigned,
        total: unassigned.confirmed + unassigned.pending,
      });
    }

    classRows.sort((a, b) => b.total - a.total);

    return {
      confirmed,
      pending,
      total: confirmed + pending,
      confirmedCount,
      pendingCount,
      unpricedCount,
      classRows,
      confirmedPeople,
      pendingPeople,
    };
  }, [filteredStudents, classMeta, classes]);

  const periodLabel = period === 'month' ? '이번 달' : '전체';

  const renderPersonList = (people, emptyText, accentColor) => {
    if (!people.length) {
      return (
        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, padding: '8px 0' }}>{emptyText}</div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {people.map((p) => (
          <div
            key={p.id}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${accentColor}33`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC' }}>{p.name}</div>
                {p.phone && (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>{p.phone}</div>
                )}
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 700 }}>
                  {p.classTitle}
                  {p.markedAt ? ` · 상태 변경 ${formatShortDate(p.markedAt)}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: accentColor }}>
                  {p.amountWon != null ? formatWon(p.amountWon) : '—'}
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: 700 }}>{p.statusLabel}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
              <TrendingUp size={20} color="#C9A84C" />
              수입 집계
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
              VIP INSTRUCTOR · {periodLabel}
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
              수강생 DB가 없으면 집계할 수 없습니다. Supabase에서 수강생 테이블 migration을 먼저 실행해 주세요.
            </div>
          )}

          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.22)',
              fontSize: 11,
              color: '#BFDBFE',
              lineHeight: 1.55,
              fontWeight: 600,
            }}
          >
            <strong style={{ color: '#93C5FD' }}>입금 확인 방법</strong>
            <br />
            통장 자동 연동은 없습니다. <strong style={{ color: '#E0F2FE' }}>수강생 관리</strong>에서 입금 확인 후
            「입금완료」 또는 「수강완료」로 바꾼 사람만 확정 수입·합계에 들어갑니다. 아래 명단에서 누가 포함됐는지 확인하세요.
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { key: 'month', label: '이번 달' },
              { key: 'all', label: '전체' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPeriod(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: `1px solid ${period === tab.key ? '#C9A84C' : 'rgba(255,255,255,0.12)'}`,
                  background: period === tab.key ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.03)',
                  color: period === tab.key ? '#C9A84C' : '#94A3B8',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 13, fontWeight: 700 }}>
              집계 중...
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div
                  style={{
                    padding: '14px 12px',
                    borderRadius: 14,
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#86EFAC', fontWeight: 800 }}>
                    <CheckCircle2 size={12} />
                    확정 수입
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#22C55E', marginTop: 8 }}>
                    {formatWon(stats.confirmed)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
                    입금·수강 {stats.confirmedCount}명
                  </div>
                </div>
                <div
                  style={{
                    padding: '14px 12px',
                    borderRadius: 14,
                    background: 'rgba(201,168,76,0.1)',
                    border: '1px solid rgba(201,168,76,0.22)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#C9A84C', fontWeight: 800 }}>
                    <Clock size={12} />
                    예상 수입
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#C9A84C', marginTop: 8 }}>
                    {formatWon(stats.pending)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
                    신청 {stats.pendingCount}명
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '16px 14px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(255,255,255,0.04) 100%)',
                  border: '1px solid rgba(201,168,76,0.28)',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8', fontWeight: 800 }}>
                    <Wallet size={14} color="#C9A84C" />
                    합계 (확정+예상)
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#F8FAFC', marginTop: 6 }}>
                    {formatWon(stats.total)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#86EFAC', marginBottom: 8, letterSpacing: '0.5px' }}>
                  입금 확인된 수강생 ({stats.confirmedCount}명)
                </div>
                {renderPersonList(
                  stats.confirmedPeople,
                  '아직 입금완료·수강완료로 표시한 수강생이 없습니다.',
                  '#22C55E',
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#C9A84C', marginBottom: 8, letterSpacing: '0.5px' }}>
                  입금 대기 — 신청만 한 수강생 ({stats.pendingCount}명)
                </div>
                {renderPersonList(
                  stats.pendingPeople,
                  '신청 상태 수강생이 없습니다.',
                  '#C9A84C',
                )}
              </div>

              {stats.unpricedCount > 0 && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    fontSize: 11,
                    color: '#FDE68A',
                    fontWeight: 600,
                    lineHeight: 1.45,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    수업료를 숫자로 읽지 못한 수강생 {stats.unpricedCount}명은 합계에서 제외됐습니다. 클래스 등록 시
                    「12만원」「50,000원」 형식으로 입력해 주세요.
                  </span>
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 10, letterSpacing: '0.5px' }}>
                클래스별
              </div>

              {stats.classRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 12px', color: '#64748B' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{periodLabel} 집계할 수강생이 없습니다</div>
                  <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600 }}>수강생 관리에서 등록·상태를 업데이트하세요</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.classRows.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#F8FAFC', marginBottom: 4 }}>{row.title}</div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 10 }}>
                        수업료: {row.feeLabel}
                        {row.parseable ? ` · 1인 ${formatWon(row.unitWon)}` : ' · 금액 자동 계산 불가'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: row.people?.length ? 10 : 0 }}>
                        <span style={{ color: '#22C55E' }}>확정 {formatWon(row.confirmed)} ({row.confirmedN}명)</span>
                        <span style={{ color: '#C9A84C' }}>예상 {formatWon(row.pending)} ({row.pendingN}명)</span>
                      </div>
                      {row.people?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {row.people.map((p, i) => (
                            <div key={`${row.id}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                              <span style={{ color: p.kind === 'confirmed' ? '#E2E8F0' : '#94A3B8' }}>
                                {p.name} · {p.statusLabel}
                              </span>
                              <span style={{ color: p.kind === 'confirmed' ? '#22C55E' : '#C9A84C' }}>{p.amountLabel}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RevenueSummaryModal;
