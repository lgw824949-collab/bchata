import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import PartyCard from '../PartyCard';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkRegionPills from './HomeDarkRegionPills';
import HomeDarkMoreSheet from './HomeDarkMoreSheet';
import { HOME_DARK_HEADER_TAGLINE } from './constants';
import type { HomeDarkMoreAction, HomeDarkParty, HomeDarkRegionPill } from './types';

export type HomeListGateProps = {
  isEn: boolean;
  regionPills: HomeDarkRegionPill[];
  regionPill: string;
  regionPillCounts: Record<string, number>;
  onRegionPillChange: (id: string) => void;
  todayParties: HomeDarkParty[];
  wishlistPartyIds: Array<string | number>;
  onPartyClick: (party: HomeDarkParty) => void;
  onToggleWishlist: (e: React.MouseEvent, party: HomeDarkParty) => void;
  onViewAllSocial: () => void;
  bootcampCount: number;
  festivalCount: number;
  partyEventCount: number;
  instructorCount: number;
  onOpenBootcamp: () => void;
  onOpenFestival: () => void;
  onOpenPartyEvents: () => void;
  onOpenInstructors: () => void;
  onOpenBarMap: () => void;
  socialBarRegionTabs: string[];
  selectedBarRegionTab: string | null;
  barRegionCounts: Record<string, number>;
  geoRegionTab: string | null;
  barCount: number;
  locationsLoading: boolean;
  geoRegionPending: boolean;
  onBarRegionTabChange: (tab: string) => void;
  onBarClick: (bar: { id?: string | number; name?: string }) => void;
  onAdminTap: () => void;
  onSearch: () => void;
  onOpenWishlist: () => void;
  moreActions: HomeDarkMoreAction[];
  getPartyVenue: (party: HomeDarkParty) => string;
};

type CatTileProps = {
  label: string;
  count: number;
  onClick: () => void;
};

function HomeListCatTile({ label, count, onClick }: CatTileProps) {
  if (count <= 0) return null;
  return (
    <button type="button" className="home-list-gate__cat-tile" onClick={onClick}>
      <span className="home-list-gate__cat-tile-label">{label}</span>
      <span className="home-list-gate__cat-tile-meta">
        <span className="home-list-gate__cat-tile-count">{count}</span>
        <ChevronRight size={14} aria-hidden />
      </span>
    </button>
  );
}

export default function HomeListGate({
  isEn,
  regionPills,
  regionPill,
  regionPillCounts,
  onRegionPillChange,
  todayParties,
  wishlistPartyIds,
  onPartyClick,
  onToggleWishlist,
  onViewAllSocial,
  bootcampCount,
  festivalCount,
  partyEventCount,
  instructorCount,
  onOpenBootcamp,
  onOpenFestival,
  onOpenPartyEvents,
  onOpenInstructors,
  onOpenBarMap,
  barCount,
  onAdminTap,
  onSearch,
  onOpenWishlist,
  moreActions,
}: HomeListGateProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="home-list-gate">
      <HomeDarkHeader
        tagline={HOME_DARK_HEADER_TAGLINE}
        onAdminTap={onAdminTap}
        onSearch={onSearch}
        onWishlist={onOpenWishlist}
        onMore={() => setMoreOpen(true)}
      />

      <div className="home-list-gate__toolbar">
        <HomeDarkRegionPills
          pills={regionPills}
          activeId={regionPill}
          counts={regionPillCounts}
          isEn={isEn}
          onChange={onRegionPillChange}
        />
      </div>

      <section className="home-list-gate__panel" aria-label={isEn ? "Today's home feed" : '오늘밤빠 홈'}>
        <div className="home-list-gate__panel-head">
          <h2 className="home-list-gate__section-title">
            {isEn ? "Today's social" : '오늘소셜'}
          </h2>
          <button type="button" className="home-list-gate__section-action" onClick={onViewAllSocial}>
            {isEn ? 'Calendar' : '달력'}
            <ChevronRight size={14} aria-hidden />
          </button>
        </div>

        {todayParties.length === 0 ? (
          <div className="home-list-gate__empty">
            {isEn ? 'No social parties in this region today.' : '이 지역에 오늘 등록된 소셜이 없습니다.'}
          </div>
        ) : (
          <div className="home-list-gate__list">
            {todayParties.map((party) => (
              <PartyCard
                key={party.id}
                item={{
                  ...party,
                  locationName: party.locationName || party.location_name,
                }}
                variant="row"
                onSelect={onPartyClick}
                wishlistParties={wishlistPartyIds}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}

        <div className="home-list-gate__panel-divider" aria-hidden />

        <div className="home-list-gate__panel-head home-list-gate__panel-head--sub">
          <h2 className="home-list-gate__section-title home-list-gate__section-title--sm">
            {isEn ? 'More tonight' : '밤빠 더보기'}
          </h2>
        </div>

        <div className="home-list-gate__cat-grid">
          <HomeListCatTile
            label={isEn ? 'Bootcamp' : '부트캠프'}
            count={bootcampCount}
            onClick={onOpenBootcamp}
          />
          <HomeListCatTile
            label={isEn ? 'Festival' : '페스티벌'}
            count={festivalCount}
            onClick={onOpenFestival}
          />
          <HomeListCatTile
            label={isEn ? 'Party events' : '파티 행사'}
            count={partyEventCount}
            onClick={onOpenPartyEvents}
          />
          <HomeListCatTile
            label={isEn ? 'Instructors' : '강사'}
            count={instructorCount}
            onClick={onOpenInstructors}
          />
          <HomeListCatTile
            label={isEn ? 'Social BAR' : '소셜 BAR'}
            count={barCount}
            onClick={onOpenBarMap}
          />
        </div>
      </section>

      <HomeDarkMoreSheet
        open={moreOpen}
        isEn={isEn}
        actions={moreActions}
        onClose={() => setMoreOpen(false)}
      />
    </div>
  );
}
