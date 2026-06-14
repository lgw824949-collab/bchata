-- 부트캠프 등록: 행사·가격·추가 포스터 (최소 3장)
ALTER TABLE public.bootcamps
  ADD COLUMN IF NOT EXISTS price_poster_url text,
  ADD COLUMN IF NOT EXISTS extra_poster_url text;
