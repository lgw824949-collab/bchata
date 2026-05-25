/** 클래스 fee 텍스트에서 원화 금액 추출 (예: "4회 12만원", "50,000원") */
export function parseClassFeeWon(feeText) {
  const s = String(feeText || '').trim();
  if (!s) return null;

  const manMatch = s.match(/(\d+(?:\.\d+)?)\s*만/);
  if (manMatch) {
    const n = Math.round(parseFloat(manMatch[1], 10) * 10000);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const wonMatch = s.match(/(\d[\d,]*)\s*원/);
  if (wonMatch) {
    const n = parseInt(wonMatch[1].replace(/,/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const digitMatch = s.match(/(\d[\d,]+)/);
  if (digitMatch) {
    const n = parseInt(digitMatch[1].replace(/,/g, ''), 10);
    if (Number.isFinite(n) && n >= 1000) return n;
  }

  return null;
}

export function formatWon(amount) {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString('ko-KR')}원`;
}
