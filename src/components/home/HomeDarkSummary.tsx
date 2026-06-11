import React from 'react';

type HomeDarkSummaryProps = {
  isEn: boolean;
  partyCount: number;
  regionLabel: string;
};

export default function HomeDarkSummary({ isEn, partyCount, regionLabel }: HomeDarkSummaryProps) {
  if (partyCount <= 0) {
    return (
      <p className="home-dark-summary home-dark-summary--empty">
        {isEn ? 'No socials tonight in this area' : '이 지역엔 오늘 소셜이 없어요'}
      </p>
    );
  }

  return (
    <p className="home-dark-summary">
      {isEn
        ? `${regionLabel} · ${partyCount} social${partyCount === 1 ? '' : 's'} tonight`
        : `${regionLabel} · 오늘 밤 소셜 ${partyCount}곳`}
    </p>
  );
}
