/** 합성 입장료(예매/현장/메너음료) — 숫자만 추출해 만원 변환하면 0.1만 등으로 깨짐 */
const COMPOSED_FEE_RE = /예매|현장|메너음료|문의|무료| · /

/** 파티 카드 입장료 줄 글자 크기 */
export const PARTY_FEE_CARD_FONT_SIZE = '13px';
export const PARTY_FEE_RATIO_FONT_SIZE = '12px';

/**
 * 파티 fee 컬럼 → 카드/상세 표시 문자열
 * @param {string|null|undefined} priceStr
 * @param {{ fallback?: string }} [opts]
 */
export function formatPartyFeeDisplay(priceStr, { fallback = '문의' } = {}) {
  const raw = String(priceStr ?? '').trim()
  if (!raw) return fallback
  if (raw.includes('무료') || raw === '0') return '무료'

  if (COMPOSED_FEE_RE.test(raw)) return raw.replace(/원/g, '')
  if (/만/.test(raw)) return raw.replace(/원/g, '')

  const num = parseInt(raw.replace(/[^0-9]/g, ''), 10)
  if (Number.isNaN(num) || num === 0) return raw.replace(/원/g, '') || fallback
  if (num < 1000) return `${num}`

  const manValue = num / 10000
  if (num % 10000 === 0) return `${manValue}만`
  return `${manValue.toFixed(1).replace('.0', '')}만`
}

/** 카드용 입장료 칩 — 예매/현장/메너음료 분리 */
export function parsePartyFeeChips(feeStr) {
  const raw = String(feeStr ?? '').trim()
  if (!raw) return [{ key: 'default', text: '문의' }]
  if (raw.includes('무료') || raw === '0') return [{ key: 'free', text: '무료' }]

  if (!COMPOSED_FEE_RE.test(raw) && !raw.includes(' · ')) {
    return [{ key: 'default', text: formatPartyFeeDisplay(raw) }]
  }

  const chips = []
  for (const seg of raw.split('·').map((s) => s.trim()).filter(Boolean)) {
    if (/^메너음료$/i.test(seg)) {
      chips.push({ key: 'manner', text: '메너음료' })
    } else if (seg.startsWith('예매 ')) {
      chips.push({ key: 'booking', text: `예매 ${seg.slice(3).trim()}` })
    } else if (seg.startsWith('현장 ')) {
      chips.push({ key: 'onsite', text: `현장 ${seg.slice(3).trim()}` })
    } else {
      chips.push({ key: seg, text: seg })
    }
  }
  return chips.length ? chips : [{ key: 'default', text: formatPartyFeeDisplay(raw) }]
}
