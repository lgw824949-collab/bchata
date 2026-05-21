/**
 * public.locations — verified against Supabase (not bars/venues).
 * Columns: id, name, address, region_id, created_at, latitude, longitude, view_count
 * Optional (migration 20260520130000): description, kakao_url, instagram_url, image_url
 * Region label: locations.region_id → regions.name (no locations.region column).
 */
export const LOCATIONS_SELECT =
  'id, name, address, region_id, created_at, latitude, longitude';

export const LOCATIONS_WITH_REGION_NAME =
  'id, name, address, region_id, regions(name)';

export function logSupabaseError(context, error) {
  if (!error) return;
  console.error('Supabase Error:', error);
  console.error(`[${context}] Supabase query failed:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

/** LIVE 카운트·파티 그룹용 광역 지역명 (regions.name 또는 주소 추론) */
export function resolveLocationRegionLabel(loc) {
  const fromJoin = loc?.regions?.name;
  if (fromJoin) return fromJoin;

  const combined = `${loc?.address || ''} ${loc?.name || ''}`.toLowerCase();
  if (combined.includes('서울')) return '서울특별시';
  if (combined.includes('경기') || combined.includes('인천')) return '경기도';
  if (
    combined.includes('경상') || combined.includes('부산') ||
    combined.includes('대구') || combined.includes('울산')
  ) return '경상도';
  if (combined.includes('전라') || combined.includes('광주')) return '전라도';
  if (combined.includes('충청') || combined.includes('대전') || combined.includes('세종')) return '충청도';
  if (combined.includes('강원') || combined.includes('제주')) return '강원도';
  return '전국';
}
