import React from 'react';
import { Clock, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sharePartyToKakao } from '../lib/kakaoShare';

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

const formatPrice = (priceStr) => {
  if (!priceStr) return '2만';
  if (priceStr.includes('무료') || priceStr === '0') return '무료';
  const num = parseInt(String(priceStr).replace(/[^0-9]/g, ''));
  if (isNaN(num)) return String(priceStr).replace('원', '');
  if (num === 0) return '무료';
  if (num < 1000) return `${num}`;
  const manValue = num / 10000;
  if (num % 10000 === 0) return `${manValue}만`;
  return `${manValue.toFixed(1).replace('.0', '')}만`;
};

const PartyCard = ({ item, onSelect }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

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
  const displayFee = formatPrice(item.fee);

  const handleKakaoShare = async (e) => {
    e.stopPropagation();
    await sharePartyToKakao({
      title: item.title,
      description: `${item.date} | ${item.locationName || item.studio_name} | ${item.fee}`,
      posterUrl: item.poster_url,
    });
  };

  return (
    <div
      onClick={() => onSelect(item.poster_url)}
      style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', backgroundColor: 'var(--color-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', cursor: 'pointer', height: '180px', marginBottom: '12px', transition: 'all 0.3s' }}
    >
      <div style={{ width: '100px', flexShrink: 0 }}>
        <img src={item.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#E53935', background: '#fff0f0', padding: '2px 8px', borderRadius: '6px', border: '1px solid #ffc9c9', flexShrink: 0 }}>
            {(() => {
              const entries = Object.entries(GENRE_MAP).filter(([_, info]) => item[info.key] > 0)
              if (entries.length === 0) return '소셜'
              const sorted = [...entries].sort((a, b) => item[b[1].key] - item[a[1].key])
              if (sorted.length >= 2 && item[sorted[0][1].key] === item[sorted[1][1].key]) return `${sorted[0][0]} · ${sorted[1][0]}`
              return sorted[0][0]
            })()}
          </span>
          {isTimeLive && (
            <span style={{ background: '#E53935', color: '#fff', fontSize: '10px', fontWeight: '950', padding: '2px 6px', borderRadius: '4px', animation: 'blink 1.5s infinite' }}>LIVE</span>
          )}
        </div>

        <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--color-text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.5px', lineHeight: 1.2, marginTop: '4px' }}>
          {translateDynamicText(cleanTitleStr.replace(/^\[.*?\]\s*/, '').replace(/ㅣ\s*$/, '').trim(), isEn)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-sub)', fontWeight: 700 }}>
              <Clock size={13} />
              {displayTime}
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); const addr = item.address || item.locationName; const query = encodeURIComponent(addr); window.open(isEn ? `https://www.google.com/maps/search/?api=1&query=${query}` : `https://map.kakao.com/link/search/${query}`, '_blank') }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-sub)', cursor: 'pointer', fontWeight: 700 }}
            >
              <Navigation size={13} color="#E53935" fill="#E53935" />
              {translateDynamicText(item.locationName || item.studio_name || '장소 미지정', isEn)}
            </span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '900', color: '#E53935' }}>
            {displayFee}
          </span>
        </div>

        <button
          onClick={handleKakaoShare}
          style={{
            backgroundColor: '#FEE500',
            color: '#3E2723',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 0',
            fontSize: '13px',
            fontWeight: '900',
            marginTop: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <span style={{ fontSize: '16px' }}>💬</span> 카카오톡 공유
        </button>
      </div>
    </div>
  );
};

export default PartyCard;
