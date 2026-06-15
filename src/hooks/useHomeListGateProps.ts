import { useCallback, useEffect, useMemo, useState } from 'react';
import { filterSocialPartyRows } from '../lib/postKind';
import { resolvePartyVenueName } from '../lib/partiesQuery';
import { normalizeVenueNameKey } from '../lib/venueDedupe';
import { resolveBarVenuePhoto } from '../lib/barVenuePhotos';
import {
  haversineKm,
  formatDistanceLabel,
  sortByDistanceFromUser,
  parseVenueCoordinates,
} from '../lib/geoDistance';
import { navigate as historyNavigate, navigateHomeTab, pushOverlay } from '../lib/appHistory';
import { buildHomeDarkHeroSlides, formatHeroDateLabel } from '../components/home/buildHomeDarkHeroSlides';
import { formatPartyTitleDisplay } from '../lib/partyTitleDisplay';
import { HOME_DARK_MIN_BAR_ITEMS, HOME_DARK_REGION_PILLS } from '../components/home/constants';
import type { HomeDarkBar, HomeDarkHeroSlide, HomeDarkParty } from '../components/home/types';
import { buildHomeListPhotoMenuItems } from '../lib/homeListPhotoMenu';
import { buildHomePartySearchItems } from '../lib/buildHomePartySearchItems';
import {
  summarizeAgendaCountsFromDays,
  buildHomeAgendaDayRange,
  HOME_LIST_DATE_STRIP_DAY_COUNT,
  type HomeTodayAgendaItem,
} from '../lib/buildHomeTodayAgenda';
import type { HomeListTodayAgendaRow } from '../components/home/HomeListTodayAgenda';
import type { HomeListGateProps } from '../components/home/HomeListGate';
import type { UseHomeDarkGatePropsInput } from './useHomeDarkGateProps';
import { resolveAgendaLiveStatus } from '../lib/agendaLiveStatus';
import { buildHomeListMoreActions } from '../components/home/buildHomeListMoreActions';

const normDate = (value?: unknown) => String(value ?? '').slice(0, 10);

const isUpcomingEvent = (row: Record<string, unknown>, todayStr: string) => {
  const end = normDate(row.end_date || row.start_date);
  return !end || end >= todayStr;
};

