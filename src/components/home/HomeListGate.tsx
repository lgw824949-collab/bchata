import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkRegionPills from './HomeDarkRegionPills';
import HomeDarkMoreSheet from './HomeDarkMoreSheet';
import HomeListTodaySocialRotator from './HomeListTodaySocialRotator';
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
  regionPills,
  regionPill,
  regionPillCounts,
  onRegionPillChange,
  todayParties,
  getPartyTitle,
  getPartyVenue,
  onPartyClick,
  onViewAllSocial,
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

      <div className="home-list-gate__toolbar">
        <p className="home-list-gate__section-caption">
          {isEn ? 'Social only · filter below' : '오늘소셜만 · 아래 목록 필터'}
        </p>
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
