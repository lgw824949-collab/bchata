import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolvePartyVenueName } from '../lib/partiesQuery';
import { normalizeVenueNameKey } from '../lib/venueDedupe';
import { resolveBarVenuePhoto } from '../lib/barVenuePhotos';
import { formatPartyTitleDisplay } from '../lib/partyTitleDisplay';
import {
  navigate as historyNavigate,
  navigateHomeTab,
  pushOverlay,
} from '../lib/appHistory';
import { buildHomeDarkHeroSlides } from '../components/home/buildHomeDarkHeroSlides';
import { buildHomeDarkQuickMenu } from '../components/home/buildHomeDarkQuickMenu';
import {
  HOME_DARK_MIN_BAR_ITEMS,
  HOME_DARK_REGION_PILLS,
} from '../components/home/constants';
import type { HomeDarkGateProps } from '../components/home/HomeDarkGate';
import type { HomeDarkBar, HomeDarkHeroSlide, HomeDarkParty } from '../components/home/types';

export type UseHomeDarkGatePropsInput = {
  isEn: boolean;
  translateDynamicText: (text: string, isEn: boolean) => string;
  /** 승인·노출 parties 전체 — 오늘 일정에서 날짜·종류별 검색 */
  parties: HomeDarkParty[];
  /** 오늘 소셜 포스터 전체 (업체 dedupe 전) */
  todayPosterParties: HomeDarkParty[];
  todayPosterPartiesForCount: HomeDarkParty[];
  bootcamps: Array<Record<string, unknown>>;
  festivals: Array<Record<string, unknown>>;
  calendarTodayStr: string;
  regionCounts: {
    national: number;
    seoul: number;
    metro: number;
  };
  wishlistParties: Array<string | number>;
  hotInstructors: HomeDarkGateProps['instructors'];
  hotInstructorsLoading: boolean;
  socialBarRegionTabs: string[];
  selectedRegionTab: string | null;
  setSelectedRegionTab: (tab: string) => void;
  barRegionCounts: Record<string, number>;
  geoRegionTab: string | null;
  locations: HomeDarkBar[];
  locationsLoading: boolean;
  geoRegionStatus: string;
  socialBarRegionAll: string;
  userGeoCoords: { lat: number; lng: number } | null;
  requestUserLocation: () => void;
  sortBarsForSocialBarTab: (bars: HomeDarkBar[], regionTab: string) => HomeDarkBar[];
  openPartyWithAfterParty: (party: HomeDarkParty) => void;
  openBootcampPage: () => void;
  openFestivalPage: () => void;
  openFestivalPartyPage: () => void;
  toggleWishlistParty: (e: React.MouseEvent, party: HomeDarkParty) => void;
  openVenueDetail: (bar: HomeDarkBar) => void;
  registerAdminPortalTap: () => void;
  filterTodayPartiesByPill: (parties: HomeDarkParty[], pillId: string) => HomeDarkParty[];
  hasLivePickUploadToday: boolean;
  onRegisterParty: () => void;
  onRegisterBarClass: () => void;
  onRegisterInstructor: () => void;
  onOpenWishlist: () => void;
  onOpenCalendar: () => void;
  onOpenConcierge: () => void;
  onOpenLivePick: () => void;
  onOpenKakaoChat: () => void;
  onOpenRestaurant: () => void;
  onOpenWeather: () => void;
  onOpenRoute: () => void;
  onOpenSaju: () => void;
  onToggleLanguage: () => void;
  barStatsMap?: Record<string, { liveCount: number; clickCount: number }>;
};

