import React from 'react';
import { motion } from 'framer-motion';
import { imgFallbackHandler } from '../../constants/imageAssets';
import { formatBarDistrictLabel } from './homeDarkUtils';
import { HD_VENUE_IMG_CLASS } from './homeDarkMedia';

const BAR_LOGO_FALLBACK = '/logo.png';

type BarLike = {
  id: string | number;
  name?: string;
  image_url?: string;
  address?: string;
  region?: string;
};

type HomeDarkBarCardProps = {
  bar: BarLike;
  coverPhoto: string | null;
  eventCount: number;
  isMyGeoRegion: boolean;
  isEn: boolean;
  onClick: () => void;
};

export default function HomeDarkBarCard({
  bar,
  coverPhoto,
  eventCount,
  isMyGeoRegion,
  isEn,
  onClick,
}: HomeDarkBarCardProps) {
  const barName = bar.name || '이름 없음';
  const district = formatBarDistrictLabel(bar);
  const coverSrc = coverPhoto || BAR_LOGO_FALLBACK;
  const isLogoFallback = coverSrc === BAR_LOGO_FALLBACK;

  return (
    <motion.button
      type="button"
      role="listitem"
      className={`home-dark-bar-card-v${isMyGeoRegion ? ' home-dark-bar-card-v--my-region' : ''}`}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <span className="home-dark-poster-card__media">
        <img
          className={`${HD_VENUE_IMG_CLASS}${isLogoFallback ? ' home-dark-bar-card-v__img--logo' : ''}`}
          src={coverSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={imgFallbackHandler(BAR_LOGO_FALLBACK)}
        />
        <span className="home-dark-card__scrim" aria-hidden />
        <span className="home-dark-card__body">
          <span className="home-dark-card__title">{barName}</span>
          <span className={`home-dark-card__meta${eventCount > 0 ? ' home-dark-card__meta--accent' : ''}`}>
            {eventCount > 0
              ? (isEn
                ? `Today ${eventCount} ${eventCount === 1 ? 'party' : 'parties'}`
                : `오늘 ${eventCount}개 파티`)
              : (isEn ? 'No party tonight' : '오늘 파티 없음')}
          </span>
          <span className="home-dark-card__meta">{district}</span>
        </span>
      </span>
    </motion.button>
  );
}
