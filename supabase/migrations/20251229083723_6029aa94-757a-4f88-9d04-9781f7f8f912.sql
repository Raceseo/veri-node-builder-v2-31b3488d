-- Create verification_history table
CREATE TABLE public.verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verification_type TEXT NOT NULL,
  trust_score_before INTEGER,
  trust_score_after INTEGER,
  score_change INTEGER,
  vn_earned INTEGER DEFAULT 0,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own verification history"
ON public.verification_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification history"
ON public.verification_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verification_id UUID REFERENCES public.verification_history(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_text TEXT,
  answer TEXT,
  time_spent INTEGER,
  typing_speed NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own survey responses"
ON public.survey_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own survey responses"
ON public.survey_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER,
  balance_after INTEGER,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);