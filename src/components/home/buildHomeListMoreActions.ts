import { Music2 } from 'lucide-react';
import type { HomeDarkMoreAction } from './types';
import {
  buildHomeDarkMoreActions,
  type BuildHomeDarkMoreActionsInput,
} from './buildHomeDarkMoreActions';

/** 하단 포토 퀵메뉴 id — 햄버거에 중복 노출하지 않음 */
const PHOTO_QUICK_MENU_IDS = new Set(['bootcamp', 'festival', 'party', 'instructors']);

/** 헤더·하단 nav에 이미 있는 항목 */
const HEADER_NAV_DUPE_IDS = new Set(['wishlist']);

export type BuildHomeListMoreActionsInput = BuildHomeDarkMoreActionsInput & {
  onOpenSocial: () => void;
};

/** 메인 햄버거 — 포토 퀵메뉴·헤더와 겹치지 않는 바로가기 */
export function buildHomeListMoreActions(input: BuildHomeListMoreActionsInput): HomeDarkMoreAction[] {
  const { onOpenSocial, ...rest } = input;

  const socialToday: HomeDarkMoreAction = {
    id: 'social-today',
    labelKo: '오늘소셜',
    labelEn: 'Social',
    icon: Music2,
    tier: 'primary',
    onClick: onOpenSocial,
  };

  const extras = buildHomeDarkMoreActions(rest).filter((action) => (
    !PHOTO_QUICK_MENU_IDS.has(action.id)
    && !HEADER_NAV_DUPE_IDS.has(action.id)
  ));

  return [socialToday, ...extras];
}
