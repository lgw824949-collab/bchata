import React from 'react';
import { Disc3, Sparkles, Tent, UserRound, type LucideIcon } from 'lucide-react';
import { homeListPhotoMenuAriaLabel, type HomeListPhotoMenuItem, type HomeListPhotoMenuItemId } from '../../lib/homeListPhotoMenu';

const QUICK_MENU_ICONS: Record<HomeListPhotoMenuItemId, LucideIcon> = {
  bootcamp: Tent,
  festival: Sparkles,
  party: Disc3,
  instructors: UserRound,
};

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
          const Icon = QUICK_MENU_ICONS[item.id];
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
              <span className="home-list-gate__quick-menu-icon" aria-hidden>
                <Icon size={22} strokeWidth={1.65} />
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
