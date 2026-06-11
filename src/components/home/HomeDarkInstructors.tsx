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

  const skeletonItems = [0, 1, 2, 3];

  return (
    <section className="home-dark-section home-hot-instructors-wrap home-hot-instructors-wrap--dark" aria-label={isEn ? 'Instructors' : '강사'}>
      <HomeDarkSectionHeader
        title={isEn ? '⭐ Instructors' : '⭐ 강사 한눈에'}
        subtitle={isEn ? 'Popular instructors tonight' : '오늘 밤 활동하는 강사'}
        linkLabel={isEn ? 'View all' : '전체보기'}
        onLinkClick={onViewAll}
      />
      <div className={`home-dark-scroll-peek${!loading && instructors.length >= 4 ? ' home-dark-scroll-peek--active' : ''}`}>
        <div className="home-dark-hscroll scrollbar-hide">
          <div className="home-dark-hscroll__track home-dark-hscroll__track--instructor">
            {loading
              ? skeletonItems.map((i) => (
                  <div key={`sk-${i}`} className="home-dark-instructor-card home-dark-instructor-card--skeleton" aria-hidden>
                    <div className="home-dark-instructor-card__media" />
                  </div>
                ))
              : instructors.map((inst) => {
                  const genreLabel = formatInstructorGenre(inst.genre);
                  return (
                    <motion.button
                      key={inst.id}
                      type="button"
                      className="home-dark-instructor-card"
                      whileTap={{ scale: 0.98 }}
                      onClick={onInstructorClick}
                    >
                      <div className="home-dark-instructor-card__media">
                        <img
                          className={HD_PORTRAIT_IMG_CLASS}
                          src={inst.photo_url || DEFAULT_AVATAR_IMAGE}
                          alt={inst.name || ''}
                          loading="lazy"
                          decoding="async"
                          onError={imgFallbackHandler(DEFAULT_AVATAR_IMAGE)}
                        />
                        <span className="home-dark-card__scrim" aria-hidden />
                        <span className="home-dark-card__body">
                          <span className="home-dark-card__title">{inst.name}</span>
                          {genreLabel ? (
                            <span className="home-dark-card__meta home-dark-card__meta--accent">{genreLabel}</span>
                          ) : null}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
          </div>
        </div>
      </div>
    </section>
  );
}
