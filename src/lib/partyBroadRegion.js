/** 파티 → 서울 / 수도권(경인) / 지방권 분류 (홈 LIVE·포스터 배너 공통) */

const SEOUL_HINT =
  /서울|강남|홍대|잠실|건대|신림|서초|영등포|성수|이태원|왕십리|목동|구로/;

export const inferPartyBroadRegion = (row) => {
  if (row?.broadRegion) return row.broadRegion;
  const title = String(row?.title || '');
  const address = String(row?.address || '');
  const locName = String(row?.locations?.name || row?.location_name || row?.locationName || '');
  const combined = `${title} ${address} ${locName}`;
  if (title.includes('[서울]') || SEOUL_HINT.test(combined)) return '서울';
  if (
    title.includes('[경인]') ||
    title.includes('[경기/인천]') ||
    /경기|인천/.test(combined)
  ) {
    return '경인';
  }
  if (title.includes('[경상') || /부산|대구|울산|경상|경남|경북/.test(combined)) return '경상도';
  if (title.includes('[전라') || /광주|전라|전남|전북/.test(combined)) return '전라도';
  if (title.includes('[충청') || /대전|충청|충남|충북|세종/.test(combined)) return '충청도';
  if (title.includes('[강원') || /강원|제주/.test(combined)) return '강원/제주';
  return '';
};

export const enrichPartyBroadRegion = (row) => ({
  ...row,
  broadRegion: inferPartyBroadRegion(row),
  location_name: row?.locations?.name || row?.location_name || row?.locationName || '',
});

export const isPartySeoul = (p) =>
  p?.broadRegion === '서울' ||
  SEOUL_HINT.test(
    `${p?.title || ''} ${p?.address || ''} ${p?.region || ''} ${p?.location_name || ''}`,
  );

export const isPartyMetro = (p) =>
  !isPartySeoul(p) &&
  (p?.broadRegion === '경인' ||
    p?.broadRegion === '경기/인천' ||
    p?.region === '경인' ||
    p?.region === '경기/인천' ||
    String(p?.region || '').includes('경기') ||
    String(p?.region || '').includes('인천'));

export const isPartyNational = (p) => !isPartySeoul(p) && !isPartyMetro(p);
