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

export function buildAppState({ view, homeTab = null, overlay = null, date = null }) {
  return {
    [BAMPPA_HISTORY]: true,
    view,
    homeTab: homeTab ?? null,
    overlay: overlay ?? null,
    date: date ?? null,
  };
}

export function parseAppState(state) {
  if (state && state[BAMPPA_HISTORY]) return state;
  return null;
}

export function navigate(path, options = {}) {
  const {
    replace = false,
    homeTab,
    overlay = null,
    view = pathToView(path),
    date = null,
    force = false,
  } = options;

  const currentPath = window.location.pathname;
  const current = parseAppState(window.history.state);

  const resolvedHomeTab =
    homeTab !== undefined ? homeTab : path === '/' ? (current?.homeTab ?? null) : null;

  if (
    !force &&
    !replace &&
    currentPath === path &&
    (current?.view ?? pathToView(path)) === view &&
    (overlay ?? null) === (current?.overlay ?? null) &&
    (path !== '/' || (current?.homeTab ?? null) === resolvedHomeTab)
  ) {
    return;
  }

  const state = buildAppState({
    view,
    homeTab: path === '/' ? resolvedHomeTab : null,
    overlay,
    date: date ?? current?.date ?? null,
  });

  if (replace) {
    window.history.replaceState(state, '', path);
  } else {
    window.history.pushState(state, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate', { state }));
  window.scrollTo(0, 0);
}

export function pushOverlay(overlay, options = {}) {
  const path = options.path ?? window.location.pathname;
  const current = parseAppState(window.history.state) || {};
  navigate(path, {
    replace: options.replace,
    view: current.view ?? pathToView(path),
    homeTab: path === '/' ? (current.homeTab ?? null) : undefined,
    overlay,
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
    date: patch.date !== undefined ? patch.date : current.date ?? null,
  });
  window.history.replaceState(state, '', path);
}

export function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigate('/');
  }
}
