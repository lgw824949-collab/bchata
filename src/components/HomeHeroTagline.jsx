import React from 'react';

const MAIN_SIZE = 16;
const SUB_SIZE = 14;

export default function HomeHeroTagline() {
  return (
    <p
      style={{
        margin: '8px 0 0',
        lineHeight: 1.45,
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: '0 6px',
      }}
    >
      <span style={{ fontSize: MAIN_SIZE, fontWeight: 800, color: '#D4436E' }}>만원의 행복공간</span>
      <span style={{ fontSize: SUB_SIZE, fontWeight: 600, color: '#64748B', letterSpacing: '-0.3px' }}>
        켜고 찾고 가면 끝
      </span>
    </p>
  );
}
