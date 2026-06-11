export const APP_SHELL_SELECTOR = '.bchata-app-shell';

/** 포털·풀스크린 오버레이를 앱 셸(500px) 안에 붙일 때 사용 */
export function getAppShellElement() {
  return document.querySelector(APP_SHELL_SELECTOR) || document.body;
}
