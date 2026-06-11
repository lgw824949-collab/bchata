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
    <article className="home-dark-today-pick home-dark-today-pick--editorial">
      <button type="button" className="home-dark-today-pick__hit" onClick={onOpen}>
        <div className="home-dark-today-pick__poster">
          <img
            className={HD_POSTER_IMG_CLASS}
            src={party.poster_url}
            alt=""
            loading="eager"
            decoding="async"
            onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
          />
        </div>
        <div className="home-dark-today-pick__info">
          <span className="home-dark-today-pick__label">
            {isEn ? 'Tonight\'s pick' : '오늘 밤 추천'}
          </span>
          <h2 className="home-dark-today-pick__title">{title}</h2>
          <div className="home-dark-today-pick__meta">
            {venue ? (
              <span>
                <MapPin size={13} aria-hidden /> {venue}
              </span>
            ) : null}
            {time ? (
              <span>
                <Clock size={13} aria-hidden /> {time}
              </span>
            ) : null}
          </div>
          <span className="home-dark-today-pick__cta">
            {isEn ? 'View party' : '파티 보기'}
            <ChevronRight size={15} aria-hidden />
          </span>
        </div>
      </button>
      {pickCount > 1 ? (
        <div className="home-dark-today-pick__dots" aria-label={isEn ? 'Pick carousel' : '추천 넘기기'}>
          {Array.from({ length: Math.min(pickCount, 5) }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === activeDot ? 'is-active' : ''}
              aria-label={isEn ? `Pick ${i + 1}` : `추천 ${i + 1}`}
              onClick={() => onDotSelect(i)}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
