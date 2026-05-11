-- SkillSnap — Add role column to profiles table
-- Allowed values: 'client', 'pro', or NULL (not yet set)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT null
    CHECK (role IN ('client', 'pro', null));
