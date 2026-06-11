import React from 'react';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import { HD_POSTER_IMG_CLASS } from './homeDarkMedia';

type PartyLike = {
  poster_url?: string;
  title?: string;
  locationName?: string;
  location_name?: string;
  venue?: string;
  start_time?: string;
};

type HomeDarkTodayPickProps = {
  party: PartyLike | null;
  title: string;
  venue: string;
  isEn: boolean;
  pickCount: number;
  activeDot: number;
  onDotSelect: (index: number) => void;
  onOpen: () => void;
  emptyLabel: string;
};

export default function HomeDarkTodayPick({
  party,
  title,
  venue,
  isEn,
  pickCount,
  activeDot,
  onDotSelect,
  onOpen,
  emptyLabel,
}: HomeDarkTodayPickProps) {
  if (!party) {
    return (
      <div className="home-dark-today-pick home-dark-today-pick--empty">
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const time = party.start_time ? String(party.start_time).slice(0, 5) : '';

  return (
    <article className="home-dark-today-pick">
      <img
        className={`home-dark-today-pick__photo ${HD_POSTER_IMG_CLASS}`}
        src={party.poster_url}
        alt=""
        loading="eager"
        decoding="async"
        onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
      />
      <div className="home-dark-today-pick__overlay" aria-hidden />
      <div className="home-dark-today-pick__content">
        <span className="home-dark-today-pick__eyebrow">TODAY PICK 🔥</span>
        <h2 className="home-dark-today-pick__title">{title}</h2>
        <p className="home-dark-today-pick__subtitle">{isEn ? 'Tonight\'s social pick' : '오늘의 소셜 픽'}</p>
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
      {pickCount > 1 ? (
        <div className="home-dark-today-pick__dots" aria-hidden>
          {Array.from({ length: Math.min(pickCount, 5) }).map((_, i) => (
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
