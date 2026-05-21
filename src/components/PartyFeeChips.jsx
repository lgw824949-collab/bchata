import { parsePartyFeeChips } from '../lib/partyFeeDisplay';

/** 파티 카드 — 입장료 칩 (예매/현장/메너음료) */
export default function PartyFeeChips({ fee, style, className }) {
  const chips = parsePartyFeeChips(fee);
  if (!chips.length) return null;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: '4px',
        overflowX: 'auto',
        flexWrap: 'nowrap',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          style={{
            fontSize: '10px',
            fontWeight: 800,
            color: '#D81B60',
            background: '#FFF0F5',
            padding: '3px 8px',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            lineHeight: 1.2,
          }}
        >
          {chip.text}
        </span>
      ))}
    </div>
  );
}
