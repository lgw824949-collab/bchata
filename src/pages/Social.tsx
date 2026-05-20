import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** 소셜 메인 장르 필터 — 부트캠프·페스티벌 제외 */
export const SOCIAL_GENRE_FILTER_TABS = ['전체', '바차타', '살사', '쥬크', '키좀바'] as const;

export type SocialGenreFilterTab = (typeof SOCIAL_GENRE_FILTER_TABS)[number];

export function isSocialGenreFilterTab(value: string): value is SocialGenreFilterTab {
  return (SOCIAL_GENRE_FILTER_TABS as readonly string[]).includes(value);
}

export function normalizeSocialDateGenre(genre: string): SocialGenreFilterTab {
  return isSocialGenreFilterTab(genre) ? genre : '전체';
}

type SocialDateGenreFilterBarProps = {
  visible: boolean;
  activeGenre: string;
  onSelectGenre: (genre: SocialGenreFilterTab) => void;
};

/** 소셜 메인 — 날짜 선택 하단 장르 필터 탭 */
export function SocialDateGenreFilterBar({
  visible,
  activeGenre,
  onSelectGenre,
}: SocialDateGenreFilterBarProps) {
  const safeActive = normalizeSocialDateGenre(activeGenre);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="genre-filter-bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ overflow: 'hidden', borderTop: '1px solid var(--color-border)' }}
        >
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '6px',
              padding: '8px 10px',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {SOCIAL_GENRE_FILTER_TABS.map((g) => {
              const isActive = safeActive === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => onSelectGenre(g)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: isActive ? 900 : 600,
                    backgroundColor: isActive ? '#E53935' : '#fff',
                    color: isActive ? '#fff' : '#64748B',
                    border: `1px solid ${isActive ? '#E53935' : '#E2E8F0'}`,
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 2px 6px rgba(229,57,53,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** parties — music_ratio 없으면 b/s/j/k_ratio → B4:S2 */
const PARTY_RATIO_SEGMENTS = [
  { key: 'b_ratio', label: 'B' },
  { key: 's_ratio', label: 'S' },
  { key: 'k_ratio', label: 'K' },
  { key: 'j_ratio', label: 'J' },
] as const;

const ratioSegmentValue = (v: unknown): number | null => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 0 && n < 1) return Math.round(n * 100);
  return Math.round(n);
};

/** "B 4% · S 2%", "B4 S2", "B4:S2" → B4:S2 */
const normalizeMusicRatioString = (raw: string): string | null => {
  const compact = raw.trim().replace(/\s+/g, '');
  if (/^[BSKJ]\d+(:[BSKJ]\d+)*$/i.test(compact)) {
    return compact
      .split(':')
      .map((p) => p.replace(/^([bskj])/i, (m) => m.toUpperCase()))
      .join(':');
  }

  const segments: string[] = [];
  const re = /([BSKJ])\s*(\d+)\s*%?/gi;
  let match = re.exec(raw);
  while (match) {
    segments.push(`${match[1].toUpperCase()}${match[2]}`);
    match = re.exec(raw);
  }
  if (segments.length > 0) return segments.join(':');

  const colonParts = raw
    .split(/[·•|/]/)
    .map((p) => p.trim().replace(/\s*%/g, '').replace(/\s+/g, ''))
    .filter((p) => /^[BSKJ]\d+$/i.test(p));
  if (colonParts.length > 0) {
    return colonParts.map((p) => p.replace(/^([bskj])/i, (m) => m.toUpperCase())).join(':');
  }

  return null;
};

export function formatPartyMusicRatio(item: Record<string, unknown> | null | undefined): string | null {
  if (!item) return null;

  const raw = item.music_ratio ?? item.musicRatio;
  if (typeof raw === 'string' && raw.trim()) {
    const normalized = normalizeMusicRatioString(raw.trim());
    if (normalized) return normalized;
  }

  const parts = PARTY_RATIO_SEGMENTS.map(({ key, label }) => {
    const v = ratioSegmentValue(item[key]);
    if (v == null) return null;
    return `${label}${v}`;
  }).filter(Boolean) as string[];

  return parts.length > 0 ? parts.join(':') : null;
}

type PartyMusicRatioLineProps = {
  item: Record<string, unknown>;
  style?: React.CSSProperties;
  className?: string;
};

/** 소셜 파티 카드 — 시간·장소 아래 B4:S2 한 줄, 데이터 없으면 null */
export function PartyMusicRatioLine({ item, style, className }: PartyMusicRatioLineProps) {
  const text = formatPartyMusicRatio(item);
  if (!text) return null;

  return (
    <p
      className={className}
      style={{
        margin: '2px 0 0',
        fontSize: '12px',
        fontWeight: 800,
        color: '#D81B60',
        lineHeight: 1.3,
        letterSpacing: '0.02em',
        ...style,
      }}
    >
      {text}
    </p>
  );
}

export default function SocialPage() {
  return null;
}
