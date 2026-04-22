-- 데모 프로필 테이블
CREATE TABLE public.demo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  email TEXT,
  occupation TEXT,
  company TEXT,
  age_group TEXT,
  gender TEXT,
  region TEXT,
  trust_score INTEGER DEFAULT 65,
  vn_balance INTEGER DEFAULT 0,
  data_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 데모 인증 이력
CREATE TABLE public.demo_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.demo_profiles(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  score_change INTEGER DEFAULT 0,
  vn_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 데모 거래 내역
CREATE TABLE public.demo_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.demo_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  buyer_company TEXT,
  data_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 데모 데이터 판매 기록
CREATE TABLE public.demo_data_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.demo_profiles(id) ON DELETE CASCADE,
  buyer_company TEXT NOT NULL,
  data_category TEXT NOT NULL,
  sale_amount INTEGER NOT NULL,
  provider_share INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 비활성화 (데모 데이터는 공개)
ALTER TABLE public.demo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_data_sales ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 설정
CREATE POLICY "Demo profiles are publicly readable" ON public.demo_profiles FOR SELECT USING (true);
CREATE POLICY "Demo verification history is publicly readable" ON public.demo_verification_history FOR SELECT USING (true);
CREATE POLICY "Demo transactions are publicly readable" ON public.demo_transactions FOR SELECT USING (true);
CREATE POLICY "Demo data sales are publicly readable" ON public.demo_data_sales FOR SELECT USING (true);