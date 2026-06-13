import type { HomeDarkMoreAction } from './types';
import {
  buildHomeDarkMoreActions,
  type BuildHomeDarkMoreActionsInput,
} from './buildHomeDarkMoreActions';

/** 하단 포토 퀵메뉴와 기능이 겹치는 항목 */
const PHOTO_QUICK_MENU_DUPE_IDS = new Set(['instructor-register']);

/**
 * 메인·헤더·하단 nav에 이미 노출된 항목
 * - wishlist: 헤더 찜 + 하단 nav
 * - calendar: 아젠다 달력
 * - concierge: 하단 nav 컨시어지(추천)
 * - livepick · chat: 하단 nav
 */
const MAIN_SURFACE_DUPE_IDS = new Set([
  'wishlist',
  'calendar',
  'concierge',
  'livepick',
  'chat',
]);

export type BuildHomeListMoreActionsInput = BuildHomeDarkMoreActionsInput;

/** 메인 햄버거 — 메인·포토 퀵메뉴·하단 nav와 겹치지 않는 바로가기 */
export function buildHomeListMoreActions(input: BuildHomeListMoreActionsInput): HomeDarkMoreAction[] {
  return buildHomeDarkMoreActions(input).filter((action) => (
    !PHOTO_QUICK_MENU_DUPE_IDS.has(action.id)
    && !MAIN_SURFACE_DUPE_IDS.has(action.id)
  ));
}
