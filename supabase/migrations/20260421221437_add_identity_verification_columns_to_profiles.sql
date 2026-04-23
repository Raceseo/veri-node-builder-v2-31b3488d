-- ⚙️ AUTO-CAPTURED FROM REMOTE (2026-04-23)
-- Original version: 20260421221437

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_name text,
  ADD COLUMN IF NOT EXISTS verified_birth_date text,
  ADD COLUMN IF NOT EXISTS verified_gender text,
  ADD COLUMN IF NOT EXISTS verified_phone text,
  ADD COLUMN IF NOT EXISTS identity_verification_id text;
