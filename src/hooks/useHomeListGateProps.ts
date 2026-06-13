import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolvePartyVenueName } from '../lib/partiesQuery';
import { navigate as historyNavigate, navigateHomeTab, pushOverlay } from '../lib/appHistory';
import { buildHomeDarkMoreActions } from '../components/home/buildHomeDarkMoreActions';
import { buildHomeDarkHeroSlides } from '../components/home/buildHomeDarkHeroSlides';
import { buildHomeDarkQuickMenu } from '../components/home/buildHomeDarkQuickMenu';
import { formatPartyTitleDisplay } from '../lib/partyTitleDisplay';
import { HOME_DARK_REGION_PILLS } from '../components/home/constants';
import type { HomeDarkHeroSlide, HomeDarkParty } from '../components/home/types';
import type { HomeListGateProps } from '../components/home/HomeListGate';
import type { UseHomeDarkGatePropsInput } from './useHomeDarkGateProps';

const normDate = (value?: unknown) => String(value ?? '').slice(0, 10);

const isUpcomingEvent = (row: Record<string, unknown>, todayStr: string) => {
  const end = normDate(row.end_date || row.start_date);
  return !end || end >= todayStr;
};

/** Home.tsx — 네이버형 리스트 메인 props */
export function useHomeListGateProps(input: UseHomeDarkGatePropsInput) {
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
    socialBarRegionTabs,
    selectedRegionTab,
    setSelectedRegionTab,
    barRegionCounts,
    geoRegionTab,
    locations,
    locationsLoading,
    geoRegionStatus,
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

  const homeFilteredTodayParties = useMemo(
    () => filterTodayPartiesByPill(todayPosterPartiesForCount, homeRegionPill)
      .filter((party) => String(party.poster_url || '').trim()),
    [todayPosterPartiesForCount, homeRegionPill, filterTodayPartiesByPill],
  );

  const homeHeroSlides = useMemo(
    () => buildHomeDarkHeroSlides(
      filterTodayPartiesByPill(todayPosterPartiesForCount, homeRegionPill),
      bootcamps,
      festivals,
      calendarTodayStr,
    ),
    [todayPosterPartiesForCount, homeRegionPill, bootcamps, festivals, calendarTodayStr, filterTodayPartiesByPill],
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

  const openSocialTab = useCallback(() => {
    navigateHomeTab('social');
  }, []);

  const quickMenuItems = useMemo(
    () => buildHomeDarkQuickMenu({
      onOpenSocial: openSocialTab,
      onOpenBootcamp: openBootcampPage,
      onOpenFestival: openFestivalPage,
      onOpenFestivalParty: openFestivalPartyPage,
    }),
    [openSocialTab, openBootcampPage, openFestivalPage, openFestivalPartyPage],
  );

  const homeListRegionPillCounts = useMemo(() => ({
    national: todayPosterPartiesForCount.length,
    seoul: regionCounts.seoul,
    metro: regionCounts.metro,
    local: regionCounts.national,
  }), [todayPosterPartiesForCount.length, regionCounts]);

  const bootcampCount = useMemo(
    () => (bootcamps || []).filter((row) => isUpcomingEvent(row, calendarTodayStr)).length,
    [bootcamps, calendarTodayStr],
  );

  const festivalCount = useMemo(
    () => (festivals || []).filter(
      (row) => ['festival', 'mt'].includes(String(row.event_type || 'festival'))
        && isUpcomingEvent(row, calendarTodayStr),
    ).length,
    [festivals, calendarTodayStr],
  );

  const partyEventCount = useMemo(
    () => (festivals || []).filter(
      (row) => row.event_type === 'party' && isUpcomingEvent(row, calendarTodayStr),
    ).length,
    [festivals, calendarTodayStr],
  );

  const moreActions = useMemo(
    () => buildHomeDarkMoreActions({
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
    }),
    [
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
    ],
  );

  const openInstructors = useCallback(() => {
    historyNavigate('/instructors', { homeTab: null });
  }, []);

  const openBarMap = useCallback(() => {
    pushOverlay('incheon');
  }, []);

  const gateProps: HomeListGateProps = {
    isEn,
    regionPills: [...HOME_DARK_REGION_PILLS],
    regionPill: homeRegionPill,
    regionPillCounts: homeListRegionPillCounts,
    onRegionPillChange: setHomeRegionPill,
    quickMenuItems,
    heroSlide: homeActiveHeroSlide,
    heroTitle: homeActiveHeroSlide ? getHeroTitle(homeActiveHeroSlide) : '',
    heroVenue: homeActiveHeroSlide ? getHeroVenue(homeActiveHeroSlide) : '',
    heroSlideCount: homeHeroSlides.length,
    pickIndex: homePickIndex,
    onPickIndexChange: setHomePickIndex,
    onHeroRotateNext: rotateHeroNext,
    onHeroOpen: () => homeActiveHeroSlide && openHeroSlide(homeActiveHeroSlide),
    todayParties: homeFilteredTodayParties,
    wishlistPartyIds: wishlistParties,
    onPartyClick: openPartyWithAfterParty,
    onToggleWishlist: toggleWishlistParty,
    onViewAllSocial: openSocialTab,
    bootcampCount,
    festivalCount,
    partyEventCount,
    instructorCount: hotInstructors.length,
    onOpenBootcamp: openBootcampPage,
    onOpenFestival: openFestivalPage,
    onOpenPartyEvents: openFestivalPartyPage,
    onOpenInstructors: openInstructors,
    onOpenBarMap: openBarMap,
    socialBarRegionTabs,
    selectedBarRegionTab: selectedRegionTab,
    barRegionCounts,
    geoRegionTab,
    barCount: locations.length,
    locationsLoading,
    geoRegionPending: geoRegionStatus === 'pending',
    onBarRegionTabChange: setSelectedRegionTab,
    onBarClick: openVenueDetail,
    onAdminTap: registerAdminPortalTap,
    onSearch: openSocialTab,
    onOpenWishlist,
    moreActions,
    getPartyVenue: (party: HomeDarkParty) => translateDynamicText(
      resolvePartyVenueName(party) || party.locationName || party.location_name || '',
      isEn,
    ),
  };

  return { gateProps };
}
