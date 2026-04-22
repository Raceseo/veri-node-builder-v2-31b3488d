-- Create rate limits table for Edge Function rate limiting
CREATE TABLE public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Enable RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies (only service role can access)
CREATE POLICY "Service role can manage rate limits"
ON public.api_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_lookup ON api_rate_limits(user_id, endpoint, window_start DESC);

-- Add constraints to withdrawals table
ALTER TABLE public.withdrawals 
  ADD CONSTRAINT valid_withdrawal_amount CHECK (amount >= 1000 AND amount <= 10000000),
  ADD CONSTRAINT valid_account_number_format CHECK (account_number ~ '^\d{10,16}$'),
  ADD CONSTRAINT valid_account_holder_length CHECK (length(account_holder) BETWEEN 2 AND 50),
  ADD CONSTRAINT valid_bank_name_length CHECK (length(bank_name) BETWEEN 2 AND 50);

-- Create balance check trigger function
CREATE OR REPLACE FUNCTION public.validate_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
  current_balance INTEGER;
  calculated_fee INTEGER;
BEGIN
  -- Get user's current balance
  SELECT vn_balance INTO current_balance
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Check sufficient balance
  IF current_balance < NEW.amount THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal. Available: %, Requested: %', current_balance, NEW.amount;
  END IF;
  
  -- Calculate and enforce server-side fee (1%)
  calculated_fee := CEIL(NEW.amount * 0.01);
  NEW.fee := calculated_fee;
  NEW.net_amount := NEW.amount - calculated_fee;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER validate_withdrawal_before_insert
BEFORE INSERT ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.validate_withdrawal();