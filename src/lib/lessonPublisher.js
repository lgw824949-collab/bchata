/** 수업 등록 주체 — description 메타 또는 category_type으로 구분 */

export const LESSON_PUBLISHER = {
  INSTRUCTOR: 'instructor',
  VENUE: 'venue',
};

export function appendLessonPublisherMeta(description, publisherType, publisherId = '') {
  const base = String(description || '').trim();
  const idPart = publisherId ? `|id:${publisherId}` : '';
  const tag = `[publisher:${publisherType}${idPart}]`;
  if (/\[publisher:[^\]]+\]/.test(base)) return base;
  return base ? `${tag}\n${base}` : tag;
}

export function appendSchedulePosterMeta(description, posterUrl) {
  if (!posterUrl) return description;
  const base = String(description || '').trim();
  const tag = `[schedule_poster:${posterUrl}]`;
  if (/\[schedule_poster:[^\]]+\]/.test(base)) {
    return base.replace(/\[schedule_poster:[^\]]+\]/, tag);
  }
  return base ? `${base}\n${tag}` : tag;
}

export function getSchedulePosterMeta(row) {
  const desc = String(row?.description || '');
  const m = desc.match(/\[schedule_poster:([^\]]+)\]/);
  return m ? m[1] : '';
}

export function getLessonPublisherMeta(row) {
  const desc = String(row?.description || '');
  const m = desc.match(/\[publisher:([^|\]]+)(?:\|id:([^\]]+))?\]/);
  if (m) return { type: m[1], id: m[2] || '' };
  if (row?.category_type === 'venue') return { type: LESSON_PUBLISHER.VENUE, id: '' };
  if (row?.category_type === 'club') return { type: LESSON_PUBLISHER.VENUE, id: '' };
  return { type: '', id: '' };
}

export function lessonPublisherBadge(row, venueName = '') {
  const { type } = getLessonPublisherMeta(row);
  const bar = venueName || row?.studio_name || '';
  if (type === LESSON_PUBLISHER.VENUE) {
    return { ko: bar ? `BAR · ${bar}` : 'BAR 수업', en: bar ? `BAR · ${bar}` : 'BAR class' };
  }
  if (type === LESSON_PUBLISHER.INSTRUCTOR) {
    return { ko: '강사 수업', en: 'Instructor class' };
  }
  return null;
}

export function stripLessonPublisherMeta(description) {
  return String(description || '')
    .replace(/^\[publisher:[^\]]+\]\n?/, '')
    .replace(/\[schedule_poster:[^\]]+\]\n?/, '')
    .trim();
}

/** UI 표시용 — publisher 메타 제거 */
export function getLessonDisplayDescription(row) {
  return stripLessonPublisherMeta(row?.description);
}
