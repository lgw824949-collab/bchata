/** 파티 포스터·카드 제목 — 등록·표시 공통 */
export const PARTY_TITLE_MAX_LENGTH = 22;

/** 카드/리스트 제목 글자 크기 (기존 18px 대비 소폭 축소) */
export const PARTY_TITLE_CARD_FONT_SIZE = '16px';

export function cleanPartyTitleRaw(raw) {
  if (!raw) return '';
  const segment = String(raw).split(/\s*ㅣ\s*|\s*\|\s*/)[0].trim();
  return segment
    .replace(/\[[^\]]*\]/g, '')
    .replace(/^\[.*?\]\s*/, '')
    .replace(/ㅣ\s*$/, '')
    .replace(/\[서울\]/g, '')
    .replace(/\[경인\]/g, '')
    .replace(/\[경기\/인천\]/g, '')
    .replace(/\[경상도\]/g, '')
    .replace(/\[전라도\]/g, '')
    .replace(/\[충청도\]/g, '')
    .replace(/\[강원\/제주\]/g, '')
    .replace(/오늘밤빠/g, '')
    .replace(/[|｜¦]/g, '')
    .replace(/[|｜¦·•／/\\]+$/g, '')
    .replace(/^[-–—·•\s]+|[-–—·•\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 카드·공유·리스트용 — 정제 후 최대 길이(기본 22자) */
export function formatPartyTitleDisplay(raw, { maxLength = PARTY_TITLE_MAX_LENGTH } = {}) {
  const text = cleanPartyTitleRaw(raw);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
