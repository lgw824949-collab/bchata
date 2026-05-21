/** 합성 입장료(예매/현장/메너음료) — 숫자만 추출해 만원 변환하면 0.1만 등으로 깨짐 */
const COMPOSED_FEE_RE = /예매|현장|메너음료|문의|무료| · /

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
