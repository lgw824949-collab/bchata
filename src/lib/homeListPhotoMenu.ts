/** 홈 탐색 퀵메뉴 — 다크 퀵메뉴와 동일 이모지 (새로고침 시 구 placeholder 사진 깜빡임 방지) */
export const HOME_EXPLORE_MENU_EMOJIS = {
  social: '🎉',
  bootcamp: '🏕️',
  festival: '🎪',
  party: '🥳',
  instructors: '🕺',
} as const;

export type HomeListPhotoMenuItemId = keyof typeof HOME_EXPLORE_MENU_EMOJIS;

export type HomeListPhotoMenuItem = {
  id: HomeListPhotoMenuItemId;
  label: string;
  emoji: string;
  count: number;
  countHint: string;
  onClick: () => void;
};

type BuildHomeListPhotoMenuItemsInput = {
  isEn: boolean;
  socialCount: number;
  bootcampCount: number;
  festivalCount: number;
  partyEventCount: number;
  instructorCount: number;
  onOpenSocial: () => void;
  onOpenBootcamp: () => void;
  onOpenFestival: () => void;
  onOpenPartyEvents: () => void;
  onOpenInstructors: () => void;
};

export function buildHomeListPhotoMenuItems(input: BuildHomeListPhotoMenuItemsInput): HomeListPhotoMenuItem[] {
  const {
    isEn,
    socialCount,
    bootcampCount,
    festivalCount,
    partyEventCount,
    instructorCount,
    onOpenSocial,
    onOpenBootcamp,
    onOpenFestival,
    onOpenPartyEvents,
    onOpenInstructors,
  } = input;

  const activeHint = isEn ? 'active' : '진행·예정';

  return [
    {
      id: 'social',
      label: isEn ? 'Social' : '소셜',
      emoji: HOME_EXPLORE_MENU_EMOJIS.social,
      count: socialCount,
      countHint: isEn ? 'today' : '오늘',
      onClick: onOpenSocial,
    },
    {
      id: 'bootcamp',
      label: isEn ? 'Bootcamp' : '부트캠프',
      emoji: HOME_EXPLORE_MENU_EMOJIS.bootcamp,
      count: bootcampCount,
      countHint: activeHint,
      onClick: onOpenBootcamp,
    },
    {
      id: 'festival',
      label: isEn ? 'Festival' : '페스티벌',
      emoji: HOME_EXPLORE_MENU_EMOJIS.festival,
      count: festivalCount,
      countHint: activeHint,
      onClick: onOpenFestival,
    },
    {
      id: 'party',
      label: isEn ? 'Party' : '파티',
      emoji: HOME_EXPLORE_MENU_EMOJIS.party,
      count: partyEventCount,
      countHint: activeHint,
      onClick: onOpenPartyEvents,
    },
    {
      id: 'instructors',
      label: isEn ? 'Instructors' : '강사',
      emoji: HOME_EXPLORE_MENU_EMOJIS.instructors,
      count: instructorCount,
      countHint: isEn ? 'instructors' : '활동 강사',
      onClick: onOpenInstructors,
    },
  ];
}

export function homeListPhotoMenuAriaLabel(
  item: HomeListPhotoMenuItem,
  isEn: boolean,
): string {
  if (item.count <= 0) return item.label;
  if (item.id === 'social') {
    return isEn ? `${item.label} · ${item.count} tonight` : `${item.label} · 오늘 소셜 ${item.count}건`;
  }
  if (item.id === 'bootcamp') {
    return isEn ? `${item.label} · ${item.count} active bootcamps` : `${item.label} · 진행·예정 부트캠프 ${item.count}건`;
  }
  if (item.id === 'festival') {
    return isEn ? `${item.label} · ${item.count} active festivals` : `${item.label} · 진행·예정 페스티벌 ${item.count}건`;
  }
  if (item.id === 'party') {
    return isEn ? `${item.label} · ${item.count} party events` : `${item.label} · 진행·예정 파티 ${item.count}건`;
  }
  return isEn ? `${item.label} · ${item.count} instructors` : `${item.label} · 활동 강사 ${item.count}명`;
}
