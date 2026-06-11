import React from 'react';
import { motion } from 'framer-motion';
import HomeDarkSectionHeader from './HomeDarkSectionHeader';
import HomeDarkBarCard from './HomeDarkBarCard';

type BarLike = {
  id: string | number;
  name?: string;
  image_url?: string;
  address?: string;
  region?: string;
};

type HomeDarkSocialBarProps = {
  isEn: boolean;
  regionTabs: string[];
  selectedTab: string | null;
  barCounts: Record<string, number>;
  geoRegionTab: string | null;
  bars: BarLike[];
  loading: boolean;
  geoPending: boolean;
  getCoverPhoto: (bar: BarLike) => string | null;
  getEventCount: (bar: BarLike) => number;
  onTabChange: (tab: string) => void;
  onBarClick: (bar: BarLike) => void;
  onViewMap: () => void;
};

export default function HomeDarkSocialBar({
  isEn,
  regionTabs,
  selectedTab,
  barCounts,
  geoRegionTab,
  bars,
  loading,
  geoPending,
  getCoverPhoto,
  getEventCount,
  onTabChange,
  onBarClick,
  onViewMap,
}: HomeDarkSocialBarProps) {
  return (
    <section className="home-dark-section home-social-bar-panel home-social-bar-panel--gate" aria-label="Social BAR">
      <HomeDarkSectionHeader
        title={isEn ? '🌴 Social BAR' : '🌴 소셜 BAR'}
        subtitle={isEn ? 'Where the Latin night begins' : '라틴의 밤이 시작되는 곳'}
        linkLabel={isEn ? 'Map' : '지도보기'}
        onLinkClick={onViewMap}
        linkVariant="map"
      />
      <div className="home-dark-region-pills home-dark-region-pills--compact" role="tablist" aria-label={isEn ? 'BAR region' : 'BAR 지역'}>
        {regionTabs.map((tab) => {
          const isSelected = selectedTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`home-dark-region-pill${isSelected ? ' is-active' : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {tab}
              <span className="home-dark-region-pill__count">{barCounts[tab] ?? 0}</span>
            </button>
          );
        })}
      </div>
      <div className="home-social-bar-outer">
        {loading || geoPending ? (
          <p className="home-dark-social-bar__status">
            {geoPending ? '현재 위치 기준 지역을 확인하는 중...' : '전국 BAR 정보를 정렬하는 중...'}
          </p>
        ) : !selectedTab ? (
          <p className="home-dark-social-bar__status">지역을 선택해 주세요.</p>
        ) : bars.length === 0 ? (
          <p className="home-dark-social-bar__status">
            {isEn ? 'No spots in this area yet.' : '이 지역 장소가 아직 없어요.'}
          </p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={selectedTab}>
            <div className={`home-dark-scroll-peek${bars.length >= 4 ? ' home-dark-scroll-peek--active' : ''}`}>
              <div className="home-dark-hscroll scrollbar-hide">
                <div className="home-dark-hscroll__track home-dark-hscroll__track--bar">
                  {bars.map((bar) => (
                    <HomeDarkBarCard
                      key={bar.id}
                      bar={bar}
                      coverPhoto={getCoverPhoto(bar)}
                      eventCount={getEventCount(bar)}
                      isMyGeoRegion={Boolean(geoRegionTab && bar.region === geoRegionTab)}
                      isEn={isEn}
                      onClick={() => onBarClick(bar)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
