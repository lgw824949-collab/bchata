import React from 'react';
import type { HomeDarkRegionPill } from './types';

type HomeDarkRegionPillsProps = {
  pills: HomeDarkRegionPill[];
  activeId: string;
  counts: Record<string, number>;
  isEn: boolean;
  onChange: (id: string) => void;
};

export default function HomeDarkRegionPills({
  pills,
  activeId,
  counts,
  isEn,
  onChange,
}: HomeDarkRegionPillsProps) {
  return (
    <div className="home-dark-region-pills" role="tablist" aria-label={isEn ? 'Region filter' : '지역 필터'}>
      {pills.map((pill) => (
        <button
          key={pill.id}
          type="button"
          role="tab"
          aria-selected={activeId === pill.id}
          className={`home-dark-region-pill${activeId === pill.id ? ' is-active' : ''}`}
          onClick={() => onChange(pill.id)}
        >
          {isEn ? pill.labelEn : pill.labelKo}
          {(counts[pill.id] ?? 0) > 0 ? (
            <span className="home-dark-region-pill__count">{counts[pill.id]}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
