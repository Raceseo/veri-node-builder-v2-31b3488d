-- Fix 1: trust_threat_alerts - Restrict visibility to own alerts only
DROP POLICY IF EXISTS "Alerts are viewable by all authenticated" ON public.trust_threat_alerts;

CREATE POLICY "Users can view own alerts"
ON public.trust_threat_alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Fix 2: profiles email - Add comment noting email is protected by existing RLS
-- The existing RLS policy "Users can view own profile" already restricts users to their own profile
-- No change needed as users can only see their own email, not others