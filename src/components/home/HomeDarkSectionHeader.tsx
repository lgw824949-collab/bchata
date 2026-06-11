import React from 'react';
import { ChevronRight, MapPin } from 'lucide-react';

type HomeDarkSectionHeaderProps = {
  title: string;
  subtitle?: string | null;
  linkLabel?: string;
  onLinkClick?: () => void;
  linkVariant?: 'default' | 'map';
};

export default function HomeDarkSectionHeader({
  title,
  subtitle,
  linkLabel,
  onLinkClick,
  linkVariant = 'default',
}: HomeDarkSectionHeaderProps) {
  const isMap = linkVariant === 'map';

  return (
    <header className="home-dark-section-header">
      <div className="home-dark-section-header__text">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {onLinkClick ? (
        <button
          type="button"
          className={`home-dark-section-header__link${isMap ? ' home-dark-section-header__link--pill' : ''}`}
          onClick={onLinkClick}
        >
          {isMap ? <MapPin size={13} aria-hidden /> : null}
          {linkLabel}
          {!isMap ? <ChevronRight size={14} aria-hidden /> : null}
        </button>
      ) : null}
    </header>
  );
}
