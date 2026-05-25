-- VIP 마스터 공지 보내기 기록
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS instructor_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instructor_notices_instructor_idx
  ON instructor_notices (instructor_id);

ALTER TABLE instructor_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instructor_notices_select" ON instructor_notices;
CREATE POLICY "instructor_notices_select" ON instructor_notices
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "instructor_notices_insert" ON instructor_notices;
CREATE POLICY "instructor_notices_insert" ON instructor_notices
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "instructor_notices_delete" ON instructor_notices;
CREATE POLICY "instructor_notices_delete" ON instructor_notices
  FOR DELETE USING (true);
