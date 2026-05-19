import React, { useMemo } from 'react';
import { buildBarCounterDisplay, shouldShowBarCounter } from '../lib/barCounterDisplay';

const COLORS = {
  dark: {
    warming: 'rgba(255, 255, 255, 0.42)',
    live: '#39FF14',
  },
  light: {
    warming: '#94A3B8',
    live: '#FF6D00',
  },
};

/**
 * Social BAR 카드 — 한 줄 카운트만 표시
 */
const BarCounterBadge = ({
  liveCount = 0,
  clickCount = 0,
  compact = false,
  theme = 'dark',
}) => {
  const visible = useMemo(
    () => shouldShowBarCounter({ liveCount, clickCount }),
    [liveCount, clickCount],
  );

  const view = useMemo(
    () => buildBarCounterDisplay({ liveCount, clickCount }),
    [liveCount, clickCount],
  );

  if (!visible) return null;

  const palette = COLORS[theme === 'dark' ? 'dark' : 'light'] || COLORS.dark;
  const isHot = view.mode === 'live_hot';
  const color = isHot ? palette.live : palette.warming;

  return (
    <p
      className="social-bar-counter-line"
      style={{
        margin: 0,
        marginTop: compact ? 10 : 12,
        padding: 0,
        width: '100%',
        maxWidth: compact ? 72 : 80,
        textAlign: 'center',
        fontSize: compact ? 9 : 10,
        fontWeight: isHot ? 900 : 600,
        lineHeight: 1.2,
        letterSpacing: isHot ? '-0.02em' : 0,
        color,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textShadow: theme === 'dark' && isHot ? '0 0 12px rgba(255, 159, 67, 0.45)' : 'none',
      }}
    >
      {view.line}
    </p>
  );
};

export default BarCounterBadge;
