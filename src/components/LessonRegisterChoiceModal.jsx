import React from 'react';
import { motion } from 'framer-motion';
import { X, GraduationCap, Building2, UserPlus } from 'lucide-react';
import { Z } from '../constants/zLayers';

const OPTIONS = [
  {
    id: 'instructor-class',
    icon: GraduationCap,
    titleKo: '강사 수업 등록',
    titleEn: 'Instructor class',
    descKo: 'VIP 강사 · 개인/그룹 수업 · 강사 프로필에 노출',
    descEn: 'VIP instructor · classes on your profile',
    accent: '#C9A84C',
  },
  {
    id: 'venue-class',
    icon: Building2,
    titleKo: 'BAR · 업체 수업 등록',
    titleEn: 'BAR / venue class',
    descKo: 'BAR 상세 → 수업 탭에서 등록 (모든 BAR 동일)',
    descEn: 'Open any BAR → Lesson tab → register',
    accent: '#D4436E',
  },
  {
    id: 'instructor-profile',
    icon: UserPlus,
    titleKo: '강사 프로필 등록',
    titleEn: 'Instructor profile',
    descKo: '강사 찾기에 올릴 프로필만 신청 (수업 아님)',
    descEn: 'Apply for instructor listing only',
    accent: '#7C3AED',
  },
];

export default function LessonRegisterChoiceModal({
  isOpen,
  onClose,
  isEn = false,
  onPickInstructorClass,
  onPickVenueClass,
  onPickInstructorProfile,
}) {
  if (!isOpen) return null;

  const handlers = {
    'instructor-class': onPickInstructorClass,
    'venue-class': onPickVenueClass,
    'instructor-profile': onPickInstructorProfile,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Choose registration type' : '등록 유형 선택'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modal,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: 'min(88vh, 560px)',
          overflowY: 'auto',
          borderRadius: 20,
          background: '#121212',
          border: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
          color: '#fff',
        }}
      >
        <div
          style={{
            padding: '18px 20px 12px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
              {isEn ? 'What do you want to register?' : '무엇을 등록할까요?'}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94A3B8', lineHeight: 1.45 }}>
              {isEn
                ? 'Instructor classes and BAR classes are saved separately.'
                : '강사 수업과 BAR 수업은 서로 다른 목록에 저장됩니다.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : '닫기'}
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  handlers[opt.id]?.();
                  onClose();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: `1px solid ${opt.accent}44`,
                  background: 'rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${opt.accent}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={opt.accent} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: '#F8FAFC' }}>
                    {isEn ? opt.titleEn : opt.titleKo}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontSize: 12,
                      color: '#94A3B8',
                      lineHeight: 1.4,
                    }}
                  >
                    {isEn ? opt.descEn : opt.descKo}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
