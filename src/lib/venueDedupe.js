/** 이름·주소 정규화 후 동일 장소는 1건만 유지 */

import {
  canonicalizeVenueRow,
  getVenueDedupeKey,
} from './venueCanonical';
import { normalizeVenueAddressKey, normalizeVenueNameKey } from './venueNormalize';

export {
  normalizeVenueAddressKey,
  normalizeVenueNameKey,
} from './venueNormalize';

export {
  canonicalizeVenueRow,
  classifyVenueRegion,
  findBarMasterRecord,
  getVenueDedupeKey,
  mapBarLibRegionToPill,
} from './venueCanonical';

const venueRichnessScore = (loc) =>
  (loc?.image_url ? 2 : 0) +
  (loc?.kakao_url ? 1 : 0) +
  (loc?.instagram_url ? 1 : 0) +
  ((loc?.address || '').length > 8 ? 2 : 0) +
  (loc?.latitude != null ? 2 : 0);

const pickRicherVenue = (a, b) => {
  const scoreA = venueRichnessScore(a);
  const scoreB = venueRichnessScore(b);
  if (scoreB > scoreA) return b;
  if (scoreA > scoreB) return a;
  return String(b?.id || '') > String(a?.id || '') ? b : a;
};

/**
 * 마스터 canonical → dedupe key 기준 1건만 유지
 * 동일 주소·별칭(SNS/라틴팩토리 등)도 하나로 병합
 */
export const dedupeVenueList = (rawList) => {
  const list = (rawList || [])
    .filter(
      (loc) => normalizeVenueNameKey(loc?.name) || normalizeVenueAddressKey(loc?.address),
    )
    .map(canonicalizeVenueRow);

  const groups = new Map();
  for (const loc of list) {
    const key = getVenueDedupeKey(loc);
    if (!key) continue;
    groups.set(key, groups.has(key) ? pickRicherVenue(groups.get(key), loc) : loc);
  }

  return Array.from(groups.values());
};
