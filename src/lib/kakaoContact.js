/** 카카오 오픈채팅 URL 또는 카톡 ID(검색용 아이디) */
export function normalizeKakaoContactInput(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.includes('open.kakao.com')) return v.startsWith('http') ? v : `https://${v}`;
  return v.replace(/^@/, '');
}

export function isKakaoWebLink(value) {
  const v = String(value || '').trim();
  return /^https?:\/\//i.test(v) || v.includes('open.kakao.com');
}

/** @returns {boolean} 열기/복사 시도 여부 */
export function openKakaoContact(idOrLink) {
  const v = normalizeKakaoContactInput(idOrLink);
  if (!v) return false;

  if (isKakaoWebLink(v)) {
    const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    window.open(url, '_blank');
    return true;
  }

  const copy = () => {
    alert(
      `카카오톡 ID「${v}」가 복사되었습니다.\n\n카카오톡 → 친구 → ID로 친구 추가 후 연락해 주세요.`,
    );
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(v).then(copy).catch(() => alert(`카카오톡 ID: ${v}`));
  } else {
    alert(`카카오톡 ID: ${v}`);
  }
  return true;
}
