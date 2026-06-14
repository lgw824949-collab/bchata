-- 매주 같은 요일 반복 소셜 포스터 (한 번 등록 → 요일마다 노출)
alter table public.parties
  add column if not exists is_weekly_recurring boolean not null default false;

comment on column public.parties.is_weekly_recurring is
  'true면 day_of_week 요일마다 달력·홈에 노출 (date는 null 가능)';
