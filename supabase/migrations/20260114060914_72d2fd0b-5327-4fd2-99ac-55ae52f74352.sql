-- 데이터 판매 등록 테이블
CREATE TABLE public.data_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  anonymization_level TEXT NOT NULL DEFAULT 'partial',
  allowed_uses TEXT[] DEFAULT '{}',
  include_premium_buyers BOOLEAN DEFAULT true,
  sale_duration_months INTEGER NOT NULL DEFAULT 6,
  expected_monthly_value INTEGER DEFAULT 0,
  expected_total_value INTEGER DEFAULT 0,
  actual_earnings INTEGER DEFAULT 0,
  buyer_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.data_listings ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own listings"
  ON public.data_listings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own listings"
  ON public.data_listings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON public.data_listings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON public.data_listings
  FOR DELETE
  USING (auth.uid() = user_id);

-- 업데이트 트리거
CREATE TRIGGER update_data_listings_updated_at
  BEFORE UPDATE ON public.data_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 판매 거래 기록 테이블
CREATE TABLE public.data_sale_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.data_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  buyer_company TEXT NOT NULL,
  buyer_industry TEXT,
  categories_sold TEXT[] NOT NULL,
  amount INTEGER NOT NULL,
  platform_fee INTEGER DEFAULT 0,
  net_amount INTEGER NOT NULL,
  sold_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.data_sale_records ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own sale records"
  ON public.data_sale_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert sale records"
  ON public.data_sale_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);