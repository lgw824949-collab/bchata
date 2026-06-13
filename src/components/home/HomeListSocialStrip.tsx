import React from 'react';
import { ChevronRight } from 'lucide-react';

type HomeListSocialStripProps = {
  isEn: boolean;
  count: number;
  onOpenSocial: () => void;
  onOpenCalendar: () => void;
};

export default function HomeListSocialStrip({
  isEn,
  count,
  onOpenSocial,
  onOpenCalendar,
}: HomeListSocialStripProps) {
  if (count <= 0) return null;

  return (
    <div className="home-list-gate__social-strip">
      <button type="button" className="home-list-gate__social-strip-link" onClick={onOpenSocial}>
        {isEn ? `Today's social · ${count}` : `오늘소셜 ${count}건`}
      </button>
      <span className="home-list-gate__social-strip-sep" aria-hidden>·</span>
      <button type="button" className="home-list-gate__social-strip-link" onClick={onOpenCalendar}>
        {isEn ? 'Calendar' : '달력'}
        <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  );
}
