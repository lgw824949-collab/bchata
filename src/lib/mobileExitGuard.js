import { isBamppaState, isHomeRoot, navigate, readNavigationState } from './appHistory';

const EXIT_TOAST_MS = 2200;
let lastExitPromptAt = 0;
let toastHandler = null;

export function registerExitToast(handler) {
  toastHandler = handler;
}

export function showExitToast(message = '한 번 더 누르면 종료됩니다') {
  toastHandler?.(message);
}

/**
 * @param {PopStateEvent} event
 * @param {object|null} prevState — pop 직전 bamppa 스냅샷
 * @returns {boolean} true면 추가 UI 동기화 생략(홈 재고정만 수행)
 */
export function handleMobileExitBack(event, prevState) {
  const path = window.location.pathname;
  const next = readNavigationState(event?.state);
  const now = Date.now();

  if (path !== '/') return false;

  if (!isBamppaState(event?.state)) {
    if (now - lastExitPromptAt < EXIT_TOAST_MS) {
      lastExitPromptAt = 0;
      return false;
    }
    lastExitPromptAt = now;
    showExitToast();
    navigate('/', { homeTab: null, overlay: null, force: true });
    return true;
  }

  if (isHomeRoot(next) && isHomeRoot(prevState) && !prevState?.overlay) {
    if (now - lastExitPromptAt < EXIT_TOAST_MS) {
      lastExitPromptAt = 0;
      return false;
    }
    lastExitPromptAt = now;
    showExitToast();
    navigate('/', { homeTab: null, overlay: null, force: true });
    return true;
  }

  return false;
}
