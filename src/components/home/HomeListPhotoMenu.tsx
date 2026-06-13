import React from 'react';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import { homeListPhotoMenuAriaLabel, type HomeListPhotoMenuItem } from '../../lib/homeListPhotoMenu';

type HomeListPhotoMenuProps = {
  isEn: boolean;
  items: HomeListPhotoMenuItem[];
};

export default function HomeListPhotoMenu({ isEn, items }: HomeListPhotoMenuProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="home-list-gate__panel home-list-gate__quick-panel"
      aria-label={isEn ? 'Explore categories' : '카테고리 탐색'}
    >
      <div className="home-list-gate__quick-panel-head">
        <h2 className="home-list-gate__section-title home-list-gate__quick-panel-title">
          {isEn ? 'Explore' : '탐색'}
        </h2>
        <p className="home-list-gate__quick-panel-caption">
          {isEn ? 'Bootcamp · Festival · Party · Instructors' : '부트캠프 · 페스티벌 · 파티 · 강사'}
        </p>
      </div>
      <div className="home-list-gate__quick-menu-grid" role="list">
        {items.map((item) => {
          const badgeLabel = item.count > 99 ? '99+' : String(item.count);

          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className={`home-list-gate__quick-menu-btn home-list-gate__quick-menu-btn--${item.id}`}
              aria-label={homeListPhotoMenuAriaLabel(item, isEn)}
              onClick={item.onClick}
            >
              <span className="home-list-gate__quick-menu-thumb-wrap" aria-hidden>
                <span className="home-list-gate__quick-menu-thumb">
                  <img
                    src={item.photoUrl}
                    alt=""
                    className="home-list-gate__quick-menu-thumb-img"
                    loading="lazy"
                    decoding="async"
                    onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
                  />
                </span>
                {item.count > 0 ? (
                  <span className="home-list-gate__quick-menu-badge">{badgeLabel}</span>
                ) : null}
              </span>
              <span className="home-list-gate__quick-menu-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
