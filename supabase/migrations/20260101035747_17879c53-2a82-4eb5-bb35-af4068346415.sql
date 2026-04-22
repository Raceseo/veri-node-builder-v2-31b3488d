-- Fix PUBLIC_DATA_EXPOSURE: Update demo tables RLS policies to require authentication

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Demo profiles are publicly readable" ON public.demo_profiles;
DROP POLICY IF EXISTS "Demo transactions are publicly readable" ON public.demo_transactions;
DROP POLICY IF EXISTS "Demo data sales are publicly readable" ON public.demo_data_sales;
DROP POLICY IF EXISTS "Demo verification history is publicly readable" ON public.demo_verification_history;

-- Create new policies requiring authentication
CREATE POLICY "Demo profiles require auth" ON public.demo_profiles 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Demo transactions require auth" ON public.demo_transactions 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Demo data sales require auth" ON public.demo_data_sales 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Demo verification history require auth" ON public.demo_verification_history 
  FOR SELECT USING (auth.uid() IS NOT NULL);