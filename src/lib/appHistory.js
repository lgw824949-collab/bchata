/** Unified in-app history (pathname + state). Phone/browser back uses this stack. */
export const BAMPPA_HISTORY = '__bamppa';

export const NAV_SESSION_PATH_KEY = 'bchata:session-path';
export const NAV_SESSION_STATE_KEY = 'bchata:session-state';
export const NAV_PENDING_INSTRUCTOR_KEY = 'bchata:pending-instructor-id';

const HOME_TABS = new Set(['social', 'partner']);
const INSTRUCTOR_TABS = new Set(['BIO', 'CLASSES']);

/** 새로고침(F5)·탭 복귀 시 session/history에 남기지 않을 모달 오버레이 */
const NON_PERSISTED_OVERLAYS = new Set([
  'fullCalendar',
  'wishlist',
  'weather',
  'barMatching',
  'saju',
  'route',
  'incheon',
  'placeInquiry',
  'rental',
  'filterPanel',
  'filteredResults',
  'gridModal',
  'classRegister',
  'chatbot',
  'barRegister',
  'partyPoster',
]);

/** F5·모바일 새로고침 복원용 — 모달은 닫힌 화면만 복원 */
export function stripEphemeralOverlayFromNavState(state) {
  if (!state?.overlay || !NON_PERSISTED_OVERLAYS.has(state.overlay)) {
    return state;
  }
  return buildAppState({
    view: state.view ?? pathToView(window.location.pathname),
    homeTab: state.homeTab ?? null,
    overlay: null,
    overlayMeta: null,
    date: state.date ?? null,
    instructorId: state.instructorId ?? null,
    instructorTab: state.instructorTab ?? null,
  });
}

/** 예전 #hash 라우트 → bamppa state (새로고침 복원) */
const HASH_NAV_PATCH = {
  social: { homeTab: 'social' },
  partner: { homeTab: 'partner' },
  wishlist: { overlay: 'wishlist' },
  weather: { overlay: 'weather' },
  route: { overlay: 'incheon' },
  incheon: { overlay: 'incheon' },
  saju: { overlay: 'barMatching' },
  restaurant: { view: 'restaurant' },
  community: { view: 'community' },
  parking: { view: 'parking' },
  instructors: { view: 'instructors' },
};

export function normalizeNavPathname(path) {
  const raw = String(path || '/');
  const noHash = raw.split('#')[0];
  const q = noHash.indexOf('?');
  return (q >= 0 ? noHash.slice(0, q) : noHash) || '/';
}

