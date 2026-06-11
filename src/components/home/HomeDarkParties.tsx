import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import HomeDarkSectionHeader from './HomeDarkSectionHeader';
import { HD_POSTER_IMG_CLASS } from './homeDarkMedia';

type PartyLike = {
  id: string | number;
  poster_url?: string;
  title?: string;
  locationName?: string;
  location_name?: string;
  venue?: string;
  start_time?: string;
  region?: string;
  broadRegion?: string;
};

type HomeDarkPartiesProps = {
  isEn: boolean;
  parties: PartyLike[];
  hasFeaturedPick: boolean;
  wishlistIds: Array<string | number>;
  getTitle: (party: PartyLike) => string;
  getVenue: (party: PartyLike) => string;
  onPartyClick: (party: PartyLike) => void;
  onToggleWishlist: (e: React.MouseEvent, party: PartyLike) => void;
  onViewAll: () => void;
  emptyLabel: string;
};

export default function HomeDarkParties({
  isEn,
  parties,
  hasFeaturedPick,
  wishlistIds,
  getTitle,
  getVenue,
  onPartyClick,
  onToggleWishlist,
  onViewAll,
  emptyLabel,
}: HomeDarkPartiesProps) {
  const sectionTitle = hasFeaturedPick
    ? (isEn ? 'More tonight' : '다른 소셜')
    : (isEn ? "Tonight's social" : '오늘소셜');

  return (
    <section className="home-dark-section home-dark-parties" aria-label={sectionTitle}>
      <HomeDarkSectionHeader
        title={sectionTitle}
        linkLabel={isEn ? 'View all' : '전체보기'}
        onLinkClick={onViewAll}
      />
      {parties.length > 0 ? (
        <div className="home-dark-grid home-dark-grid--2">
          {parties.map((party, index) => {
            const title = getTitle(party);
            const venue = getVenue(party);
            const time = party.start_time ? String(party.start_time).slice(0, 5) : '';
            const regionLabel = party.region || party.broadRegion || '';
            const isWishlisted = wishlistIds.includes(party.id);

            return (
              <motion.button
                key={party.id}
                type="button"
                className="home-dark-tile-card home-dark-tile-card--party"
                whileTap={{ scale: 0.98 }}
                onClick={() => onPartyClick(party)}
              >
                <div className="home-dark-tile-card__media">
                  <img
                    className={HD_POSTER_IMG_CLASS}
                    src={party.poster_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
                  />
                  {index < 2 ? (
                    <span className={`home-dark-card__badge${index === 0 ? ' home-dark-card__badge--hot' : ' home-dark-card__badge--new'}`}>
                      {index === 0 ? 'HOT' : 'NEW'}
                    </span>
                  ) : null}
                  <span
                    role="button"
                    tabIndex={0}
                    className={`home-dark-card__heart${isWishlisted ? ' is-active' : ''}`}
                    aria-label={isEn ? 'Save party' : '파티 찜하기'}
                    onClick={(e) => onToggleWishlist(e, party)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleWishlist(e as unknown as React.MouseEvent, party);
                      }
                    }}
                  >
                    <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </span>
                </div>
                <div className="home-dark-tile-card__foot">
                  <p className="home-dark-tile-card__title">{title}</p>
                  <p className="home-dark-tile-card__meta">
                    {[venue || regionLabel, time].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <p className="home-dark-parties-empty">{emptyLabel}</p>
      )}
    </section>
  );
}
