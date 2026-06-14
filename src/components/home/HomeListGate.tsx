import React, { useEffect, useRef, useState } from 'react';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkTodayPick from './HomeDarkTodayPick';
import HomeListBarSection from './HomeListBarSection';
import HomeListPhotoMenu from './HomeListPhotoMenu';
import HomeListTodayAgenda from './HomeListTodayAgenda';
import HomePartySearchSheet from './HomePartySearchSheet';
import HomeDarkMoreSheet from './HomeDarkMoreSheet';
import { HOME_LIST_TAGLINE_EN, HOME_LIST_TAGLINE_KO } from './constants';
import type { HomeDarkMoreAction } from './types';
import type { HomeListPhotoMenuItem } from '../../lib/homeListPhotoMenu';
import type { HomeTodayAgendaItem } from '../../lib/buildHomeTodayAgenda';
import type { HomeListUpcomingAgendaDay } from './HomeListTodayAgenda';
import type {
  HomeDarkBar,
  HomeDarkHeroSlide,
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
  moreMenuActions: HomeDarkMoreAction[];
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
  moreMenuActions,
}: HomeListGateProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [onHomePath, setOnHomePath] = useState(() => window.location.pathname === '/');
  const gateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPath = () => {
      const home = window.location.pathname === '/';
      setOnHomePath(home);
      if (!home) setMoreOpen(false);
    };
    syncPath();
    window.addEventListener('bamppa-navigate', syncPath);
    window.addEventListener('bamppa-history', syncPath);
    window.addEventListener('popstate', syncPath);
    return () => {
      window.removeEventListener('bamppa-navigate', syncPath);
      window.removeEventListener('bamppa-history', syncPath);
      window.removeEventListener('popstate', syncPath);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setHeaderCompact(window.scrollY > 96);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`home-list-gate${headerCompact ? ' home-list-gate--header-compact' : ''}`} ref={gateRef}>
      <HomeDarkHeader
        tagline={isEn ? HOME_LIST_TAGLINE_EN : HOME_LIST_TAGLINE_KO}
        compact={headerCompact}
        onAdminTap={onAdminTap}
        onSearch={() => setSearchOpen(true)}
        onOpenMore={() => setMoreOpen(true)}
        onWishlist={onOpenWishlist}
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

      <HomeListPhotoMenu isEn={isEn} items={photoMenuItems} />

      <HomeListTodayAgenda
        isEn={isEn}
        todayStr={calendarTodayStr}
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

      <HomePartySearchSheet
        open={searchOpen}
        isEn={isEn}
        todayStr={calendarTodayStr}
        items={partySearchItems}
        onClose={() => setSearchOpen(false)}
        onItemClick={onAgendaItemClick}
      />

      <HomeDarkMoreSheet
        open={moreOpen && onHomePath}
        isEn={isEn}
        actions={moreMenuActions}
        onClose={() => setMoreOpen(false)}
      />
    </div>
  );
}
