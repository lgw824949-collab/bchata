# 강사 / 클래스 관리자 수정이 안 될 때 (RLS)

에러: `클래스 수정이 DB에 반영되지 않았습니다. ID·RLS 권한을 확인해 주세요.`

## 해결 (1회만)

1. [Supabase](https://supabase.com/dashboard) → 프로젝트 → **SQL Editor**
2. `supabase/migrations/20260522120000_instructor_classes_instructors_rls.sql` 내용을 붙여넣고 **Run**
3. 로컬 사이트 새로고침 후 관리자에서 다시 수정·삭제 테스트

## Vercel (선택)

서버에서 service role 로 우회하려면 Vercel 환경 변수에 추가:

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Settings → API → service_role
- `ADMIN_API_SECRET` — 관리자 로그인 비밀번호와 동일한 값

배포 후 `/api/admin-db` 가 RLS 없이 반영합니다. SQL 정책을 적용했다면 필수는 아닙니다.

## VIP 수강생 관리 (1회)

마스터 메뉴 → **수강생 관리** 사용 전:

1. SQL Editor에서 `supabase/migrations/20260523120000_instructor_class_students.sql` 실행
2. 앱에서 VIP 로그인 → 수강생 관리 → 이름·연락처·클래스별 등록 확인
3. **수입 집계**는 수강생 상태(신청/입금/수강)와 클래스 수업료(예: `12만원`)로 자동 계산됩니다
