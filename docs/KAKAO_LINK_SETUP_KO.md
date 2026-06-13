# 카카오톡 공유 링크가 안 눌릴 때

공유 카드는 뜨는데 **「모바일에서 확인해주세요」** 만 보이고 링크·버튼이 안 열리면, **앱 코드 문제가 아니라 카카오 개발자 콘솔 도메인 설정**이 거의 항상 원인입니다.

## 원인 (한 줄)

`mobileWebUrl` / `webUrl` 에 넣은 **호스트**가 카카오 앱의 **제품 링크 → 웹 도메인** 에 등록되어 있지 않으면, 카톡이 링크를 비활성화합니다.

## 반드시 맞춰야 할 값

| 항목 | 값 |
|------|-----|
| 공유 URL (코드) | `https://bchata.vercel.app/?party=...&open=true` |
| 제품 링크 웹 도메인 | `bchata.vercel.app` (프로토콜·경로 없이 호스트만) |
| JS SDK 사이트 도메인 | `https://bchata.vercel.app` + 로컬 테스트 시 `http://localhost:1234` |

`.env` 의 `VITE_PUBLIC_APP_URL` 이 다른 도메인이면, 콘솔에 **그 호스트**를 등록하거나 URL을 `https://bchata.vercel.app` 로 통일하세요.

## 카카오 개발자 콘솔 체크리스트

1. [developers.kakao.com](https://developers.kakao.com) → **내 애플리케이션** → 사용 중인 앱 (JavaScript 키와 동일한 앱)
2. **앱 설정 → 플랫폼 → Web**
   - 사이트 도메인: `https://bchata.vercel.app`
   - (선택) 로컬: `http://localhost:1234`
3. **제품 링크 → 웹 도메인** (또는 「웹 도메인 등록」)
   - `bchata.vercel.app` 추가 후 **저장**
   - 등록 후 반영까지 수 분 걸릴 수 있음
4. **앱 키 → JavaScript 키** 가 `.env` 의 `VITE_KAKAO_API_KEY` 와 **같은 앱**인지 확인
5. **제품 설정 → 카카오맵 · 로컬(OPEN_MAP_AND_LOCAL)** 이 **활성화** 되어 있는지 확인  
   - BAR 상세 **지도 미리보기**는 이 서비스가 켜져 있어야 SDK가 로드됩니다.  
   - 꺼져 있으면 `disabled OPEN_MAP_AND_LOCAL service` 403 으로 회색 placeholder만 보입니다.
6. **Web 사이트 도메인**에 아래를 모두 등록 (둘 다 필요할 수 있음)  
   - `http://localhost:1234`  
   - `http://127.0.0.1:1234`  
   - `https://bchata.vercel.app`

## 테스트 방법

1. 브라우저 개발자 도구 콘솔에서 공유 시  
   `[Kakao Share] link URL ...` 로그가 **`https://bchata.vercel.app/...`** 인지 확인 (`localhost` 이면 링크 비활성)
2. **휴대폰 카카오톡**에서 공유·클릭 테스트 (PC 카톡은 설정이 맞아도 「모바일에서 확인」 문구가 남는 경우가 많음)
3. 콘솔 도메인 저장 후 **5~10분** 뒤 다시 공유 (캐시된 미리보기와 별개로, 새로 보낸 메시지부터 적용)

## 코드에서 하는 일

- `resolveKakaoShareUrl()` — 공유 링크를 등록 호스트(`KAKAO_SHARE_HOST`)의 HTTPS URL만 쓰도록 고정
- `localhost` / 미등록 도메인은 `https://bchata.vercel.app` 로 대체

링크가 여전히 안 되면, 콘솔 스크린샷(플랫폼 Web + 제품 링크 웹 도메인)과 콘솔에 찍힌 `[Kakao Share] link URL` 한 줄을 함께 확인하면 됩니다.
