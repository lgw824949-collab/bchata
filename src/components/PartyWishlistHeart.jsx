import React from 'react';
import { Heart } from 'lucide-react';
import { isPartyWishlisted } from '../lib/partyWishlistStore';

const DEFAULT_BTN_STYLE = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(4px)',
  border: 'none',
  borderRadius: '50%',
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 10,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

/**
 * 포스터 카드 찜하기 하트 — 기존 지역 캐러셀 스타일과 동일
 */
export default function PartyWishlistHeart({
  party,
  wishlistParties,
  onToggle,
  style = {},
  iconSize = 15,
}) {
  if (!party?.id || !onToggle) return null;

  const isWish = isPartyWishlisted(wishlistParties, party.id);

  return (
    <button
      type="button"
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => onToggle(e, party)}
      aria-label={isWish ? '찜 해제' : '찜하기'}
      style={{ ...DEFAULT_BTN_STYLE, ...style }}
    >
      <Heart
        size={iconSize}
        color={isWish ? '#FF4081' : '#FFCDD2'}
        fill={isWish ? '#FF4081' : '#FFCDD2'}
      />
    </button>
  );
}
