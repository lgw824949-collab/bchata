import React, { useState } from 'react';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkRegionPills from './HomeDarkRegionPills';
import HomeDarkTodayPick from './HomeDarkTodayPick';
import HomeDarkParties from './HomeDarkParties';
import HomeDarkInstructors from './HomeDarkInstructors';
import HomeDarkSocialBar from './HomeDarkSocialBar';
import HomeDarkMoreSheet from './HomeDarkMoreSheet';
import HomeDarkQuickMenu from './HomeDarkQuickMenu';
import { HOME_DARK_HEADER_TAGLINE } from './constants';
import type {
  HomeDarkBar,
  HomeDarkHeroSlide,
  HomeDarkInstructor,
  HomeDarkMoreAction,
  HomeDarkParty,
  HomeDarkQuickMenuItem,
  HomeDarkRegionPill,
} from './types';

export type HomeDarkGateProps = {
  isEn: boolean;
  regionPills: HomeDarkRegionPill[];
  regionPill: string;
  regionPillCounts: Record<string, number>;
  onRegionPillChange: (id: string) => void;
  heroSlide: HomeDarkHeroSlide | null;
  heroTitle: string;
  heroVenue: string;
  heroSlideCount: number;
  pickIndex: number;
  onPickIndexChange: (index: number) => void;
  onHeroRotateNext: () => void;
  onHeroOpen: () => void;
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
  onOpenWishlist: () => void;
  moreActions: HomeDarkMoreAction[];
  quickMenuItems: HomeDarkQuickMenuItem[];
};

export default function HomeDarkGate({
  isEn,
  regionPills,
  regionPill,
  regionPillCounts,
  onRegionPillChange,
  heroSlide,
  heroTitle,
  heroVenue,
  heroSlideCount,
  pickIndex,
  onPickIndexChange,
  onHeroRotateNext,
  onHeroOpen,
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
  onOpenWishlist,
  moreActions,
  quickMenuItems,
}: HomeDarkGateProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="home-dark-gate">
      <HomeDarkHeader
        tagline={HOME_DARK_HEADER_TAGLINE}
        onAdminTap={onAdminTap}
        onSearch={onSearch}
        onWishlist={onOpenWishlist}
        onMore={() => setMoreOpen(true)}
      />
      <HomeDarkRegionPills
        pills={regionPills}
        activeId={regionPill}
        counts={regionPillCounts}
        isEn={isEn}
        onChange={onRegionPillChange}
      />
      <HomeDarkQuickMenu isEn={isEn} items={quickMenuItems} />
      <HomeDarkTodayPick
        slide={heroSlide}
        title={heroTitle}
        venue={heroVenue}
        isEn={isEn}
        slideCount={heroSlideCount}
        activeDot={pickIndex % Math.max(heroSlideCount, 1)}
        onDotSelect={onPickIndexChange}
        onRotateNext={onHeroRotateNext}
        onOpen={onHeroOpen}
        emptyLabel={isEn ? 'No featured events today' : '오늘 등록된 행사가 없어요'}
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
      <HomeDarkMoreSheet
        open={moreOpen}
        isEn={isEn}
        actions={moreActions}
        onClose={() => setMoreOpen(false)}
      />
    </div>
  );
}
