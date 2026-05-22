-- Admin + 앱(anon)에서 강사/클래스 수정·삭제 가능하도록 RLS 정책 추가
-- Supabase 대시보드 → SQL Editor 에서 이 파일 전체 실행

ALTER TABLE instructor_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instructor_classes_select" ON instructor_classes;
CREATE POLICY "instructor_classes_select" ON instructor_classes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "instructor_classes_insert" ON instructor_classes;
CREATE POLICY "instructor_classes_insert" ON instructor_classes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "instructor_classes_update" ON instructor_classes;
CREATE POLICY "instructor_classes_update" ON instructor_classes
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "instructor_classes_delete" ON instructor_classes;
CREATE POLICY "instructor_classes_delete" ON instructor_classes
  FOR DELETE USING (true);

ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instructors_select" ON instructors;
CREATE POLICY "instructors_select" ON instructors
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "instructors_insert" ON instructors;
CREATE POLICY "instructors_insert" ON instructors
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "instructors_update" ON instructors;
CREATE POLICY "instructors_update" ON instructors
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "instructors_delete" ON instructors;
CREATE POLICY "instructors_delete" ON instructors
  FOR DELETE USING (true);
