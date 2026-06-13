import { BAR_DATABASE } from '../data/barDatabase.js';
import { normalizeVenueAddressKey, normalizeVenueNameKey } from './venueNormalize.js';

/** barDatabase.js 마스터 — name · alias · address 매칭 */
export function findBarMasterRecord(name, address) {
  const locName = normalizeVenueNameKey(name);
  const locAddr = normalizeVenueAddressKey(address);

  return BAR_DATABASE.find((bar) => {
    const barName = normalizeVenueNameKey(bar.name);
    if (locName && barName && locName === barName) return true;
    if (locName && (bar.aliases || []).some((alias) => normalizeVenueNameKey(alias) === locName)) {
      return true;
    }
    const barAddr = normalizeVenueAddressKey(bar.address);
    return locAddr && barAddr && locAddr === barAddr;
  }) || null;
}

export const mapBarLibRegionToPill = (regionLabel) => {
  const r = `${regionLabel || ''}`;
  if (r.includes('서울')) return '서울';
  if (r.includes('경기') || r.includes('인천')) return '경인';
  if (r.includes('경상') || r.includes('부산') || r.includes('대구')) return '경상도';
  if (r.includes('전라') || r.includes('광주')) return '전라도';
  if (r.includes('충청') || r.includes('대전') || r.includes('세종')) return '충청도';
  if (r.includes('강원') || r.includes('제주')) return '강원/제주';
  return null;
};

/** 주소·이름·마스터 기준 지역 pill */
export function classifyVenueRegion(loc, masterMatch = null) {
  const master = masterMatch || findBarMasterRecord(loc?.name, loc?.address);
  if (master?.region) {
    const mapped = mapBarLibRegionToPill(master.region);
    if (mapped) return mapped;
  }

  const text = `${loc?.address || ''}`.toLowerCase();
  const nameText = `${loc?.name || ''}`.toLowerCase();
  const combined = `${text} ${nameText}`;

  if (combined.includes('서울')) return '서울';
  if (combined.includes('경기') || combined.includes('인천')) return '경인';
  if (
    combined.includes('경상') || combined.includes('부산') || combined.includes('대구') ||
    combined.includes('울산') || combined.includes('창원') || combined.includes('포항') ||
    combined.includes('구미') || combined.includes('김천') || combined.includes('김해')
  ) return '경상도';
  if (
    combined.includes('전라') || combined.includes('광주') || combined.includes('전북') ||
    combined.includes('전남') || combined.includes('여수') || combined.includes('순천') ||
    combined.includes('목포')
  ) return '전라도';
  if (
    combined.includes('충청') || combined.includes('대전') || combined.includes('충북') ||
    combined.includes('충남') || combined.includes('세종') || combined.includes('청주') ||
    combined.includes('천안')
  ) return '충청도';
  if (combined.includes('강원') || combined.includes('제주') || combined.includes('춘천') || combined.includes('원주')) {
    return '강원/제주';
  }

  return '기타';
}

/** 마스터 기준 표준 name · address 적용 */
export function canonicalizeVenueRow(row) {
  if (!row) return row;
  const master = findBarMasterRecord(row.name, row.address);
  if (!master) return row;
  return {
    ...row,
    name: master.name,
    address: master.address,
  };
}

/** 동일 업체 dedupe 키 — 마스터 > 주소 > 이름 */
export function getVenueDedupeKey(loc) {
  if (!loc) return null;
  const master = findBarMasterRecord(loc.name, loc.address);
  if (master) return `m:${normalizeVenueNameKey(master.name)}`;

  const addrKey = normalizeVenueAddressKey(loc.address);
  if (addrKey) return `a:${addrKey}`;

  const nameKey = normalizeVenueNameKey(loc.name);
  return nameKey ? `n:${nameKey}` : null;
}
