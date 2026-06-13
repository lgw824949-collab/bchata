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
}: HomeListBarSectionProps) {
  if (regionTabs.length === 0 && !loading) return null;

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
        <h2 className="home-list-gate__section-title">
          {isEn ? 'Venue BAR' : '업체 BAR'}
          {selectedTab && barCounts[selectedTab] != null ? (
            <span className="home-list-gate__section-count">{barCounts[selectedTab]}</span>
          ) : null}
        </h2>
        <button type="button" className="home-list-gate__section-action" onClick={onViewMap}>
          {isEn ? 'Map' : '지도'}
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>

      {sortByNearest ? (
        <p className="home-list-gate__bar-hint">
          {isEn ? 'Sorted by distance from you' : '내 위치 기준 가까운 순'}
        </p>
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
        <div className="home-list-gate__bar-scroll-wrap">
          <div className="home-list-gate__bar-scroll" role="list">
            {bars.map((bar, index) => {
              const coverSrc = getCoverPhoto(bar) || BAR_LOGO_FALLBACK;
              const eventCount = getEventCount(bar);
              const distanceLabel = getDistanceLabel(bar);
              const isNearest = sortByNearest && index === 0 && Boolean(distanceLabel);
              const isMyRegion = Boolean(geoRegionTab && bar.region === geoRegionTab);

              return (
                <button
                  key={bar.id}
                  type="button"
                  role="listitem"
                  className={`home-list-gate__bar-card${isNearest ? ' is-nearest' : ''}${isMyRegion ? ' is-my-region' : ''}`}
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
                  {distanceLabel ? (
                    <span className="home-list-gate__bar-distance">{distanceLabel}</span>
                  ) : null}
                  <span className={`home-list-gate__bar-meta${eventCount > 0 ? ' is-live' : ''}`}>
                    {eventCount > 0
                      ? (isEn ? `Tonight ${eventCount}` : `오늘 ${eventCount}건`)
                      : (isEn ? 'No party tonight' : '오늘 파티 없음')}
                  </span>
                  <span className="home-list-gate__bar-district">{formatBarDistrictLabel(bar)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
