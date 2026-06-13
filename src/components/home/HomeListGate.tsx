import React, { useState } from 'react';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkMoreSheet from './HomeDarkMoreSheet';
import HomeDarkTodayPick from './HomeDarkTodayPick';
import HomeListBarSection from './HomeListBarSection';
import HomeListPhotoMenu from './HomeListPhotoMenu';
import HomeListTodayAgenda from './HomeListTodayAgenda';
import HomePartySearchSheet from './HomePartySearchSheet';
import { HOME_LIST_TAGLINE_EN, HOME_LIST_TAGLINE_KO } from './constants';
import type { HomeListPhotoMenuItem } from '../../lib/homeListPhotoMenu';
import type { HomeTodayAgendaItem } from '../../lib/buildHomeTodayAgenda';
import type { HomeListUpcomingAgendaDay } from './HomeListTodayAgenda';
import type {
  HomeDarkBar,
  HomeDarkHeroSlide,
  HomeDarkMoreAction,
  HomeDarkParty,
  HomeDarkRegionPill,
} from './types';

export type HomeListGateProps = {
  isEn: boolean;
  regionPills: HomeDarkRegionPill[];
  regionPill: string;
  regionPillCounts: Record<string, number>;
  onRegionPillChange: (id: string) => void;
  heroSlide: HomeDarkHeroSlide | null;
  heroTitle: string;
  heroVenue: string;
  heroDateLabel: string;
  heroSlideCount: number;
  pickIndex: number;
  onPickIndexChange: (index: number) => void;
  onHeroRotateNext: () => void;
  onHeroOpen: () => void;
  todaySocialCount: number;
  todayParties: HomeDarkParty[];
  getPartyTitle: (party: HomeDarkParty) => string;
  getPartyVenue: (party: HomeDarkParty) => string;
  onPartyClick: (party: HomeDarkParty) => void;
  onViewAllSocial: () => void;
  todayAgendaDayCount: number;
  todayAgendaDayGroups: HomeListUpcomingAgendaDay[];
  todayAgendaCount: number;
  todayAgendaSummaryLabel: string;
  onAgendaItemClick: (item: HomeTodayAgendaItem) => void;
  onOpenCalendar: () => void;
  calendarTodayStr: string;
  partySearchItems: HomeTodayAgendaItem[];
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
  onOpenWishlist: () => void;
  moreActions: HomeDarkMoreAction[];
};

export default function HomeListGate({
  isEn,
  regionPills: _regionPills,
  regionPill: _regionPill,
  regionPillCounts: _regionPillCounts,
  onRegionPillChange: _onRegionPillChange,
  heroSlide,
  heroTitle,
  heroVenue,
  heroDateLabel,
  heroSlideCount,
  pickIndex,
  onPickIndexChange,
  onHeroRotateNext,
  onHeroOpen,
  todaySocialCount: _todaySocialCount,
  todayParties: _todayParties,
  getPartyTitle: _getPartyTitle,
  getPartyVenue: _getPartyVenue,
  onPartyClick: _onPartyClick,
  onViewAllSocial: _onViewAllSocial,
  todayAgendaDayCount,
  todayAgendaDayGroups,
  todayAgendaCount,
  todayAgendaSummaryLabel,
  onAgendaItemClick,
  onOpenCalendar,
  calendarTodayStr,
  partySearchItems,
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
  onOpenWishlist,
  moreActions,
}: HomeListGateProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="home-list-gate">
      <HomeDarkHeader
        tagline={isEn ? HOME_LIST_TAGLINE_EN : HOME_LIST_TAGLINE_KO}
        onAdminTap={onAdminTap}
        onSearch={() => setSearchOpen(true)}
        onWishlist={onOpenWishlist}
        onMore={() => setMoreOpen(true)}
      />

      <div className="home-list-gate__hero">
        <HomeDarkTodayPick
          slide={heroSlide}
          title={heroTitle}
          venue={heroVenue}
          dateLabel={heroDateLabel}
          isEn={isEn}
          slideCount={heroSlideCount}
          activeDot={pickIndex % Math.max(heroSlideCount, 1)}
          onDotSelect={onPickIndexChange}
          onRotateNext={onHeroRotateNext}
          onOpen={onHeroOpen}
          emptyLabel={isEn ? 'No featured events today' : '오늘 등록된 행사가 없어요'}
        />
      </div>

      <HomeListTodayAgenda
        isEn={isEn}
        dayCount={todayAgendaDayCount}
        totalCount={todayAgendaCount}
        summaryLabel={todayAgendaSummaryLabel}
        dayGroups={todayAgendaDayGroups}
        onItemClick={onAgendaItemClick}
        onOpenCalendar={onOpenCalendar}
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

      <HomePartySearchSheet
        open={searchOpen}
        isEn={isEn}
        todayStr={calendarTodayStr}
        items={partySearchItems}
        onClose={() => setSearchOpen(false)}
        onItemClick={onAgendaItemClick}
      />
    </div>
  );
}
