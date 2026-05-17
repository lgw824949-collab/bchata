/** 오늘밤빠 Kakao — JavaScript 키만 .env 의 VITE_KAKAO_API_KEY 사용 */
export const getKakaoApiKey = () => String(import.meta.env.VITE_KAKAO_API_KEY ?? '').trim();
