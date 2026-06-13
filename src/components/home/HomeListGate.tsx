import React, { useState } from 'react';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkMoreSheet from './HomeDarkMoreSheet';
import HomeListBarSection from './HomeListBarSection';
import HomeListPhotoMenu from './HomeListPhotoMenu';
import { HOME_LIST_TAGLINE_EN, HOME_LIST_TAGLINE_KO } from './constants';
import type { HomeListPhotoMenuItem } from '../../lib/homeListPhotoMenu';
import type { HomeDarkBar, HomeDarkMoreAction, HomeDarkParty, HomeDarkRegionPill } from './types';

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
  photoMenuItems: HomeListPhotoMenuItem[];
  onOpenBarMap: () => void;
  barCount: number;
  socialBarRegionTabs: string[];
  selectedBarRegionTab: string | null;
  barRegionCounts: Record<string, number>;
  geoRegionTab: string | null;
  regionBars: HomeDarkBar[];
  locationsLoading: boolean;
  geoRegionPending: boolean;
  getBarCoverPhoto: (bar: HomeDarkBar) => string | null;
  getBarEventCount: (bar: HomeDarkBar) => number;
  getBarDistanceLabel: (bar: HomeDarkBar) => string | null;
  sortByNearest: boolean;
  onBarRegionTabChange: (tab: string) => void;
  onBarClick: (bar: HomeDarkBar) => void;
  onRequestLocation: () => void;
  onAdminTap: () => void;
  onSearch: () => void;
  onOpenWishlist: () => void;
  moreActions: HomeDarkMoreAction[];
};

export default function HomeListGate({
  isEn,
  regionPills: _regionPills,
  regionPill: _regionPill,
  regionPillCounts: _regionPillCounts,
  onRegionPillChange: _onRegionPillChange,
  todayParties: _todayParties,
  getPartyTitle: _getPartyTitle,
  getPartyVenue: _getPartyVenue,
  onPartyClick: _onPartyClick,
  onViewAllSocial: _onViewAllSocial,
  photoMenuItems,
  onOpenBarMap,
  socialBarRegionTabs,
  selectedBarRegionTab,
  barRegionCounts,
  geoRegionTab,
  regionBars,
  locationsLoading,
  geoRegionPending,
  getBarCoverPhoto,
  getBarEventCount,
  getBarDistanceLabel,
  sortByNearest,
  onBarRegionTabChange,
  onBarClick,
  onRequestLocation,
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

      <HomeListBarSection
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
        getDistanceLabel={getBarDistanceLabel}
        sortByNearest={sortByNearest}
        onTabChange={onBarRegionTabChange}
        onBarClick={onBarClick}
        onViewMap={onOpenBarMap}
        onRequestLocation={onRequestLocation}
      />

      <HomeListPhotoMenu isEn={isEn} items={photoMenuItems} />

      <HomeDarkMoreSheet
        open={moreOpen}
        isEn={isEn}
        actions={moreActions}
        onClose={() => setMoreOpen(false)}
      />
    </div>
  );
}
