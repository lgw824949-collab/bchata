-- BAR 연락처·상세설명 (locations 컬럼 없어도 사용 가능한 별도 테이블)
-- Supabase 대시보드 → SQL Editor 에서 이 파일 전체 실행

CREATE TABLE IF NOT EXISTS public.location_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  venue_name text NOT NULL,
  description text,
  kakao_url text,
  instagram_url text,
  image_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT location_extras_venue_name_unique UNIQUE (venue_name)
);

CREATE UNIQUE INDEX IF NOT EXISTS location_extras_location_id_unique
  ON public.location_extras (location_id)
  WHERE location_id IS NOT NULL;

ALTER TABLE public.location_extras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS location_extras_select ON public.location_extras;
DROP POLICY IF EXISTS location_extras_insert ON public.location_extras;
DROP POLICY IF EXISTS location_extras_update ON public.location_extras;

CREATE POLICY location_extras_select ON public.location_extras
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY location_extras_insert ON public.location_extras
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY location_extras_update ON public.location_extras
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- locations 테이블에 컬럼이 있으면 함께 쓰기 (선택)
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS kakao_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS image_url text;
