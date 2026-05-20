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
