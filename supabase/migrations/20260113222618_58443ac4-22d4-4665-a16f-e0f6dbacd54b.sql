-- Add security_level and locked_balance columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS security_level integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_balance integer NOT NULL DEFAULT 0;

-- Add comments explaining the columns
COMMENT ON COLUMN profiles.security_level IS 'Security level: 0=Unverified, 1=Basic (orange), 2+=Verified (blue)';
COMMENT ON COLUMN profiles.locked_balance IS 'Balance locked for security review (cannot be withdrawn)';