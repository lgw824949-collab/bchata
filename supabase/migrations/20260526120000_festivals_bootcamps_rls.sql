-- Admin + 앱(anon)에서 페스티벌/부트캠프 수정·삭제 가능하도록 RLS 정책 추가
-- Supabase 대시보드 → SQL Editor 에서 이 파일 전체 실행

ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "festivals_select" ON festivals;
CREATE POLICY "festivals_select" ON festivals
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "festivals_insert" ON festivals;
CREATE POLICY "festivals_insert" ON festivals
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "festivals_update" ON festivals;
CREATE POLICY "festivals_update" ON festivals
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "festivals_delete" ON festivals;
CREATE POLICY "festivals_delete" ON festivals
  FOR DELETE USING (true);

ALTER TABLE bootcamps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bootcamps_select" ON bootcamps;
CREATE POLICY "bootcamps_select" ON bootcamps
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "bootcamps_insert" ON bootcamps;
CREATE POLICY "bootcamps_insert" ON bootcamps
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "bootcamps_update" ON bootcamps;
CREATE POLICY "bootcamps_update" ON bootcamps
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bootcamps_delete" ON bootcamps;
CREATE POLICY "bootcamps_delete" ON bootcamps
  FOR DELETE USING (true);
