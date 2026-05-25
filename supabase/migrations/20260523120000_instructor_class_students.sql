-- VIP 마스터 수강생 관리
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS instructor_class_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  class_id uuid,
  name text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'registered',
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instructor_class_students_instructor_idx
  ON instructor_class_students (instructor_id);

CREATE INDEX IF NOT EXISTS instructor_class_students_class_idx
  ON instructor_class_students (class_id);

ALTER TABLE instructor_class_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instructor_class_students_select" ON instructor_class_students;
CREATE POLICY "instructor_class_students_select" ON instructor_class_students
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "instructor_class_students_insert" ON instructor_class_students;
CREATE POLICY "instructor_class_students_insert" ON instructor_class_students
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "instructor_class_students_update" ON instructor_class_students;
CREATE POLICY "instructor_class_students_update" ON instructor_class_students
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "instructor_class_students_delete" ON instructor_class_students;
CREATE POLICY "instructor_class_students_delete" ON instructor_class_students
  FOR DELETE USING (true);
