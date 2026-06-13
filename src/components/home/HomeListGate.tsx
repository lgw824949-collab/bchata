import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import PartyCard from '../PartyCard';
import HomeDarkHeader from './HomeDarkHeader';
import HomeDarkRegionPills from './HomeDarkRegionPills';
import HomeDarkMoreSheet from './HomeDarkMoreSheet';
import { HOME_LIST_TAGLINE_EN, HOME_LIST_TAGLINE_KO } from './constants';
import type { HomeDarkMoreAction, HomeDarkParty, HomeDarkRegionPill } from './types';

const HOME_LIST_PREVIEW = 4;

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
  barCount: number;
  onAdminTap: () => void;
  onSearch: () => void;
  onOpenWishlist: () => void;
  moreActions: HomeDarkMoreAction[];
};

type NavChipProps = {
  label: string;
  count: number;
  onClick: () => void;
};

function HomeListNavChip({ label, count, onClick }: NavChipProps) {
  if (count <= 0) return null;
  return (
    <button type="button" className="home-list-gate__nav-chip" onClick={onClick}>
      <span className="home-list-gate__nav-chip-label">{label}</span>
      <span className="home-list-gate__nav-chip-count">{count}</span>
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

  const previewParties = useMemo(
    () => todayParties.slice(0, HOME_LIST_PREVIEW),
    [todayParties],
  );
  const [featuredParty, ...restParties] = previewParties;
  const hasMoreParties = todayParties.length > previewParties.length;

  const partyItem = (party: HomeDarkParty) => ({
    ...party,
    locationName: party.locationName || party.location_name,
  });

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
          <div className="home-list-gate__feed">
            {featuredParty ? (
              <div className="home-list-gate__featured">
                <PartyCard
                  key={featuredParty.id}
                  item={partyItem(featuredParty)}
                  variant="stack"
                  onSelect={onPartyClick}
                  wishlistParties={wishlistPartyIds}
                  onToggleWishlist={onToggleWishlist}
                />
              </div>
            ) : null}

            {restParties.length > 0 ? (
              <div className="home-list-gate__list">
                {restParties.map((party) => (
                  <PartyCard
                    key={party.id}
                    item={partyItem(party)}
                    variant="row"
                    onSelect={onPartyClick}
                    wishlistParties={wishlistPartyIds}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </div>
            ) : null}

            {hasMoreParties ? (
              <button type="button" className="home-list-gate__more-parties" onClick={onViewAllSocial}>
                {isEn
                  ? `${todayParties.length} parties tonight — see all`
                  : `오늘 ${todayParties.length}건 · 전체 보기`}
                <ChevronRight size={16} aria-hidden />
              </button>
            ) : null}
          </div>
        )}
      </section>

      <nav className="home-list-gate__nav-chips" aria-label={isEn ? 'More categories' : '밤빠 더보기'}>
        <HomeListNavChip
          label={isEn ? 'Bootcamp' : '부트캠프'}
          count={bootcampCount}
          onClick={onOpenBootcamp}
        />
        <HomeListNavChip
          label={isEn ? 'Festival' : '페스티벌'}
          count={festivalCount}
          onClick={onOpenFestival}
        />
        <HomeListNavChip
          label={isEn ? 'Party' : '파티'}
          count={partyEventCount}
          onClick={onOpenPartyEvents}
        />
        <HomeListNavChip
          label={isEn ? 'Instructors' : '강사'}
          count={instructorCount}
          onClick={onOpenInstructors}
        />
        <HomeListNavChip
          label={isEn ? 'BAR' : 'BAR'}
          count={barCount}
          onClick={onOpenBarMap}
        />
      </nav>

      <HomeDarkMoreSheet
        open={moreOpen}
        isEn={isEn}
        actions={moreActions}
        onClose={() => setMoreOpen(false)}
      />
    </div>
  );
}
