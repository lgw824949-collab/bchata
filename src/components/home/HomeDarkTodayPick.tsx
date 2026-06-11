import React from 'react';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import { HD_POSTER_IMG_CLASS } from './homeDarkMedia';
import type { HomeDarkHeroSlide } from './types';

type HomeDarkTodayPickProps = {
  slide: HomeDarkHeroSlide | null;
  title: string;
  venue: string;
  isEn: boolean;
  slideCount: number;
  activeDot: number;
  onDotSelect: (index: number) => void;
  onOpen: () => void;
  emptyLabel: string;
};

export default function HomeDarkTodayPick({
  slide,
  title,
  venue,
  isEn,
  slideCount,
  activeDot,
  onDotSelect,
  onOpen,
  emptyLabel,
}: HomeDarkTodayPickProps) {
  if (!slide) {
    return (
      <div className="home-dark-today-pick home-dark-today-pick--empty">
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const time = slide.start_time || '';
  const kindLabel = isEn ? slide.subtitleEn : slide.subtitleKo;
  const showTodayPickEyebrow = slide.kind === 'party';

  return (
    <article className="home-dark-today-pick">
      <img
        className={`home-dark-today-pick__photo ${HD_POSTER_IMG_CLASS}`}
        src={slide.poster_url}
        alt=""
        loading="eager"
        decoding="async"
        onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
      />
      <div className="home-dark-today-pick__overlay" aria-hidden />
      <div className="home-dark-today-pick__content">
        <span className="home-dark-today-pick__eyebrow">
          {showTodayPickEyebrow ? 'TODAY PICK 🔥' : kindLabel.toUpperCase()}
        </span>
        <h2 className="home-dark-today-pick__title">{title}</h2>
        {showTodayPickEyebrow ? (
          <p className="home-dark-today-pick__subtitle-en">{isEn ? slide.subtitleEn : slide.subtitleKo}</p>
        ) : null}
        <div className="home-dark-today-pick__meta">
          {venue ? (
            <span>
              <MapPin size={14} aria-hidden /> {venue}
            </span>
          ) : null}
          {time ? (
            <span>
              <Clock size={14} aria-hidden /> {time} ~
            </span>
          ) : null}
        </div>
        <button type="button" className="home-dark-today-pick__cta" onClick={onOpen}>
          {isEn ? 'View details' : '자세히 보기'}
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
      {slideCount > 1 ? (
        <div className="home-dark-today-pick__dots" aria-hidden>
          {Array.from({ length: Math.min(slideCount, 5) }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === activeDot ? 'is-active' : ''}
              onClick={() => onDotSelect(i)}
              tabIndex={-1}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
