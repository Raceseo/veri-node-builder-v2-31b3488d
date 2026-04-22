-- 마이데이터 연결 정보 테이블
CREATE TABLE public.mydata_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN ('bank', 'card', 'securities', 'insurance')),
  institution_code TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  account_number_masked TEXT,
  is_connected BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 거래 내역 테이블
CREATE TABLE public.mydata_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.mydata_connections(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  merchant_name TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 소비 분석 결과 테이블
CREATE TABLE public.consumption_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  persona_type TEXT NOT NULL,
  persona_description TEXT,
  category_breakdown JSONB NOT NULL DEFAULT '{}',
  monthly_average INTEGER DEFAULT 0,
  data_value_raw INTEGER DEFAULT 100,
  data_value_refined INTEGER DEFAULT 850,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mydata_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mydata_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mydata_connections
CREATE POLICY "Users can view their own connections"
  ON public.mydata_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections"
  ON public.mydata_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON public.mydata_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
  ON public.mydata_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for mydata_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.mydata_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.mydata_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for consumption_analysis
CREATE POLICY "Users can view their own analysis"
  ON public.consumption_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own analysis"
  ON public.consumption_analysis FOR ALL
  USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE TRIGGER update_mydata_connections_updated_at
  BEFORE UPDATE ON public.mydata_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consumption_analysis_updated_at
  BEFORE UPDATE ON public.consumption_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();