import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, BarChart2, Users, GraduationCap, Heart, Star, CalendarDays } from 'lucide-react';
import { Z } from '../constants/zLayers';
import { supabase } from '../lib/supabase';
import { getKSTCalendarTodayStr } from '../lib/dateNorm';
import { getScheduleTiming, parseClassSchedule } from '../lib/parseClassSchedule';

const StatTile = ({ label, value, sub, icon, accent = '#C9A84C' }) => (
  <div
    style={{
      padding: '14px 12px',
      borderRadius: 14,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent}33`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#94A3B8', fontWeight: 800 }}>
      {icon}
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color: accent, marginTop: 8 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 600 }}>{sub}</div>}
  </div>
);

const InstructorProfileStatsModal = ({ onClose, instructorId }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    classCount: 0,
    upcomingCount: 0,
    studentCount: 0,
    paidCount: 0,
    followerCount: 0,
    likeCount: 0,
  });

  const todayStr = getKSTCalendarTodayStr();

  const loadData = useCallback(async () => {
    if (!instructorId || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [instRes, classRes, studentRes, followRes, likeRes] = await Promise.all([
        supabase
          .from('instructors')
          .select('id, name, photo_url, city, genre, follower_count, instagram, kakao_link, bio')
          .eq('id', instructorId)
          .maybeSingle(),
        supabase
          .from('instructor_classes')
          .select('id, schedule, status')
          .eq('instructor_id', instructorId)
          .eq('status', 'active'),
        supabase
          .from('instructor_class_students')
          .select('status')
          .eq('instructor_id', instructorId),
        supabase
          .from('instructor_follows')
          .select('id', { count: 'exact', head: true })
          .eq('instructor_id', instructorId),
        supabase
          .from('instructor_likes')
          .select('id', { count: 'exact', head: true })
          .eq('instructor_id', instructorId),
      ]);

      setProfile(instRes.data || null);

      const classes = classRes.data || [];
      let upcomingCount = 0;
      classes.forEach((c) => {
        const timing = getScheduleTiming(parseClassSchedule(c.schedule), todayStr);
        if (timing === 'today' || timing === 'upcoming') upcomingCount += 1;
      });

      const students = studentRes.error ? [] : studentRes.data || [];
      const activeStudents = students.filter((s) => s.status !== 'cancelled');
      const paidCount = activeStudents.filter((s) => s.status === 'paid' || s.status === 'attended').length;

      setStats({
        classCount: classes.length,
        upcomingCount,
        studentCount: activeStudents.length,
        paidCount,
        followerCount: Number(instRes.data?.follower_count) || followRes.count || 0,
        likeCount: likeRes.count || 0,
      });
    } catch {
      setProfile(null);
      setStats({
        classCount: 0,
        upcomingCount: 0,
        studentCount: 0,
        paidCount: 0,
        followerCount: 0,
        likeCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [instructorId, todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const conversionRate = useMemo(() => {
    if (!stats.studentCount) return '—';
    return `${Math.round((stats.paidCount / stats.studentCount) * 100)}%`;
  }, [stats.paidCount, stats.studentCount]);

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
              <BarChart2 size={20} color="#C9A84C" />
              내 프로필 통계
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>VIP INSTRUCTOR</div>
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 13, fontWeight: 700 }}>
              통계 불러오는 중...
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 16,
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.2)',
                }}
              >
                {profile?.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt=""
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                    }}
                  >
                    👑
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#F8FAFC' }}>{profile?.name || '강사'}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
                    {[profile?.city, profile?.genre].filter(Boolean).join(' · ') || '프로필 정보'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <StatTile
                  label="팔로워"
                  value={(stats.followerCount || 0).toLocaleString('ko-KR')}
                  icon={<Users size={12} color="#C9A84C" />}
                />
                <StatTile
                  label="좋아요"
                  value={(stats.likeCount || 0).toLocaleString('ko-KR')}
                  icon={<Heart size={12} color="#F472B6" />}
                  accent="#F472B6"
                />
                <StatTile
                  label="등록 클래스"
                  value={stats.classCount}
                  sub={`다가오는 ${stats.upcomingCount}개`}
                  icon={<GraduationCap size={12} color="#C9A84C" />}
                />
                <StatTile
                  label="수강생"
                  value={stats.studentCount}
                  sub={`입금확인 ${stats.paidCount}명`}
                  icon={<Star size={12} color="#38BDF8" />}
                  accent="#38BDF8"
                />
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 8 }}>전환율 (신청→입금)</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#C9A84C' }}>{conversionRate}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 6, fontWeight: 600, lineHeight: 1.45 }}>
                  수강생 관리에서 입금완료·수강완료로 표시한 비율입니다.
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  fontSize: 11,
                  color: '#94A3B8',
                  lineHeight: 1.5,
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <CalendarDays size={14} color="#C9A84C" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  앱 내 조회·클릭 수는 파티/바 데이터와 별도입니다. 클래스·수강생·팔로우는 VIP 메뉴에서 관리한 데이터 기준입니다.
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InstructorProfileStatsModal;
