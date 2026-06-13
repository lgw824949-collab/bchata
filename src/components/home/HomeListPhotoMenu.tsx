import React from 'react';
import { homeListPhotoMenuAriaLabel, type HomeListPhotoMenuItem, type HomeListPhotoMenuItemId } from '../../lib/homeListPhotoMenu';

const QUICK_MENU_EMOJI: Record<HomeListPhotoMenuItemId, string> = {
  bootcamp: '🏕️',
  festival: '🎪',
  party: '🥳',
  instructors: '🕺',
};

type HomeListPhotoMenuProps = {
  isEn: boolean;
  items: HomeListPhotoMenuItem[];
};

export default function HomeListPhotoMenu({ isEn, items }: HomeListPhotoMenuProps) {
  if (items.length === 0) return null;

  return (
    <nav className="home-list-gate__quick-menu" aria-label={isEn ? 'Quick menu' : '퀵메뉴'}>
      <p className="home-list-gate__quick-menu-caption">{isEn ? 'Quick menu' : '퀵메뉴'}</p>
      <div className="home-list-gate__quick-menu-grid" role="list">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="listitem"
            className="home-list-gate__quick-menu-btn"
            aria-label={homeListPhotoMenuAriaLabel(item, isEn)}
            onClick={item.onClick}
          >
            <span className="home-list-gate__quick-menu-icon" aria-hidden>
              {QUICK_MENU_EMOJI[item.id]}
            </span>
            <span className="home-list-gate__quick-menu-label">{item.label}</span>
            {item.count > 0 ? (
              <span className="home-list-gate__quick-menu-meta">
                {item.countHint} {item.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </nav>
  );
}
