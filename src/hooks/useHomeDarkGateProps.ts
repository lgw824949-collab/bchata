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
import { HOME_DARK_REGION_PILLS } from '../components/home/constants';
import type { HomeDarkGateProps } from '../components/home/HomeDarkGate';
import type { HomeDarkBar, HomeDarkParty } from '../components/home/types';

export type UseHomeDarkGatePropsInput = {
  isEn: boolean;
  translateDynamicText: (text: string, isEn: boolean) => string;
  todayPosterPartiesForCount: HomeDarkParty[];
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
  sortBarsForSocialBarTab: (bars: HomeDarkBar[], regionTab: string) => HomeDarkBar[];
  openPartyWithAfterParty: (party: HomeDarkParty) => void;
  toggleWishlistParty: (e: React.MouseEvent, party: HomeDarkParty) => void;
  openVenueDetail: (bar: HomeDarkBar) => void;
  registerAdminPortalTap: () => void;
  filterTodayPartiesByPill: (parties: HomeDarkParty[], pillId: string) => HomeDarkParty[];
};

/** Home.tsx — fetch·상태 유지, HomeDarkGate에 넘길 props + 네비 콜백 생성 */
export function useHomeDarkGateProps(input: UseHomeDarkGatePropsInput) {
  const {
    isEn,
    translateDynamicText,
    todayPosterPartiesForCount,
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
    toggleWishlistParty,
    openVenueDetail,
    registerAdminPortalTap,
    filterTodayPartiesByPill,
  } = input;

  const [homeRegionPill, setHomeRegionPill] = useState('all');
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

  const homeTodayPickParty = homeFilteredTodayParties.length
    ? homeFilteredTodayParties[homePickIndex % homeFilteredTodayParties.length]
    : null;

  useEffect(() => {
    setHomePickIndex(0);
  }, [homeRegionPill]);

  const homeDarkRegionPillCounts = useMemo(() => ({
    all: todayPosterPartiesForCount.length,
    national: regionCounts.national,
    seoul: regionCounts.seoul,
    metro: regionCounts.metro,
  }), [todayPosterPartiesForCount.length, regionCounts]);

  const homeDarkRegionBars = useMemo(() => {
    if (!selectedRegionTab) return [];
    const filteredBars = selectedRegionTab === socialBarRegionAll
      ? locations
      : locations.filter((bar) => bar.region === selectedRegionTab);
    return sortBarsForSocialBarTab(filteredBars, selectedRegionTab);
  }, [locations, selectedRegionTab, socialBarRegionAll, sortBarsForSocialBarTab]);

  const navHandlers = useMemo(() => ({
    /** 하단 네비 · 전체보기 — /?tab=social */
    openPartyTab: () => navigateHomeTab('social'),
    /** 하단 네비 · 강사 — /instructors */
    openInstructors: () => historyNavigate('/instructors', { homeTab: null }),
    /** 하단 네비 · BAR — incheon 오버레이 */
    openBarOverlay: () => pushOverlay('incheon'),
    /** 하단 네비 · 마이 — partner 오버레이 */
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

  const gateProps: HomeDarkGateProps = {
    isEn,
    regionPills: [...HOME_DARK_REGION_PILLS],
    regionPill: homeRegionPill,
    regionPillCounts: homeDarkRegionPillCounts,
    onRegionPillChange: setHomeRegionPill,
    todayPickParty: homeTodayPickParty,
    todayPickTitle: homeTodayPickParty ? getPartyTitle(homeTodayPickParty) : '',
    todayPickVenue: homeTodayPickParty ? getPartyVenue(homeTodayPickParty) : '',
    pickIndex: homePickIndex,
    onPickIndexChange: setHomePickIndex,
    todayParties: homeFilteredTodayParties,
    wishlistPartyIds: wishlistParties,
    getPartyTitle,
    getPartyVenue,
    onPartyClick: openPartyWithAfterParty,
    onToggleWishlist: toggleWishlistParty,
    onViewAllParties: navHandlers.openPartyTab,
    instructors: hotInstructors,
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
    getBarCoverPhoto: (bar) => bar.image_url || resolveBarVenuePhoto(bar.name, bar.image_url),
    getBarEventCount: getBarTodayEventCount,
    onBarRegionTabChange: setSelectedRegionTab,
    onBarClick: openVenueDetail,
    onViewMap: navHandlers.openBarOverlay,
    onAdminTap: registerAdminPortalTap,
    onSearch: navHandlers.openPartyTab,
  };

  return { gateProps, navHandlers };
}
