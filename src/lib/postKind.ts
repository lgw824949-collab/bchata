/** 포스터 슬롯 — 소셜·부트캠프·페스티벌·파티 상호 등록 방지 */
export type PosterSlot = 'social' | 'bootcamp' | 'festival' | 'party';

export type FestivalEventType = 'festival' | 'mt' | 'party';

export type PostKindFields = {
  title?: string | null;
  description?: string | null;
  is_weekly_recurring?: boolean | null;
};

export type ValidationResult = { ok: true } | { ok: false; message: string };

const BOOTCAMP_PATTERNS = [
  /부트\s*캠프/,
  /boot\s*camp/,
  /bootcamp/i,
];

const FESTIVAL_MT_PATTERNS = [
  /페스티벌/,
  /festival/i,
  /\bmt\b/i,
  /엠티/,
  /membership\s*training/i,
];

const PARTY_EVENT_PATTERNS = [
  /주년\s*파티/,
  /기념\s*파티/,
  /anniversary/i,
  /grand\s*party/i,
  /대형\s*파티/,
  /행사\s*파티/,
];

/** BAR 소셜·정기 모임 — parties(오늘소셜) 전용 */
const SOCIAL_NIGHTLY_PATTERNS = [
  /소셜/,
  /social/i,
  /클럽\s*나이트/,
  /club\s*night/i,
  /정\s*모/,
  /나이트\s*파티/,
  /night\s*party/i,
  /맛집/,
  /오늘밤빠/,
  /ㅣ\s*오늘밤빠/,
];

const SLOT_LABEL_KO: Record<PosterSlot, string> = {
  social: '오늘소셜',
  bootcamp: '부트캠프',
  festival: '페스티벌',
  party: '파티',
};

const HOME_SLOT_ALIASES: Record<string, PosterSlot> = {
  소셜: 'social',
  부트캠프: 'bootcamp',
  페스티벌: 'festival',
  파티: 'party',
};

function combineText(...parts: Array<string | null | undefined>) {
  return parts.map((p) => String(p ?? '')).join(' ').trim();
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((re) => re.test(text));
}

/** parties 행 → 어느 슬롯에 속하는지 (소셜은 명시 패턴만, 그 외는 해당 슬롯 없음) */
export function inferPartyRowSlot(row: PostKindFields | null | undefined): PosterSlot | null {
  if (row?.is_weekly_recurring) return 'social';
  const text = combineText(row?.title, row?.description);
  if (matchesAny(text, BOOTCAMP_PATTERNS)) return 'bootcamp';
  if (matchesAny(text, FESTIVAL_MT_PATTERNS)) return 'festival';
  if (matchesAny(text, PARTY_EVENT_PATTERNS)) return 'party';
  if (matchesAny(text, SOCIAL_NIGHTLY_PATTERNS)) return 'social';
  return null;
}

export function isSocialPartyRow(row: PostKindFields | null | undefined) {
  return inferPartyRowSlot(row) === 'social';
}

export function isUnscopedPartyRow(row: PostKindFields | null | undefined) {
  return inferPartyRowSlot(row) === null;
}

export function partyRowMatchesSlot(
  row: PostKindFields | null | undefined,
  slot: PosterSlot | keyof typeof HOME_SLOT_ALIASES,
) {
  const normalized = (HOME_SLOT_ALIASES[slot as string] || slot) as PosterSlot;
  return inferPartyRowSlot(row) === normalized;
}

export function filterSocialPartyRows<T extends PostKindFields>(rows: T[] | null | undefined): T[] {
  return (rows || []).filter(isSocialPartyRow);
}

function fail(message: string): ValidationResult {
  return { ok: false, message };
}

function ok(): ValidationResult {
  return { ok: true };
}

/** RegisterForm — parties / BAR·정기 포스터 등록 전용 (제목 기준 — 설명 일정 문구는 허용) */
export function validateSocialPartyRegistration(fields: PostKindFields): ValidationResult {
  const title = String(fields.title ?? '').trim();
  const text = combineText(fields.title, fields.description);
  if (matchesAny(title, BOOTCAMP_PATTERNS)) {
    return fail('부트캠프는 [부트캠프] 메뉴에서만 등록할 수 있습니다. 소셜 등록에는 올릴 수 없어요.');
  }
  if (matchesAny(title, FESTIVAL_MT_PATTERNS)) {
    return fail('페스티벌·MT는 [페스티벌] 메뉴에서만 등록할 수 있습니다. 소셜 등록에는 올릴 수 없어요.');
  }
  if (matchesAny(title, PARTY_EVENT_PATTERNS)) {
    return fail('행사·주년 파티는 [페스티벌 > 파티] 메뉴에서만 등록할 수 있습니다. 여기와는 다릅니다.');
  }
  if (!matchesAny(text, SOCIAL_NIGHTLY_PATTERNS)) {
    if (fields.is_weekly_recurring) return ok();
    return fail(
      '제목에 맛집·정모·나이트파티·소셜 중 하나를 넣어 주세요. (예: [강남] ○○바 맛집) 매주 고정은 「매주 고정」을 선택하면 됩니다.',
    );
  }
  return ok();
}

/** Bootcamp.jsx — 메뉴 선택을 신뢰 (설명의 festival·소셜 문구 허용) */
export function validateBootcampRegistration(_fields: PostKindFields): ValidationResult {
  return ok();
}

/** Festival.jsx — 탭 event_type 신뢰 (설명 키워드로 막지 않음) */
export function validateFestivalRegistration(
  _eventType: FestivalEventType,
  _fields: PostKindFields,
): ValidationResult {
  return ok();
}

export function getPosterSlotLabelKo(slot: PosterSlot) {
  return SLOT_LABEL_KO[slot];
}
