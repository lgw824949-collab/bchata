/** 위치: 한 번 허용 후 캐시 재사용 · 거부 시 재요청 안 함 */
const COORDS_KEY = 'bchata_last_coords';
const PERM_KEY = 'bchata_geo_permission';
const LEGACY_KEY = 'last_coords';
const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000;

const migrateLegacy = () => {
  try {
    if (localStorage.getItem(COORDS_KEY)) return;
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const p = JSON.parse(legacy);
    if (p?.lat != null && (p.lng != null || p.lon != null)) {
      writeCachedCoords(p.lat, p.lng ?? p.lon);
    }
  } catch (_) {}
};

export const readCachedCoords = (maxAgeMs = DEFAULT_MAX_AGE_MS) => {
  migrateLegacy();
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p?.lat == null || p?.lng == null) return null;
    if (Date.now() - (p.ts || 0) > maxAgeMs) return null;
    return { lat: p.lat, lng: p.lng, lon: p.lng };
  } catch {
    return null;
  }
};

export const writeCachedCoords = (lat, lng) => {
  localStorage.setItem(
    COORDS_KEY,
    JSON.stringify({ lat, lng, ts: Date.now() })
  );
  localStorage.setItem(LEGACY_KEY, JSON.stringify({ lat, lon: lng }));
  localStorage.setItem(PERM_KEY, 'granted');
};

export const markGeoDenied = () => {
  localStorage.setItem(PERM_KEY, 'denied');
};

export const isGeoDenied = () => localStorage.getItem(PERM_KEY) === 'denied';

export const isGeoGranted = () => localStorage.getItem(PERM_KEY) === 'granted';

/** 브라우저 권한 상태 동기화 (팝업 없이) */
export const syncGeoPermissionState = async () => {
  if (!navigator.permissions?.query) return;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    if (status.state === 'granted') {
      if (localStorage.getItem(PERM_KEY) !== 'granted') {
        localStorage.setItem(PERM_KEY, 'granted');
      }
    } else if (status.state === 'denied') {
      markGeoDenied();
    }
    status.onchange = () => {
      if (status.state === 'granted') localStorage.setItem(PERM_KEY, 'granted');
      if (status.state === 'denied') markGeoDenied();
    };
  } catch (_) {}
};

/**
 * @returns {Promise<{ lat: number, lng: number, lon: number }>}
 */
export const getUserCoords = (options = {}) => {
  const {
    maxAgeMs = DEFAULT_MAX_AGE_MS,
    force = false,
    enableHighAccuracy = false,
  } = options;

  const cached = readCachedCoords(maxAgeMs);
  if (cached && !force) return Promise.resolve(cached);

  if (isGeoDenied() && !force) {
    return cached ? Promise.resolve(cached) : Promise.reject(new Error('geo_denied'));
  }

  if (!navigator.geolocation) {
    return cached ? Promise.resolve(cached) : Promise.reject(new Error('geo_unsupported'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          lon: pos.coords.longitude,
        };
        writeCachedCoords(coords.lat, coords.lng);
        resolve(coords);
      },
      (err) => {
        if (err?.code === 1) markGeoDenied();
        if (cached) resolve(cached);
        else reject(err);
      },
      {
        enableHighAccuracy,
        timeout: 10000,
        maximumAge: maxAgeMs,
      }
    );
  });
};
