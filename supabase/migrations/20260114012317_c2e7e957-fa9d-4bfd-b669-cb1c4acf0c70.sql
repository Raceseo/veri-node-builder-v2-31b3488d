-- Create withdrawal_limits table for configurable limits
CREATE TABLE public.withdrawal_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_limit INTEGER NOT NULL DEFAULT 100000,
  monthly_limit INTEGER NOT NULL DEFAULT 1000000,
  single_transaction_limit INTEGER NOT NULL DEFAULT 50000,
  high_value_threshold INTEGER NOT NULL DEFAULT 30000,
  requires_additional_verification BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_limits UNIQUE (user_id)
);

-- Create withdrawal_daily_stats for tracking daily usage
CREATE TABLE public.withdrawal_daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_withdrawn INTEGER NOT NULL DEFAULT 0,
  withdrawal_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_daily_stats UNIQUE (user_id, date)
);

-- Create withdrawal_monthly_stats for tracking monthly usage
CREATE TABLE public.withdrawal_monthly_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year_month TEXT NOT NULL, -- Format: YYYY-MM
  total_withdrawn INTEGER NOT NULL DEFAULT 0,
  withdrawal_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_monthly_stats UNIQUE (user_id, year_month)
);

-- Enable RLS
ALTER TABLE public.withdrawal_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_monthly_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for withdrawal_limits
CREATE POLICY "Users can view own limits"
ON public.withdrawal_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own limits"
ON public.withdrawal_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own limits"
ON public.withdrawal_limits FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for withdrawal_daily_stats
CREATE POLICY "Users can view own daily stats"
ON public.withdrawal_daily_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage daily stats"
ON public.withdrawal_daily_stats FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for withdrawal_monthly_stats
CREATE POLICY "Users can view own monthly stats"
ON public.withdrawal_monthly_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage monthly stats"
ON public.withdrawal_monthly_stats FOR ALL
USING (true)
WITH CHECK (true);

-- Function to create default limits for new users
CREATE OR REPLACE FUNCTION public.create_default_withdrawal_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.withdrawal_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create limits when profile is created
CREATE TRIGGER on_profile_created_create_limits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_withdrawal_limits();

-- Create indexes for performance
CREATE INDEX idx_withdrawal_daily_stats_user_date ON public.withdrawal_daily_stats(user_id, date);
CREATE INDEX idx_withdrawal_monthly_stats_user_month ON public.withdrawal_monthly_stats(user_id, year_month);