-- Add is_verified column to profiles table for data grade system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_verified IS 'Indicates if user has completed biometric/government verification';