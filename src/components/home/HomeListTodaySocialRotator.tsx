import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import { formatPartyFeeDisplay } from '../../lib/partyFeeDisplay';
import { partyMatchesCalendarDate } from '../../lib/partyRecurrence';
import type { HomeDarkParty } from './types';

const ROTATE_MS = 60_000;
const SWIPE_THRESHOLD_PX = 40;

type HomeListTodaySocialRotatorProps = {
  isEn: boolean;
  parties: HomeDarkParty[];
  getPartyTitle: (party: HomeDarkParty) => string;
  getPartyVenue: (party: HomeDarkParty) => string;
  onPartyClick: (party: HomeDarkParty) => void;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatPartyTime = (party: HomeDarkParty, isEn: boolean) => {
  const raw = String(party.start_time || party.time || '').trim();
  const start = raw.includes('-') ? raw.split('-')[0].trim() : raw;
  const clock = start.slice(0, 5);
  if (!clock) return '';
  const isToday = partyMatchesCalendarDate(party, todayStr());
  if (isToday) return isEn ? `Tonight ${clock}` : `오늘 ${clock}`;
  return clock;
};

export default function HomeListTodaySocialRotator({
  isEn,
  parties,
  getPartyTitle,
  getPartyVenue,
  onPartyClick,
}: HomeListTodaySocialRotatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pauseUntilRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);

  const pauseRotation = useCallback(() => {
    pauseUntilRef.current = Date.now() + ROTATE_MS;
  }, []);

  const goToIndex = useCallback((index: number) => {
    if (parties.length === 0) return;
    setActiveIndex(((index % parties.length) + parties.length) % parties.length);
    pauseRotation();
  }, [parties.length, pauseRotation]);

  useEffect(() => {
    setActiveIndex(0);
  }, [parties]);

  useEffect(() => {
    if (parties.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      setActiveIndex((index) => (index + 1) % parties.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [parties.length]);

  if (parties.length === 0) {
    return (
      <div className="home-list-gate__empty">
        {isEn
          ? 'No social in this region today. Check bootcamp · festival · party cards below.'
          : '이 지역 오늘 소셜 없음 · 부트캠프·페스티벌·파티는 아래 카드에서 확인'}
      </div>
    );
  }

  const party = parties[activeIndex % parties.length];
  const title = getPartyTitle(party);
  const venue = getPartyVenue(party);
  const time = formatPartyTime(party, isEn);
  const fee = formatPartyFeeDisplay(party.fee, { fallback: isEn ? 'Ask' : '문의' });
  const meta = [time, venue, fee].filter(Boolean).join(' · ');
  const posterUrl = String(party.poster_url || '').trim() || DEFAULT_CARD_IMAGE;

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartXRef.current == null || parties.length <= 1) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX == null) return;
    const delta = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goToIndex(activeIndex + 1);
    else goToIndex(activeIndex - 1);
  };

  return (
    <div
      className="home-list-gate__social-rotator-wrap"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        className="home-list-gate__social-rotator"
        onClick={() => onPartyClick(party)}
        aria-label={isEn ? `Open ${title}` : `${title} 보기`}
      >
        <span key={party.id} className="home-list-gate__social-rotator-poster">
          <img
            src={posterUrl}
            alt=""
            className="home-list-gate__social-rotator-img"
            loading="eager"
            decoding="async"
            onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
          />
        </span>
        <span className="home-list-gate__social-rotator-body">
          <span className="home-list-gate__social-rotator-copy">
            <span className="home-list-gate__social-rotator-title">{title}</span>
            {meta ? <span className="home-list-gate__social-rotator-meta">{meta}</span> : null}
          </span>
          <ChevronRight size={18} className="home-list-gate__social-rotator-chevron" aria-hidden />
        </span>
      </button>

      {parties.length > 1 ? (
        <div className="home-list-gate__social-dots" role="tablist" aria-label={isEn ? 'Social posters' : '오늘소셜 포스터'}>
          {parties.map((p, index) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              className={`home-list-gate__social-dot${index === activeIndex ? ' is-active' : ''}`}
              onClick={() => goToIndex(index)}
              aria-label={isEn ? `Poster ${index + 1}` : `포스터 ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
