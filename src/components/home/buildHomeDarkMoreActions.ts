import {
  Building2,
  CalendarDays,
  Camera,
  CloudSun,
  Globe,
  Heart,
  MessageSquare,
  Music2,
  Navigation,
  Sparkles,
  Star,
  UserPlus,
  Utensils,
} from 'lucide-react';
import type { HomeDarkMoreAction } from '../components/home/types';

type BuildHomeDarkMoreActionsInput = {
  hasLivePickUploadToday: boolean;
  onRegisterParty: () => void;
  onRegisterBarClass: () => void;
  onRegisterInstructor: () => void;
  onOpenWishlist: () => void;
  onOpenCalendar: () => void;
  onOpenConcierge: () => void;
  onOpenLivePick: () => void;
  onOpenKakaoChat: () => void;
  onOpenRestaurant: () => void;
  onOpenWeather: () => void;
  onOpenRoute: () => void;
  onOpenSaju: () => void;
  onToggleLanguage: () => void;
};

export function buildHomeDarkMoreActions(input: BuildHomeDarkMoreActionsInput): HomeDarkMoreAction[] {
  const {
    hasLivePickUploadToday,
    onRegisterParty,
    onRegisterBarClass,
    onRegisterInstructor,
    onOpenWishlist,
    onOpenCalendar,
    onOpenConcierge,
    onOpenLivePick,
    onOpenKakaoChat,
    onOpenRestaurant,
    onOpenWeather,
    onOpenRoute,
    onOpenSaju,
    onToggleLanguage,
  } = input;

  return [
    {
      id: 'party-register',
      labelKo: '파티 등록',
      labelEn: 'Post party',
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
      id: 'wishlist',
      labelKo: '찜하기',
      labelEn: 'Saved',
      icon: Heart,
      tier: 'primary',
      onClick: onOpenWishlist,
    },
    {
      id: 'calendar',
      labelKo: '플랜',
      labelEn: 'Plan',
      icon: CalendarDays,
      tier: 'primary',
      onClick: onOpenCalendar,
    },
    {
      id: 'concierge',
      labelKo: '추천',
      labelEn: 'Picks',
      icon: Sparkles,
      tier: 'primary',
      onClick: onOpenConcierge,
    },
    {
      id: 'livepick',
      labelKo: '라이브픽',
      labelEn: 'Live pick',
      icon: Camera,
      tier: 'secondary',
      badge: hasLivePickUploadToday ? 'ON' : undefined,
      onClick: onOpenLivePick,
    },
    {
      id: 'chat',
      labelKo: '채팅 문의',
      labelEn: 'Chat',
      icon: MessageSquare,
      tier: 'secondary',
      onClick: onOpenKakaoChat,
    },
    {
      id: 'restaurant',
      labelKo: '맛집',
      labelEn: 'Food',
      icon: Utensils,
      tier: 'secondary',
      onClick: onOpenRestaurant,
    },
    {
      id: 'weather',
      labelKo: '오늘 날씨',
      labelEn: 'Weather',
      icon: CloudSun,
      tier: 'secondary',
      onClick: onOpenWeather,
    },
    {
      id: 'route',
      labelKo: '길찾기',
      labelEn: 'Route',
      icon: Navigation,
      tier: 'secondary',
      onClick: onOpenRoute,
    },
    {
      id: 'saju',
      labelKo: '운명의 좌표',
      labelEn: 'Fortune',
      icon: Star,
      tier: 'secondary',
      onClick: onOpenSaju,
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
