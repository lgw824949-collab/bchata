import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { HOME_DARK_HERO_ROTATE_MS } from './buildHomeDarkHeroSlides';
import type { HomeDarkHeroSlide } from './types';

type HomeDarkTodayPickProps = {
  slide: HomeDarkHeroSlide | null;
  title: string;
  venue: string;
  dateLabel?: string;
  isEn: boolean;
  slideCount: number;
  activeDot: number;
  onDotSelect: (index: number) => void;
  onRotateNext: () => void;
  onOpen: () => void;
  emptyLabel: string;
  eventsLoading?: boolean;
};

export default function HomeDarkTodayPick({
  slide,
  title,
  venue,
  dateLabel = '',
  isEn,
  slideCount,
  activeDot,
  onDotSelect,
  onRotateNext,
  onOpen,
  emptyLabel,
  eventsLoading = false,
}: HomeDarkTodayPickProps) {
  const pauseUntilRef = useRef(0);
  const [posterBroken, setPosterBroken] = useState(false);

  useEffect(() => {
    setPosterBroken(false);
  }, [slide?.id, slide?.poster_url]);

  const pauseRotation = useCallback(() => {
    pauseUntilRef.current = Date.now() + HOME_DARK_HERO_ROTATE_MS * 2;
  }, []);

  useEffect(() => {
    if (slideCount <= 1) return undefined;

    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      onRotateNext();
    }, HOME_DARK_HERO_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [slideCount, onRotateNext, slide?.id]);

  if (eventsLoading) {
    return (
      <div className="home-dark-today-pick home-dark-today-pick--loading" aria-busy="true">
        <div className="home-dark-today-pick__skeleton" />
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="home-dark-today-pick home-dark-today-pick--empty">
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const time = slide.start_time || '';
  const kindLabel = isEn ? slide.subtitleEn : slide.subtitleKo;
  const showTodayPickEyebrow = slide.kind === 'social';
  const metaParts = [
    dateLabel || slide.date_label,
    venue,
    time ? `${time}~` : null,
  ].filter(Boolean);

  return (
    <article className="home-dark-today-pick">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          className="home-dark-today-pick__stage home-dark-today-pick__stage--clickable"
          role="button"
          tabIndex={0}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen();
            }
          }}
        >
          {slide.poster_url && !posterBroken ? (
            <img
              key={slide.poster_url}
              className="home-dark-today-pick__photo bchata-poster-fit home-dark-today-pick__photo--hero"
              src={slide.poster_url}
              alt=""
              loading="eager"
              decoding="async"
              onError={() => setPosterBroken(true)}
            />
          ) : (
            <span className="home-dark-today-pick__poster-placeholder" aria-hidden />
          )}
          <div className="home-dark-today-pick__overlay" aria-hidden />
          <div className="home-dark-today-pick__content">
            <span className="home-dark-today-pick__eyebrow">
              {showTodayPickEyebrow ? 'TODAY PICK 🔥' : kindLabel.toUpperCase()}
            </span>
            <h2 className="home-dark-today-pick__title">{title}</h2>
            {showTodayPickEyebrow ? (
              <p className="home-dark-today-pick__subtitle-en">
                {isEn ? slide.subtitleEn : slide.subtitleKo}
              </p>
            ) : null}
            {metaParts.length > 0 ? (
              <p className="home-dark-today-pick__meta-line">
                {metaParts.map((part, index) => (
                  <React.Fragment key={`${part}-${index}`}>
                    {index > 0 ? <span className="home-dark-today-pick__meta-sep"> · </span> : null}
                    <span>{part}</span>
                  </React.Fragment>
                ))}
              </p>
            ) : null}
            <button
              type="button"
              className="home-dark-today-pick__cta"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
            >
              {isEn ? 'View details' : '자세히 보기'}
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
      {slideCount > 1 ? (
        <div className="home-dark-today-pick__dots" aria-label={isEn ? 'Hero posters' : '히어로 포스터'}>
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === activeDot ? 'is-active' : ''}
              aria-label={isEn ? `Slide ${i + 1}` : `${i + 1}번 포스터`}
              onClick={() => {
                pauseRotation();
                onDotSelect(i);
              }}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
