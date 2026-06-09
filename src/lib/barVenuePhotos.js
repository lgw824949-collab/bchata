import gangturnPhoto from '../assets/gangturn_photo.png';
import ggomaeyaPhoto from '../assets/ggomaeya_photo.jpg';
import noriterPhoto from '../assets/noriter_photo.png';
import latinPhoto from '../assets/latin_photo.png';
import macondoPhoto from '../assets/macondo_photo.png';
import bonitaPhoto from '../assets/bonita_photo.png';
import buenaPhoto from '../assets/buena_photo.png';
import hongturnPhoto from '../assets/hongturn_photo.png';
import havanaPhoto from '../assets/havana_photo.png';
import bibigoPhoto from '../assets/bibigo_photo.png';
import { normalizeVenueNameKey } from './venueDedupe';

/** 앱 공통 기본 카드(오늘밤 Latin 빠) — BAR 전용 사진으로 쓰지 않음 */
const GENERIC_BAR_IMAGE_RE = /default-card\.png|tonightbamppa|오늘밤/i;

export const ELMAR_BAR_PHOTO = '/bar-elmar.jpg';

export function isGenericBarPlaceholderImage(url) {
  const u = String(url || '').trim();
  if (!u) return false;
  return GENERIC_BAR_IMAGE_RE.test(u);
}

/** DB·기본 카드 이미지보다 우선하는 BAR 고정 사진 */
export function resolveBarVenuePhoto(name, imageUrl) {
  const nameKey = normalizeVenueNameKey(name || '');

  if (nameKey.includes('엘마르') || nameKey.includes('elmar') || nameKey === '엘마') {
    return ELMAR_BAR_PHOTO;
  }
  if (nameKey.includes('강남턴') || nameKey === '강턴') return gangturnPhoto;
  if (nameKey.includes('꼼애야')) return ggomaeyaPhoto;
  if (nameKey.includes('놀이터')) return noriterPhoto;
  if (nameKey === '라틴') return latinPhoto;
  if (nameKey.includes('마콘도')) return macondoPhoto;
  if (nameKey.includes('보니따')) return bonitaPhoto;
  if (nameKey.includes('부에나') && !nameKey.includes('비스타')) return buenaPhoto;
  if (nameKey.includes('홍턴')) return hongturnPhoto;
  if (nameKey.includes('하바나') || nameKey.includes('havana')) return havanaPhoto;
  if (nameKey.includes('비비고')) return bibigoPhoto;

  if (isGenericBarPlaceholderImage(imageUrl)) return null;
  return imageUrl || null;
}

export function applyBarVenuePhotosToList(venues) {
  return (venues || []).map((v) => ({
    ...v,
    image_url: resolveBarVenuePhoto(v?.name, v?.image_url),
  }));
}
