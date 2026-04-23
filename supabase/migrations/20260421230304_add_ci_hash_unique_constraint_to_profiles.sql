-- ⚙️ AUTO-CAPTURED FROM REMOTE (2026-04-23)
-- Original version: 20260421230304

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ci_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_ci_hash_unique ON profiles(ci_hash) WHERE ci_hash IS NOT NULL;
