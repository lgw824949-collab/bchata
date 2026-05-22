import React from 'react';

/**
 * 썸네일 포스터 바로 하단 [VIEW N명] — 실제 클릭/체류 누적값만 표기
 */
export default function SocialBarChipMeter({ viewCount = 0, children }) {
  const score = Number.isFinite(Number(viewCount)) ? Number(viewCount) : 0;

  return (
    <>
      <span
        className="home-bar-thumb"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </span>
      <p className="home-bar-view-line" aria-live="polite">
        VIEW {score}명
      </p>
    </>
  );
}
