/**
 * 파티별 뒷풀이 맛집 (1단계 뼈대)
 * 음식 장소 알려주시면 spots 배열에 추가하면 됩니다.
 *
 * 매칭 우선순위: partyIds → locationContains → addressContains → broadRegion
 */

/** @typedef {{ id: string, name: string, address: string, category?: string, note?: string, mapQuery?: string, isPlaceholder?: boolean }} AfterPartySpot */

/** @type {{ id: string, partyIds?: string[], locationContains?: string[], addressContains?: string[], broadRegion?: string, spots: AfterPartySpot[] }[]} */
export const AFTER_PARTY_RULES = [
  {
    id: 'rule-bupyeong-sipjeong',
    locationContains: ['부평', '십정', '인천', '부평구'],
    addressContains: ['십정', '부평'],
    spots: [
      {
        id: 'bp-halmae-chicken',
        name: '할매닭한마리',
        address: '인천광역시 부평구 십정동 406-4',
        category: '닭요리',
        mapQuery: '인천 부평구 십정동 할매닭한마리',
        note: '파티 후 뒷풀이 추천',
      },
    ],
  },
];

/** 데이터 없을 때 UI용 */
export const AFTER_PARTY_FALLBACK = [
  {
    id: 'pending-1',
    name: '맛집 정보 등록 예정',
    address: '이 파티 장소에 맞는 뒷풀이를 곧 연결합니다',
    category: '-',
    isPlaceholder: true,
  },
];

const norm = (s) => String(s || '').trim().toLowerCase();

/**
 * @param {Record<string, unknown>} party
 * @returns {AfterPartySpot[]}
 */
export function getAfterPartySpotsForParty(party) {
  if (!party) return [...AFTER_PARTY_FALLBACK];

  const partyId = party.id != null ? String(party.id) : '';
  const loc = norm(party.locationName || party.location_name || party.studio_name || party.venue);
  const addr = norm(party.address);
  const region = party.broadRegion || '';

  for (const rule of AFTER_PARTY_RULES) {
    if (rule.partyIds?.length && partyId && rule.partyIds.includes(partyId)) {
      return rule.spots?.length ? [...rule.spots] : [...AFTER_PARTY_FALLBACK];
    }
    if (rule.locationContains?.length && loc) {
      const hit = rule.locationContains.some((k) => loc.includes(norm(k)));
      if (hit) return rule.spots?.length ? [...rule.spots] : [...AFTER_PARTY_FALLBACK];
    }
    if (rule.addressContains?.length && addr) {
      const hit = rule.addressContains.some((k) => addr.includes(norm(k)));
      if (hit) return rule.spots?.length ? [...rule.spots] : [...AFTER_PARTY_FALLBACK];
    }
    if (rule.broadRegion && region === rule.broadRegion) {
      return rule.spots?.length ? [...rule.spots] : [...AFTER_PARTY_FALLBACK];
    }
  }

  return [...AFTER_PARTY_FALLBACK];
}

export function openAfterPartyMap(spot) {
  if (!spot || spot.isPlaceholder) return;
  const q = encodeURIComponent(spot.mapQuery || `${spot.name} ${spot.address}`);
  window.open(`https://map.kakao.com/link/search/${q}`, '_blank');
}
