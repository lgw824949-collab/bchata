/**
 * Social BAR 카드 클라이언트 전용 VIEW 가중치 (DB 미사용)
 * 진입 후 time 경과 기준 실시간 점수 표기용.
 */
export function calculateViewScore(entryTime, currentTime) {
  let score = 1;
  const elapsedMinutes = (currentTime - entryTime) / (1000 * 60);
  if (elapsedMinutes >= 2) {
    score += Math.floor(elapsedMinutes / 2);
  }
  return score;
}
