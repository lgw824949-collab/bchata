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

type MoreRowProps = {
  emoji: string;
  label: string;
  sub?: string;
  count: number;
  onClick: () => void;
  isEn: boolean;
};

function HomeListMoreRow({ emoji, label, sub, count, onClick, isEn }: MoreRowProps) {
  if (count <= 0) return null;
  return (
    <button type="button" className="home-list-gate__more-row" onClick={onClick}>
      <span className="home-list-gate__more-row-emoji" aria-hidden>{emoji}</span>
      <span className="home-list-gate__more-row-text">
        <span className="home-list-gate__more-row-label">{label}</span>
        {sub ? <span className="home-list-gate__more-row-sub">{sub}</span> : null}
      </span>
      <span className="home-list-gate__more-row-meta">
        <span className="home-list-gate__more-row-count">{count}</span>
        <ChevronRight size={16} aria-hidden />
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

      <HomeDarkRegionPills
        pills={regionPills}
        activeId={regionPill}
        counts={regionPillCounts}
        isEn={isEn}
        onChange={onRegionPillChange}
      />

      <section className="home-list-gate__section" aria-label={isEn ? "Today's social" : '오늘소셜'}>
        <div className="home-list-gate__section-head">
          <div>
            <h2 className="home-list-gate__section-title">
              {isEn ? "Today's social" : '오늘소셜'}
            </h2>
            <p className="home-list-gate__section-sub">
              {isEn ? 'Parties tonight — scroll to browse' : '오늘 밤 갈 곳 — 아래로 스크롤'}
            </p>
          </div>
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
      </section>

      <section className="home-list-gate__section home-list-gate__section--secondary" aria-label={isEn ? 'More categories' : '더보기'}>
        <h2 className="home-list-gate__section-title home-list-gate__section-title--sm">
          {isEn ? 'More tonight' : '밤빠 더보기'}
        </h2>
        <div className="home-list-gate__more-list">
          <HomeListMoreRow
            emoji="🏕️"
            label={isEn ? 'Bootcamp' : '부트캠프'}
            sub={isEn ? 'Workshops & camps' : '워크샵 · 캠프'}
            count={bootcampCount}
            onClick={onOpenBootcamp}
            isEn={isEn}
          />
          <HomeListMoreRow
            emoji="🎪"
            label={isEn ? 'Festival' : '페스티벌'}
            sub={isEn ? 'Festivals & MT' : '페스티벌 · MT'}
            count={festivalCount}
            onClick={onOpenFestival}
            isEn={isEn}
          />
          <HomeListMoreRow
            emoji="🥳"
            label={isEn ? 'Party events' : '파티 행사'}
            sub={isEn ? 'Large events' : '대형 행사'}
            count={partyEventCount}
            onClick={onOpenPartyEvents}
            isEn={isEn}
          />
          <HomeListMoreRow
            emoji="⭐"
            label={isEn ? 'Instructors' : '강사'}
            sub={isEn ? 'Find a pro' : '강사 찾기'}
            count={instructorCount}
            onClick={onOpenInstructors}
            isEn={isEn}
          />
          <HomeListMoreRow
            emoji="🌴"
            label={isEn ? 'Social BAR' : '소셜 BAR'}
            sub={isEn ? 'Map & venues' : '지도 · BAR'}
            count={barCount}
            onClick={onOpenBarMap}
            isEn={isEn}
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