export function patchFromLocationHash(hash) {
  const key = String(hash || '').replace(/^#/, '').trim().toLowerCase();
  return key ? HASH_NAV_PATCH[key] : null;
}

export function parseInstructorIdFromPath(pathname = window.location.pathname) {
  const match = String(pathname || '').match(/^\/instructors\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function instructorProfilePath(instructorId) {
  if (!instructorId) return '/instructors';
  return `/instructors/${encodeURIComponent(String(instructorId))}`;
}

/** URL·state·session에서 강사 프로필 ID 읽기 (새로고침 복원용) */
export function readInstructorIdFromLocation() {
  const fromPath = parseInstructorIdFromPath();
  if (fromPath) return fromPath;
  const fromQuery = readUrlNavPatch().instructorId;
  if (fromQuery) return fromQuery;
  const fromState = readNavigationState()?.instructorId;
  if (fromState) return String(fromState);
  try {
    const pending = sessionStorage.getItem(NAV_PENDING_INSTRUCTOR_KEY);
    if (pending) return pending;
  } catch {
    /* ignore */
  }
  return null;
}

export function readUrlNavPatch(pathname = window.location.pathname, search = window.location.search) {
  const params = new URLSearchParams(search || '');
  const patch = {};
  const tab = params.get('tab');
  if (tab && HOME_TABS.has(tab)) patch.homeTab = tab;

  const pathInstructorId = parseInstructorIdFromPath(pathname);
  const queryInstructorId = params.get('instructor');
  if (pathInstructorId || queryInstructorId) {
    patch.instructorId = pathInstructorId || queryInstructorId;
    patch.view = 'instructors';
  }

  const itab = params.get('itab');
  if (itab && INSTRUCTOR_TABS.has(itab)) patch.instructorTab = itab;
  return patch;
}

export const PATH_TO_VIEW = {
  '/': 'home',
  '/livepick': 'community',
  '/community': 'community',
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
  if (PATH_TO_VIEW[path]) return PATH_TO_VIEW[path];
  if (parseInstructorIdFromPath(path)) return 'instructors';
  return 'home';
}

export function buildAppState({
  view,
  homeTab = null,
  overlay = null,
  overlayMeta = null,
  date = null,
  instructorId = null,
  instructorTab = null,
}) {
  return {
    [BAMPPA_HISTORY]: true,
    view,
    homeTab: homeTab ?? null,
    overlay: overlay ?? null,
    overlayMeta: overlayMeta ?? null,
    date: date ?? null,
    instructorId: instructorId ?? null,
    instructorTab: instructorTab ?? null,
  };
}

function mergeNavState({ pathname, hashPatch, parsed, urlPatch }) {
  const pathView = pathToView(pathname);
  return buildAppState({
    view: hashPatch?.view ?? urlPatch?.view ?? parsed?.view ?? pathView,
    homeTab: hashPatch?.homeTab ?? urlPatch?.homeTab ?? parsed?.homeTab ?? null,
    overlay: hashPatch?.overlay ?? parsed?.overlay ?? null,
    overlayMeta: hashPatch?.overlayMeta ?? parsed?.overlayMeta ?? null,
    date: parsed?.date ?? null,
    instructorId: urlPatch?.instructorId ?? parsed?.instructorId ?? null,
    instructorTab: urlPatch?.instructorTab ?? parsed?.instructorTab ?? null,
  });
}

export function buildNavUrl(pathname, state) {
  const params = new URLSearchParams();
  let path = pathname || '/';

  if (path === '/') {
    if (state?.homeTab && HOME_TABS.has(state.homeTab)) {
      params.set('tab', state.homeTab);
    }
  }

  if (state?.instructorId) {
    path = instructorProfilePath(state.instructorId);
    if (state.instructorTab && INSTRUCTOR_TABS.has(state.instructorTab)) {
      params.set('itab', state.instructorTab);
    }
  } else if (path.startsWith('/instructors/')) {
    path = '/instructors';
  }

  const qs = params.toString();
  return path + (qs ? `?${qs}` : '');
}

export function resolveNavPath(path, state) {
  if (state?.instructorId) return instructorProfilePath(state.instructorId);
  if (path?.startsWith('/instructors/')) return '/instructors';
  return path || '/';
}

export function parseAppState(state) {
  if (state && state[BAMPPA_HISTORY]) return state;
  return null;
}

export function readPersistedNavState() {
  try {
    const savedRaw = sessionStorage.getItem(NAV_SESSION_STATE_KEY);
    if (!savedRaw) return null;
    const parsed = JSON.parse(savedRaw);
    return parsed?.[BAMPPA_HISTORY] ? parsed : null;
  } catch {
    return null;
  }
}

export function readNavigationState(rawState) {
  return parseAppState(rawState) ?? parseAppState(window.history.state) ?? readPersistedNavState();
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

function isBareHomeUrl(pathname, urlPatch, hashPatch) {
  return (
    normalizeNavPathname(pathname) === '/'
    && !urlPatch.homeTab
    && !urlPatch.instructorId
    && !hashPatch?.homeTab
    && !window.location.search
  );
}

/** F5 on `/` without ?tab= — 메인 게이트 유지 (session의 social 탭 복원 안 함) */
function normalizeBareHomeRefreshState(state, pathname, urlPatch, hashPatch) {
  if (!state || !isBareHomeUrl(pathname, urlPatch, hashPatch)) return state;
  return buildAppState({
    view: state.view ?? 'home',
    homeTab: null,
    overlay: state.overlay ?? null,
    overlayMeta: state.overlayMeta ?? null,
    date: state.date ?? null,
    instructorId: null,
    instructorTab: null,
  });
}

/**
 * 새로고침 직후: history.state · sessionStorage · URL 쿼리에서 복원
 * @returns {{ state: object, url: string }}
 */
export function restoreNavigationOnLoad() {
  const pathname = window.location.pathname;
  const hash = window.location.hash || '';
  const urlPatch = readUrlNavPatch(pathname);
  const hashPatch = patchFromLocationHash(hash);

  const toRestoreUrl = (state, basePath = pathname) => {
    const basePatch = readUrlNavPatch(basePath);
    const normalized = normalizeBareHomeRefreshState(state, basePath, basePatch, hashPatch);
    const cleaned = stripEphemeralOverlayFromNavState(normalized);
    const canonicalPath = resolveNavPath(basePath, cleaned);
    return { state: cleaned, url: buildNavUrl(canonicalPath, cleaned) + hash };
  };

  const existing = parseAppState(window.history.state);
  if (existing) {
    const state = mergeNavState({
      pathname,
      hashPatch,
      parsed: existing,
      urlPatch,
    });
    return toRestoreUrl(state);
  }

  let parsed = readPersistedNavState();
  const savedPath = sessionStorage.getItem(NAV_SESSION_PATH_KEY) || '';
  const savedBase = normalizeNavPathname(savedPath);
  const currentBase = normalizeNavPathname(pathname);
  const savedSearch = savedPath.includes('?') ? savedPath.slice(savedPath.indexOf('?')) : '';
  const savedUrlPatch = readUrlNavPatch(savedBase, savedSearch);

  const currentIsBareHome = isBareHomeUrl(pathname, urlPatch, hashPatch);

  if (parsed && savedBase && savedBase !== currentBase && !currentIsBareHome) {
    const savedHasDeep = savedBase !== '/' || savedUrlPatch.instructorId || parsed.instructorId;
    if (savedHasDeep) {
      const state = mergeNavState({
        pathname: savedBase,
        hashPatch,
        parsed,
        urlPatch: { ...savedUrlPatch, ...urlPatch },
      });
      return toRestoreUrl(state, savedBase);
    }
  }

  if (parsed && savedBase === currentBase) {
    const state = mergeNavState({
      pathname,
      hashPatch,
      parsed,
      urlPatch: { ...savedUrlPatch, ...urlPatch },
    });
    return toRestoreUrl(state);
  }

  let state = mergeNavState({ pathname, hashPatch, parsed: null, urlPatch });

  if (state.instructorId && !parseInstructorIdFromPath(pathname)) {
    state = mergeNavState({
      pathname: instructorProfilePath(state.instructorId),
      hashPatch,
      parsed: state,
      urlPatch,
    });
  }

  return toRestoreUrl(state);
}

export function persistNavSession() {
  try {
    const path = window.location.pathname + window.location.search + window.location.hash;
    sessionStorage.setItem(NAV_SESSION_PATH_KEY, path);
    const st = readNavigationState();
    if (st) {
      sessionStorage.setItem(
        NAV_SESSION_STATE_KEY,
        JSON.stringify(stripEphemeralOverlayFromNavState(st)),
      );
    }
  } catch {
    /* quota / private mode */
  }
}

let navPersistenceInstalled = false;

export function installNavSessionPersistence() {
  if (navPersistenceInstalled || typeof window === 'undefined') return;
  navPersistenceInstalled = true;
  const flush = () => persistNavSession();
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
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
    instructorId,
    instructorTab,
  } = options;

  const currentPath = window.location.pathname;
  const current = readNavigationState();

  const resolvedHomeTab =
    homeTab !== undefined ? homeTab : path === '/' ? (current?.homeTab ?? null) : null;

  const isInstructorsRoute = String(path).startsWith('/instructors');

  const resolvedInstructorId =
    instructorId !== undefined
      ? instructorId
      : parseInstructorIdFromPath(path) ?? (isInstructorsRoute ? current?.instructorId : null) ?? null;

  const resolvedInstructorTab =
    instructorTab !== undefined
      ? instructorTab
      : isInstructorsRoute
        ? (current?.instructorTab ?? null)
        : null;

  const resolvedView = isInstructorsRoute ? 'instructors' : view;

  const state = buildAppState({
    view: resolvedView,
    homeTab: path === '/' ? resolvedHomeTab : null,
    overlay,
    overlayMeta,
    date: date ?? current?.date ?? null,
    instructorId: isInstructorsRoute ? resolvedInstructorId : null,
    instructorTab: isInstructorsRoute ? resolvedInstructorTab : null,
  });

  const finalPath = resolveNavPath(path, state);
  const url = buildNavUrl(finalPath, state);

  if (
    !force
    && !replace
    && currentPath === finalPath
    && (current?.view ?? pathToView(path)) === resolvedView
    && (overlay ?? null) === (current?.overlay ?? null)
    && JSON.stringify(overlayMeta ?? null) === JSON.stringify(current?.overlayMeta ?? null)
    && (path !== '/' || (current?.homeTab ?? null) === resolvedHomeTab)
    && (!isInstructorsRoute || String(current?.instructorId ?? '') === String(resolvedInstructorId ?? ''))
    && (!isInstructorsRoute || (current?.instructorTab ?? null) === resolvedInstructorTab)
  ) {
    return;
  }

  if (replace) {
    window.history.replaceState(state, '', url);
  } else {
    window.history.pushState(state, '', url);
  }
  window.scrollTo(0, 0);
  syncHistoryToApp(state);
  persistNavSession();
}

export function pushOverlay(overlay, options = {}) {
  const path = options.path ?? window.location.pathname;
  const current = readNavigationState() || {};
  navigate(path, {
    replace: false,
    view: current.view ?? pathToView(path),
    homeTab: path === '/' ? (current.homeTab ?? null) : undefined,
    overlay,
    overlayMeta: options.meta ?? null,
    date: current.date ?? null,
    instructorId: String(path).startsWith('/instructors')
      ? (parseInstructorIdFromPath(path) ?? current.instructorId ?? null)
      : undefined,
    instructorTab: String(path).startsWith('/instructors') ? (current.instructorTab ?? null) : undefined,
    force: true,
  });
}

export function replaceCurrentState(patch) {
  const current = readNavigationState() || {};
  const path = window.location.pathname;
  const state = buildAppState({
    view: patch.view ?? current.view ?? pathToView(path),
    homeTab: patch.homeTab !== undefined ? patch.homeTab : current.homeTab ?? null,
    overlay: patch.overlay !== undefined ? patch.overlay : current.overlay ?? null,
    overlayMeta: patch.overlayMeta !== undefined ? patch.overlayMeta : current.overlayMeta ?? null,
    date: patch.date !== undefined ? patch.date : current.date ?? null,
    instructorId: patch.instructorId !== undefined ? patch.instructorId : current.instructorId ?? null,
    instructorTab: patch.instructorTab !== undefined ? patch.instructorTab : current.instructorTab ?? null,
  });
  const url = buildNavUrl(resolveNavPath(path, state), state);
  window.history.replaceState(state, '', url);
  syncHistoryToApp(state);
  persistNavSession();
}

export function syncInstructorNav(instructorId, instructorTab = 'BIO') {
  try {
    if (instructorId) {
      sessionStorage.setItem(NAV_PENDING_INSTRUCTOR_KEY, String(instructorId));
    } else {
      sessionStorage.removeItem(NAV_PENDING_INSTRUCTOR_KEY);
    }
  } catch {
    /* ignore */
  }

  const current = readNavigationState() || {};
  const path = instructorId ? instructorProfilePath(instructorId) : '/instructors';
  navigate(path, {
    replace: true,
    view: 'instructors',
    homeTab: null,
    overlay: current.overlay ?? null,
    overlayMeta: current.overlayMeta ?? null,
    date: current.date ?? null,
    instructorId: instructorId || null,
    instructorTab: instructorId ? (instructorTab || 'BIO') : null,
    force: true,
  });
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
