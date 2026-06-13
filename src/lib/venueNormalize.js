/** BAR·장소 이름·주소 정규화 키 */

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
    .replace(/울산광역시|울산시/g, '울산')
    .replace(/경기도|경상북도|경상남도|전라남도|전라북도|충청북도|충청남도/g, '')
    .replace(/(지하)?\d+\s*층/g, '')
    .replace(/b\d*f?/gi, '')
    .replace(/\d+호/g, '');

  return s;
};
