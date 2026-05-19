import React, { useMemo } from 'react';
import {
  buildVenuePartyLiveBadge,
  shouldShowVenuePartyLiveBadge,
} from '../lib/barCounterDisplay';

/**
 * BAR 상세 FeaturedPartyCard — 우측 하이브리드 라이브 배지
 */
const PartyLiveHybridBadge = ({ liveCount = 0, clickCount = 0 }) => {
  const visible = useMemo(
    () => shouldShowVenuePartyLiveBadge({ liveCount, clickCount }),
    [liveCount, clickCount],
  );

  const view = useMemo(
    () => buildVenuePartyLiveBadge({ liveCount, clickCount }),
    [liveCount, clickCount],
  );

  if (!visible) return null;

  const isHot = view.mode === 'live_hot';

  return (
    <span
      className={`party-live-hybrid-badge party-live-hybrid-badge--${view.mode}`}
      style={{
        flexShrink: 0,
        alignSelf: 'center',
        maxWidth: 118,
        padding: isHot ? '8px 10px' : '7px 11px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        lineHeight: 1.25,
        letterSpacing: '-0.02em',
        textAlign: 'center',
        whiteSpace: 'normal',
        wordBreak: 'keep-all',
        ...(isHot
          ? {
              color: '#0f1a0a',
              background: 'linear-gradient(135deg, #39FF14 0%, #7CFC00 55%, #FFB020 100%)',
              boxShadow: '0 0 16px rgba(57, 255, 20, 0.45), 0 2px 8px rgba(255, 109, 0, 0.25)',
            }
          : {
              color: '#64748B',
              background: 'rgba(148, 163, 184, 0.14)',
              border: '1px solid rgba(148, 163, 184, 0.28)',
            }),
      }}
    >
      {view.line}
    </span>
  );
};

export default PartyLiveHybridBadge;
