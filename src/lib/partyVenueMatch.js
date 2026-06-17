import { BAR_DATABASE } from './BarLib';
import { getLessonPublisherMeta } from './lessonPublisher';
import { normalizeVenueAddressKey, normalizeVenueNameKey } from './venueDedupe';

/** BAR(venue)에 대응하는 정규화 이름 키 목록 */
export function getVenueMatchKeys(venue) {
  if (!venue) return [];
  const keys = new Set();
  const add = (name) => {
    const k = normalizeVenueNameKey(name);
    if (k) keys.add(k);
  };
  add(venue.name);
  for (const bar of BAR_DATABASE) {
    const barKeys = [bar.name, ...(bar.aliases || [])].map((n) => normalizeVenueNameKey(n));
    if (barKeys.includes(normalizeVenueNameKey(venue.name))) {
      add(bar.name);
      (bar.aliases || []).forEach(add);
    }
  }
  return Array.from(keys);
}

const canonicalBarKeyFromLocKey = (locKey) => {
  if (!locKey) return null;
  for (const bar of BAR_DATABASE) {
    const canon = normalizeVenueNameKey(bar.name);
    const aliases = (bar.aliases || []).map((a) => normalizeVenueNameKey(a));
    const all = [canon, ...aliases];
    if (all.includes(locKey)) return canon;
    if (canon.length >= 3 && (locKey === canon || locKey.endsWith(canon))) {
      const prefixLen = locKey.length - canon.length;
      if (prefixLen === 0 || prefixLen <= 6) return canon;
    }
  }
  return null;
};

/** 파티가 어느 BAR 소속인지 (엄격). 해당 BAR가 아니면 null */
export const resolvePartyBarKey = (party) => {
  if (!party) return null;

  const locKey = normalizeVenueNameKey(
    party.location_name || party.locations?.name || party.locationName || ''
  );
  if (locKey) {
    const fromLoc = canonicalBarKeyFromLocKey(locKey);
    if (fromLoc) return fromLoc;
    return null;
  }

  const addr = normalizeVenueAddressKey(party.address || '');
  if (addr) {
    for (const bar of BAR_DATABASE) {
      const barAddr = normalizeVenueAddressKey(bar.address || '');
      if (barAddr && addr === barAddr) return normalizeVenueNameKey(bar.name);
    }
  }

  return null;
};

const canonicalVenueKey = (venue) => {
  const keys = getVenueMatchKeys(venue);
  if (!keys.length) return null;
  for (const bar of BAR_DATABASE) {
    const canon = normalizeVenueNameKey(bar.name);
    if (keys.includes(canon)) return canon;
  }
  return keys[0];
};

/**
 * 해당 BAR 포스터·파티만 true.
 * location_id · 장소명(정확/접두) · 주소 일치만 허용. 제목만으로는 매칭하지 않음.
 */
export const partyMatchesVenue = (party, venue) => {
  if (!party || !venue) return false;

  const venueKey = canonicalVenueKey(venue);
  if (!venueKey) return false;

  if (
    party.location_id &&
    venue.id &&
    !String(venue.id).startsWith('bar-') &&
    String(party.location_id) === String(venue.id)
  ) {
    return true;
  }

  const partyKey = resolvePartyBarKey(party);
  if (partyKey) return partyKey === venueKey;

  const partyAddr = normalizeVenueAddressKey(party.address || '');
  const venueAddr = normalizeVenueAddressKey(venue.address || '');
  if (partyAddr && venueAddr && partyAddr === venueAddr) return true;

  const master = BAR_DATABASE.find((b) => normalizeVenueNameKey(b.name) === venueKey);
  if (master?.address && partyAddr) {
    const masterAddr = normalizeVenueAddressKey(master.address);
    if (masterAddr && partyAddr === masterAddr) return true;
  }

  return false;
};

/** 수업(클래스)이 해당 BAR와 같은 장소인지 — publisher id · studio_name · 주소 기준 */
export const lessonMatchesVenue = (lesson, venue) => {
  if (!lesson || !venue) return false;

  const publisher = getLessonPublisherMeta(lesson);
  if (
    publisher.type === 'venue'
    && publisher.id
    && venue.id
    && !String(venue.id).startsWith('bar-')
    && String(publisher.id) === String(venue.id)
  ) {
    return true;
  }

  if (
    partyMatchesVenue(
      {
        location_name: lesson.studio_name || lesson.location || '',
        address: lesson.address || '',
        location_id: lesson.location_id,
      },
      venue
    )
  ) {
    return true;
  }
  const studioKey = normalizeVenueNameKey(lesson.studio_name || lesson.location || '');
  if (!studioKey) return false;
  const venueKeys = getVenueMatchKeys(venue);
  return venueKeys.some((k) => k === studioKey || studioKey.includes(k) || k.includes(studioKey));
};
