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

const PartyCard = ({ item, onSelect, wishlistParties: wishlistProp, onToggleWishlist: toggleProp }) => {
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

  return (
    <div
      onClick={handleCardClick}
      style={{
        display: 'flex',
        padding: '20px',
        background: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        gap: '20px',
        cursor: 'pointer',
        marginBottom: '12px',
        position: 'relative',
        alignItems: 'center',
      }}
    >
      <PartyWishlistHeart
        party={item}
        wishlistParties={wishlistParties}
        onToggle={onToggleWishlist}
      />

      <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 11px',
              borderRadius: '999px',
              background: 'linear-gradient(180deg, #FFFBFC 0%, #FFF0F5 100%)',
              border: '1px solid rgba(216, 27, 96, 0.14)',
              boxShadow: '0 1px 4px rgba(216, 27, 96, 0.08)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#C2185B', letterSpacing: '0.2px' }}>
              {genreLabel}
            </span>
            {ratioLabel ? (
              <>
                <span
                  aria-hidden
                  style={{
                    width: '1px',
                    height: '10px',
                    background: 'rgba(216, 27, 96, 0.22)',
                    borderRadius: '1px',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#E53935', letterSpacing: '0.02em' }}>
                  {ratioLabel}
                </span>
              </>
            ) : null}
          </span>
          {isTimeLive ? (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#fff',
                background: '#E53935',
                letterSpacing: '0.3px',
                flexShrink: 0,
                padding: '3px 7px',
                borderRadius: '999px',
              }}
            >
              LIVE
            </span>
          ) : null}
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: PARTY_TITLE_CARD_FONT_SIZE,
            fontWeight: 800,
            color: '#111',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#757575',
            fontWeight: 500,
            minWidth: 0,
          }}
        >
          <span style={{ flexShrink: 0 }}>🕒 {timeLabel}</span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            📍 {locationLabel}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px', flexWrap: 'nowrap', minWidth: 0 }}>
          <span
            style={{
              fontSize: PARTY_FEE_CARD_FONT_SIZE,
              fontWeight: 900,
              color: '#E53935',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {displayFee}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PartyCard;