/** Home.tsx — fetch·상태 유지, HomeDarkGate에 넘길 props + 네비 콜백 생성 */
export function useHomeDarkGateProps(input: UseHomeDarkGatePropsInput) {
  const {
    isEn,
    translateDynamicText,
    todayPosterPartiesForCount,
    bootcamps,
    festivals,
    calendarTodayStr,
    regionCounts,
    wishlistParties,
    hotInstructors,
    hotInstructorsLoading,
    socialBarRegionTabs,
    selectedRegionTab,
    setSelectedRegionTab,
    barRegionCounts,
    geoRegionTab,
    locations,
    locationsLoading,
    geoRegionStatus,
    socialBarRegionAll,
    sortBarsForSocialBarTab,
    openPartyWithAfterParty,
    openBootcampPage,
    openFestivalPage,
    openFestivalPartyPage,
    toggleWishlistParty,
    openVenueDetail,
    registerAdminPortalTap,
    filterTodayPartiesByPill,
    hasLivePickUploadToday,
    onRegisterParty,
    onRegisterBarClass,
    onRegisterInstructor,
    onOpenWishlist,
    onOpenCalendar,
    onOpenConcierge,
    onOpenLivePick,
    onOpenKakaoChat,
    onOpenRestaurant,
    onOpenWeather,
    onOpenRoute,
    onOpenSaju,
    onToggleLanguage,
  } = input;

  const [homeRegionPill, setHomeRegionPill] = useState('national');
  const [homePickIndex, setHomePickIndex] = useState(0);

  const barTodayPartyCountByKey = useMemo(() => {
    const map = new Map<string, number>();
    todayPosterPartiesForCount.forEach((party) => {
      const venueName = resolvePartyVenueName(party)
        || party.locationName
        || party.location_name
        || '';
      const key = normalizeVenueNameKey(venueName);
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [todayPosterPartiesForCount]);

  const getBarTodayEventCount = useCallback((bar: HomeDarkBar) => {
    const key = normalizeVenueNameKey(bar?.name || '');
    return key ? (barTodayPartyCountByKey.get(key) || 0) : 0;
  }, [barTodayPartyCountByKey]);

  const homeFilteredTodayParties = useMemo(
    () => filterTodayPartiesByPill(todayPosterPartiesForCount, homeRegionPill),
    [todayPosterPartiesForCount, homeRegionPill, filterTodayPartiesByPill],
  );

  const homeHeroSlides = useMemo(
    () => buildHomeDarkHeroSlides(
      homeFilteredTodayParties,
      bootcamps,
      festivals,
      calendarTodayStr,
    ),
    [homeFilteredTodayParties, bootcamps, festivals, calendarTodayStr],
  );

  const homeActiveHeroSlide = homeHeroSlides.length
    ? homeHeroSlides[homePickIndex % homeHeroSlides.length]
    : null;

  useEffect(() => {
    setHomePickIndex(0);
  }, [homeRegionPill]);

  useEffect(() => {
    if (homePickIndex >= homeHeroSlides.length && homeHeroSlides.length > 0) {
      setHomePickIndex(0);
    }
  }, [homePickIndex, homeHeroSlides.length]);

  const homeDarkRegionPillCounts = useMemo(() => ({
    national: todayPosterPartiesForCount.length,
    seoul: regionCounts.seoul,
    metro: regionCounts.metro,
    local: regionCounts.national,
  }), [todayPosterPartiesForCount.length, regionCounts]);

  const homeDarkInstructors = useMemo(() => {
    const posterUrls = new Set(
      todayPosterPartiesForCount.map((party) => party.poster_url).filter(Boolean),
    );
    return hotInstructors.filter((inst) => inst.photo_url && !posterUrls.has(inst.photo_url));
  }, [hotInstructors, todayPosterPartiesForCount]);

  const homeDarkDisplayParties = useMemo(
    () => homeFilteredTodayParties.filter((party) => String(party.poster_url || '').trim()),
    [homeFilteredTodayParties],
  );

  const homeDarkRegionBars = useMemo(() => {
    if (!selectedRegionTab) return [];
    const filteredBars = selectedRegionTab === socialBarRegionAll
      ? locations
      : locations.filter((bar) => bar.region === selectedRegionTab);
    const sorted = sortBarsForSocialBarTab(filteredBars, selectedRegionTab);
    if (sorted.length >= HOME_DARK_MIN_BAR_ITEMS || selectedRegionTab === socialBarRegionAll) {
      return sorted;
    }
    const seen = new Set(sorted.map((bar) => bar.id));
    const extras = sortBarsForSocialBarTab(
      locations.filter((bar) => !seen.has(bar.id)),
      socialBarRegionAll,
    );
    return [...sorted, ...extras].slice(0, Math.max(sorted.length, HOME_DARK_MIN_BAR_ITEMS));
  }, [locations, selectedRegionTab, socialBarRegionAll, sortBarsForSocialBarTab]);

  const navHandlers = useMemo(() => ({
    openPartyTab: () => navigateHomeTab('social'),
    openInstructors: () => historyNavigate('/instructors', { homeTab: null }),
    openBarOverlay: () => pushOverlay('incheon'),
    openProfileOverlay: () => pushOverlay('partner'),
  }), []);

  const getPartyTitle = useCallback(
    (party: HomeDarkParty) => translateDynamicText(formatPartyTitleDisplay(party.title), isEn),
    [isEn, translateDynamicText],
  );

  const getPartyVenue = useCallback(
    (party: HomeDarkParty) => translateDynamicText(
      party.locationName || party.location_name || party.venue || '',
      isEn,
    ),
    [isEn, translateDynamicText],
  );

  const getHeroTitle = useCallback(
    (slide: HomeDarkHeroSlide) => translateDynamicText(
      slide.kind === 'social'
        ? formatPartyTitleDisplay(slide.title)
        : slide.title,
      isEn,
    ),
    [isEn, translateDynamicText],
  );

  const getHeroVenue = useCallback(
    (slide: HomeDarkHeroSlide) => translateDynamicText(slide.venue, isEn),
    [isEn, translateDynamicText],
  );

  const rotateHeroNext = useCallback(() => {
    if (homeHeroSlides.length <= 1) return;
    setHomePickIndex((index) => (index + 1) % homeHeroSlides.length);
  }, [homeHeroSlides.length]);

  const openHeroSlide = useCallback((slide: HomeDarkHeroSlide) => {
    if (slide.kind === 'bootcamp') {
      openBootcampPage();
      return;
    }
    if (slide.kind === 'festival') {
      openFestivalPage();
      return;
    }
    if (slide.kind === 'party') {
      openFestivalPartyPage();
      return;
    }
    openPartyWithAfterParty(slide.raw as HomeDarkParty);
  }, [openBootcampPage, openFestivalPage, openFestivalPartyPage, openPartyWithAfterParty]);

  const quickMenuItems = useMemo(
    () => buildHomeDarkQuickMenu({
      onOpenSocial: navHandlers.openPartyTab,
      onOpenBootcamp: openBootcampPage,
      onOpenFestival: openFestivalPage,
      onOpenFestivalParty: openFestivalPartyPage,
    }),
    [navHandlers.openPartyTab, openBootcampPage, openFestivalPage, openFestivalPartyPage],
  );

  const gateProps: HomeDarkGateProps = {
    isEn,
    regionPills: [...HOME_DARK_REGION_PILLS],
    regionPill: homeRegionPill,
    regionPillCounts: homeDarkRegionPillCounts,
    onRegionPillChange: setHomeRegionPill,
    heroSlide: homeActiveHeroSlide,
    heroTitle: homeActiveHeroSlide ? getHeroTitle(homeActiveHeroSlide) : '',
    heroVenue: homeActiveHeroSlide ? getHeroVenue(homeActiveHeroSlide) : '',
    heroSlideCount: homeHeroSlides.length,
    pickIndex: homePickIndex,
    onPickIndexChange: setHomePickIndex,
    onHeroRotateNext: rotateHeroNext,
    onHeroOpen: () => homeActiveHeroSlide && openHeroSlide(homeActiveHeroSlide),
    todayParties: homeDarkDisplayParties,
    wishlistPartyIds: wishlistParties,
    getPartyTitle,
    getPartyVenue,
    onPartyClick: openPartyWithAfterParty,
    onToggleWishlist: toggleWishlistParty,
    onViewAllParties: navHandlers.openPartyTab,
    instructors: homeDarkInstructors,
    instructorsLoading: hotInstructorsLoading,
    onViewAllInstructors: navHandlers.openInstructors,
    onInstructorClick: navHandlers.openInstructors,
    socialBarRegionTabs,
    selectedBarRegionTab: selectedRegionTab,
    barRegionCounts,
    geoRegionTab,
    regionBars: homeDarkRegionBars,
    locationsLoading,
    geoRegionPending: geoRegionStatus === 'pending',
    getBarCoverPhoto: (bar) => {
      const resolved = resolveBarVenuePhoto(bar.name, bar.image_url) || bar.image_url;
      return resolved || '/logo.png';
    },
    getBarEventCount: getBarTodayEventCount,
    onBarRegionTabChange: setSelectedRegionTab,
    onBarClick: openVenueDetail,
    onViewMap: navHandlers.openBarOverlay,
    onAdminTap: registerAdminPortalTap,
    onSearch: navHandlers.openPartyTab,
    onOpenWishlist,
    quickMenuItems,
  };

  return { gateProps, navHandlers };
}
