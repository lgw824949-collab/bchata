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
    <nav className="home-list-gate__photo-menu" aria-label={isEn ? 'Categories' : '카테고리'}>
      <div className="home-list-gate__photo-menu-scroll" role="list">
        {items.map((item) => {
          const badgeLabel = item.count > 99 ? '99+' : String(item.count);
          return (
            <div key={item.id} className="home-list-gate__photo-menu-shell" role="listitem">
              <button
                type="button"
                className="home-list-gate__photo-menu-card"
                aria-label={homeListPhotoMenuAriaLabel(item, isEn)}
                onClick={item.onClick}
              >
                <span className="home-list-gate__photo-menu-media" aria-hidden>
                  <img
                    src={item.photoUrl}
                    alt=""
                    className="home-list-gate__photo-menu-img"
                    loading={item.id === 'party' ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
                  />
                  <span className="home-list-gate__photo-menu-overlay" />
                </span>
                {item.count > 0 ? (
                  <span className="home-list-gate__photo-menu-badge" aria-hidden>
                    {badgeLabel}
                  </span>
                ) : null}
                <span className="home-list-gate__photo-menu-label">{item.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
