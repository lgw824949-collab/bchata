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

/** parties b_ratio · s_ratio · j_ratio · k_ratio → B4:S2 (0 제외, 콜론 연결) */
export function formatPartyMusicRatio(item: Record<string, unknown> | null | undefined): string | null {
  if (!item) return null;

  const b_ratio = item.b_ratio ?? item.bRatio;
  const s_ratio = item.s_ratio ?? item.sRatio;
  const j_ratio = item.j_ratio ?? item.jRatio;
  const k_ratio = item.k_ratio ?? item.kRatio;

  const parts: string[] = [];
  if (b_ratio) parts.push(`B${b_ratio}`);
  if (s_ratio) parts.push(`S${s_ratio}`);
  if (j_ratio) parts.push(`J${j_ratio}`);
  if (k_ratio) parts.push(`K${k_ratio}`);

  const result = parts.join(':');
  return result || null;
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

export const PARTY_LIST_REGION_ORDER = [
  '경인',
  '서울',
  '경상도',
  '전라도',
  '충청도',
  '강원/제주',
] as const;

export type PartyListRegionName = (typeof PARTY_LIST_REGION_ORDER)[number];

type SocialPartyRegionFilterBarProps = {
  regions: { name: PartyListRegionName; count: number }[];
  activeRegion: PartyListRegionName | '';
  onSelectRegion: (region: PartyListRegionName | '') => void;
  regionLabel: (name: PartyListRegionName) => string;
  isEn?: boolean;
};

/** 소셜 파티 — 파티 있는 지역만 · 전체/지역 필터 */
export function SocialPartyRegionFilterBar({
  regions,
  activeRegion,
  onSelectRegion,
  regionLabel,
  isEn = false,
}: SocialPartyRegionFilterBarProps) {
  if (!regions.length) return null;

  const totalCount = regions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div
      className="social-party-region-filter"
      style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '8px',
        padding: '10px 16px 6px',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <button
        type="button"
        onClick={() => onSelectRegion('')}
        style={{
          flexShrink: 0,
          padding: '8px 14px',
          borderRadius: '100px',
          fontSize: '12px',
          fontWeight: activeRegion === '' ? 800 : 600,
          border: `1px solid ${activeRegion === '' ? '#E53935' : '#E2E8F0'}`,
          background: activeRegion === '' ? '#E53935' : '#FFFFFF',
          color: activeRegion === '' ? '#FFFFFF' : '#64748B',
          cursor: 'pointer',
        }}
      >
        {isEn ? `All ${totalCount}` : `전체 ${totalCount}`}
      </button>
      {regions.map(({ name, count }) => {
        const isActive = activeRegion === name;
        const label = regionLabel(name);
        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelectRegion(isActive ? '' : name)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: isActive ? 800 : 600,
              border: `1px solid ${isActive ? '#E53935' : '#E2E8F0'}`,
              background: isActive ? '#E53935' : '#FFFFFF',
              color: isActive ? '#FFFFFF' : '#64748B',
              cursor: 'pointer',
            }}
          >
            {isEn ? `${label} ${count}` : `${label} 파티 ${count}`}
          </button>
        );
      })}
    </div>
  );
}

export default function SocialPage() {
  return null;
}
