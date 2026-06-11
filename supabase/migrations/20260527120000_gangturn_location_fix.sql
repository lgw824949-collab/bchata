-- 강남턴(강턴) locations·parties 장소/주소 정리
-- name null → 강남턴, parties는 canonical location_id로 통합

UPDATE public.locations
SET
  name = '강남턴',
  address = '서울특별시 강남구 역삼로3길 17-5 (역삼동), 삼영빌딩 지하 1층',
  latitude = 37.4975,
  longitude = 127.0358
WHERE id = 'e0ff4047-f3b1-46f2-aa05-ff6ca488a593'
  AND name IS NULL;

UPDATE public.parties
SET
  location_id = 'fb4e7a29-f1d4-4760-bd98-64a91981cbab',
  address = '서울특별시 강남구 역삼로3길 17-5 (역삼동), 삼영빌딩 지하 1층'
WHERE location_id = 'e0ff4047-f3b1-46f2-aa05-ff6ca488a593';

DELETE FROM public.locations
WHERE id = 'e0ff4047-f3b1-46f2-aa05-ff6ca488a593'
  AND NOT EXISTS (
    SELECT 1 FROM public.parties p WHERE p.location_id = 'e0ff4047-f3b1-46f2-aa05-ff6ca488a593'
  );
