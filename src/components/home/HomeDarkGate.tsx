import React from 'react';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkRegionPills, { type HomeDarkRegionPill } from './HomeDarkRegionPills';
import HomeDarkTodayPick from './HomeDarkTodayPick';
import HomeDarkParties from './HomeDarkParties';
import HomeDarkInstructors from './HomeDarkInstructors';
import HomeDarkSocialBar from './HomeDarkSocialBar';

type PartyLike = {
  id: string | number;
  poster_url?: string;
  title?: string;
  locationName?: string;
  location_name?: string;
  venue?: string;
  start_time?: string;
  region?: string;
  broadRegion?: string;
};

type InstructorLike = {
  id: string | number;
  name?: string;
  genre?: unknown;
  photo_url?: string;
};

type BarLike = {
  id: string | number;
  name?: string;
  image_url?: string;
  address?: string;
  region?: string;
};

export type HomeDarkGateProps = {
  isEn: boolean;
  regionPills: HomeDarkRegionPill[];
  regionPill: string;
  regionPillCounts: Record<string, number>;
  onRegionPillChange: (id: string) => void;
  todayPickParty: PartyLike | null;
  todayPickTitle: string;
  todayPickVenue: string;
  pickIndex: number;
  onPickIndexChange: (index: number) => void;
  todayParties: PartyLike[];
  wishlistPartyIds: Array<string | number>;
  getPartyTitle: (party: PartyLike) => string;
  getPartyVenue: (party: PartyLike) => string;
  onPartyClick: (party: PartyLike) => void;
  onToggleWishlist: (e: React.MouseEvent, party: PartyLike) => void;
  onViewAllParties: () => void;
  instructors: InstructorLike[];
  instructorsLoading: boolean;
  onViewAllInstructors: () => void;
  onInstructorClick: () => void;
  socialBarRegionTabs: string[];
  selectedBarRegionTab: string | null;
  barRegionCounts: Record<string, number>;
  geoRegionTab: string | null;
  regionBars: BarLike[];
  locationsLoading: boolean;
  geoRegionPending: boolean;
  getBarCoverPhoto: (bar: BarLike) => string | null;
  getBarEventCount: (bar: BarLike) => number;
  onBarRegionTabChange: (tab: string) => void;
  onBarClick: (bar: BarLike) => void;
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
  return (
    <div className="home-dark-gate">
      <HomeDarkHeader
        tagline={isEn ? 'Time to dance' : '지금, 춤추러 갈 시간'}
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
        parties={todayParties}
        wishlistIds={wishlistPartyIds}
        getTitle={getPartyTitle}
        getVenue={getPartyVenue}
        onPartyClick={onPartyClick}
        onToggleWishlist={onToggleWishlist}
        onViewAll={onViewAllParties}
        emptyLabel={isEn ? 'No parties in this region today' : '이 지역 오늘 파티가 없어요'}
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
