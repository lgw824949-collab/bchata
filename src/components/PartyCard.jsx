import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sharePartyToKakao } from '../lib/kakaoShare';
import { buildPartyShareCard } from '../lib/partyShareCard';
import { supabase } from '../lib/supabase';
import PartyWishlistHeart from './PartyWishlistHeart';
import { usePartyWishlist } from '../hooks/usePartyWishlist';
import { PartyMusicRatioLine } from '../pages/Social';
import { formatPartyFeeDisplay } from '../lib/partyFeeDisplay';

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

  const cleanTitleStr = item.title?.split(' ㅣ ')[0] || '';
  const displayTime = item.time?.split('-')[0].trim() || '21:00';
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const timeLabel = item.date === todayStr ? `오늘 ${displayTime}` : displayTime;
  const displayFee = formatPartyFeeDisplay(item.fee, { fallback: '문의' });
  const locationLabel = translateDynamicText(item.locationName || item.studio_name || '장소 미지정', isEn);

  const handleKakaoShare = async (e) => {
    e.stopPropagation();
    const card = buildPartyShareCard(item);
    await sharePartyToKakao({
      title: card?.title || item.title,
      description: card?.feedDesc || `${item.date} · ${item.locationName || item.studio_name || ''} · ${item.fee || ''}`.replace(/ · $/, '').replace(/^ · /, ''),
      posterUrl: item.poster_url,
      linkUrl: `https://bchata.vercel.app/?party=${item.id}&open=true`,
    });
  };

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
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: 'var(--color-card)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        height: '180px',
        marginBottom: '12px',
        transition: 'all 0.3s',
        position: 'relative',
      }}
    >
      <PartyWishlistHeart
        party={item}
        wishlistParties={wishlistParties}
        onToggle={onToggleWishlist}
      />

      <div style={{ width: '110px', flexShrink: 0, background: '#000' }}>
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#ffffff',
              background: '#E53935',
              padding: '2px 8px',
              borderRadius: '4px',
              flexShrink: 0,
            }}
          >
            {genreLabel}
          </span>
          {isTimeLive ? (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                background: '#E53935',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                animation: 'blink 1.5s infinite',
              }}
            >
              LIVE
            </span>
          ) : null}
        </div>

        <div
          style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--color-text-main)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.5px',
            lineHeight: 1.25,
            marginTop: '6px',
          }}
        >
          {translateDynamicText(cleanTitleStr.replace(/^\[.*?\]\s*/, '').replace(/ㅣ\s*$/, '').trim(), isEn)}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '6px',
            minWidth: 0,
            fontSize: '12px',
            color: 'var(--color-text-sub)',
            fontWeight: 600,
          }}
        >
          <Clock size={12} style={{ flexShrink: 0 }} />
          <span style={{ flexShrink: 0 }}>{timeLabel}</span>
          <span style={{ opacity: 0.45, flexShrink: 0 }}>·</span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {locationLabel}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '6px',
            minWidth: 0,
          }}
        >
          <PartyMusicRatioLine
            item={item}
            style={{
              margin: 0,
              fontSize: '11px',
              fontWeight: 500,
              color: '#888888',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              color: '#E53935',
              fontWeight: 800,
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            {displayFee}
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0 }} />

        <button
          type="button"
          onClick={handleKakaoShare}
          style={{
            alignSelf: 'flex-end',
            background: '#FEE500',
            color: '#3E2723',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          💬 카카오공유
        </button>
      </div>
    </div>
  );
};

export default PartyCard;
