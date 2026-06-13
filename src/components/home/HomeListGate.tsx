import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkRegionPills from './HomeDarkRegionPills';
import HomeDarkMoreSheet from './HomeDarkMoreSheet';
import HomeListTodaySocialRotator from './HomeListTodaySocialRotator';
import { HOME_LIST_TAGLINE_EN, HOME_LIST_TAGLINE_KO } from './constants';
import type { HomeDarkMoreAction, HomeDarkParty, HomeDarkRegionPill } from './types';

export type HomeListGateProps = {
  isEn: boolean;
  regionPills: HomeDarkRegionPill[];
  regionPill: string;
  regionPillCounts: Record<string, number>;
  onRegionPillChange: (id: string) => void;
  todayParties: HomeDarkParty[];
  getPartyTitle: (party: HomeDarkParty) => string;
  getPartyVenue: (party: HomeDarkParty) => string;
  onPartyClick: (party: HomeDarkParty) => void;
  onViewAllSocial: () => void;
  bootcampCount: number;
  festivalCount: number;
  partyEventCount: number;
  instructorCount: number;
  onOpenBootcamp: () => void;
  onOpenFestival: () => void;
  onOpenPartyEvents: () => void;
  onOpenInstructors: () => void;
  onOpenBarMap: () => void;
  barCount: number;
  onAdminTap: () => void;
  onSearch: () => void;
  onOpenWishlist: () => void;
  moreActions: HomeDarkMoreAction[];
};

type NavChipProps = {
  label: string;
  count: number;
  onClick: () => void;
};

function HomeListNavChip({ label, count, onClick }: NavChipProps) {
  if (count <= 0) return null;
  return (
    <button type="button" className="home-list-gate__nav-chip" onClick={onClick}>
      <span className="home-list-gate__nav-chip-label">{label}</span>
      <span className="home-list-gate__nav-chip-count">{count}</span>
    </button>
  );
}

export default function HomeListGate({
  isEn,
  regionPills,
  regionPill,
  regionPillCounts,
  onRegionPillChange,
  todayParties,
  getPartyTitle,
  getPartyVenue,
  onPartyClick,
  onViewAllSocial,
  bootcampCount,
  festivalCount,
  partyEventCount,
  instructorCount,
  onOpenBootcamp,
  onOpenFestival,
  onOpenPartyEvents,
  onOpenInstructors,
  onOpenBarMap,
  barCount,
  onAdminTap,
  onSearch,
  onOpenWishlist,
  moreActions,
}: HomeListGateProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="home-list-gate">
      <HomeDarkHeader
        tagline={isEn ? HOME_LIST_TAGLINE_EN : HOME_LIST_TAGLINE_KO}
        onAdminTap={onAdminTap}
        onSearch={onSearch}
        onWishlist={onOpenWishlist}
        onMore={() => setMoreOpen(true)}
      />

      <div className="home-list-gate__toolbar">
        <HomeDarkRegionPills
          pills={regionPills}
          activeId={regionPill}
          counts={regionPillCounts}
          isEn={isEn}
          onChange={onRegionPillChange}
        />
      </div>

      <section className="home-list-gate__panel" aria-label={isEn ? "Today's social" : '오늘소셜'}>
        <div className="home-list-gate__panel-head">
          <h2 className="home-list-gate__section-title">
            {isEn ? "Today's social" : '오늘소셜'}
            {todayParties.length > 0 ? (
              <span className="home-list-gate__section-count">{todayParties.length}</span>
            ) : null}
          </h2>
          <button type="button" className="home-list-gate__section-action" onClick={onViewAllSocial}>
            {isEn ? 'Calendar' : '달력'}
            <ChevronRight size={14} aria-hidden />
          </button>
        </div>

        <HomeListTodaySocialRotator
          isEn={isEn}
          parties={todayParties}
          getPartyTitle={getPartyTitle}
          getPartyVenue={getPartyVenue}
          onPartyClick={onPartyClick}
        />
      </section>

      <nav className="home-list-gate__nav-chips" aria-label={isEn ? 'More categories' : '밤빠 더보기'}>
        <HomeListNavChip
          label={isEn ? 'Bootcamp' : '부트캠프'}
          count={bootcampCount}
          onClick={onOpenBootcamp}
        />
        <HomeListNavChip
          label={isEn ? 'Festival' : '페스티벌'}
          count={festivalCount}
          onClick={onOpenFestival}
        />
        <HomeListNavChip
          label={isEn ? 'Party' : '파티'}
          count={partyEventCount}
          onClick={onOpenPartyEvents}
        />
        <HomeListNavChip
          label={isEn ? 'Instructors' : '강사'}
          count={instructorCount}
          onClick={onOpenInstructors}
        />
        <HomeListNavChip
          label={isEn ? 'BAR' : 'BAR'}
          count={barCount}
          onClick={onOpenBarMap}
        />
      </nav>

      <HomeDarkMoreSheet
        open={moreOpen}
        isEn={isEn}
        actions={moreActions}
        onClose={() => setMoreOpen(false)}
      />
    </div>
  );
}
