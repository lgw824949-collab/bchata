import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { imgFallbackHandler } from '../../constants/imageAssets';
import { formatBarDistrictLabel } from './homeDarkUtils';
import type { HomeDarkBar } from './types';

const BAR_REGION_ALL = '전체';

function orderBarRegionTabs(tabs: string[], geoTab: string | null): string[] {
  const all = tabs.filter((tab) => tab === BAR_REGION_ALL);
  const rest = tabs.filter((tab) => tab !== BAR_REGION_ALL);
  const geo = geoTab && rest.includes(geoTab) ? geoTab : null;
  const others = rest.filter((tab) => tab !== geoTab);
  return [...all, ...(geo ? [geo] : []), ...others];
}

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
  getEventCount: _getEventCount,
  getDistanceLabel,
  onTabChange,
  onBarClick,
  onViewMap,
  onRequestLocation,
}: HomeListBarSectionProps) {
  if (regionTabs.length === 0 && !loading) return null;

  const orderedTabs = useMemo(
    () => orderBarRegionTabs(regionTabs, geoRegionTab),
    [regionTabs, geoRegionTab],
  );

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
    <section className="home-list-gate__panel home-list-gate__bar-panel" aria-label={isEn ? 'BAR venues' : 'BAR'}>
      <div className="home-list-gate__panel-head home-list-gate__bar-panel-head">
        <div className="home-list-gate__bar-panel-title-wrap">
          <h2 className="home-list-gate__section-title">
            BAR
            {selectedTab && barCounts[selectedTab] != null ? (
              <span
                className="home-list-gate__section-count home-list-gate__section-count--muted"
                aria-label={isEn ? `${barCounts[selectedTab]} venues` : `${barCounts[selectedTab]}곳`}
              >
                {barCounts[selectedTab]}
                <span className="home-list-gate__count-unit">{isEn ? '' : '곳'}</span>
              </span>
            ) : null}
          </h2>
          <p className="home-list-gate__bar-panel-caption">
            {isEn ? 'Venues in selected region' : '선택 지역 BAR 수'}
          </p>
        </div>
        <div className="home-list-gate__bar-panel-actions">
          {!sortByNearest && !geoPending && !loading ? (
            <button
              type="button"
              className="home-list-gate__bar-locate-link"
              onClick={onRequestLocation}
            >
              {isEn ? 'Sort by distance' : '내 위치로 정렬'}
            </button>
          ) : null}
          <button
            type="button"
            className="home-list-gate__bar-map-btn"
            onClick={onViewMap}
            aria-label={isEn ? 'Open map' : '지도 열기'}
          >
            <MapPin size={18} aria-hidden />
          </button>
        </div>
      </div>

      {orderedTabs.length > 0 ? (
        <div className="home-list-gate__bar-tabs-wrap">
          <div
            className="home-list-gate__bar-tabs"
            role="tablist"
            aria-label={isEn ? 'BAR region' : 'BAR 지역'}
          >
            {orderedTabs.map((tab) => {
              const isSelected = selectedTab === tab;
              const isMyRegion = Boolean(geoRegionTab && tab === geoRegionTab);
              const isAll = tab === BAR_REGION_ALL;
              const count = barCounts[tab] ?? 0;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`home-list-gate__bar-tab${isSelected ? ' is-active' : ''}${isMyRegion ? ' is-my-region' : ''}${isAll ? ' is-all' : ''}`}
                  onClick={() => onTabChange(tab)}
                >
                  <span className="home-list-gate__bar-tab-label">
                    {isMyRegion && !isSelected ? (isEn ? 'Near me · ' : '내 주변 · ') : ''}
                    {tab}
                  </span>
                  <span className="home-list-gate__bar-tab-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {statusText ? (
        <p className="home-list-gate__bar-status">{statusText}</p>
      ) : (
        <div className="home-list-gate__bar-scroll-wrap home-list-gate__bar-scroll-wrap--peek">
          <div className="home-list-gate__bar-scroll" role="list">
            {bars.map((bar, index) => {
              const coverSrc = getCoverPhoto(bar) || BAR_LOGO_FALLBACK;
              const distanceLabel = getDistanceLabel(bar);
              const districtLabel = !distanceLabel ? formatBarDistrictLabel(bar) : null;
              const isNearest = sortByNearest && index === 0 && Boolean(distanceLabel);

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
                      {isEn ? 'Near' : '가까움'}
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
                    <span className="home-list-gate__bar-meta-dist">{distanceLabel}</span>
                  ) : districtLabel ? (
                    <span className="home-list-gate__bar-meta-district">{districtLabel}</span>
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
