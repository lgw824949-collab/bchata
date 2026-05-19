/** 이름·주소 정규화 후 동일 장소는 1건만 유지 */

export const normalizeVenueNameKey = (name) => {
  let key = (name || '').replace(/\s+/g, '').toLowerCase();
  if (key.includes('강남턴') || key.includes('강턴')) key = '강턴';
  return key;
};

export const normalizeVenueAddressKey = (address) => {
  if (!address) return '';
  let s = String(address).toLowerCase().trim();
  if (!s) return '';

  s = s
    .replace(/\s+/g, '')
    .replace(/[,，.]/g, '')
    .replace(/서울특별시|서울시/g, '서울')
    .replace(/부산광역시|부산시/g, '부산')
    .replace(/대구광역시|대구시/g, '대구')
    .replace(/인천광역시|인천시/g, '인천')
    .replace(/광주광역시|광주시/g, '광주')
    .replace(/대전광역시|대전시/g, '대전')
    .replace(/경기도|경상북도|경상남도|전라남도|전라북도|충청북도|충청남도/g, '')
    .replace(/(지하)?\d+\s*층/g, '')
    .replace(/b\d*f?/gi, '')
    .replace(/\d+호/g, '');

  return s;
};

const venueRichnessScore = (loc) =>
  (loc?.image_url ? 2 : 0) +
  (loc?.kakao_url ? 1 : 0) +
  (loc?.instagram_url ? 1 : 0) +
  ((loc?.address || '').length > 8 ? 2 : 0);

const pickRicherVenue = (a, b) => {
  const scoreA = venueRichnessScore(a);
  const scoreB = venueRichnessScore(b);
  if (scoreB > scoreA) return b;
  if (scoreA > scoreB) return a;
  return String(b?.id || '') > String(a?.id || '') ? b : a;
};

/**
 * 1) 주소가 같으면 같은 장소 → 1건 (이름이 달라도 병합)
 * 2) 이름이 같고 주소도 같으면 → 1건
 * 3) 이름만 같고 주소가 다르면 → 별도 장소로 유지
 */
export const dedupeVenueList = (rawList) => {
  const list = (rawList || []).filter(
    (loc) => normalizeVenueNameKey(loc?.name) || normalizeVenueAddressKey(loc?.address)
  );

  const byAddress = new Map();
  const noAddress = [];

  for (const loc of list) {
    const addrKey = normalizeVenueAddressKey(loc.address);
    if (addrKey) {
      byAddress.set(addrKey, byAddress.has(addrKey) ? pickRicherVenue(byAddress.get(addrKey), loc) : loc);
    } else {
      noAddress.push(loc);
    }
  }

  const merged = [...byAddress.values(), ...noAddress];
  const byName = new Map();

  for (const loc of merged) {
    const nameKey = normalizeVenueNameKey(loc.name);
    if (!nameKey) continue;

    const addrKey = normalizeVenueAddressKey(loc.address);
    const mapKey = addrKey ? `${nameKey}::${addrKey}` : nameKey;

    if (!byName.has(mapKey)) {
      byName.set(mapKey, loc);
      continue;
    }

    const existing = byName.get(mapKey);
    const existingAddr = normalizeVenueAddressKey(existing.address);

    if (!addrKey || !existingAddr || addrKey === existingAddr) {
      byName.set(mapKey, pickRicherVenue(existing, loc));
    } else {
      byName.set(`${nameKey}::${addrKey}`, loc);
    }
  }

  return Array.from(byName.values());
};
