import React from 'react';

/** parties — music_ratio 없음, b/s/j/k_ratio 조합으로 B4:S2 형식 생성 */
const PARTY_RATIO_SEGMENTS = [
  { key: 'b_ratio', label: 'B' },
  { key: 's_ratio', label: 'S' },
  { key: 'k_ratio', label: 'K' },
  { key: 'j_ratio', label: 'J' },
] as const;

export function formatPartyMusicRatio(item: Record<string, unknown> | null | undefined): string | null {
  if (!item) return null;

  const raw = item.music_ratio ?? item.musicRatio;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();

  const parts = PARTY_RATIO_SEGMENTS.map(({ key, label }) => {
    const v = Number(item[key]);
    if (!Number.isFinite(v) || v <= 0) return null;
    return `${label}${v}`;
  }).filter(Boolean) as string[];

  return parts.length > 0 ? parts.join(':') : null;
}

type PartyMusicRatioLineProps = {
  item: Record<string, unknown>;
  style?: React.CSSProperties;
  className?: string;
};

/** 소셜 파티 카드 — 음악 비율 한 줄 (B4:S2), 데이터 없으면 null */
export function PartyMusicRatioLine({ item, style, className }: PartyMusicRatioLineProps) {
  const text = formatPartyMusicRatio(item);
  if (!text) return null;

  return (
    <div style={{ marginTop: '2px', ...style }} className={className}>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 800,
          color: '#D81B60',
          background: '#FFF0F5',
          padding: '1px 6px',
          borderRadius: '10px',
          flexShrink: 0,
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default function SocialPage() {
  return null;
}
