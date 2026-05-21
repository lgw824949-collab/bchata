# BAR 카카오·인스타 Supabase 등록 방법

앱에서 저장한 **카카오톡 / 인스타그램 / 상세 설명**을 모든 기기에서 쓰려면 Supabase에 테이블을 한 번만 만들면 됩니다.

## 1. SQL 실행 (약 1분)

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 선택  
2. 왼쪽 **SQL Editor** → **New query**  
3. 아래 파일 내용 **전체 복사** 후 **Run**  
   - `supabase/migrations/20260521100000_location_extras.sql`

## 2. 만든 테이블

| 테이블 | 용도 |
|--------|------|
| `location_extras` | BAR 이름(`venue_name`) 기준으로 연락처·설명 저장 (라틴 등 `bar-3` ID도 이름으로 저장) |
| `locations` (선택) | 같은 컬럼이 있으면 `locations`에도 함께 저장 |

## 3. 앱 동작

- 저장 시 **Supabase `location_extras`에 upsert** (우선)  
- 실패 시에만 이 기기 **localStorage** 백업  
- 새로고침·다른 폰에서도 **같은 BAR 이름**이면 동일 링크 표시  

## 4. 확인

SQL 실행 후 Table Editor에서 `location_extras` 행이 생기는지 확인하고, 앱에서 라틴 BAR에 링크 저장 → 새로고침 → 다른 브라우저에서 확인하세요.
