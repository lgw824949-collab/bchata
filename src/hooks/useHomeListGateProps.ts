import { useCallback, useMemo, useState } from 'react';
import { filterSocialPartyRows } from '../lib/postKind';
import { resolvePartyVenueName } from '../lib/partiesQuery';
import { normalizeVenueNameKey } from '../lib/venueDedupe';
import { resolveBarVenuePhoto } from '../lib/barVenuePhotos';
import { haversineKm, formatDistanceLabel, sortByDistanceFromUser } from '../lib/geoDistance';
import { navigate as historyNavigate, navigateHomeTab, pushOverlay } from '../lib/appHistory';
import { buildHomeDarkMoreActions } from '../components/home/buildHomeDarkMoreActions';
import { formatPartyTitleDisplay } from '../lib/partyTitleDisplay';
import { HOME_DARK_MIN_BAR_ITEMS, HOME_DARK_REGION_PILLS } from '../components/home/constants';
import type { HomeDarkBar, HomeDarkParty } from '../components/home/types';
import type { HomeListGateProps } from '../components/home/HomeListGate';
import type { UseHomeDarkGatePropsInput } from './useHomeDarkGateProps';

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
    todayPosterPartiesForCount,
    bootcamps,
    festivals,
    calendarTodayStr,
    regionCounts,
    hotInstructors,
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
    let sorted = sortBarsForSocialBarTab(filteredBars, selectedRegionTab);
    if (userGeoCoords?.lat != null && userGeoCoords?.lng != null) {
      sorted = sortByDistanceFromUser(sorted, userGeoCoords, (bar) => {
        const lat = Number(bar.latitude);
        const lng = Number(bar.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
      });
    }
    if (
      sorted.length >= HOME_DARK_MIN_BAR_ITEMS
      || selectedRegionTab === socialBarRegionAll
      || userGeoCoords
    ) {
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
    const km = haversineKm(
      userGeoCoords.lat,
      userGeoCoords.lng,
      Number(bar.latitude),
      Number(bar.longitude),
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

  const openSocialTab = useCallback(() => {
    navigateHomeTab('social');
  }, []);

  const openInstructors = useCallback(() => {
    historyNavigate('/instructors', { homeTab: null });
  }, []);

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

  const gateProps: HomeListGateProps = {
    isEn,
    regionPills: [...HOME_DARK_REGION_PILLS],
    regionPill: homeRegionPill,
    regionPillCounts: homeListRegionPillCounts,
    onRegionPillChange: setHomeRegionPill,
    todayParties: homeFilteredTodayParties,
    getPartyTitle,
    getPartyVenue,
    onPartyClick: openPartyWithAfterParty,
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
    onSearch: openSocialTab,
    onOpenWishlist,
    moreActions,
  };

  return { gateProps };
}
