import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, CalendarDays, MapPin, Clock, Users } from 'lucide-react';
import { Z } from '../constants/zLayers';
import { supabase } from '../lib/supabase';
import { getKSTCalendarTodayStr } from '../lib/dateNorm';
import {
  formatScheduleDateLabel,
  formatScheduleTimeRange,
  getScheduleTiming,
  parseClassSchedule,
} from '../lib/parseClassSchedule';

const TIMING_LABEL = {
  today: '오늘',
  upcoming: '예정',
  past: '종료',
  unknown: '미정',
};

const TIMING_COLOR = {
  today: '#22C55E',
  upcoming: '#C9A84C',
  past: '#64748B',
  unknown: '#94A3B8',
};

const MyClassScheduleModal = ({ onClose, instructorId }) => {
  const [classes, setClasses] = useState([]);
  const [enrollCounts, setEnrollCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  const todayStr = getKSTCalendarTodayStr();

  const loadData = useCallback(async () => {
    if (!instructorId || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: classRows, error: classErr } = await supabase
        .from('instructor_classes')
        .select('id, title, schedule, location, genre, level, capacity, fee, poster_url, created_at')
        .eq('instructor_id', instructorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (classErr) throw classErr;
      setClasses(classRows || []);

      const { data: students } = await supabase
        .from('instructor_class_students')
        .select('class_id, status')
        .eq('instructor_id', instructorId);

      const counts = {};
      (students || []).forEach((s) => {
        if (!s.class_id || s.status === 'cancelled') return;
        counts[s.class_id] = (counts[s.class_id] || 0) + 1;
      });
      setEnrollCounts(counts);
    } catch {
      setClasses([]);
      setEnrollCounts({});
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scheduleItems = useMemo(() => {
    return (classes || []).map((c) => {
      const parsed = parseClassSchedule(c.schedule);
      const timing = getScheduleTiming(parsed, todayStr);
      return {
        ...c,
        parsed,
        timing,
        timingLabel: TIMING_LABEL[timing],
        timingColor: TIMING_COLOR[timing],
        dateLabel: formatScheduleDateLabel(parsed.startDate),
        timeLabel: formatScheduleTimeRange(parsed),
        enrolled: enrollCounts[c.id] || 0,
        sortKey: `${parsed.startDate || '9999-99-99'}T${parsed.startTime || '99:99'}`,
      };
    });
  }, [classes, enrollCounts, todayStr]);

  const filtered = useMemo(() => {
    if (filter === 'all') return scheduleItems;
    if (filter === 'upcoming') {
      return scheduleItems.filter((i) => i.timing === 'today' || i.timing === 'upcoming');
    }
    if (filter === 'past') return scheduleItems.filter((i) => i.timing === 'past');
    return scheduleItems.filter((i) => i.timing === 'unknown');
  }, [scheduleItems, filter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (filter === 'past') {
      return list.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
    }
    return list.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filtered, filter]);

  const counts = useMemo(() => ({
    upcoming: scheduleItems.filter((i) => i.timing === 'today' || i.timing === 'upcoming').length,
    past: scheduleItems.filter((i) => i.timing === 'past').length,
    all: scheduleItems.length,
  }), [scheduleItems]);

  const groupedByDate = useMemo(() => {
    const groups = [];
    let lastDate = null;
    sorted.forEach((item) => {
      const dateKey = item.parsed.startDate || '미정';
      if (dateKey !== lastDate) {
        groups.push({ type: 'header', dateKey, label: item.dateLabel });
        lastDate = dateKey;
      }
      groups.push({ type: 'item', item });
    });
    return groups;
  }, [sorted]);

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
              <CalendarDays size={20} color="#C9A84C" />
              내 클래스 일정
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
              VIP INSTRUCTOR · 오늘 {formatScheduleDateLabel(todayStr)}
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { key: 'upcoming', label: `다가오는 ${counts.upcoming}` },
              { key: 'past', label: `지난 ${counts.past}` },
              { key: 'all', label: `전체 ${counts.all}` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 12,
                  border: `1px solid ${filter === tab.key ? '#C9A84C' : 'rgba(255,255,255,0.12)'}`,
                  background: filter === tab.key ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.03)',
                  color: filter === tab.key ? '#C9A84C' : '#94A3B8',
                  fontSize: 12,
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
              일정 불러오는 중...
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 12px', color: '#64748B' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {filter === 'past' ? '지난 클래스가 없습니다' : '등록된 일정이 없습니다'}
              </div>
              <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600 }}>
                클래스등록에서 수업을 등록하면 여기에 표시됩니다
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {groupedByDate.map((row, idx) => {
                if (row.type === 'header') {
                  return (
                    <div
                      key={`h-${row.dateKey}-${idx}`}
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: '#C9A84C',
                        letterSpacing: '0.5px',
                        marginTop: idx > 0 ? 8 : 0,
                        paddingBottom: 4,
                      }}
                    >
                      {row.label}
                    </div>
                  );
                }
                const item = row.item;
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${item.timing === 'today' ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      display: 'flex',
                      gap: 12,
                    }}
                  >
                    {item.poster_url ? (
                      <img
                        src={item.poster_url}
                        alt=""
                        style={{
                          width: 52,
                          height: 68,
                          borderRadius: 10,
                          objectFit: 'cover',
                          flexShrink: 0,
                          background: '#111',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 52,
                          height: 68,
                          borderRadius: 10,
                          background: 'rgba(201,168,76,0.12)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                        }}
                      >
                        📚
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: item.timingColor,
                            background: `${item.timingColor}22`,
                            border: `1px solid ${item.timingColor}44`,
                            padding: '3px 8px',
                            borderRadius: 8,
                          }}
                        >
                          {item.timingLabel}
                        </span>
                        {item.genre && (
                          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>{item.genre}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#F8FAFC', lineHeight: 1.3 }}>
                        {item.title || '클래스'}
                      </div>
                      {item.level && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 700 }}>{item.level}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                        <Clock size={12} color="#C9A84C" />
                        {item.timeLabel}
                      </div>
                      {item.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                          <MapPin size={12} color="#C9A84C" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                        <Users size={12} color="#C9A84C" />
                        수강생 {item.enrolled}명
                        {item.capacity ? ` · 정원 ${item.capacity}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MyClassScheduleModal;
