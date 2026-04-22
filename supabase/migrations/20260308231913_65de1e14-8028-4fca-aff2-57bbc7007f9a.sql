ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS requires_dual_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS synergy_bonus numeric DEFAULT 0;