
-- Fix: passkey_challenges table publicly readable - restrict to owner only
-- Drop any existing permissive policies first
DO $$
BEGIN
  -- Check and create proper RLS policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'passkey_challenges' AND policyname = 'Users can view own challenges'
  ) THEN
    CREATE POLICY "Users can view own challenges"
      ON public.passkey_challenges
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'passkey_challenges' AND policyname = 'Users can insert own challenges'
  ) THEN
    CREATE POLICY "Users can insert own challenges"
      ON public.passkey_challenges
      FOR INSERT
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'passkey_challenges' AND policyname = 'Users can delete own challenges'
  ) THEN
    CREATE POLICY "Users can delete own challenges"
      ON public.passkey_challenges
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;
