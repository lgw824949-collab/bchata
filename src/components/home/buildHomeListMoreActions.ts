import type { HomeDarkMoreAction } from './types';
import {
  buildHomeDarkMoreActions,
  type BuildHomeDarkMoreActionsInput,
} from './buildHomeDarkMoreActions';

export type BuildHomeListMoreActionsInput = BuildHomeDarkMoreActionsInput;

/** 메인 햄버거 더보기 */
export function buildHomeListMoreActions(input: BuildHomeListMoreActionsInput): HomeDarkMoreAction[] {
  return buildHomeDarkMoreActions(input);
}
