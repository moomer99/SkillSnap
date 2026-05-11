-- SkillSnap — RLS policies for jobs_done and notifications tables
-- Run in Supabase SQL Editor after 001_initial_schema.sql

-- jobs_done policies
CREATE POLICY IF NOT EXISTS "Users can insert jobs_done"
  ON jobs_done FOR INSERT
  WITH CHECK (auth.uid() = skiller_id);

CREATE POLICY IF NOT EXISTS "Users can update jobs_done"
  ON jobs_done FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = skiller_id);

CREATE POLICY IF NOT EXISTS "Users can read own jobs_done"
  ON jobs_done FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = skiller_id);

CREATE POLICY IF NOT EXISTS "Users can delete own jobs_done"
  ON jobs_done FOR DELETE
  USING (auth.uid() = client_id OR auth.uid() = skiller_id);

-- notifications policies
CREATE POLICY IF NOT EXISTS "Users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY IF NOT EXISTS "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
