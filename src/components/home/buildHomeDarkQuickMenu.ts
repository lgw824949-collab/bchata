import type { HomeDarkQuickMenuItem } from './types';
import { HOME_EXPLORE_MENU_EMOJIS } from '../../lib/homeListPhotoMenu';

type BuildHomeDarkQuickMenuInput = {
  onOpenSocial: () => void;
  onOpenBootcamp: () => void;
  onOpenFestival: () => void;
  onOpenFestivalParty: () => void;
};

/** 다크 홈 — 이모지 퀵메뉴 (오늘소셜 · 부트캠프 · 페스티벌 · 파티) */
export function buildHomeDarkQuickMenu(input: BuildHomeDarkQuickMenuInput): HomeDarkQuickMenuItem[] {
  const {
    onOpenSocial,
    onOpenBootcamp,
    onOpenFestival,
    onOpenFestivalParty,
  } = input;

  return [
    {
      id: 'social',
      emoji: HOME_EXPLORE_MENU_EMOJIS.social,
      labelKo: '오늘소셜',
      labelEn: 'Social',
      onClick: onOpenSocial,
    },
    {
      id: 'bootcamp',
      emoji: HOME_EXPLORE_MENU_EMOJIS.bootcamp,
      labelKo: '부트캠프',
      labelEn: 'Bootcamp',
      onClick: onOpenBootcamp,
    },
    {
      id: 'festival',
      emoji: HOME_EXPLORE_MENU_EMOJIS.festival,
      labelKo: '페스티벌',
      labelEn: 'Festival',
      onClick: onOpenFestival,
    },
    {
      id: 'party',
      emoji: HOME_EXPLORE_MENU_EMOJIS.party,
      labelKo: '파티',
      labelEn: 'Party',
      onClick: onOpenFestivalParty,
    },
  ];
}
