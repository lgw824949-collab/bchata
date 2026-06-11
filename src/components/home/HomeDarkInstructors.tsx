import React from 'react';
import { motion } from 'framer-motion';
import { DEFAULT_AVATAR_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import HomeDarkSectionHeader from './HomeDarkSectionHeader';
import { HD_PORTRAIT_IMG_CLASS } from './homeDarkMedia';
import { formatInstructorGenre } from './homeDarkUtils';

type InstructorLike = {
  id: string | number;
  name?: string;
  genre?: unknown;
  photo_url?: string;
};

type HomeDarkInstructorsProps = {
  isEn: boolean;
  instructors: InstructorLike[];
  loading: boolean;
  onViewAll: () => void;
  onInstructorClick: () => void;
};

export default function HomeDarkInstructors({
  isEn,
  instructors,
  loading,
  onViewAll,
  onInstructorClick,
}: HomeDarkInstructorsProps) {
  if (!loading && instructors.length === 0) return null;

  const skeletonItems = [0, 1, 2];

  return (
    <section className="home-dark-section home-hot-instructors-wrap home-hot-instructors-wrap--dark" aria-label={isEn ? 'Instructors' : '강사'}>
      <HomeDarkSectionHeader
        title={isEn ? 'Instructors' : '강사'}
        linkLabel={isEn ? 'View all' : '전체보기'}
        onLinkClick={onViewAll}
      />
      <div className="home-dark-grid home-dark-grid--3">
        {loading
          ? skeletonItems.map((i) => (
              <div key={`sk-${i}`} className="home-dark-tile-card home-dark-tile-card--skeleton" aria-hidden>
                <div className="home-dark-tile-card__media" />
                <div className="home-dark-tile-card__foot" />
              </div>
            ))
          : instructors.slice(0, 6).map((inst) => {
              const genreLabel = formatInstructorGenre(inst.genre);
              return (
                <motion.button
                  key={inst.id}
                  type="button"
                  className="home-dark-tile-card home-dark-tile-card--instructor"
                  whileTap={{ scale: 0.98 }}
                  onClick={onInstructorClick}
                >
                  <div className="home-dark-tile-card__media home-dark-tile-card__media--portrait">
                    <img
                      className={HD_PORTRAIT_IMG_CLASS}
                      src={inst.photo_url || DEFAULT_AVATAR_IMAGE}
                      alt={inst.name || ''}
                      loading="lazy"
                      decoding="async"
                      onError={imgFallbackHandler(DEFAULT_AVATAR_IMAGE)}
                    />
                  </div>
                  <div className="home-dark-tile-card__foot">
                    <p className="home-dark-tile-card__title">{inst.name}</p>
                    {genreLabel ? (
                      <p className="home-dark-tile-card__meta">{genreLabel}</p>
                    ) : null}
                  </div>
                </motion.button>
              );
            })}
      </div>
    </section>
  );
}
