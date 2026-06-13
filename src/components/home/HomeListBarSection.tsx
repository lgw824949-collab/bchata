import React from 'react';
import { ChevronRight } from 'lucide-react';
import { imgFallbackHandler } from '../../constants/imageAssets';
import { formatBarDistrictLabel } from './homeDarkUtils';
import type { HomeDarkBar } from './types';

const BAR_LOGO_FALLBACK = '/logo.png';

type HomeListBarSectionProps = {
  isEn: boolean;
  regionTabs: string[];
  selectedTab: string | null;
  barCounts: Record<string, number>;
  geoRegionTab: string | null;
  bars: HomeDarkBar[];
  loading: boolean;
  geoPending: boolean;
  sortByNearest: boolean;
  getCoverPhoto: (bar: HomeDarkBar) => string | null;
  getEventCount: (bar: HomeDarkBar) => number;
  getDistanceLabel: (bar: HomeDarkBar) => string | null;
  onTabChange: (tab: string) => void;
  onBarClick: (bar: HomeDarkBar) => void;
  onViewMap: () => void;
  onRequestLocation: () => void;
};

export default function HomeListBarSection({
  isEn,
  regionTabs,
  selectedTab,
  barCounts,
  geoRegionTab,
  bars,
  loading,
  geoPending,
  sortByNearest,
  getCoverPhoto,
  getEventCount,
  getDistanceLabel,
  onTabChange,
  onBarClick,
  onViewMap,
  onRequestLocation,
}: HomeListBarSectionProps) {
  if (regionTabs.length === 0 && !loading) return null;

  const nearestBar = sortByNearest && bars.length > 0 ? bars[0] : null;
  const nearestDistance = nearestBar ? getDistanceLabel(nearestBar) : null;
  const nearestName = nearestBar?.name || '';

  const statusText = geoPending
    ? (isEn ? 'Finding your area…' : '현재 위치 기준 지역을 확인하는 중...')
    : loading
      ? (isEn ? 'Loading BAR list…' : '전국 BAR 정보를 불러오는 중...')
      : !selectedTab
        ? (isEn ? 'Select a region.' : '지역을 선택해 주세요.')
        : bars.length === 0
          ? (isEn ? 'No spots in this area yet.' : '이 지역 장소가 아직 없어요.')
          : null;

  return (
    <section className="home-list-gate__panel home-list-gate__bar-panel" aria-label={isEn ? 'Venue BAR' : '업체 BAR'}>
      <div className="home-list-gate__panel-head">
        <div className="home-list-gate__panel-head-copy">
          <h2 className="home-list-gate__section-title">
            {isEn ? 'Venue BAR' : '업체 BAR'}
            {selectedTab && barCounts[selectedTab] != null ? (
              <span className="home-list-gate__section-count">{barCounts[selectedTab]}</span>
            ) : null}
          </h2>
          {sortByNearest && selectedTab ? (
            <p className="home-list-gate__bar-subtitle">
              {nearestDistance && nearestName
                ? (isEn
                  ? `${selectedTab} · nearest ${nearestName} ${nearestDistance}`
                  : `${selectedTab} · ${nearestName} ${nearestDistance}`)
                : (isEn
                  ? `${selectedTab} · sorted by distance`
                  : `${selectedTab} · 내 위치 기준 가까운 순`)}
            </p>
          ) : (
            <p className="home-list-gate__bar-subtitle home-list-gate__bar-subtitle--muted">
              {isEn ? 'Find a BAR near you' : '내 주변 BAR 찾기'}
            </p>
          )}
        </div>
        <button type="button" className="home-list-gate__section-action" onClick={onViewMap}>
          {isEn ? 'Map' : '지도'}
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>

      {!sortByNearest && !geoPending && !loading ? (
        <div className="home-list-gate__bar-hint-row">
          <p className="home-list-gate__bar-hint home-list-gate__bar-hint--muted">
            {isEn ? 'Allow location to sort by nearest BAR' : '위치 허용하면 가까운 BAR부터 보여드려요'}
          </p>
          <button type="button" className="home-list-gate__bar-locate-btn" onClick={onRequestLocation}>
            {isEn ? 'Allow' : '위치 허용'}
          </button>
        </div>
      ) : null}

      {regionTabs.length > 0 ? (
        <div
          className="home-list-gate__bar-tabs"
          role="tablist"
          aria-label={isEn ? 'BAR region' : 'BAR 지역'}
        >
          {regionTabs.map((tab) => {
            const isSelected = selectedTab === tab;
            const isMyRegion = Boolean(geoRegionTab && tab === geoRegionTab);
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`home-list-gate__bar-tab${isSelected ? ' is-active' : ''}${isMyRegion ? ' is-my-region' : ''}`}
                onClick={() => onTabChange(tab)}
              >
                <span className="home-list-gate__bar-tab-label">{tab}</span>
                <span className="home-list-gate__bar-tab-count">{barCounts[tab] ?? 0}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {statusText ? (
        <p className="home-list-gate__bar-status">{statusText}</p>
      ) : (
        <div className="home-list-gate__bar-scroll-wrap home-list-gate__bar-scroll-wrap--peek">
          <p className="home-list-gate__bar-scroll-hint" aria-hidden>
            {isEn ? 'Swipe for more' : '좌우로 더보기'}
          </p>
          <div className="home-list-gate__bar-scroll" role="list">
            {bars.map((bar, index) => {
              const coverSrc = getCoverPhoto(bar) || BAR_LOGO_FALLBACK;
              const eventCount = getEventCount(bar);
              const distanceLabel = getDistanceLabel(bar);
              const isNearest = sortByNearest && index === 0 && Boolean(distanceLabel);
              const district = formatBarDistrictLabel(bar);
              const partyLine = eventCount > 0
                ? (isEn ? `${eventCount} tonight` : `오늘 ${eventCount}건`)
                : (isEn ? 'No party' : '오늘 없음');
              const restMeta = [partyLine, district].filter(Boolean).join(' · ');

              return (
                <button
                  key={bar.id}
                  type="button"
                  role="listitem"
                  className={`home-list-gate__bar-card${isNearest ? ' is-nearest' : ''}`}
                  onClick={() => onBarClick(bar)}
                >
                  {isNearest ? (
                    <span className="home-list-gate__bar-nearest-badge">
                      {isEn ? 'Nearest' : '가장 가까움'}
                    </span>
                  ) : null}
                  <span className="home-list-gate__bar-thumb">
                    <img
                      src={coverSrc}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={imgFallbackHandler(BAR_LOGO_FALLBACK)}
                    />
                  </span>
                  <span className="home-list-gate__bar-name">{bar.name || (isEn ? 'Unnamed' : '이름 없음')}</span>
                  {distanceLabel || restMeta ? (
                    <span className={`home-list-gate__bar-compact${eventCount > 0 ? ' is-live' : ''}`}>
                      {distanceLabel ? (
                        <span className="home-list-gate__bar-compact-dist">{distanceLabel}</span>
                      ) : null}
                      {distanceLabel && restMeta ? ' · ' : null}
                      {restMeta}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
