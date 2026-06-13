import React from 'react';
import { Heart, MoreHorizontal, Search } from 'lucide-react';

type HomeDarkHeaderProps = {
  tagline: string;
  onAdminTap: () => void;
  onSearch: () => void;
  onWishlist: () => void;
  onMore: () => void;
};

export default function HomeDarkHeader({
  tagline,
  onAdminTap,
  onSearch,
  onWishlist,
  onMore,
}: HomeDarkHeaderProps) {
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
        <button
          type="button"
          className="home-dark-header__icon-btn home-dark-header__icon-btn--wishlist"
          aria-label="찜 목록"
          onClick={onWishlist}
        >
          <Heart size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="home-dark-header__icon-btn"
          aria-label="더보기"
          onClick={onMore}
        >
          <MoreHorizontal size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="home-dark-header__icon-btn"
          aria-label="파티·행사 검색"
          onClick={onSearch}
        >
          <Search size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
