-- BAR 상세: 사장님 공간 필드 (상세 설명·연락처·이미지)
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS kakao_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS image_url text;