/** Home.tsx — 네이버형 리스트 메인 props (A안: 리스트 중심) */
export function useHomeListGateProps(input: UseHomeDarkGatePropsInput) {
  const {
    isEn,
    translateDynamicText,
    todayPosterParties,
    todayPosterPartiesForCount,
    parties,
    bootcamps,
    festivals,
    calendarTodayStr,
    regionCounts,
    locations,
    socialBarRegionTabs,
    selectedRegionTab,
    setSelectedRegionTab,
    barRegionCounts,
    geoRegionTab,
    locationsLoading,
    geoRegionStatus,
    socialBarRegionAll,
    userGeoCoords,
    requestUserLocation,
    sortBarsForSocialBarTab,
    openVenueDetail,
    openPartyWithAfterParty,
    openBootcampPage,
    openFestivalPage,
    openFestivalPartyPage,
    registerAdminPortalTap,
    filterTodayPartiesByPill,
    onOpenWishlist,
    onOpenCalendar,
    onRegisterParty,
    onRegisterBarClass,
    onRegisterInstructor,
    onToggleLanguage,
    barStatsMap = {},
  } = input;

  const [homeRegionPill, setHomeRegionPill] = useState('national');
  const [homePickIndex, setHomePickIndex] = useState(0);

  const todaySocialPosterParties = useMemo(
    () => filterSocialPartyRows(
      (todayPosterPartiesForCount || []).filter((party) => String(party.poster_url || '').trim()),
    ),
    [todayPosterPartiesForCount],
  );

  const homeHeroSocialSource = useMemo(
    () => (todaySocialPosterParties.length > 0 ? todaySocialPosterParties : parties),
    [todaySocialPosterParties, parties],
  );

  const homeHeroSocialParties = useMemo(
    () => filterSocialPartyRows(
      (homeHeroSocialSource || []).filter((party) => String(party.poster_url || '').trim()),
    ),
    [homeHeroSocialSource],
  );

  const homeHeroSlides = useMemo(
    () => buildHomeDarkHeroSlides(
      homeHeroSocialParties,
      bootcamps,
      festivals,
      calendarTodayStr,
    ),
    [homeHeroSocialParties, bootcamps, festivals, calendarTodayStr],
  );

  const homeActiveHeroSlide = homeHeroSlides.length
    ? homeHeroSlides[homePickIndex % homeHeroSlides.length]
    : null;

  useEffect(() => {
    if (homePickIndex >= homeHeroSlides.length && homeHeroSlides.length > 0) {
      setHomePickIndex(0);
    }
  }, [homePickIndex, homeHeroSlides.length]);

  const homeFilteredTodayParties = useMemo(
    () => filterSocialPartyRows(
      filterTodayPartiesByPill(todayPosterPartiesForCount, homeRegionPill)
        .filter((party) => String(party.poster_url || '').trim()),
    ),
    [todayPosterPartiesForCount, homeRegionPill, filterTodayPartiesByPill],
  );

  const homeListRegionPillCounts = useMemo(() => ({
    national: todayPosterPartiesForCount.length,
    seoul: regionCounts.seoul,
    metro: regionCounts.metro,
    local: regionCounts.national,
  }), [todayPosterPartiesForCount.length, regionCounts]);

  const barTodayPartyCountByKey = useMemo(() => {
    const map = new Map<string, number>();
    todayPosterPartiesForCount.forEach((party) => {
      const key = normalizeVenueNameKey(
        resolvePartyVenueName(party) || party.locationName || party.location_name || '',
      );
      if (key) map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [todayPosterPartiesForCount]);

  const getBarTodayEventCount = useCallback((bar: HomeDarkBar) => {
    const key = normalizeVenueNameKey(bar?.name || '');
    return key ? (barTodayPartyCountByKey.get(key) || 0) : 0;
  }, [barTodayPartyCountByKey]);

  const homeListRegionBars = useMemo(() => {
    if (!selectedRegionTab) return [];
    const filteredBars = selectedRegionTab === socialBarRegionAll
      ? locations
      : locations.filter((bar) => bar.region === selectedRegionTab);
    if (userGeoCoords?.lat != null && userGeoCoords?.lng != null) {
      return sortByDistanceFromUser(filteredBars, userGeoCoords, (bar) => (
        parseVenueCoordinates(bar.latitude, bar.longitude)
      ));
    }
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
  }, [
    locations,
    selectedRegionTab,
    socialBarRegionAll,
    sortBarsForSocialBarTab,
    userGeoCoords,
  ]);

  const getBarCoverPhoto = useCallback((bar: HomeDarkBar) => {
    const resolved = resolveBarVenuePhoto(bar.name, bar.image_url) || bar.image_url;
    return resolved || '/logo.png';
  }, []);

  const getBarDistanceLabel = useCallback((bar: HomeDarkBar) => {
    if (!userGeoCoords) return null;
    const venue = parseVenueCoordinates(bar.latitude, bar.longitude);
    if (!venue) return null;
    const km = haversineKm(
      userGeoCoords.lat,
      userGeoCoords.lng,
      venue.lat,
      venue.lng,
    );
    return km != null ? formatDistanceLabel(km) : null;
  }, [userGeoCoords]);

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

  const openSocialTab = useCallback(() => {
    navigateHomeTab('social');
  }, []);

  const homeAgendaDayRange = useMemo(
    () => buildHomeAgendaDayRange({
      fromDateStr: calendarTodayStr,
      dayCount: HOME_LIST_DATE_STRIP_DAY_COUNT,
      parties,
      bootcamps,
      festivals,
    }),
    [calendarTodayStr, parties, bootcamps, festivals],
  );

  const homeUpcomingAgendaCounts = useMemo(
    () => summarizeAgendaCountsFromDays(homeAgendaDayRange),
    [homeAgendaDayRange],
  );

  const formatAgendaTimeMeta = useCallback((item: HomeTodayAgendaItem) => {
    const parts = [item.timeLabel, item.venue].filter(Boolean);
    return parts.join(' · ');
  }, []);

  const mapAgendaItemsToRows = useCallback((items: HomeTodayAgendaItem[]) => (
    items.map((item) => {
      const title = translateDynamicText(item.title, isEn);
      const meta = translateDynamicText(formatAgendaTimeMeta(item), isEn);
      const live = resolveAgendaLiveStatus(item, calendarTodayStr, locations, barStatsMap);
      const genreLabel = translateDynamicText(item.genreLabel, isEn);
      return {
        id: `${item.dateStr}-${item.id}`,
        kind: item.kind,
        kindLabel: isEn ? item.kindLabelEn : item.kindLabelKo,
        genreLabel,
        posterUrl: item.posterUrl,
        title,
        meta,
        liveLabel: live ? (isEn ? live.labelEn : live.labelKo) : null,
        liveCount: live?.liveCount ?? null,
        item,
      };
    })
  ), [barStatsMap, calendarTodayStr, formatAgendaTimeMeta, isEn, locations, translateDynamicText]);

  const homePartySearchItems = useMemo(
    () => buildHomePartySearchItems({
      fromDateStr: calendarTodayStr,
      parties,
      bootcamps,
      festivals,
    }),
    [calendarTodayStr, parties, bootcamps, festivals],
  );

  const openAgendaItem = useCallback((item: HomeTodayAgendaItem) => {
    if (item.kind === 'social') {
      openPartyWithAfterParty(item.raw as HomeDarkParty);
      return;
    }
    if (item.kind === 'bootcamp') {
      openBootcampPage();
      return;
    }
    if (item.kind === 'party') {
      openFestivalPartyPage();
      return;
    }
    openFestivalPage();
  }, [openBootcampPage, openFestivalPage, openFestivalPartyPage, openPartyWithAfterParty]);

  const openBarMap = useCallback(() => {
    pushOverlay('incheon');
  }, []);

  const getPartyTitle = useCallback(
    (party: HomeDarkParty) => translateDynamicText(formatPartyTitleDisplay(party.title), isEn),
    [isEn, translateDynamicText],
  );

  const getPartyVenue = useCallback(
    (party: HomeDarkParty) => translateDynamicText(
      resolvePartyVenueName(party) || party.locationName || party.location_name || '',
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

  const getHeroDateLabel = useCallback((slide: HomeDarkHeroSlide) => {
    const raw = slide.raw as { start_date?: string; date?: string };
    return formatHeroDateLabel(raw?.start_date || raw?.date, calendarTodayStr, isEn) || '';
  }, [calendarTodayStr, isEn]);

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

  const socialMenuCount = homeHeroSocialParties.length;

  const photoMenuItems = useMemo(
    () => buildHomeListPhotoMenuItems({
      isEn,
      socialParties: homeHeroSocialParties,
      bootcamps,
      festivals,
      calendarTodayStr,
      socialCount: socialMenuCount,
      bootcampCount,
      festivalCount,
      partyEventCount,
      onOpenSocial: openSocialTab,
      onOpenBootcamp: openBootcampPage,
      onOpenFestival: openFestivalPage,
      onOpenPartyEvents: openFestivalPartyPage,
    }),
    [
      isEn,
      homeHeroSocialParties,
      bootcamps,
      festivals,
      calendarTodayStr,
      socialMenuCount,
      bootcampCount,
      festivalCount,
      partyEventCount,
      openSocialTab,
      openBootcampPage,
      openFestivalPage,
      openFestivalPartyPage,
    ],
  );

  const moreMenuActions = useMemo(
    () => buildHomeListMoreActions({
      onRegisterParty,
      onRegisterBarClass,
      onRegisterInstructor,
      onToggleLanguage,
    }),
    [
      onRegisterParty,
      onRegisterBarClass,
      onRegisterInstructor,
      onToggleLanguage,
    ],
  );

  const gateProps: HomeListGateProps = {
    isEn,
    regionPills: [...HOME_DARK_REGION_PILLS],
    regionPill: homeRegionPill,
    regionPillCounts: homeListRegionPillCounts,
    onRegionPillChange: setHomeRegionPill,
    heroSlide: homeActiveHeroSlide,
    heroTitle: homeActiveHeroSlide ? getHeroTitle(homeActiveHeroSlide) : '',
    heroVenue: homeActiveHeroSlide ? getHeroVenue(homeActiveHeroSlide) : '',
    heroDateLabel: homeActiveHeroSlide ? getHeroDateLabel(homeActiveHeroSlide) : '',
    heroSlideCount: homeHeroSlides.length,
    pickIndex: homePickIndex,
    onPickIndexChange: setHomePickIndex,
    onHeroRotateNext: rotateHeroNext,
    onHeroOpen: () => homeActiveHeroSlide && openHeroSlide(homeActiveHeroSlide),
    todaySocialCount: homeHeroSocialParties.length,
    todayParties: homeFilteredTodayParties,
    getPartyTitle,
    getPartyVenue,
    onPartyClick: openPartyWithAfterParty,
    onViewAllSocial: openSocialTab,
    todayAgendaCount: homeUpcomingAgendaCounts.total,
    onAgendaItemClick: openAgendaItem,
    mapAgendaRows: mapAgendaItemsToRows,
    agendaParties: parties,
    agendaBootcamps: bootcamps,
    agendaFestivals: festivals,
    onOpenCalendar,
    calendarTodayStr,
    partySearchItems: homePartySearchItems,
    photoMenuItems,
    onOpenBarMap: openBarMap,
    barCount: locations.length,
    socialBarRegionTabs,
    selectedBarRegionTab: selectedRegionTab,
    barRegionCounts,
    geoRegionTab,
    regionBars: homeListRegionBars,
    locationsLoading,
    geoRegionPending: geoRegionStatus === 'pending',
    getBarCoverPhoto,
    getBarEventCount: getBarTodayEventCount,
    getBarDistanceLabel,
    sortByNearest: Boolean(userGeoCoords),
    onBarRegionTabChange: setSelectedRegionTab,
    onBarClick: openVenueDetail,
    onRequestLocation: requestUserLocation,
    onAdminTap: registerAdminPortalTap,
    onOpenWishlist,
    moreMenuActions,
  };

  return { gateProps };
}
