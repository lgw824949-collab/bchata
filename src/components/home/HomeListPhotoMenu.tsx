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
      aria-label={isEn ? 'Quick menu' : '퀵메뉴'}
    >
      <div className="home-list-gate__quick-menu-grid" role="list">
        {items.map((item) => {
          const countLabel = item.count > 0
            ? (isEn ? `${item.count} open` : `${item.count}건`)
            : null;

          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className={`home-list-gate__quick-menu-btn home-list-gate__quick-menu-btn--${item.id}`}
              aria-label={homeListPhotoMenuAriaLabel(item, isEn)}
              onClick={item.onClick}
            >
              <span className="home-list-gate__quick-menu-thumb" aria-hidden>
                <img
                  src={item.photoUrl}
                  alt=""
                  className="home-list-gate__quick-menu-thumb-img"
                  loading="lazy"
                  decoding="async"
                  onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
                />
              </span>
              <span className="home-list-gate__quick-menu-copy">
                <span className="home-list-gate__quick-menu-label">{item.label}</span>
                {countLabel ? (
                  <span className="home-list-gate__quick-menu-meta">{countLabel}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
