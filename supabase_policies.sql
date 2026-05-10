
-- instructor_follows RLS 정책 확인 및 추가
ALTER TABLE instructor_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read follows" ON instructor_follows;
CREATE POLICY "Anyone can read follows" ON instructor_follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert follows" ON instructor_follows;
CREATE POLICY "Anyone can insert follows" ON instructor_follows
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete follows" ON instructor_follows;
CREATE POLICY "Anyone can delete follows" ON instructor_follows
  FOR DELETE USING (true);
