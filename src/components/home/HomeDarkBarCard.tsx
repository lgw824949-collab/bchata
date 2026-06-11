import React from 'react';
import { motion } from 'framer-motion';
import { imgFallbackHandler } from '../../constants/imageAssets';
import { formatBarDistrictLabel } from './homeDarkUtils';

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

  return (
    <motion.button
      type="button"
      role="listitem"
      className={`home-dark-bar-card-v${isMyGeoRegion ? ' home-dark-bar-card-v--my-region' : ''}`}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <span className="home-dark-bar-card-v__cover">
        {coverPhoto ? (
          <img
            className="home-dark-bar-card-v__cover-img"
            src={coverPhoto}
            alt=""
            loading="lazy"
            decoding="async"
            onError={imgFallbackHandler('/logo.png')}
          />
        ) : (
          <span className="home-dark-bar-card-v__cover-fallback" aria-hidden />
        )}
      </span>
      <span className="home-dark-bar-card-v__body">
        <span className="home-dark-bar-card-v__name">{barName}</span>
        <span className="home-dark-bar-card-v__parties">
          {isEn
            ? `Today ${eventCount} ${eventCount === 1 ? 'event' : 'events'}`
            : `오늘 ${eventCount}개 행사`}
        </span>
        <span className="home-dark-bar-card-v__district">{district}</span>
      </span>
    </motion.button>
  );
}
