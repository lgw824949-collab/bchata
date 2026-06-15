import {
  Building2,
  Globe,
  Music2,
  UserPlus,
} from 'lucide-react';
import type { HomeDarkMoreAction } from '../components/home/types';

type BuildHomeDarkMoreActionsInput = {
  onRegisterParty: () => void;
  onRegisterBarClass: () => void;
  onRegisterInstructor: () => void;
  onToggleLanguage: () => void;
};

/** 홈 더보기 — 등록·강사·언어만 (나머지는 하단 nav·헤더·일정) */
export function buildHomeDarkMoreActions(input: BuildHomeDarkMoreActionsInput): HomeDarkMoreAction[] {
  const {
    onRegisterParty,
    onRegisterBarClass,
    onRegisterInstructor,
    onToggleLanguage,
  } = input;

  return [
    {
      id: 'party-register',
      labelKo: '소셜 등록',
      labelEn: 'Post social',
      icon: Music2,
      tier: 'primary',
      onClick: onRegisterParty,
    },
    {
      id: 'bar-class-register',
      labelKo: 'BAR 수업',
      labelEn: 'BAR class',
      icon: Building2,
      tier: 'primary',
      onClick: onRegisterBarClass,
    },
    {
      id: 'instructor-register',
      labelKo: '강사 등록',
      labelEn: 'Instructor',
      icon: UserPlus,
      tier: 'primary',
      onClick: onRegisterInstructor,
    },
    {
      id: 'language',
      labelKo: '언어',
      labelEn: 'Language',
      icon: Globe,
      tier: 'secondary',
      onClick: onToggleLanguage,
    },
  ];
}

export type { BuildHomeDarkMoreActionsInput };
