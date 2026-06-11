import React from 'react';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkRegionPills from './HomeDarkRegionPills';
import HomeDarkSummary from './HomeDarkSummary';
import HomeDarkTodayPick from './HomeDarkTodayPick';
import HomeDarkParties from './HomeDarkParties';
import HomeDarkInstructors from './HomeDarkInstructors';
import HomeDarkSocialBar from './HomeDarkSocialBar';
import type { HomeDarkBar, HomeDarkInstructor, HomeDarkParty, HomeDarkRegionPill } from './types';

export type HomeDarkGateProps = {
  isEn: boolean;
  regionPills: HomeDarkRegionPill[];
  regionPill: string;
  regionPillCounts: Record<string, number>;
  onRegionPillChange: (id: string) => void;
  todayPickParty: HomeDarkParty | null;
  todayPickTitle: string;
  todayPickVenue: string;
  pickIndex: number;
  onPickIndexChange: (index: number) => void;
  todayParties: HomeDarkParty[];
  wishlistPartyIds: Array<string | number>;
  getPartyTitle: (party: HomeDarkParty) => string;
  getPartyVenue: (party: HomeDarkParty) => string;
  onPartyClick: (party: HomeDarkParty) => void;
  onToggleWishlist: (e: React.MouseEvent, party: HomeDarkParty) => void;
  onViewAllParties: () => void;
  instructors: HomeDarkInstructor[];
  instructorsLoading: boolean;
  onViewAllInstructors: () => void;
  onInstructorClick: () => void;
  socialBarRegionTabs: string[];
  selectedBarRegionTab: string | null;
  barRegionCounts: Record<string, number>;
  geoRegionTab: string | null;
  regionBars: HomeDarkBar[];
  locationsLoading: boolean;
  geoRegionPending: boolean;
  getBarCoverPhoto: (bar: HomeDarkBar) => string | null;
  getBarEventCount: (bar: HomeDarkBar) => number;
  onBarRegionTabChange: (tab: string) => void;
  onBarClick: (bar: HomeDarkBar) => void;
  onViewMap: () => void;
  onAdminTap: () => void;
  onSearch: () => void;
};

export default function HomeDarkGate({
  isEn,
  regionPills,
  regionPill,
  regionPillCounts,
  onRegionPillChange,
  todayPickParty,
  todayPickTitle,
  todayPickVenue,
  pickIndex,
  onPickIndexChange,
  todayParties,
  wishlistPartyIds,
  getPartyTitle,
  getPartyVenue,
  onPartyClick,
  onToggleWishlist,
  onViewAllParties,
  instructors,
  instructorsLoading,
  onViewAllInstructors,
  onInstructorClick,
  socialBarRegionTabs,
  selectedBarRegionTab,
  barRegionCounts,
  geoRegionTab,
  regionBars,
  locationsLoading,
  geoRegionPending,
  getBarCoverPhoto,
  getBarEventCount,
  onBarRegionTabChange,
  onBarClick,
  onViewMap,
  onAdminTap,
  onSearch,
}: HomeDarkGateProps) {
  const activeRegion = regionPills.find((pill) => pill.id === regionPill);
  const regionLabel = isEn ? (activeRegion?.labelEn || 'All') : (activeRegion?.labelKo || '전체');
  const moreParties = todayPickParty
    ? todayParties.filter((party) => party.id !== todayPickParty.id)
    : todayParties;

  return (
    <div className="home-dark-gate">
      <HomeDarkHeader
        tagline={isEn ? 'Latin dance tonight' : '라틴 댄스 소셜'}
        mission={isEn ? 'Where are you going tonight?' : '오늘 밤, 어디 갈까?'}
        onAdminTap={onAdminTap}
        onSearch={onSearch}
      />
      <HomeDarkRegionPills
        pills={regionPills}
        activeId={regionPill}
        counts={regionPillCounts}
        isEn={isEn}
        onChange={onRegionPillChange}
      />
      <HomeDarkSummary
        isEn={isEn}
        partyCount={todayParties.length}
        regionLabel={regionLabel}
      />
      <HomeDarkTodayPick
        party={todayPickParty}
        title={todayPickTitle}
        venue={todayPickVenue}
        isEn={isEn}
        pickCount={todayParties.length}
        activeDot={pickIndex % Math.max(todayParties.length, 1)}
        onDotSelect={onPickIndexChange}
        onOpen={() => todayPickParty && onPartyClick(todayPickParty)}
        emptyLabel={isEn ? 'No parties registered today' : '오늘 등록된 파티가 없어요'}
      />
      <HomeDarkParties
        isEn={isEn}
        parties={moreParties}
        hasFeaturedPick={Boolean(todayPickParty)}
        wishlistIds={wishlistPartyIds}
        getTitle={getPartyTitle}
        getVenue={getPartyVenue}
        onPartyClick={onPartyClick}
        onToggleWishlist={onToggleWishlist}
        onViewAll={onViewAllParties}
        emptyLabel={
          todayPickParty
            ? (isEn ? 'No other socials in this area' : '추천 말고는 다른 소셜이 없어요')
            : (isEn ? 'No parties in this region today' : '이 지역 오늘 파티가 없어요')
        }
      />
      <HomeDarkInstructors
        isEn={isEn}
        instructors={instructors}
        loading={instructorsLoading}
        onViewAll={onViewAllInstructors}
        onInstructorClick={onInstructorClick}
      />
      <HomeDarkSocialBar
        isEn={isEn}
        regionTabs={socialBarRegionTabs}
        selectedTab={selectedBarRegionTab}
        barCounts={barRegionCounts}
        geoRegionTab={geoRegionTab}
        bars={regionBars}
        loading={locationsLoading}
        geoPending={geoRegionPending}
        getCoverPhoto={getBarCoverPhoto}
        getEventCount={getBarEventCount}
        onTabChange={onBarRegionTabChange}
        onBarClick={onBarClick}
        onViewMap={onViewMap}
      />
    </div>
  );
}
