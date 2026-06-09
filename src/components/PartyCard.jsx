import React from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import PartyWishlistHeart from './PartyWishlistHeart';
import { usePartyWishlist } from '../hooks/usePartyWishlist';
import { formatPartyMusicRatio } from '../pages/Social';
import { formatPartyFeeDisplay, PARTY_FEE_CARD_FONT_SIZE } from '../lib/partyFeeDisplay';
import { formatPartyTitleDisplay, PARTY_TITLE_CARD_FONT_SIZE } from '../lib/partyTitleDisplay';

const GENRE_MAP = {
  '바차타': { key: 'b_ratio', label: 'B', label_en: 'Bachata', color: '#FF1744' },
  '살사': { key: 's_ratio', label: 'S', label_en: 'Salsa', color: '#FF1744' },
  '쥬크': { key: 'j_ratio', label: 'J', label_en: 'Zouk', color: '#FF1744' },
  '키좀바': { key: 'k_ratio', label: 'K', label_en: 'Kizomba', color: '#FF1744' },
};

const TITLE_TRANSLATION = {
  '주말 모드 원': 'Weekend Mode One',
  '바차타 파인 다이닝': 'Bachata Fine Dining',
  '오늘밤빠': 'TonightBAMPPA',
  '맛집': 'Hot Spot',
  '성지': 'Holy Ground',
  '정모': 'Meetup',
  '라틴': 'Latin',
  '클럽': 'Club',
  '살사': 'Salsa',
  '바차타': 'Bachata',
  '쥬크': 'Zouk',
  '키좀바': 'Kizomba',
  '수업': 'Class',
  '번개': 'Flash Mob',
  '파티': 'Party',
  '전국': 'National',
  '서울': 'Seoul',
  '홍대': 'Hongdae',
  '강남': 'Gangnam',
  '부산': 'Busan',
  '제주': 'Jeju',
  '인천': 'Incheon',
  '경기': 'Gyeonggi'
};

const translateDynamicText = (text, isEn) => {
  if (!text || !isEn) return text;
  let translated = text;
  const sortedKeys = Object.keys(TITLE_TRANSLATION).sort((a, b) => b.length - a.length);
  sortedKeys.forEach(ko => {
    const en = TITLE_TRANSLATION[ko];
    const regex = new RegExp(ko, 'g');
    translated = translated.replace(regex, en);
  });
  return translated;
};

const PartyCard = ({
  item,
  onSelect,
  wishlistParties: wishlistProp,
  onToggleWishlist: toggleProp,
  variant = 'row',
}) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const fallbackWishlist = usePartyWishlist();
  const wishlistParties = wishlistProp ?? fallbackWishlist.wishlistParties;
  const onToggleWishlist = toggleProp ?? fallbackWishlist.toggleWishlistParty;

  const isTimeLive = (() => {
    const now = new Date();
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (item.date !== todayStr) return false;
    const startStr = (item.time?.split('-')[0] || '20:00').trim();
    const [sH, sM] = startStr.split(':').length === 2 ? startStr.split(':').map(Number) : [20, 0];
    const startDate = new Date();
    startDate.setHours(sH, sM, 0, 0);
    const endStr = item.time?.includes('-') ? item.time.split('-')[1].trim() : null;
    let endDate = new Date(startDate);
    if (endStr && endStr.includes(':')) {
      const [eH, eM] = endStr.split(':').map(Number);
      endDate.setHours(eH, eM + 30, 0, 0);
      if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
    } else {
      endDate.setHours(startDate.getHours() + 4, startDate.getMinutes() + 30, 0, 0);
    }
    const startWithBuffer = new Date(startDate.getTime() - 30 * 60 * 1000);
    return now >= startWithBuffer && now <= endDate;
  })();

  const displayTime = item.time?.split('-')[0].trim() || '21:00';
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const timeLabel = item.date === todayStr ? `오늘 ${displayTime}` : displayTime;
  const displayFee = formatPartyFeeDisplay(item.fee, { fallback: '문의' });
  const locationLabel = translateDynamicText(item.locationName || item.studio_name || '장소 미지정', isEn);
  const ratioLabel = formatPartyMusicRatio(item);
  const title = translateDynamicText(formatPartyTitleDisplay(item.title), isEn);

  const handleCardClick = async () => {
    if (item?.id) {
      await supabase.from('parties').update({ view_count: (item.view_count || 0) + 1 }).eq('id', item.id);
    }
    onSelect(item);
  };

  const genreLabel = (() => {
    const entries = Object.entries(GENRE_MAP).filter(([_, info]) => item[info.key] > 0);
    if (entries.length === 0) return '소셜';
    const sorted = [...entries].sort((a, b) => item[b[1].key] - item[a[1].key]);
    if (sorted.length >= 2 && item[sorted[0][1].key] === item[sorted[1][1].key]) {
      return `${sorted[0][0]} · ${sorted[1][0]}`;
    }
    return sorted[0][0];
  })();

  const genreChip = (
    <span className="party-card__genre-chip">
      <span className="party-card__genre-label">{genreLabel}</span>
      {ratioLabel ? (
        <>
          <span className="party-card__genre-sep" aria-hidden />
          <span className="party-card__genre-ratio">{ratioLabel}</span>
        </>
      ) : null}
    </span>
  );

  const liveBadge = isTimeLive ? (
    <span className="party-card__live-badge">LIVE</span>
  ) : null;

  if (variant === 'stack') {
    return (
      <div className="party-card party-card--stack" onClick={handleCardClick} role="button" tabIndex={0}>
        <div className="party-card__poster-wrap">
          <PartyWishlistHeart
            party={item}
            wishlistParties={wishlistParties}
            onToggle={onToggleWishlist}
          />
          <img src={item.poster_url} className="party-card__poster-img" alt="" />
          <div className="party-card__poster-overlay" aria-hidden />
          <div className="party-card__poster-meta">
            {genreChip}
            {liveBadge}
          </div>
        </div>
        <div className="party-card__body">
          <h3 className="party-card__title">{title}</h3>
          <div className="party-card__meta-row">
            <span className="party-card__meta-item">{timeLabel}</span>
            <span className="party-card__meta-dot" aria-hidden />
            <span className="party-card__meta-item party-card__meta-item--location">{locationLabel}</span>
          </div>
          <div className="party-card__fee">{displayFee}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="party-card party-card--row" onClick={handleCardClick} role="button" tabIndex={0}>
      <PartyWishlistHeart
        party={item}
        wishlistParties={wishlistParties}
        onToggle={onToggleWishlist}
      />

      <div className="bchata-poster-frame party-card__thumb">
        <img src={item.poster_url} className="bchata-poster-fit" alt="Poster" />
      </div>

      <div className="party-card__content">
        <div className="party-card__tags">
          {genreChip}
          {liveBadge}
        </div>

        <h3 className="party-card__title party-card__title--row">{title}</h3>

        <div className="party-card__meta-row party-card__meta-row--row">
          <span className="party-card__meta-item">🕒 {timeLabel}</span>
          <span className="party-card__meta-item party-card__meta-item--location">📍 {locationLabel}</span>
        </div>

        <div className="party-card__fee party-card__fee--row">{displayFee}</div>
      </div>
    </div>
  );
};

export default PartyCard;
