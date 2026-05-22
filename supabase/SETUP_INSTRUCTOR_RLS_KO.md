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
