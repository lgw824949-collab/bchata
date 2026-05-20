/** Unified in-app history (pathname + state). Phone/browser back uses this stack. */
export const BAMPPA_HISTORY = '__bamppa';

export const PATH_TO_VIEW = {
  '/': 'home',
  '/livepick': 'community',
  '/instructors': 'instructors',
  '/bootcamp': 'bootcamp',
  '/bootcamp/register': 'bootcamp-register',
  '/festival': 'festival',
  '/festival/register': 'festival-register',
  '/register-party': 'register-party',
  '/register-class': 'register-class',
  '/parking': 'parking',
  '/restaurant': 'restaurant',
  '/admin': 'admin',
  '/admin-portal': 'admin-portal',
};

export function pathToView(path) {
  return PATH_TO_VIEW[path] ?? 'home';
}

export function buildAppState({
  view,
  homeTab = null,
  overlay = null,
  overlayMeta = null,
  date = null,
}) {
  return {
    [BAMPPA_HISTORY]: true,
    view,
    homeTab: homeTab ?? null,
    overlay: overlay ?? null,
    overlayMeta: overlayMeta ?? null,
    date: date ?? null,
  };
}

export function parseAppState(state) {
  if (state && state[BAMPPA_HISTORY]) return state;
  return null;
}

export function readNavigationState(rawState) {
  return parseAppState(rawState) ?? parseAppState(window.history.state);
}

export function isBamppaState(state) {
  return Boolean(state && state[BAMPPA_HISTORY]);
}

export function isHomeRoot(state, path = window.location.pathname) {
  const st = state ?? readNavigationState();
  return (
    path === '/'
    && (st?.view === 'home' || !st?.view)
    && !st?.overlay
    && !st?.homeTab
  );
}

function syncHistoryToApp(state) {
  window.dispatchEvent(new CustomEvent('bamppa-navigate', { detail: { state } }));
  window.dispatchEvent(new CustomEvent('bamppa-history', { detail: { state } }));
}

export function navigate(path, options = {}) {
  const {
    replace = false,
    homeTab,
    overlay = null,
    overlayMeta = null,
    view = pathToView(path),
    date = null,
    force = false,
  } = options;

  const currentPath = window.location.pathname;
  const current = parseAppState(window.history.state);

  const resolvedHomeTab =
    homeTab !== undefined ? homeTab : path === '/' ? (current?.homeTab ?? null) : null;

  if (
    !force
    && !replace
    && currentPath === path
    && (current?.view ?? pathToView(path)) === view
    && (overlay ?? null) === (current?.overlay ?? null)
    && JSON.stringify(overlayMeta ?? null) === JSON.stringify(current?.overlayMeta ?? null)
    && (path !== '/' || (current?.homeTab ?? null) === resolvedHomeTab)
  ) {
    return;
  }

  const state = buildAppState({
    view,
    homeTab: path === '/' ? resolvedHomeTab : null,
    overlay,
    overlayMeta,
    date: date ?? current?.date ?? null,
  });

  if (replace) {
    window.history.replaceState(state, '', path);
  } else {
    window.history.pushState(state, '', path);
  }
  window.scrollTo(0, 0);
  syncHistoryToApp(state);
}

export function pushOverlay(overlay, options = {}) {
  const path = options.path ?? window.location.pathname;
  const current = parseAppState(window.history.state) || {};
  navigate(path, {
    replace: false,
    view: current.view ?? pathToView(path),
    homeTab: path === '/' ? (current.homeTab ?? null) : undefined,
    overlay,
    overlayMeta: options.meta ?? null,
    date: current.date ?? null,
    force: true,
  });
}

export function replaceCurrentState(patch) {
  const current = parseAppState(window.history.state) || {};
  const path = window.location.pathname;
  const state = buildAppState({
    view: patch.view ?? current.view ?? pathToView(path),
    homeTab: patch.homeTab !== undefined ? patch.homeTab : current.homeTab ?? null,
    overlay: patch.overlay !== undefined ? patch.overlay : current.overlay ?? null,
    overlayMeta: patch.overlayMeta !== undefined ? patch.overlayMeta : current.overlayMeta ?? null,
    date: patch.date !== undefined ? patch.date : current.date ?? null,
  });
  window.history.replaceState(state, '', path);
  syncHistoryToApp(state);
}

export function closeOverlay() {
  const st = parseAppState(window.history.state);
  if (st?.overlay) {
    goBack();
    return true;
  }
  return false;
}

/**
 * 홈(/) 탭 전환 — 메인 게이트(null)에서 서브탭으로 갈 때는 push(뒤로가기 복귀),
 * 서브탭에서 메인으로 올 때는 replace(홈 버튼 의도).
 */
export function navigateHomeTab(homeTab) {
  const path = window.location.pathname;
  const current = readNavigationState();

  if (path !== '/') {
    navigate('/', { homeTab: homeTab ?? null, replace: false });
    return;
  }

  const target = homeTab ?? null;
  const currentTab = current?.homeTab ?? null;
  if (currentTab === target) return;

  const replace = target === null && currentTab !== null;
  navigate('/', { homeTab: target, replace });
}

/** 브라우저 히스토리 1단계 뒤로 — 스택 없으면 홈 메인(/)으로 */
export function goBackOrHome() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  navigate('/', { homeTab: null, overlay: null, overlayMeta: null, force: true });
}

export function goBack() {
  goBackOrHome();
}
