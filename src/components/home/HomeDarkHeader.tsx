import React from 'react';
import { Bell, Search } from 'lucide-react';

type HomeDarkHeaderProps = {
  tagline: string;
  onAdminTap: () => void;
  onSearch: () => void;
};

export default function HomeDarkHeader({ tagline, onAdminTap, onSearch }: HomeDarkHeaderProps) {
  return (
    <header className="home-dark-header">
      <div className="home-dark-header__brand">
        <h1
          className="home-dark-header__title"
          role="button"
          tabIndex={0}
          onClick={onAdminTap}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAdminTap();
            }
          }}
        >
          오늘밤빠
        </h1>
        <p className="home-dark-header__tagline">{tagline}</p>
      </div>
      <div className="home-dark-header__actions">
        <button type="button" className="home-dark-header__icon-btn" aria-label="알림">
          <Bell size={20} strokeWidth={2} />
        </button>
        <button type="button" className="home-dark-header__icon-btn" aria-label="파티 검색" onClick={onSearch}>
          <Search size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
