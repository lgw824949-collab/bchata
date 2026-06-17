import { formatPartyTitleDisplay } from './partyTitleDisplay';

const GENRE_MAP = {
  바차타: { key: 'b_ratio' },
  살사: { key: 's_ratio' },
  쥬크: { key: 'j_ratio' },
  키좀바: { key: 'k_ratio' },
};

export const formatPartyPrice = (priceStr) => {
  if (!priceStr) return '2만';
  if (String(priceStr).includes('무료') || priceStr === '0') return '무료';
  const num = parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10);
  if (Number.isNaN(num)) return String(priceStr).replace('원', '');
  if (num === 0) return '무료';
  if (num < 1000) return `${num}`;
  const manValue = num / 10000;
  if (num % 10000 === 0) return `${manValue}만`;
  return `${manValue.toFixed(1).replace('.0', '')}만`;
};

export const getPartyGenreLabel = (item) => {
  if (!item) return '소셜';
  const genreText = String(item.genre || '').trim();
  if (genreText) return genreText;
  if (item._itemGenre && item._itemGenre !== '소셜') return item._itemGenre;
  const entries = Object.entries(GENRE_MAP).filter(([, info]) => item[info.key] > 0);
  if (entries.length === 0) return '소셜';
  const sorted = [...entries].sort((a, b) => item[b[1].key] - item[a[1].key]);
  if (sorted.length >= 2 && item[sorted[0][1].key] === item[sorted[1][1].key]) {
    return `${sorted[0][0]} · ${sorted[1][0]}`;
  }
  return sorted[0][0];
};

/** @returns {{ src: string, title: string, desc: string, lines: string[] } | null} */
export const buildPartyShareCard = (item) => {
  const posterUrl = item?.poster_url && String(item.poster_url).trim();
  if (!posterUrl) return null;

  const title = formatPartyTitleDisplay(item.title) || '라틴·소셜 파티';
  const loc =
    item.locationName ||
    item.location_name ||
    item.studio_name ||
    item.venue ||
    item.displayLocationName ||
    '';
  const fee = formatPartyPrice(item.fee ?? item.price_info);
  const genre = getPartyGenreLabel(item);
  const timeRaw = item.time?.split('-')[0]?.trim() || '';

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let timeLabel = timeRaw;
  if (timeRaw && item.date === todayStr) timeLabel = `오늘 ${timeRaw}`;
  else if (timeRaw && item.date) timeLabel = `${item.date} ${timeRaw}`;

  const line1 = [loc, fee].filter(Boolean).join(' · ');
  const line2 = [timeLabel, genre !== '소셜' ? genre : ''].filter(Boolean).join(' · ');
  const lines = [line1, line2].filter(Boolean);
  const desc = lines.join('\n');
  const feedDesc = [item.date, loc, item.fee ?? item.price_info].filter(Boolean).join(' · ');

  return { src: posterUrl, title, desc, lines, feedDesc, partyId: item.id };
};
